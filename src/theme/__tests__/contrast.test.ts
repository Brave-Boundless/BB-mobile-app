import { describe, expect, it } from '@jest/globals';

import { TEXT_PAIRS, palette } from '../palette';

// CLAUDE.md non-negotiable: text contrast >= 4.5:1.

function resolve(path: string): string {
  const value = path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], palette);
  if (typeof value !== 'string') throw new Error(`No colour at ${path}`);
  return value;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('palette contrast', () => {
  it.each(TEXT_PAIRS.map(([fg, bg]) => [fg, bg]))('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(resolve(fg), resolve(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
