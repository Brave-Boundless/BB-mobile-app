// Talks to the Ask Mark server (Brave-Boundless/askMark on Railway), the same
// one the website uses. The app adds an optional `context` (see context.ts);
// the server appends it to the prompt only when present.

import type { AskMarkContext } from './context';

export const ASK_MARK_URL = (process.env.EXPO_PUBLIC_ASK_MARK_URL || 'https://askmark-production.up.railway.app').replace(/\/$/, '');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AskMarkError = 'offline' | 'busy' | 'failed';

export class AskMarkRequestError extends Error {
  constructor(readonly kind: AskMarkError) {
    super(kind);
  }
}

type Fetch = typeof fetch;

/** One turn: the whole conversation goes up (the server keeps no history). */
export async function askMark(
  messages: ChatMessage[],
  opts: { conversationId?: string | null; context?: AskMarkContext | null; fetchImpl?: Fetch } = {},
): Promise<{ message: string; conversationId: string }> {
  const f = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await f(`${ASK_MARK_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages,
        conversationId: opts.conversationId ?? undefined,
        ...(opts.context ? { context: opts.context } : {}),
      }),
    });
  } catch {
    throw new AskMarkRequestError('offline');
  }
  if (res.status === 429) throw new AskMarkRequestError('busy');
  if (!res.ok) throw new AskMarkRequestError('failed');
  const body = (await res.json().catch(() => null)) as { message?: string; conversationId?: string } | null;
  if (!body?.message) throw new AskMarkRequestError('failed');
  return { message: body.message, conversationId: body.conversationId ?? opts.conversationId ?? '' };
}

/** "Email me this chat": the server emails the reader and copies Mark (as on the website). */
export async function sendTranscript(
  email: string,
  messages: ChatMessage[],
  conversationId: string | null,
  fetchImpl: Fetch = fetch,
): Promise<void> {
  let res: Response;
  try {
    res = await fetchImpl(`${ASK_MARK_URL}/api/send-transcript`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, messages, conversationId }),
    });
  } catch {
    throw new AskMarkRequestError('offline');
  }
  if (!res.ok) throw new AskMarkRequestError(res.status === 429 ? 'busy' : 'failed');
}
