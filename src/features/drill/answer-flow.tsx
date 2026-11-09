import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { askMarkCopy } from '@copy/askmark';
import { practiceCopy } from '@copy/practice';
import { redesignCopy } from '@copy/redesign';
import { todayCopy as copy } from '@copy/today';
import { Button } from '@/components/button';
import { Reveal, Rise } from '@/components/motion';
import { getRule } from '@/content';
import { MorningPassage } from '@/features/inspiration/today-passages';
import { features } from '@/lib/features';
import { palette } from '@/theme';
import { fadeIn } from '@/theme/motion';

import { PlanTomorrow, RuleRecapCard } from './after-answer-view';
import { dodgePattern } from './after-answer';
import { checkReport } from './journal-rules';
import { DODGE_REASONS, useDrillStore, type DrillDayRow, type Effort } from './store';

/**
 * The screens right after Did it / Dodged it, one at a time (redesign step 1):
 *   1. Did it: the mantra on orange, how hard (one tap), one line.
 *      Dodged it: no lecture, what got in the way (one tap), one line.
 *   2. The day's passage, plan tomorrow, and the recap after a rule's third drill.
 * Next with nothing filled in counts as skipping, so the resting Today screen
 * doesn't ask again.
 */
export function AnswerFlow({ row, today, onFinish }: { row: DrillDayRow; today: string; onFinish: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const done = row.status === 'done';
  const onOrange = step === 1 && done;
  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${onOrange ? 'bg-ember' : 'bg-charcoal-950'}`} testID={`answer-flow-${step}`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView key={step} contentContainerClassName="grow px-6 pb-8 pt-4" keyboardShouldPersistTaps="handled">
          {step === 1 ? <FirstStep row={row} onNext={() => setStep(2)} /> : <SecondStep row={row} today={today} onFinish={onFinish} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── 1. The answer ─────────────────────────────────────────────────────────

function FirstStep({ row, onNext }: { row: DrillDayRow; onNext: () => void }) {
  const undo = useDrillStore((s) => s.undo);
  const skipAsk = useDrillStore((s) => s.skipAsk);
  const saveReport = useDrillStore((s) => s.saveReport);
  const skipReport = useDrillStore((s) => s.skipReport);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const done = row.status === 'done';
  const rule = getRule(row.ruleId);
  const ink = done ? palette.charcoal[950] : palette.bone;
  const prompt = done ? copy.evening.promptDone : copy.evening.promptDodged;

  const next = () => {
    if (text.trim()) {
      const check = checkReport(text);
      if (!check.ok) {
        if (check.reason === 'too_long') setError(copy.evening.tooLong);
        return;
      }
      saveReport(row.id, check.body);
    } else {
      skipReport(row.id);
    }
    if (done ? !row.effort : !row.dodgeReason) skipAsk(row.id);
    onNext();
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between">
        <Text style={{ color: ink }} className="font-bold text-sm uppercase tracking-widest">
          {done ? copy.answered.done : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => undo(row.id)}
          testID="undo"
          className="min-h-12 justify-center px-2 active:opacity-60">
          <Text style={{ color: ink }} className="font-medium text-base underline">
            {copy.answered.undo}
          </Text>
        </Pressable>
      </View>

      <Animated.View entering={fadeIn()}>
        <View
          className="mt-4 h-16 w-16 items-center justify-center"
          style={{ backgroundColor: done ? palette.charcoal[950] : palette.charcoal[800] }}>
          <Text style={{ color: done ? palette.ember.DEFAULT : palette.bone }} className="font-bold text-3xl">
            {done ? '✓' : '✕'}
          </Text>
        </View>
      </Animated.View>

      {done ? (
        <Reveal delay={150}>
          <Text accessibilityRole="header" style={{ color: ink }} className="mt-6 font-bold text-5xl uppercase leading-[52px]">
            {rule.mantra}
          </Text>
        </Reveal>
      ) : (
        <Text accessibilityRole="header" className="mt-6 font-bold text-3xl text-bone">
          {copy.answered.dodged}
        </Text>
      )}

      <Rise base={300}>{done ? <EffortBars row={row} /> : <ReasonTiles row={row} />}</Rise>

      <Rise base={360}>
        <View className="mt-8">
          <Text nativeID="flow-note" style={{ color: ink }} className="font-bold text-base">
            {prompt}
          </Text>
          <TextInput
            accessibilityLabel={prompt}
            accessibilityLabelledBy="flow-note"
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (error) setError(null);
            }}
            placeholder={copy.evening.placeholder}
            placeholderTextColor={done ? 'rgba(14,13,12,0.6)' : palette.ash}
            multiline
            maxLength={1000}
            style={{ color: ink, borderColor: ink }}
            className="mt-2 min-h-14 border-b-2 py-2 font-sans text-lg"
            testID="evening-input"
          />
          {error ? (
            <Text accessibilityRole="alert" style={{ color: ink }} className="mt-2 font-bold text-sm">
              {error}
            </Text>
          ) : null}
        </View>
      </Rise>

      <View className="mt-auto pt-10">
        <Pressable
          accessibilityRole="button"
          onPress={next}
          testID="flow-next"
          style={{ backgroundColor: done ? palette.charcoal[950] : palette.ember.DEFAULT }}
          className="min-h-14 items-center justify-center active:opacity-80">
          <Text style={{ color: done ? palette.bone : palette.charcoal[950] }} className="font-bold text-lg uppercase tracking-wider">
            {redesignCopy.next}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** How hard: five bars, rising. One tap; tap again to change. */
function EffortBars({ row }: { row: DrillDayRow }) {
  const rate = useDrillStore((s) => s.rate);
  const scale = practiceCopy.rating.scale;
  return (
    <View className="mt-10" testID="how-hard">
      <Text className="font-bold text-sm uppercase tracking-widest text-charcoal-950">{practiceCopy.rating.prompt}</Text>
      <View className="mt-3 flex-row gap-2">
        {scale.map((label, i) => {
          const n = (i + 1) as Effort;
          const on = row.effort === n;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={practiceCopy.rating.a11y(n, label)}
              accessibilityState={{ selected: on }}
              onPress={() => rate(row.id, n)}
              testID={`effort-${n}`}
              className="h-16 flex-1 items-center justify-end border-2 border-charcoal-950 pb-2"
              style={{ backgroundColor: on ? palette.charcoal[950] : 'transparent' }}>
              <View style={{ width: 14, height: 8 + i * 7, backgroundColor: on ? palette.ember.DEFAULT : palette.charcoal[950] }} />
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-2 min-h-6 font-bold text-base text-charcoal-950">{row.effort ? scale[row.effort - 1] : ''}</Text>
    </View>
  );
}

/** What got in the way: five big tiles. One tap. No lecture. */
function ReasonTiles({ row }: { row: DrillDayRow }) {
  const setReason = useDrillStore((s) => s.setDodgeReason);
  const drills = useDrillStore((s) => s.drills);
  const pattern = row.dodgeReason ? dodgePattern({ drills }) : undefined;
  return (
    <View className="mt-10" testID="what-got-in-the-way">
      <Text className="font-bold text-sm uppercase tracking-widest text-bone">{practiceCopy.dodge.prompt}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {DODGE_REASONS.map((k) => {
          const on = row.dodgeReason === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setReason(row.id, k)}
              testID={`reason-${k}`}
              className={`min-h-14 justify-center border-2 px-4 ${on ? 'border-bone bg-bone' : 'border-charcoal-700'}`}
              style={{ flexBasis: '47%', flexGrow: 1 }}>
              <Text className={`font-bold text-base ${on ? 'text-charcoal-950' : 'text-bone'}`}>{practiceCopy.dodge.reasons[k]}</Text>
            </Pressable>
          );
        })}
      </View>
      {pattern ? (
        <Animated.View entering={fadeIn()}>
          <Text className="mt-4 font-medium text-base text-ember-soft" testID="dodge-pattern">
            {practiceCopy.dodge.pattern(practiceCopy.dodge.reasons[pattern.reason], pattern.count)}
          </Text>
          {features.askMark ? (
            <View className="mt-1 items-start">
              <Button
                variant="text"
                label={practiceCopy.dodge.askMark}
                onPress={() => router.push({ pathname: '/ask', params: { prefill: askMarkCopy.drillStarters.pattern } })}
                testID="dodge-ask-mark"
              />
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── 2. The passage, tomorrow, and the recap ───────────────────────────────

function SecondStep({ row, today, onFinish }: { row: DrillDayRow; today: string; onFinish: () => void }) {
  return (
    <View className="flex-1">
      <Rise index={0}>
        <MorningPassage row={row} today={today} />
      </Rise>
      <RuleRecapCard row={row} />
      <Rise index={1}>
        <PlanTomorrow row={row} today={today} />
      </Rise>
      <View className="mt-auto pt-10">
        <Button label={redesignCopy.finish} onPress={onFinish} testID="flow-finish" />
      </View>
    </View>
  );
}
