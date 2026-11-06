import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { todayCopy } from '@copy/today';
import { wrapupCopy as copy } from '@copy/wrapup';
import { Button } from '@/components/button';
import { Reveal, Rise, Settle } from '@/components/motion';
import { fadeIn, pop } from '@/theme/motion';
import Animated from 'react-native-reanimated';
import { getRule, rules, type RuleId } from '@/content';
import { EveningPrompt } from '@/features/drill/evening-prompt';
import type { LocalDate } from '@/features/drill/local-date';
import { reportFor, useDrillStore } from '@/features/drill/store';

import { dodgePattern, practiceToday, spineTally, wrapupDue, type PracticeSlot } from './plan';

/** Today once all 45 days are answered: the wrap-up, then the daily set. */
export function AfterDay45({
  today,
  editing,
  setEditing,
}: {
  today: LocalDate;
  editing: boolean;
  setEditing: (v: boolean) => void;
}) {
  const data = useDrillStore();

  if (wrapupDue(data, today)) return <WrapupView today={today} mode="first" onDone={() => {}} />;
  if (editing) return <WrapupView today={today} mode="edit" onDone={() => setEditing(false)} />;
  return <PracticeView today={today} onChange={() => setEditing(true)} />;
}

// ── Wrap-up ────────────────────────────────────────────────────────────────

function Toggle({ label, a11y, on, onPress, testID }: { label: string; a11y: string; on: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={a11y}
      onPress={onPress}
      testID={testID}
      className={`mb-2 min-h-14 flex-row items-center gap-3 border px-4 py-3 active:opacity-80 ${
        on ? 'border-ember bg-charcoal-800' : 'border-charcoal-700 bg-charcoal-900'
      }`}>
      <View className={`h-5 w-5 items-center justify-center border-2 ${on ? 'border-ember bg-ember' : 'border-ash'}`}>
        {on ? (
          <Animated.View entering={pop()}>
            <View className="h-2 w-2 bg-charcoal-950" />
          </Animated.View>
        ) : null}
      </View>
      <Text className="flex-1 font-medium text-base text-bone">{label}</Text>
    </Pressable>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ash">
      {children}
    </Text>
  );
}

function WrapupView({ today, mode, onDone }: { today: LocalDate; mode: 'first' | 'edit'; onDone: () => void }) {
  const data = useDrillStore();
  const setPractice = useDrillStore((s) => s.setPractice);
  const tally = spineTally(data);
  const pattern = dodgePattern(data);

  const [keep, setKeep] = useState<RuleId[]>(data.practice?.dailySet ?? []);
  const [restart, setRestart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleKeep = (id: RuleId) => {
    setError(null);
    setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id].sort((a, b) => a - b)));
  };

  const lockIn = () => {
    const restartRules = mode === 'first' && restart ? pattern.map((p) => p.ruleId) : (data.practice?.restartRules ?? []);
    if (keep.length === 0 && !(mode === 'first' && restart && pattern.length > 0)) {
      setError(copy.wrapup.needOne);
      return;
    }
    setPractice({ dailySet: keep, restartRules, startedOn: data.practice?.startedOn ?? today });
    onDone();
  };

  return (
    <View className="flex-1">
      {mode === 'first' ? (
        <>
          <Rise index={0}>
            <Text accessibilityRole="header" className="font-bold text-3xl text-bone">
              {copy.wrapup.headline}
            </Text>
          </Rise>
          <Rise index={1}>
            <Text className="mt-3 font-sans text-lg text-ash">{copy.wrapup.tally(tally.done, tally.dodged)}</Text>
          </Rise>

          <Rise index={2} base={150}>
          <View className="mt-10">
            <Heading>{copy.wrapup.dodgeTitle}</Heading>
            {pattern.length === 0 ? (
              <Text className="mt-3 font-medium text-lg text-bone">{copy.wrapup.noDodges}</Text>
            ) : (
              <>
                <Text className="mt-2 font-sans text-base text-ash">{copy.wrapup.dodgeBody}</Text>
                <View className="mt-3">
                  {pattern.map((p, i) => (
                    <Rise key={p.ruleId} index={i} base={350}>
                    <View className="mb-2 bg-charcoal-900 p-4">
                      <Text className="font-bold text-base text-bone">{getRule(p.ruleId).title}</Text>
                      <Text className="mt-1 font-medium text-sm text-ember-soft">{copy.wrapup.dodgeRow(p.dodged, p.answered)}</Text>
                    </View>
                    </Rise>
                  ))}
                </View>
                <View className="mt-2">
                  <Toggle
                    label={copy.wrapup.restartToggle}
                    a11y={copy.wrapup.restartToggle}
                    on={restart}
                    onPress={() => {
                      setError(null);
                      setRestart((r) => !r);
                    }}
                    testID="restart-toggle"
                  />
                  <Text className="font-sans text-sm text-ash">{copy.wrapup.restartNote}</Text>
                </View>
              </>
            )}
          </View>
          </Rise>
        </>
      ) : null}

      <Rise index={mode === 'first' ? 3 : 0} base={mode === 'first' ? 250 : 0}>
      <View className={mode === 'first' ? 'mt-10' : ''}>
        <Heading>{copy.wrapup.keepTitle}</Heading>
        <Text className="mt-2 font-sans text-base text-ash">{copy.wrapup.keepBody}</Text>
        <Text className="mb-3 mt-1 font-sans text-sm text-ash">{copy.wrapup.keepHint}</Text>
        {rules.map((r) => (
          <Toggle
            key={r.number}
            label={r.title}
            a11y={copy.wrapup.keepA11y(r.title, keep.includes(r.number))}
            on={keep.includes(r.number)}
            onPress={() => toggleKeep(r.number)}
            testID={`keep-${r.number}`}
          />
        ))}
      </View>
      </Rise>

      {error ? (
        <Animated.View key={error} entering={fadeIn()}>
          <Text accessibilityRole="alert" className="mt-3 font-sans text-sm text-ember-soft">
            {error}
          </Text>
        </Animated.View>
      ) : null}
      <View className="mt-6">
        <Button label={copy.wrapup.cta} onPress={lockIn} testID="lock-it-in" />
      </View>
    </View>
  );
}

// ── Daily set ──────────────────────────────────────────────────────────────

function PracticeView({ today, onChange }: { today: LocalDate; onChange: () => void }) {
  const data = useDrillStore();
  const ensure = useDrillStore((s) => s.ensurePracticeToday);
  const plan = practiceToday(data, today);

  // Create today's rows (and carry an unanswered restart drill over to today).
  const needsRows = !!plan?.slots.some((s) => !s.row || (s.row.status === 'pending' && s.row.scheduledFor !== today));
  useEffect(() => {
    if (needsRows) ensure(today);
  }, [needsRows, ensure, today]);

  if (!plan) return null;
  const restartSlot = plan.slots.find((s) => s.kind === 'restart');
  const dailySlots = plan.slots.filter((s) => s.kind === 'daily');
  const allAnswered = plan.slots.length > 0 && plan.slots.every((s) => s.row && s.row.status !== 'pending');

  return (
    <View className="flex-1">
      <Text className="font-medium text-sm uppercase tracking-widest text-ash">{copy.practice.dayLabel(plan.day)}</Text>
      {plan.restartDone ? (
        <Reveal delay={150}>
          <Text className="mt-4 font-medium text-lg text-ember-soft">{copy.practice.restartDone}</Text>
        </Reveal>
      ) : null}

      {restartSlot && plan.restart ? (
        <View className="mt-6">
          <Text className="font-medium text-sm uppercase tracking-widest text-ember-soft">
            {copy.practice.restartLabel(plan.restart.index, plan.restart.total)}
          </Text>
          <Rise index={0}>
            <SlotCard slot={restartSlot} />
          </Rise>
        </View>
      ) : null}

      <View className="mt-8">
        <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ash">
          {copy.practice.dailySet}
        </Text>
        {dailySlots.length === 0 && !restartSlot ? (
          <Text className="mt-3 font-sans text-lg text-ash">{copy.practice.empty}</Text>
        ) : (
          dailySlots.map((slot, i) => (
            <Rise key={slot.ruleId} index={i} base={restartSlot ? 120 : 0} layout>
              <SlotCard slot={slot} />
            </Rise>
          ))
        )}
      </View>

      {allAnswered ? (
        <Reveal delay={250}>
          <Text className="mt-6 font-medium text-base text-bone">{copy.practice.allAnswered}</Text>
        </Reveal>
      ) : null}

      <View className="mt-6 items-start">
        <Button variant="text" label={copy.practice.change} onPress={onChange} testID="change-daily-set" />
      </View>
    </View>
  );
}

function SlotCard({ slot }: { slot: PracticeSlot }) {
  const answer = useDrillStore((s) => s.answer);
  const undo = useDrillStore((s) => s.undo);
  const [noting, setNoting] = useState(false);
  const hasNote = useDrillStore((s) => !!slot.row && !!reportFor(s, slot.row.id));
  const rule = getRule(slot.ruleId);
  const row = slot.row;
  const label = slot.weekly ? copy.practice.weeklyChallenge : todayCopy.drill.tier[slot.tier];

  return (
    <Settle>
    <View className="mt-3 bg-charcoal-900 p-5" testID={`slot-${slot.kind}-${slot.ruleId}`}>
      <Text className="font-bold text-lg text-bone">{rule.title}</Text>
      <Text className="mt-2 font-medium text-sm uppercase tracking-widest text-ember-soft">{label}</Text>
      <Text className="mt-1 font-medium text-xl leading-8 text-bone">{rule.drills[slot.tier]}</Text>

      {!row ? null : row.status === 'pending' ? (
        <View className="mt-4 gap-3">
          <Button
            label={todayCopy.drill.did}
            accessibilityLabel={`${todayCopy.drill.a11y.did} ${rule.title}.`}
            onPress={() => answer(row.id, 'done', row.tier)}
          />
          <Button
            variant="secondary"
            label={todayCopy.drill.dodged}
            accessibilityLabel={`${todayCopy.drill.a11y.dodged} ${rule.title}.`}
            onPress={() => answer(row.id, 'dodged', row.tier)}
          />
        </View>
      ) : (
        <Animated.View entering={fadeIn()}>
        <View className="mt-4">
          <Text className="font-bold text-lg text-bone">{row.status === 'done' ? copy.practice.done : copy.practice.dodged}</Text>
          {row.status === 'done' ? (
            <Reveal delay={120}>
              <Text className="mt-1 font-medium text-base text-ember-soft">{rule.mantra}</Text>
            </Reveal>
          ) : null}
          {noting || hasNote ? (
            <EveningPrompt row={row} />
          ) : (
            <View className="mt-2 flex-row gap-2">
              <Button variant="text" label={copy.practice.addNote} onPress={() => setNoting(true)} />
              <Button variant="text" label={todayCopy.answered.undo} onPress={() => undo(row.id)} />
            </View>
          )}
        </View>
        </Animated.View>
      )}
    </View>
    </Settle>
  );
}
