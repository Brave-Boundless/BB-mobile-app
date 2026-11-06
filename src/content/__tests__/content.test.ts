import { describe, expect, it } from '@jest/globals';

import { DRILL_TIERS, PASSAGE_USES, SITUATIONS, getPart, getRule, parts, passages, rules } from '@/content';

// Guards the shape of content/*.json. The app casts these files to typed
// structures, so this suite is what makes that cast safe.

const EXPECTED_PARTS = [
  { id: 1, name: 'FIRE', rules: [1, 2, 3, 4] },
  { id: 2, name: 'FORGE', rules: [5, 6, 7, 8] },
  { id: 3, name: 'FOUNDATION', rules: [9, 10, 11, 12] },
  { id: 4, name: 'FIELD', rules: [13, 14, 15] },
];

const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;

describe('rule cards', () => {
  it('has the four parts from the book, in order', () => {
    expect(parts.map(({ id, name, rules: r }) => ({ id, name, rules: r }))).toEqual(EXPECTED_PARTS);
  });

  it('has exactly rules 1-15, in order', () => {
    expect(rules.map((r) => r.number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it.each(rules.map((r) => [r.number, r] as const))('rule %i has all six card fields', (_, rule) => {
    expect(nonEmpty(rule.title)).toBe(true);
    expect(nonEmpty(rule.chapter)).toBe(true);
    expect(nonEmpty(rule.why_it_matters)).toBe(true);
    expect(nonEmpty(rule.scorecard)).toBe(true);
    expect(nonEmpty(rule.mantra)).toBe(true);
    expect(Object.keys(rule.drills).sort()).toEqual([...DRILL_TIERS].sort());
    for (const tier of DRILL_TIERS) expect(nonEmpty(rule.drills[tier])).toBe(true);
  });

  it("puts each rule in the part that lists it", () => {
    for (const rule of rules) expect(getPart(rule.part).rules).toContain(rule.number);
  });

  it('looks up rules and parts by id', () => {
    expect(getRule(1).mantra).toBe('Action beats anxiety.');
    expect(getPart(4).name).toBe('FIELD');
  });
});

describe('passages', () => {
  it('has unique ids', () => {
    const ids = passages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses known rules, uses and situations', () => {
    for (const p of passages) {
      expect(p.rule).toBeGreaterThanOrEqual(1);
      expect(p.rule).toBeLessThanOrEqual(15);
      expect(PASSAGE_USES).toContain(p.use);
      expect(p.situations.length).toBeGreaterThan(0);
      for (const s of p.situations) expect(SITUATIONS).toContain(s);
      expect(nonEmpty(p.text)).toBe(true);
      if (p.explicit !== undefined) expect(typeof p.explicit).toBe('boolean');
    }
  });

  it('has at least one push-safe morning passage for every rule', () => {
    for (let rule = 1; rule <= 15; rule++) {
      expect(passages.some((p) => p.rule === rule && p.use === 'morning' && !p.explicit)).toBe(true);
    }
  });
});
