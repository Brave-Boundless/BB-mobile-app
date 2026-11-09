# Community groups — design (build step 11)

Status: **decided by Mark, 2026-11-07** (see the end). **11a (invite-only pilot) built 2026-11-09**; the daily group push and the urgent moderator alert are next. 11b and 11c are not built. The brief (`CLAUDE.md` §1, §6) sets the shape: small groups of 5–8, matched by a shared rule struggle, moderated, and designed so phase 1 doesn't get in the way. This document turns that into concrete choices. The "Decisions" section at the end lists what Mark needs to decide; everything else follows from those answers.

## 1. What a group is for

A group is a handful of people working the same rule, who check in on each other for a few weeks. It is not a social network: no followers, no public profiles, no feed of strangers, no likes count. The book's voice applies — direct, honest, no shaming a dodge.

## 2. What Apple requires (App Store guideline 1.2, user-generated content)

Any app where users post things other users see must have, before review:

1. **A filter** for objectionable material.
2. **Reporting**: a way to flag a post or a person, with a timely response.
3. **Blocking**: a way to stop seeing someone.
4. **Published contact information** so people can reach the developer.
5. In practice also: **terms of use** the person accepts before posting, with zero tolerance for abuse, and acting on reports (removing content, removing people) — Apple expects within 24 hours.

Expect a higher age rating once the app has user chat (likely 17+ in Apple's questionnaire).

## 3. Proposed design

### Joining
- **An account is required** (email code, Apple or Google — already built). Moderation is impossible with anonymous users.
- A reader picks **a display name** (first name or anything they like) and accepts the **group rules** once: be honest, be kind, no selling, no shaming a dodge, what's said in the group stays in the group, this isn't therapy (988 if in crisis).
- They choose **the rule they want help with**. The app suggests their dodge pattern (top dodged rules) but any of the 15 can be picked.

### Matching
- People who pick the same rule wait together; a group **opens at 5** and **closes at 8**. Time zones are kept within a few hours of each other so check-ins land on the same day.
- A group runs for **a set stretch (proposed: 3 weeks)**, then closes. Members can join a new group on the same or another rule. Short, fixed groups keep it fresh and limit the harm of a bad mix.
- If a rule has too few people waiting, the app says so honestly and offers the next-closest rule in the same part.

### Inside a group
- **Posts**: text only to start (no photos, no links that unfurl — fewer ways to abuse it). One group thread, newest at the bottom.
- **Weekly prompt** pinned at the top, drawn from the rule's drills ("This week: the uncomfortable drill — who's going first?").
- **Check-ins**: a member can choose to share "Did it / Dodged it" for today's drill into the group with one tap. Optional, never automatic.
- **One reaction**: a single "respect" mark on a post. No counts on profiles, no leaderboards.
- **No private messages** in the first version. DMs are where most harassment happens and they can't be moderated without reading private chats.
- **Notifications**: one daily digest push if the group had new posts (needs a small server job; phase 1 pushes are all on-device). Mutable per group.

### Safety and moderation
- **Filter**: the brand is a little profane, so the filter does *not* block swearing. It blocks slurs, threats, sexual content, contact details and links (to stop selling and grooming), and holds anything it flags for a moderator.
- **Crisis words** (self-harm, suicide): the post is held for a moderator, and the person who wrote it immediately sees the 988 line and a "talk to someone now" screen. Moderators get an urgent alert.
- **Report** on every post and every person (reason: abusive, spam, unsafe, something else). Reported posts are hidden from the reporter at once.
- **Block** a person: you stop seeing them everywhere; they aren't told.
- **Moderators**: every group has one named moderator who can hide posts, mute or remove members, and close the group. See decision 2 for who.
- **Admin view** (a simple web page or Supabase dashboard to start) listing reports, held posts and members, with a 24-hour response target.
- **Contact**: a "Contact us" link in Settings and on the group rules (hello@braveandboundless.com).

### Privacy
- Other members see only your **display name**, your posts, and check-ins you chose to share. Never your journal, email, ratings or dodge reasons.
- Leaving a group removes you from it; your past posts stay as "former member" unless you delete them. **Deleting your account deletes all your posts** (the existing cascade already does this for new tables).
- The data export includes your groups and posts.

## 4. Data model (Supabase, RLS on every table)

```
group_profiles   user_id, display_name, accepted_rules_at, tz
groups           id, rule_id, status (forming|open|closed), opens_at, closes_at, moderator_id
group_waitlist   user_id, rule_id, tz, joined_at
group_members    group_id, user_id, role (member|moderator), joined_at, left_at, muted_until
group_posts      id, group_id, author_id, kind (post|checkin|prompt), body, status (visible|held|hidden), created_at
post_reactions   post_id, user_id
reports          id, reporter_id, post_id?, user_id?, reason, status, created_at, resolved_by, resolved_at
blocks           blocker_id, blocked_id
```

Members read only their own groups' visible posts, minus anyone they've blocked. Only moderators and admins see held posts and reports. Matching and the filter run in Supabase Edge Functions, not in the app, so they can't be bypassed. Realtime updates via Supabase Realtime.

## 5. Suggested rollout

1. **11a — Pilot** (chosen): invite-only. Mark creates a group for a rule and gets an **invite code** (e.g. `FIRE-7K2Q`) to send to the readers he picks; they enter it in the app. Full posting, reporting, blocking, filter and moderator tools. No automatic matching yet. Learn what people actually do.
2. **11b — Matching**: the waitlist and automatic groups of 5–8 by rule.
3. **11c — Extras** if the pilot calls for them: photos, a group recap at the end, alumni groups.

## 6. Decisions for Mark

1. **Rollout**: start with the invite-only pilot (11a), or go straight to open matching?
2. **Who moderates**: Mark, a named team member, trained volunteer readers per group, or a paid moderation service?
3. **Group length**: fixed stretch (proposed 3 weeks), or open-ended groups?
4. **Who can join**: only readers past a point in the 45 drills (e.g. finished FIRE, Day 12), or anyone with an account?
5. **Private messages**: none at first (proposed), or allowed between group members?
6. **Age**: 18+ only (proposed — simplest given the subject matter), or 17+ to match Apple's likely rating?

## 7. Mark's answers (2026-11-07)

1. **Rollout**: invite-only **pilot first** (confirmed). Mark creates each group and shares its invite code with the readers he picks.
2. **Moderator**: **Mark, for the pilot**. Decide the longer-term model once the workload is clear.
3. **Group length**: **fixed 3 weeks**.
4. **Who can join**: **anyone with an account** (no Day-12 gate).
5. **Private messages**: **none at first**.
6. **Age**: **18+ only** — a one-time "I'm 18 or older" confirmation when joining, and the App Store age rating set to match.
