// Evening report-back limits: optional, 1-3 sentences (CLAUDE.md §3).
// The database also caps the body at 1000 characters.

export const MAX_SENTENCES = 3;
export const MAX_CHARS = 1000;

export function sentenceCount(text: string): number {
  return text
    .trim()
    .split(/[.!?…]+(?:\s+|$)/)
    .filter((s) => s.trim().length > 0).length;
}

export type ReportCheck = { ok: true; body: string } | { ok: false; reason: 'empty' | 'too_long' };

export function checkReport(raw: string): ReportCheck {
  const body = raw.trim();
  if (!body) return { ok: false, reason: 'empty' };
  if (body.length > MAX_CHARS || sentenceCount(body) > MAX_SENTENCES) return { ok: false, reason: 'too_long' };
  return { ok: true, body };
}
