-- Community groups, pilot (build step 11a; docs/community-design.md).
--
-- Invite-only: a moderator creates a group for one rule and shares its invite
-- code; readers join with the code. Groups run three weeks. No private
-- messages. Members see each other's display name, posts and the check-ins
-- they chose to share, never anything else.
--
-- Safety (App Store guideline 1.2): every post passes a filter in a trigger,
-- so it can't be bypassed from the client. Slurs, threats, sexual content,
-- links and contact details are held for a moderator; crisis words are held
-- and flagged urgent. Reports and blocks are per reader. RLS is on for every
-- table; writes that need checks across tables go through SECURITY DEFINER
-- functions with a fixed search_path.
--
-- Account deletion: every user column cascades from auth.users, so deleting
-- an account deletes the reader's profile, memberships, posts, reactions,
-- reports and blocks.

-- ---------------------------------------------------------------------------
-- Moderators: by verified sign-in email, so a moderator can be named before
-- their account exists. Rows are added by hand (SQL editor), never by the app.
-- ---------------------------------------------------------------------------

create table public.moderators (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.moderators enable row level security;
-- No policies: only the functions below read it.

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.moderators m
    where m.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- group_profiles: the name a reader uses in groups, and their one-time
-- agreement to the rules and the 18+ confirmation.
-- ---------------------------------------------------------------------------

create table public.group_profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  display_name       text not null check (char_length(btrim(display_name)) between 1 and 40),
  adult_confirmed_at timestamptz not null,
  accepted_rules_at  timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.group_profiles enable row level security;

create trigger group_profiles_set_updated_at
  before update on public.group_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  rule_id     smallint not null references public.rules (id),
  invite_code text not null unique check (invite_code ~ '^[A-Z]+-[A-Z0-9]{4}$'),
  starts_on   date not null,
  closes_on   date not null,
  closed_at   timestamptz,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  check (closes_on > starts_on)
);

alter table public.groups enable row level security;

create table public.group_members (
  group_id    uuid not null references public.groups (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  removed     boolean not null default false,
  muted_until timestamptz,
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

alter table public.group_members enable row level security;

-- A group is open until a moderator closes it or its three weeks are up.
create or replace function public.group_is_open(g public.groups)
returns boolean
language sql
stable
set search_path = ''
as $$
  select g.closed_at is null and current_date <= g.closes_on;
$$;

-- The caller is a current member (joined, not left or removed).
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = (select auth.uid()) and gm.left_at is null
  );
$$;

-- The caller shares a current group with this person (to read their name).
create or replace function public.shares_group_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members me
    join public.group_members them on them.group_id = me.group_id
    where me.user_id = (select auth.uid()) and me.left_at is null and them.user_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- Posts, reactions, reports, blocks
-- ---------------------------------------------------------------------------

create table public.group_posts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  kind       text not null default 'post' check (kind in ('post', 'checkin')),
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  status     text not null default 'visible' check (status in ('visible', 'held', 'hidden')),
  flag       text check (flag in ('filter', 'crisis')),
  created_at timestamptz not null default now()
);

create index group_posts_group_idx on public.group_posts (group_id, created_at);
create index group_posts_author_idx on public.group_posts (author_id);
create index group_posts_held_idx on public.group_posts (status) where status = 'held';

alter table public.group_posts enable row level security;

create table public.post_reactions (
  post_id    uuid not null references public.group_posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_reactions_user_idx on public.post_reactions (user_id);

alter table public.post_reactions enable row level security;

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references auth.users (id) on delete cascade,
  post_id          uuid references public.group_posts (id) on delete cascade,
  reported_user_id uuid references auth.users (id) on delete cascade,
  reason           text not null check (reason in ('abuse', 'spam', 'unsafe', 'other')),
  status           text not null default 'open' check (status in ('open', 'resolved')),
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  check (post_id is not null or reported_user_id is not null)
);

create index reports_open_idx on public.reports (status) where status = 'open';
create index reports_reporter_idx on public.reports (reporter_id);
create index reports_post_idx on public.reports (post_id);
create index reports_user_idx on public.reports (reported_user_id);

alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- The filter. Swearing is allowed (the book swears); these are not.
-- Returns 'crisis', 'filter' or null.
-- ---------------------------------------------------------------------------

create or replace function public.classify_post(body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  t text := lower(body);
begin
  -- Self-harm and suicide: held, flagged urgent, and the writer sees 988.
  if t ~ '(suicid|kill (my|me)self|killing myself|end (it all|my life)|want(ed)? to die|wanna die|better off dead|self[- ]?harm|cut(ting)? myself|hurt(ing)? myself|no reason to live|overdose)' then
    return 'crisis';
  end if;
  -- Links and contact details (selling, grooming, taking people off the app).
  if t ~ '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|io|co|me|ly|gg|app|link|shop)\M)'
     or t ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     or t ~ '(\+?\d[\s().-]?){9,}'
     or t ~ '\m(dm me|text me|whatsapp|telegram|snapchat|venmo|cashapp|cash app|paypal|onlyfans)\M' then
    return 'filter';
  end if;
  -- Threats.
  if t ~ '\m(i(''| wi)ll|gonna|going to) (kill|hurt|find|beat|shoot|stab) (you|u)\M' or t ~ '\mkill yourself\M|\mkys\M' then
    return 'filter';
  end if;
  -- Slurs and sexual content.
  if t ~ '\m(n[i1]gg(er|a)s?|f[a@]gg?(ot)?s?|k[i1]kes?|sp[i1]cs?|ch[i1]nks?|tr[a@]nn(y|ies)|r[e3]t[a@]rds?|wetbacks?|dykes?|coons?|gooks?)\M'
     or t ~ '\m(nudes?|sexting|porn|blowjob|dick pic|send pics)\M' then
    return 'filter';
  end if;
  return null;
end;
$$;

-- Every new post: the server decides its status, whatever the client sent.
create or replace function public.group_posts_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.flag := public.classify_post(new.body);
  new.status := case when new.flag is null then 'visible' else 'held' end;
  new.created_at := now();
  return new;
end;
$$;

create trigger group_posts_filter
  before insert on public.group_posts
  for each row execute function public.group_posts_before_insert();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- group_profiles: your own, people in your current groups, and moderators.
create policy "group_profiles: read own, groupmates, moderators"
  on public.group_profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.shares_group_with(user_id) or public.is_moderator());

create policy "group_profiles: insert own"
  on public.group_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "group_profiles: update own"
  on public.group_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- groups: members (current or past) and moderators. Joining goes through
-- join_group(); creating and closing through moderator functions.
create policy "groups: read if member or moderator"
  on public.groups for select to authenticated
  using (
    public.is_moderator()
    or exists (select 1 from public.group_members gm where gm.group_id = groups.id and gm.user_id = (select auth.uid()))
  );

-- group_members: your own rows, your current groups' rows, moderators.
create policy "group_members: read own, groupmates, moderators"
  on public.group_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_group_member(group_id) or public.is_moderator());

-- group_posts: current members see visible posts, plus their own held ones,
-- minus anyone they blocked. Moderators see everything.
create policy "group_posts: read"
  on public.group_posts for select to authenticated
  using (
    public.is_moderator()
    or (
      public.is_group_member(group_id)
      and (status = 'visible' or author_id = (select auth.uid()))
      and not exists (
        select 1 from public.blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = author_id
      )
    )
  );

create policy "group_posts: members post in open groups"
  on public.group_posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = group_posts.group_id
        and gm.user_id = (select auth.uid())
        and gm.left_at is null
        and (gm.muted_until is null or gm.muted_until < now())
        and public.group_is_open(g)
    )
  );

create policy "group_posts: delete own or moderator"
  on public.group_posts for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_moderator());

-- Status changes (show / hide) are moderator-only, through moderate_post().

-- post_reactions: see reactions in your groups; give or take back your own.
create policy "post_reactions: read in your groups"
  on public.post_reactions for select to authenticated
  using (
    public.is_moderator()
    or exists (select 1 from public.group_posts p where p.id = post_id and public.is_group_member(p.group_id))
  );

create policy "post_reactions: give own"
  on public.post_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.group_posts p
      where p.id = post_id and p.status = 'visible' and public.is_group_member(p.group_id)
    )
  );

create policy "post_reactions: take back own"
  on public.post_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- blocks: your own list.
create policy "blocks: read own"
  on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "blocks: add own"
  on public.blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "blocks: remove own"
  on public.blocks for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- reports: file your own; see your own (to hide what you reported);
-- moderators see and resolve all.
create policy "reports: read own or moderator"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_moderator());

create policy "reports: file own"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and resolved_at is null
    and (post_id is null or exists (select 1 from public.group_posts p where p.id = post_id and public.is_group_member(p.group_id)))
    and (reported_user_id is null or public.shares_group_with(reported_user_id))
  );

create policy "reports: moderators resolve"
  on public.reports for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- What a code opens, before joining: rule, people so far, weeks. Null if the
-- code doesn't match an open group.
create or replace function public.preview_group(code text)
returns table (group_id uuid, rule_id smallint, members integer, starts_on date, closes_on date, is_full boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.rule_id,
         (select count(*)::integer from public.group_members gm where gm.group_id = g.id and gm.left_at is null),
         g.starts_on, g.closes_on,
         (select count(*) from public.group_members gm where gm.group_id = g.id and gm.left_at is null) >= 8
  from public.groups g
  where g.invite_code = upper(btrim(code)) and public.group_is_open(g) and (select auth.uid()) is not null;
$$;

-- Join with a code: saves the group name, the 18+ confirmation and the rules,
-- then adds the caller. Errors: bad_code, full, removed, adult, name.
create or replace function public.join_group(code text, name text, adult boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  g public.groups;
  n integer;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if not coalesce(adult, false) then raise exception 'adult'; end if;
  if char_length(btrim(coalesce(name, ''))) not between 1 and 40 then raise exception 'name'; end if;

  select * into g from public.groups where invite_code = upper(btrim(code));
  if not found or not public.group_is_open(g) then raise exception 'bad_code'; end if;

  if exists (select 1 from public.group_members where group_id = g.id and user_id = me and removed) then
    raise exception 'removed';
  end if;

  select count(*) into n from public.group_members where group_id = g.id and left_at is null and user_id <> me;
  if n >= 8 then raise exception 'full'; end if;

  insert into public.group_profiles (user_id, display_name, adult_confirmed_at, accepted_rules_at)
  values (me, btrim(name), now(), now())
  on conflict (user_id) do update
    set display_name = excluded.display_name, adult_confirmed_at = excluded.adult_confirmed_at, accepted_rules_at = excluded.accepted_rules_at;

  insert into public.group_members (group_id, user_id) values (g.id, me)
  on conflict (group_id, user_id) do update set left_at = null, joined_at = now();

  return g.id;
end;
$$;

-- Leave a group. Your posts stay (as "Former member") unless you delete them.
create or replace function public.leave_group(gid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.group_members set left_at = now()
  where group_id = gid and user_id = (select auth.uid()) and left_at is null;
$$;

-- Moderators: create a group for a rule; returns its invite code
-- (part name + 4 characters, e.g. FIRE-7K2Q; no 0/O/1/I).
create or replace function public.create_group(rule smallint, starts date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefix text;
  code text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if not public.is_moderator() then raise exception 'not_moderator'; end if;
  select case r.part when 1 then 'FIRE' when 2 then 'FORGE' when 3 then 'FOUNDATION' else 'FIELD' end
    into prefix from public.rules r where r.id = rule;
  if prefix is null then raise exception 'bad_rule'; end if;
  loop
    code := prefix || '-' || (
      select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1), '')
      from generate_series(1, 4)
    );
    exit when not exists (select 1 from public.groups where invite_code = code);
  end loop;
  insert into public.groups (rule_id, invite_code, starts_on, closes_on, created_by)
  values (rule, code, coalesce(starts, current_date), coalesce(starts, current_date) + 21, (select auth.uid()));
  return code;
end;
$$;

create or replace function public.close_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then raise exception 'not_moderator'; end if;
  update public.groups set closed_at = now() where id = gid and closed_at is null;
end;
$$;

-- Moderators: show or hide a post. Resolves its open reports.
create or replace function public.moderate_post(pid uuid, show boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then raise exception 'not_moderator'; end if;
  update public.group_posts set status = case when show then 'visible' else 'hidden' end where id = pid;
  update public.reports set status = 'resolved', resolved_at = now() where post_id = pid and status = 'open';
end;
$$;

-- Moderators: mute for 24 hours, or remove from the group (can't rejoin it).
create or replace function public.moderate_member(gid uuid, uid uuid, action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then raise exception 'not_moderator'; end if;
  if action = 'mute' then
    update public.group_members set muted_until = now() + interval '24 hours' where group_id = gid and user_id = uid;
  elsif action = 'remove' then
    update public.group_members set left_at = coalesce(left_at, now()), removed = true where group_id = gid and user_id = uid;
  else
    raise exception 'bad_action';
  end if;
  update public.reports set status = 'resolved', resolved_at = now()
  where reported_user_id = uid and status = 'open';
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: the trigger function is not part of the API; the rest are called
-- by signed-in readers (the moderator ones check is_moderator() inside).
-- ---------------------------------------------------------------------------

revoke execute on function public.group_posts_before_insert() from public, anon, authenticated;
revoke execute on function public.classify_post(text) from public, anon;
revoke execute on function public.is_moderator() from public, anon;
revoke execute on function public.is_group_member(uuid) from public, anon;
revoke execute on function public.shares_group_with(uuid) from public, anon;
revoke execute on function public.group_is_open(public.groups) from public, anon;
revoke execute on function public.preview_group(text) from public, anon;
revoke execute on function public.join_group(text, text, boolean) from public, anon;
revoke execute on function public.leave_group(uuid) from public, anon;
revoke execute on function public.create_group(smallint, date) from public, anon;
revoke execute on function public.close_group(uuid) from public, anon;
revoke execute on function public.moderate_post(uuid, boolean) from public, anon;
revoke execute on function public.moderate_member(uuid, uuid, text) from public, anon;

grant execute on function public.classify_post(text) to authenticated;
grant execute on function public.is_moderator() to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;
grant execute on function public.group_is_open(public.groups) to authenticated;
grant execute on function public.preview_group(text) to authenticated;
grant execute on function public.join_group(text, text, boolean) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.create_group(smallint, date) to authenticated;
grant execute on function public.close_group(uuid) to authenticated;
grant execute on function public.moderate_post(uuid, boolean) to authenticated;
grant execute on function public.moderate_member(uuid, uuid, text) to authenticated;
