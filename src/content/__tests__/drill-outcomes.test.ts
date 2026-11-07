import { describe, expect, it } from '@jest/globals';

import outcomes from '../../../content/drill-outcomes.json';

// "What it builds" copy for the Go deeper page: one line per drill, 45 in all.

const TIERS = ['five_minute', 'uncomfortable', 'daily'] as const;

describe('drill outcomes', () => {
  it('covers all 15 rules in order', () => {
    expect(outcomes.rules.map((r) => r.number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('has a short, non-empty line for every one of the 45 drills', () => {
    const lines = outcomes.rules.flatMap((r) => TIERS.map((t) => r[t]));
    expect(lines).toHaveLength(45);
    for (const line of lines) {
      expect(line.trim().length).toBeGreaterThan(0);
      expect(line.length).toBeLessThanOrEqual(200);
    }
  });

  it('follows the tone rules: no exclamation points', () => {
    const lines = outcomes.rules.flatMap((r) => TIERS.map((t) => r[t]));
    expect(lines.filter((l) => l.includes('!'))).toEqual([]);
  });
});
