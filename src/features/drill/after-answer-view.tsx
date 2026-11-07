import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { practiceCopy as copy } from '@copy/practice';
import { todayCopy } from '@copy/today';
import { Button } from '@/components/button';
import { Chips } from '@/components/chips';
import { TimeField, formatTime } from '@/components/time-field';
import { getRule, type RuleId } from '@/content';
import { features } from '@/lib/features';
import { fadeIn } from '@/theme/motion';

import { StampImage } from '@/features/stamps/passport';

import { PLAN_TIMES, dodgePattern, lookBackFor, ruleRecap } from './after-answer';
import { addDays, type LocalDate } from './local-date';
import { SPINE_LENGTH, spineDay } from './spine';
import { DODGE_REASONS, useDrillStore, type DrillDayRow, type Effort } from './store';

// ── How hard was it? (done drills) ────────────────────────────────────────

export function HowHard({ row }: { row: DrillDayRow }) {
  const rate = useDrillStore((s) => s.rate);
  const skipAsk = useDrillStore((s) => s.skipAsk);
  const skipped = useDrillStore((s) => !!s.askSkipped[row.id]);
  if (skipped && !row.effort) return null;
  const chips = copy.rating.scale.map((label, i) => ({
    key: String(i + 1) as `${Effort}`,
    label,
    a11y: copy.rating.a11y(i + 1, label),
  }));
  return (
    <View className="mt-8" testID="how-hard">
      <Text className="font-bold text-xl text-bone">{copy.rating.prompt}</Text>
      <View className="mt-3">
        <Chips
          chips={chips}
          selected={row.effort ? (String(row.effort) as `${Effort}`) : null}
          onSelect={(k) => rate(row.id, Number(k) as Effort)}
          testID="effort"
        />
      </View>
      {!row.effort ? (
        <View className="mt-1 items-start">
          <Button variant="text" label={copy.rating.skip} onPress={() => skipAsk(row.id)} testID="effort-skip" />
        </View>
      ) : null}
    </View>
  );
}

// ── What got in the way? (dodged drills) ──────────────────────────────────

export function WhatGotInTheWay({ row }: { row: DrillDayRow }) {
  const setReason = useDrillStore((s) => s.setDodgeReason);
  const skipAsk = useDrillStore((s) => s.skipAsk);
  const skipped = useDrillStore((s) => !!s.askSkipped[row.id]);
  const drills = useDrillStore((s) => s.drills);
  if (skipped && !row.dodgeReason) return null;
  const pattern = row.dodgeReason ? dodgePattern({ drills }) : undefined;
  const chips = DODGE_REASONS.map((k) => ({ key: k, label: copy.dodge.reasons[k] }));
  return (
    <View className="mt-8" testID="what-got-in-the-way">
      <Text className="font-bold text-xl text-bone">{copy.dodge.prompt}</Text>
      <View className="mt-3">
        <Chips chips={chips} selected={row.dodgeReason ?? null} onSelect={(k) => setReason(row.id, k)} testID="reason" />
      </View>
      {!row.dodgeReason ? (
        <View className="mt-1 items-start">
          <Button variant="text" label={copy.dodge.skip} onPress={() => skipAsk(row.id)} testID="reason-skip" />
        </View>
      ) : null}
      {pattern ? (
        <Animated.View entering={fadeIn()}>
          <Text className="mt-4 font-medium text-base text-ember-soft" testID="dodge-pattern">
            {copy.dodge.pattern(copy.dodge.reasons[pattern.reason], pattern.count)}
          </Text>
          {features.askMark ? (
            <View className="mt-1 items-start">
              <Button variant="text" label={copy.dodge.askMark} onPress={() => router.push('/ask')} />
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── Plan tomorrow ─────────────────────────────────────────────────────────

export function PlanTomorrow({ row, today }: { row: DrillDayRow; today: LocalDate }) {
  const plan = useDrillStore((s) => s.plan);
  const setPlan = useDrillStore((s) => s.setPlan);
  const [picking, setPicking] = useState(false);
  if (row.day >= SPINE_LENGTH) return null;
  const next = spineDay(row.day + 1);
  const tomorrow = addDays(today, 1);
  const current = plan?.forDate === tomorrow ? plan : null;

  const options = (['morning', 'midday', 'evening'] as const).map((k) => ({ key: k, label: copy.plan.options[k] }));
  const choose = (at: string) => {
    setPlan({ forDate: tomorrow, at });
    setPicking(false);
  };

  return (
    <View className="mt-10 bg-charcoal-900 p-5" testID="plan-tomorrow">
      <Text className="font-bold text-xl text-bone">{copy.plan.headline(next.ruleId, todayCopy.drill.tier[next.tier])}</Text>
      {current && !picking ? (
        <View className="mt-3">
          <Text className="font-medium text-lg text-ember-soft" testID="plan-set">
            {copy.plan.set(formatTime(current.at))}
          </Text>
          <View className="mt-1 flex-row gap-4">
            <Button variant="text" label={copy.plan.change} onPress={() => setPicking(true)} testID="plan-change" />
            <Button variant="text" label={copy.plan.none} onPress={() => setPlan(null)} testID="plan-none" />
          </View>
        </View>
      ) : (
        <View className="mt-3">
          <Text className="font-sans text-base text-ash">{copy.plan.prompt}</Text>
          <View className="mt-3">
            <Chips chips={options} onSelect={(k) => choose(PLAN_TIMES[k])} testID="plan" />
          </View>
          <PickTime onPick={choose} />
        </View>
      )}
    </View>
  );
}

function PickTime({ onPick }: { onPick: (hhmm: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('07:30');
  if (!open) {
    return (
      <View className="mt-1 items-start">
        <Button variant="text" label={copy.plan.options.pick} onPress={() => setOpen(true)} testID="plan-pick" />
      </View>
    );
  }
  return (
    <View className="mt-3">
      <TimeField value={value} onChange={setValue} />
      <View className="mt-2 items-start">
        <Button variant="secondary" label={todayCopy.evening.save} onPress={() => onPick(value)} testID="plan-pick-save" />
      </View>
    </View>
  );
}

// ── On Day N you wrote ────────────────────────────────────────────────────

export function LookBack({ today, ruleId }: { today: LocalDate; ruleId: RuleId }) {
  const drills = useDrillStore((s) => s.drills);
  const journal = useDrillStore((s) => s.journal);
  const lookBack = useDrillStore((s) => s.lookBack);
  const setLookBack = useDrillStore((s) => s.setLookBack);
  const pick = lookBackFor({ drills, journal, lookBack }, today, ruleId);

  useEffect(() => {
    if (pick?.isNew) setLookBack({ on: today, journalId: pick.entry.id });
  }, [pick?.isNew, pick?.entry.id, today, setLookBack]);

  if (!pick) return null;
  const rule = getRule(drills[pick.entry.drillDayId].ruleId);
  return (
    <View className="mt-10 border-l-2 border-ember pl-4" testID="look-back">
      <Text className="font-medium text-sm uppercase tracking-widest text-ash">{copy.lookBack.label(pick.day)}</Text>
      <Text className="mt-2 font-sans text-lg leading-7 text-bone">{pick.entry.body}</Text>
      <Text className="mt-1 font-sans text-sm text-ash">{`${todayCopy.drill.ruleLabel(rule.number)} · ${rule.title}`}</Text>
      <View className="mt-1 items-start">
        <Button variant="text" label={copy.lookBack.open} onPress={() => router.push('/you')} />
      </View>
    </View>
  );
}

// ── Rule recap (after a rule's third drill) ───────────────────────────────

export function RuleRecapCard({ row }: { row: DrillDayRow }) {
  const drills = useDrillStore((s) => s.drills);
  const journal = useDrillStore((s) => s.journal);
  if (spineDay(row.day).dayOfRule !== 3) return null;
  const recap = ruleRecap({ drills, journal }, row.ruleId);
  if (!recap) return null;
  const next = recap.next ? getRule(recap.next) : undefined;
  return (
    <Animated.View entering={fadeIn()}>
      <View className="mt-10 border border-ember p-5" testID="rule-recap">
        <View className="flex-row items-start gap-4">
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-bold text-xl text-bone">
              {copy.recap.headline(recap.ruleId)}
            </Text>
            <Text className="mt-2 font-medium text-base text-bone">{copy.recap.tally(recap.done, recap.dodged)}</Text>
            {recap.hardest ? (
              <Text className="mt-1 font-sans text-base text-ash">{copy.recap.hardest(copy.rating.scale[recap.hardest - 1])}</Text>
            ) : null}
            <Text className="mt-1 font-medium text-base text-ember-soft">{copy.recap.stamp}</Text>
          </View>
          <StampImage ruleId={recap.ruleId} width={88} />
        </View>
        <Text className="mt-5 font-medium text-sm uppercase tracking-widest text-ash">{copy.recap.notes}</Text>
        {recap.notes.length === 0 ? (
          <Text className="mt-1 font-sans text-base text-ash">{copy.recap.noNotes}</Text>
        ) : (
          recap.notes.map((n) => (
            <View key={n.day} className="mt-2">
              <Text className="font-sans text-sm text-ash">{copy.lookBack.label(n.day)}</Text>
              <Text className="font-sans text-base text-bone">{n.body}</Text>
            </View>
          ))
        )}
        {next ? <Text className="mt-5 font-bold text-base text-bone">{copy.recap.next(next.number, next.title)}</Text> : null}
      </View>
    </Animated.View>
  );
}
