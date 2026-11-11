// Sends a story to Kit, the same way braveandboundless.com/connect does:
// first the "Share Your Story" form (name, email, which describes you, story),
// then, only if the reader ticked the box, the newsletter form. Sequential,
// as on the website: Kit 404s when one email hits two forms at the same moment.

export const KIT_STORY_FORM = '9584762';
export const KIT_NEWSLETTER_FORM = '9157427';
/** "Community Signup": readers who want to hear when groups open (Mark, 2026-11-11). */
export const KIT_COMMUNITY_FORM = '10173540';

/** Kit's custom-field values, as the website sends them. */
export const KIND_VALUES = { made: 'Made it through', inIt: 'In it right now', other: 'Other' } as const;
export type StoryKind = keyof typeof KIND_VALUES;

export interface StoryInput {
  name: string;
  email: string;
  kind: StoryKind | null;
  story: string;
  newsletter: boolean;
}

export type StoryError = 'offline' | 'failed';

export class StoryRequestError extends Error {
  constructor(readonly kind: StoryError) {
    super(kind);
  }
}

type Fetch = typeof fetch;

function encode(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function post(formId: string, fields: Record<string, string>, f: Fetch): Promise<void> {
  let res: Response;
  try {
    res = await f(`https://app.kit.com/forms/${formId}/subscriptions`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: encode(fields),
    });
  } catch {
    throw new StoryRequestError('offline');
  }
  if (!res.ok) throw new StoryRequestError('failed');
}

export async function submitStory(input: StoryInput, f: Fetch = fetch): Promise<void> {
  const base = { email_address: input.email.trim(), 'fields[first_name]': input.name.trim() };
  await post(
    KIT_STORY_FORM,
    {
      ...base,
      ...(input.kind ? { 'fields[which_describes_you]': KIND_VALUES[input.kind] } : {}),
      'fields[story]': input.story.trim(),
    },
    f,
  );
  if (input.newsletter) await post(KIT_NEWSLETTER_FORM, base, f);
}

export const STORY_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** What's missing, in the order the form asks for it. */
export function checkStory(input: StoryInput): 'missing' | 'empty' | null {
  if (!input.name.trim() || !STORY_EMAIL_RE.test(input.email.trim())) return 'missing';
  if (!input.story.trim()) return 'empty';
  return null;
}

/** Adds an email to the community waitlist (Kit form "Community Signup"). */
export async function joinCommunityWaitlist(email: string, f: Fetch = fetch): Promise<void> {
  await post(KIT_COMMUNITY_FORM, { email_address: email.trim() }, f);
}
