// status: approved — Mark, 2026-11-07
//
// Copy for build step 9: Ask Mark in the app. Lines marked (website) are the
// live braveandboundless.com/ask wording, reused as-is; everything else is new
// and needs Mark's approval. Answers come from the Ask Mark server
// (Brave-Boundless/askMark) and are never written here.

export const askMarkCopy = {
  status: 'approved',

  // ── Header ─────────────────────────────────────────────────────────────
  title: 'Ask Mark', // (website)
  subtitle: 'Advice from Brave & Boundless', // (website)

  // ── Empty chat ─────────────────────────────────────────────────────────
  welcome: {
    title: 'Straight answers for tough questions.', // (website)
    body: 'No sugarcoating. No preaching. Just straight talk on career, relationships, parenting, and breaking the patterns holding you back.', // (website)
    startersLabel: 'Try one of these', // (website)
    shuffle: 'Shuffle', // (website)
    ownLabel: 'Or ask your own', // (website)
  },

  // Three shown at a time, shuffled. (website, all 18)
  starters: [
    'I’m stuck and don’t know what to do next.',
    'How do I have a conversation I’ve been avoiding?',
    'My kid won’t listen to me.',
    'I hate my job but I’m scared to leave.',
    'How do I stop caring what people think?',
    'I feel like I’ve wasted years of my life.',
    'How do I know if my relationship is worth saving?',
    'I keep making the same mistakes over and over.',
    'How do I stop letting fear run my life?',
    'I don’t know what I actually want.',
    'How do I set boundaries without feeling guilty?',
    'I’m successful but still feel empty.',
    'How do I stop repeating my parents’ mistakes?',
    'I want to start something but don’t know where to begin.',
    'I’ve lost my faith. Can I get it back?',
    'I feel like I’m living someone else’s life.',
    'My marriage feels like we’re just roommates.',
    'I know what I need to do but can’t make myself do it.',
  ],

  // App only: one of these leads the three when it applies. (new)
  drillStarters: {
    today: 'Help me with today’s drill.',
    dodged: 'I dodged today. Talk me through it.',
    pattern: 'Why do I keep dodging?',
  },

  // ── Writing ────────────────────────────────────────────────────────────
  placeholder: 'What’s on your mind?', // (website)
  followUp: 'Ask a follow-up…', // (website)
  send: 'Send',
  sendA11y: 'Send your question to Ask Mark.',
  writing: 'Writing…', // shown while the answer comes back (new)
  writingA11y: 'Ask Mark is writing an answer.',
  you: 'You', // speaker label for VoiceOver (new)

  // ── What Ask Mark knows (new) ──────────────────────────────────────────
  // One quiet line above the chat while sharing is on.
  knows: (day: number, rule: number) => `Ask Mark knows you’re on drill ${day} of 45, Rule ${rule}.`,
  knowsAfter45: 'Ask Mark knows your daily set.',
  knowsOff: 'Ask Mark doesn’t see your drills. Turn it on in Settings.',

  // ── Save / start over ──────────────────────────────────────────────────
  email: {
    button: 'Email me this chat', // (website)
    title: 'Email this conversation', // (website)
    body: 'We’ll send you a copy of this chat so you can reference it later.', // (website)
    note: 'A copy will also be shared with Mark.', // (website)
    placeholder: 'Your email', // (website)
    send: 'Send', // (website)
    cancel: 'Cancel', // (website)
    sending: 'Sending…', // (website)
    sent: 'Sent to your inbox', // (website)
  },
  newChat: 'New conversation', // (new)
  newChatConfirm: 'Clear this conversation from your phone?', // (new)
  newChatYes: 'Clear it',
  newChatNo: 'Keep it',

  // ── The fine print ─────────────────────────────────────────────────────
  // Under the welcome, always visible. Shortened from the website's note.
  disclaimer:
    'Ask Mark is powered by AI and trained on the principles and voice behind Brave & Boundless. It’s not Mark, and it’s not a therapist, doctor, lawyer, or financial advisor.',
  crisis: 'In crisis? Call or text 988, any time.', // matches the website's 988 line

  // ── When it goes wrong (new) ───────────────────────────────────────────
  errors: {
    offline: 'Offline. Ask Mark needs a connection.',
    busy: 'Too many questions too fast. Give it a minute.',
    failed: 'Couldn’t get an answer. Try again.',
    retry: 'Try again',
  },
} as const;

// Settings → a new "Ask Mark" section. (new)
export const askMarkSettingsCopy = {
  status: 'approved',
  title: 'Ask Mark',
  share: 'Share my drill progress',
  shareHint: 'Your day, rule, today’s drill, whether you did it or dodged it, and what got in the way. Never your journal.',
} as const;
