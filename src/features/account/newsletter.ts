import { KIT_NEWSLETTER_FORM, StoryRequestError } from '@/features/story/kit';

type Fetch = typeof fetch;

/** Adds an email to Mark's newsletter (Kit form 9157427), the same form the website and Share Your Story use. */
export async function joinNewsletter(email: string, f: Fetch = fetch): Promise<void> {
  let res: Response;
  try {
    res = await f(`https://app.kit.com/forms/${KIT_NEWSLETTER_FORM}/subscriptions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: `email_address=${encodeURIComponent(email.trim())}`,
    });
  } catch {
    throw new StoryRequestError('offline');
  }
  if (!res.ok) throw new StoryRequestError('failed');
}
