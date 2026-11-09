// status: approved — Mark, 2026-11-09 (lines marked "new" below are for review)
//
// Copy for build step 11a: the invite-only community-groups pilot
// (docs/community-design.md). Rule titles, drills and part names come from
// content/ verbatim.

export const groupsCopy = {
  status: 'approved',

  // ── Community tab segments ─────────────────────────────────────────────
  tabs: { groups: 'Groups', story: 'Share Your Story' },

  // ── No group yet ───────────────────────────────────────────────────────
  none: {
    title: 'Groups',
    body: 'Five to eight people working the same rule, checking in on each other for three weeks. Honest, small, moderated.',
    pilot: 'Groups are invite-only while we test them.',
    codeLabel: 'Have an invite code?',
    codePlaceholder: 'e.g. FIRE-7K2Q',
    join: 'Join',
    badCode: 'That code doesn’t match an open group. Check it and try again.',
    full: 'That group is full.',
    // new: Settings moved behind the account icon (was "Sign in under You → Settings").
    signIn: 'Groups need an account so people know who they’re talking to.',
    signInButton: 'Sign in', // new
    offline: 'Groups need a connection. Try again when you’re back online.', // new
    retry: 'Try again', // new
  },

  // ── Joining (one time) ─────────────────────────────────────────────────
  join: {
    title: (rule: number, ruleTitle: string) => `Rule ${rule} · ${ruleTitle}`,
    meta: (members: number, weeks: number) => `${members} people · ${weeks} weeks`,
    nameLabel: 'What should the group call you?',
    nameHint: 'A first name or anything you like. It’s all the group sees.',
    adult: 'I’m 18 or older.',
    rulesTitle: 'Group rules',
    rules: [
      'Tell the truth. That’s the whole point.',
      'Dodges get logged, not judged. Nobody here gets shamed.',
      'What’s said in the group stays in the group.',
      'No selling, no links, no swapping contact details.',
      'No slurs, threats or harassment. One strike and you’re out.',
      'This isn’t therapy. If you’re in crisis, call or text 988.',
    ],
    accept: 'I’m in. I’ll follow the rules.',
    termsNote: 'Breaking the rules gets posts removed and people removed from the group. We read every report.',
  },

  // ── The group ──────────────────────────────────────────────────────────
  group: {
    week: (n: number, of: number) => `Week ${n} of ${of}`,
    members: (n: number) => `${n} people`,
    prompt: 'This week',
    composer: 'Say something real.',
    post: 'Post',
    checkIn: 'Share today’s drill',
    checkInDone: 'Did it today.',
    checkInDodged: 'Dodged it today.',
    respect: 'Respect',
    respectA11y: (n: number) => (n === 1 ? '1 person gave respect' : `${n} people gave respect`),
    you: 'You',
    formerMember: 'Former member',
    moderator: 'Moderator',
    held: 'Held for a moderator. It shows once it’s checked.',
    empty: 'Nobody’s posted yet. Go first.',
    closed: 'This group has closed. Three weeks, done.',
    closedNext: 'Mark will be in touch about the next one.',
    leave: 'Leave group',
    leaveConfirm: 'Leave this group? Your posts stay as “Former member” unless you delete them.',
    leaveYes: 'Leave',
    leaveNo: 'Stay',
    deletePost: 'Delete post',
    deleteConfirm: 'Delete this post?',
    sendFailed: 'Couldn’t post. Check your connection and try again.', // new
    muted: 'A moderator paused your posting for 24 hours.', // new
    more: 'More', // new: the menu on each post (Report, Block, Delete)
    removed: 'You were removed from this group.', // new
  },

  // ── Report / block ─────────────────────────────────────────────────────
  report: {
    action: 'Report',
    title: 'What’s wrong with it?',
    reasons: { abuse: 'Abusive or hateful', spam: 'Selling or spam', unsafe: 'Someone may be unsafe', other: 'Something else' },
    send: 'Send report',
    sent: 'Reported. It’s hidden for you, and a moderator will look at it within 24 hours.',
  },
  block: {
    action: 'Block',
    confirm: (name: string) => `Block ${name}? You won’t see their posts. They won’t be told.`,
    yes: 'Block',
    no: 'Cancel',
    done: (name: string) => `${name} is blocked.`,
    unblock: 'Unblock',
  },

  // ── Crisis (shown to the writer when a post mentions self-harm) ───────
  crisis: {
    title: 'You don’t have to carry this alone.',
    body: 'Your post is with a moderator. If you’re thinking about hurting yourself, talk to someone now.',
    call: 'Call or text 988',
    note: 'The 988 Suicide & Crisis Lifeline is free and open 24/7.',
    back: 'Back to the group',
  },

  // ── Push (one a day at most, only if there's something new) ────────────
  push: {
    title: (ruleTitle: string) => ruleTitle,
    body: (n: number) => (n === 1 ? '1 new post in your group.' : `${n} new posts in your group.`),
    setting: 'Group updates',
    settingHint: 'One push a day when your group has new posts.',
  },

  // ── Moderator tools (Mark's account only) ──────────────────────────────
  moderator: {
    title: 'Moderation',
    queue: (n: number) => (n === 0 ? 'Nothing waiting.' : n === 1 ? '1 thing waiting' : `${n} things waiting`),
    held: 'Held posts',
    reports: 'Reports',
    urgent: 'Urgent: may be unsafe',
    approve: 'Show it',
    hide: 'Hide it',
    mute: 'Mute for 24 hours',
    remove: 'Remove from group',
    removeConfirm: (name: string) => `Remove ${name} from the group?`,
    resolve: 'Done',
    newGroup: 'New group',
    newGroupRule: 'Which rule?',
    newGroupStart: 'Starts',
    create: 'Create group',
    code: (code: string) => `Invite code: ${code}`,
    shareCode: 'Share the code',
    closeGroup: 'Close group now',
    open: 'Open moderation', // new: button on the Groups tab, moderators only
    groups: 'Groups', // new
    readGroup: 'Read the group', // new
    closedTag: 'Closed', // new
    noGroups: 'No groups yet.', // new
  },

  // ── Settings additions ─────────────────────────────────────────────────
  settings: {
    title: 'Community',
    displayName: 'Your group name',
    contact: 'Contact us',
    contactHint: 'hello@braveandboundless.com',
  },
} as const;
