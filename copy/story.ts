// status: approved — Mark, 2026-11-07
//
// Copy for build step 10: Share Your Story, on the Community tab. Lines marked
// (website) are the live braveandboundless.com/connect wording, reused as-is;
// the rest is new and needs Mark's approval. Stories go to the same Kit form as
// the website (9584762).

export const storyCopy = {
  status: 'approved',

  // ── Community tab, top ─────────────────────────────────────────────────
  // Until groups exist (step 11), the tab is Share Your Story.
  intro: {
    eyebrow: 'Two Kinds of People', // (website)
    body: 'Brave & Boundless exists because real people face real challenges—and some find a way through. Not the polished, filtered versions. The honest, messy ones.', // (website)
    madeIt: {
      title: 'People Who’ve Made It Through', // (website)
      body: 'You hit a wall that should have stopped you—and you didn’t let it. Maybe you broke a generational cycle. Built something from nothing. Walked away from a life that looked good on paper but was killing you slowly. Got sober. Got out. Got up after getting knocked down more times than you want to count.', // (website)
      line: 'Your story could be what helps someone else take their first step.', // (website)
    },
    inIt: {
      title: 'People Who Are In It Right Now', // (website)
      body: 'You’re not on the other side yet. You’re still figuring it out—still in the middle of the hard part. That’s okay. Sometimes what people need isn’t a success story. They need to know they’re not alone in the struggle.', // (website)
      line: 'If you’re willing to share where you are, we’d like to hear from you too.', // (website)
    },
    // New: the groups to come, so the tab doesn't read as finished.
    groupsSoon: 'Groups for people working the same rules are coming. Start here.',
  },

  // ── The form ───────────────────────────────────────────────────────────
  form: {
    title: 'Share Your Story', // (website)
    sub: 'We read every submission—an actual human, not an algorithm.', // (website)
    name: 'Your name', // (website)
    email: 'Email', // (website)
    emailFromAccount: 'From your account. Change it if you want replies somewhere else.', // (new)
    kind: 'Which describes you?', // (website)
    kinds: {
      made: 'I’ve made it through something hard', // (website) → Kit value "Made it through"
      inIt: 'I’m in the middle of it right now', // (website) → "In it right now"
      other: 'Something else', // (website) → "Other"
    },
    story: 'Your story', // (website)
    storyPlaceholder: 'Tell us where you are, or what you came through. As much or as little as you want.', // (website)
    // New: the website signs story-sharers up to the newsletter automatically.
    // In the app it's the reader's choice, off by default.
    newsletter: 'Send me the Brave & Boundless newsletter too.',
    submit: 'Share My Story', // (website, without the arrow)
    sending: 'Sending…', // (new)
    note: 'Nothing is published without your explicit permission. We’ll never sell your email. Ever.', // (website)
  },

  // ── After sending ──────────────────────────────────────────────────────
  sent: 'Thank you — your story is in. We read every submission, and we’ll be in touch if it’s a fit.', // (website)
  another: 'Share another', // (new)

  // ── Errors ─────────────────────────────────────────────────────────────
  errors: {
    missing: 'Please add your name and a valid email.', // (website)
    empty: 'Tell us something first. A sentence is enough.', // (new: the website allows an empty story)
    failed: 'Something went wrong. Please email hello@braveandboundless.com and we’ll make sure it reaches us.', // (website)
    offline: 'Offline. Your story is still here. Send it when you’re back.', // (new: the draft is kept)
  },

  // ── What happens next (website) ────────────────────────────────────────
  next: {
    eyebrow: 'What Happens Next',
    title: 'You’re in control—always.',
    items: [
      { title: 'We’ll read your story', body: 'All of it. Not an algorithm—an actual human.' },
      { title: 'We might reach out', body: 'If your story resonates, we may contact you about a short interview for our blog, podcast, social, or promotional content.' },
      { title: 'Nothing happens without your permission', body: 'You control what gets shared and how. We’ll never publish anything with your name attached without your explicit approval.' },
      { title: 'Your information stays private', body: 'We’ll never sell your email to anyone. Ever.' },
    ],
  },

  // ── Privacy + crisis (website) ─────────────────────────────────────────
  privacy: {
    title: 'A Note on Privacy',
    body: 'We take this seriously. Your story is yours. We’re not here to exploit anyone’s pain for content. If you share something with us, it stays between us unless you explicitly say otherwise—in writing, after you’ve seen exactly what we plan to publish.',
    crisis: 'If you’re currently in crisis or experiencing thoughts of self-harm, please reach out to a professional. The 988 Suicide & Crisis Lifeline is available 24/7 by calling or texting 988. We care about your story, but we’re not equipped to provide emergency support.',
    call988: 'Call or text 988', // (new: a button that opens the phone's dialer)
  },
} as const;
