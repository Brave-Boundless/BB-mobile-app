// status: draft — for Mark's review, 2026-11-07
//
// "How this works": one short page that explains the daily drills (Mark,
// 2026-11-07: "so people know how to use the daily challenges").
//
// Where it opens from (proposed):
//   - Today: a small "How this works" link under "Drill N of 45 · Rule N · Drill N of 3".
//   - First run: a "How this works" link under "Start Day 1", for readers who
//     want the detail before they begin.
//   - You → Settings: a "How this works" row, so it's always findable.
//
// It describes what the app already does; nothing new is built behind it.
// Tone: short, imperative, no exclamation points, never shame a dodge.

export const howItWorksCopy = {
  status: 'draft',

  link: 'How this works',
  title: 'How this works',
  intro: 'One drill a day from the book. 45 days. Here’s the whole thing.',

  sections: [
    {
      heading: 'The 45 days',
      body: [
        '15 rules, one per chapter, in book order. Each rule gets three days.',
        'Day 1: the five-minute drill. Get moving.',
        'Day 2: the uncomfortable drill. Go where it’s hard.',
        'Day 3: the daily drill. Make it a habit.',
      ],
    },
    {
      heading: 'Each morning',
      body: [
        'A push with the rule’s mantra. Tap it, or open the app. Today’s drill is waiting.',
        'Go deeper if you want more: why it matters, what it builds, and what Mark wrote about it.',
        'Short on time? Tap “Only have five minutes” and do the five-minute drill instead. It still counts.',
      ],
    },
    {
      heading: 'Answer honestly',
      body: [
        'Did it, or Dodged it. One tap.',
        'A dodge isn’t a failure. It’s information. Say what got in the way and the next morning’s passage will speak to it.',
        'Tapped the wrong one? Undo.',
      ],
    },
    {
      heading: 'After you answer',
      body: [
        'Rate how hard it was. Plan when you’ll do tomorrow’s drill and get a reminder then.',
        'In the evening, write one to three sentences: what it cost you, or what you learned. It goes in your Journal. Skip it if you want.',
      ],
    },
    {
      heading: 'Your pace',
      body: [
        'The next drill unlocks the morning after you answer. Miss a day and nothing is lost. The drill waits for you.',
        'Finish a rule’s three days and you earn its stamp. Finish a part and you hit a milestone.',
      ],
    },
    {
      heading: 'After Day 45',
      body: [
        'Pick the rules you want to keep running every day. The app shows the rules you dodged most and offers to run them again.',
      ],
    },
    {
      heading: 'Stuck?',
      body: ['Ask Mark. He knows which drill you’re on.'],
    },
  ],

  close: 'Close',
} as const;
