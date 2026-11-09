-- Wider crisis phrases for the groups filter (step 11a). Same behaviour:
-- matching posts are held for a moderator, flagged urgent, and the writer sees
-- the 988 screen.
create or replace function public.classify_post(body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  t text := regexp_replace(lower(body), '[’‘]', '''', 'g');
begin
  -- Self-harm and suicide: held, flagged urgent, and the writer sees 988.
  if t ~ '(suicid|kill(ing)? (my|me)sel(f|ves)|end(ing)? (it all|my life|things)|take my (own )?life|want(ed)? to die|wanna die|wish i (was|were) dead|better off (dead|without me)|(don''?t|do not) want to (be here|live|wake up|exist)|can''?t (go on|do this anymore|keep going)|no (reason|point) (to|in) (live|living|going on)|self[- ]?harm|cut(ting)? myself|hurt(ing)? myself|overdos(e|ing))' then
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
  if t ~ '\m(i''ll|i will|gonna|going to) (kill|hurt|find|beat|shoot|stab) (you|u)\M' or t ~ '\mkill yourself\M|\mkys\M' then
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

revoke execute on function public.classify_post(text) from public, anon;
grant execute on function public.classify_post(text) to authenticated;
