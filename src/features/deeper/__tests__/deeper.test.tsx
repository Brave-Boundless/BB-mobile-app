import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import { deeperCopy as copy } from '@copy/deeper';
import { DRILL_TIERS, deeperExercise, deeperPassages, drillOutcome, getRule, rules } from '@/content';

import { DeeperScreen } from '../deeper-screen';

describe('Go deeper content', () => {
  it('gives every one of the 45 drills an outcome and three book passages', () => {
    for (const r of rules) {
      for (const t of DRILL_TIERS) {
        expect(drillOutcome(r.number, t).length).toBeGreaterThan(0);
        const ps = deeperPassages(r.number, t);
        expect(ps).toHaveLength(3);
        for (const p of ps) expect(p.rule).toBe(r.number);
        for (const p of ps) expect(p.use).not.toBe('exercise');
      }
    }
  });

  it('shows different passages for the three drills of a rule', () => {
    const ids = DRILL_TIERS.flatMap((t) => deeperPassages(1, t).map((p) => p.id));
    expect(new Set(ids).size).toBe(9);
  });

  it('only offers exercises from the same rule', () => {
    for (const r of rules) for (const t of DRILL_TIERS) {
      const ex = deeperExercise(r.number, t);
      if (ex) expect(ex).toMatchObject({ rule: r.number, use: 'exercise' });
    }
  });
});

describe('Go deeper screen', () => {
  it('shows the drill, why it matters, what it builds, passages and the exercise', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ rule: '1', tier: 'uncomfortable' });
    await render(<DeeperScreen />);
    const r = getRule(1);
    expect(screen.getByText(r.drills.uncomfortable)).toBeTruthy();
    expect(screen.getByText(r.why_it_matters)).toBeTruthy();
    expect(screen.getByText(drillOutcome(1, 'uncomfortable'))).toBeTruthy();
    for (const p of deeperPassages(1, 'uncomfortable')) expect(screen.getByText(p.text)).toBeTruthy();
    expect(screen.getByTestId('exercise')).toBeTruthy();
    for (const h of [copy.whyItMatters, copy.whatItBuilds, copy.fromTheBook, copy.exercise]) expect(screen.getByText(h)).toBeTruthy();
    expect(screen.getByTestId('deeper-ask-mark')).toBeTruthy();
  });

  it('renders nothing for a bad link', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ rule: '99', tier: 'daily' });
    await render(<DeeperScreen />);
    expect(screen.queryByTestId('deeper')).toBeNull();
  });
});
