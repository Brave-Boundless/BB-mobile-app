import { describe, expect, it } from '@jest/globals';

import { MILESTONE_DAYS, SPINE_LENGTH, milestoneFor, spineDay, spineDrill } from '../spine';

describe('spine', () => {
  it('maps 45 days to rules 1-15, three tiers each, in book order', () => {
    const days = Array.from({ length: SPINE_LENGTH }, (_, i) => spineDay(i + 1));
    expect(days.map((d) => d.ruleId)).toEqual(Array.from({ length: 45 }, (_, i) => Math.floor(i / 3) + 1));
    expect(days.slice(0, 3).map((d) => d.tier)).toEqual(['five_minute', 'uncomfortable', 'daily']);
    expect(days.every((d, i) => d.tier === ['five_minute', 'uncomfortable', 'daily'][i % 3])).toBe(true);
  });

  it('rejects days outside 1-45', () => {
    for (const bad of [0, 46, 1.5, -1]) expect(() => spineDay(bad)).toThrow(RangeError);
  });

  it('puts milestones on the last day of each part', () => {
    expect(MILESTONE_DAYS).toEqual({ 12: 1, 24: 2, 36: 3, 45: 4 });
    // Last day of each part is the daily tier of that part's last rule.
    expect(spineDay(12)).toMatchObject({ ruleId: 4, tier: 'daily' });
    expect(spineDay(24)).toMatchObject({ ruleId: 8, tier: 'daily' });
    expect(spineDay(36)).toMatchObject({ ruleId: 12, tier: 'daily' });
    expect(spineDay(45)).toMatchObject({ ruleId: 15, tier: 'daily' });
    expect(milestoneFor(11)).toBeUndefined();
  });

  it('uses the card drill text verbatim', () => {
    expect(spineDrill(1).text).toBe('Write the smallest visible step you can take in 5 minutes. Do it now.');
    expect(spineDrill(5).text).toBe('Deliver it to the person, same day, with ownership + ask.');
  });
});
