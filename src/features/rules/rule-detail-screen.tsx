import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { deeperCopy } from '@copy/deeper';
import { practiceCopy } from '@copy/practice';
import { rulesCopy as copy } from '@copy/rules';
import { Button } from '@/components/button';
import { todayCopy } from '@copy/today';
import { DRILL_TIERS, getPart, getRule, passages, type RuleId } from '@/content';
import { progressCopy } from '@copy/progress';
import { redesignCopy } from '@copy/redesign';
import { ruleTallies } from '@/features/progress/stats';
import { effortTrend } from '@/features/drill/after-answer';
import { rulePips, type PipState } from '@/features/drill/structure';
import { useDrillStore } from '@/features/drill/store';
import { Rise } from '@/components/motion';
import { ChapterArt } from '@/components/art';
import { chapterArt } from '@/content/art';
import { stampsCopy } from '@copy/stamps';
import { StampImage } from '@/features/stamps/passport';
import { stampFor } from '@/features/stamps/stamps';

import { ROMAN, ruleHistory, ruleStartDay, type HistoryEntry } from './history';

function Section({ title, children, index = 0 }: { title: string; children: React.ReactNode; index?: number }) {
  return (
    <Rise index={index} base={120}>
    <View className="mt-8">
      <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ash">
        {title}
      </Text>
      <View className="mt-2">{children}</View>
    </View>
    </Rise>
  );
}

export function RuleDetailScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = Number(raw);
  const data = useDrillStore();
  if (!Number.isInteger(id) || id < 1 || id > 15) return null;

  const rule = getRule(id as RuleId);
  const part = getPart(rule.part);
  const history = ruleHistory(data, rule.number);
  const stamp = stampFor(data, rule.number);
  const trend = effortTrend(data, rule.number);
  const pips = rulePips(data, rule.number);
  const tally = ruleTallies(data).find((t) => t.ruleId === rule.number)!;
  const bookCount = passages.filter((p) => p.rule === rule.number && p.use !== 'exercise').length;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView className="flex-1 bg-charcoal-950" contentContainerClassName="px-6 pb-12 pt-2">
        {chapterArt[rule.number] ? (
          <Rise>
            <View className="mb-6">
              <ChapterArt art={chapterArt[rule.number]!} testID="chapter-art" />
            </View>
          </Rise>
        ) : null}
        <Text className="font-medium text-sm uppercase tracking-widest text-ember-soft">
          {`${copy.list.partLabel(ROMAN[part.id])} · ${part.name}`}
        </Text>
        <Text className="mt-4 font-medium text-base text-ash">{copy.detail.ruleLabel(rule.number)}</Text>
        <Text accessibilityRole="header" className="mt-1 font-bold text-3xl text-bone">
          {rule.title}
        </Text>
        <Text className="mt-2 font-sans text-base text-ash">{copy.detail.chapter(rule.chapter)}</Text>

        <Section title={copy.detail.whyItMatters} index={0}>
          <Text className="font-medium text-xl leading-8 text-bone">{rule.why_it_matters}</Text>
        </Section>

        <Section title={copy.detail.drills} index={1}>
          {DRILL_TIERS.map((tier, i) => (
            <View key={tier} className="mb-3 flex-row gap-4 border-t border-charcoal-700 pt-3">
              <DrillMark state={pips[i]} />
              <View className="flex-1">
              <Text className="font-medium text-sm text-ember-soft">{todayCopy.drill.tier[tier]}</Text>
              <Text className="mt-1 font-sans text-lg text-bone">{rule.drills[tier]}</Text>
              <View className="mt-1 items-start">
                <Button
                  variant="text"
                  label={deeperCopy.open}
                  accessibilityLabel={deeperCopy.openA11y}
                  onPress={() => router.push(`/drill/${rule.number}/${tier}`)}
                  testID={`go-deeper-${tier}`}
                />
              </View>
              </View>
            </View>
          ))}
        </Section>

        <Section title={copy.detail.scorecard} index={2}>
          <Text className="font-sans text-lg text-bone">{rule.scorecard}</Text>
          <Text className="mt-2 font-medium text-base text-ember-soft" testID="rule-tally">
            {tally.answered === 0
              ? progressCopy.scorecards.notReached
              : progressCopy.scorecards.tally(tally.done, tally.answered)}
          </Text>
        </Section>

        <Section title={copy.detail.mantra} index={3}>
          <Text className="font-bold text-2xl text-ember-soft">{rule.mantra}</Text>
        </Section>

        {bookCount > 0 ? (
          <Rise index={4} base={120}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${redesignCopy.rule.fromTheBook}. ${redesignCopy.rule.fromTheBookCount(bookCount)}`}
              onPress={() => router.push({ pathname: '/passages', params: { rule: String(rule.number) } })}
              testID="rule-from-the-book"
              className="mt-8 min-h-16 flex-row items-center justify-between border-2 border-bone px-5 active:opacity-80">
              <Text className="font-bold text-lg uppercase tracking-wider text-bone">{redesignCopy.rule.fromTheBook}</Text>
              <Text className="font-medium text-base text-ash">{`${redesignCopy.rule.fromTheBookCount(bookCount)}  ›`}</Text>
            </Pressable>
          </Rise>
        ) : null}

        <Section title={copy.detail.history} index={5}>
          {stamp ? (
            <View
              accessible
              accessibilityLabel={stampsCopy.a11y.earned(rule.number, rule.title, stamp.done)}
              className="mb-4 flex-row items-center gap-4"
              testID="rule-stamp">
              <StampImage ruleId={rule.number} width={120} />
              <Text className="flex-1 font-medium text-base text-bone">{stampsCopy.rule.stamped(stamp.done)}</Text>
            </View>
          ) : history.length > 0 ? (
            <Text className="mb-3 font-sans text-base text-ash">{stampsCopy.rule.notYet}</Text>
          ) : null}
          {trend ? (
            <Text className="mb-3 font-medium text-base text-ember-soft" testID="rule-trend">
              {practiceCopy.trend.line(trend.ruleId, practiceCopy.rating.scale[trend.first - 1], trend.firstDay, practiceCopy.rating.scale[trend.last - 1])}
            </Text>
          ) : null}
          {history.length === 0 ? (
            <Text className="font-sans text-base text-ash">{copy.detail.historyEmpty(ruleStartDay(rule.number))}</Text>
          ) : (
            history.map((entry) => <HistoryRow key={entry.drill.id} entry={entry} />)
          )}
        </Section>
      </ScrollView>
    </>
  );
}

function HistoryRow({ entry: { drill, tookFallback, report } }: { entry: HistoryEntry }) {
  const outcome =
    drill.status === 'pending'
      ? copy.detail.pending
      : drill.status === 'done'
        ? todayCopy.drill.did
        : todayCopy.drill.dodged;
  const parts = [copy.detail.historyDay(drill.day), todayCopy.drill.tier[drill.tier], outcome];

  return (
    <View className="mb-3 border-l-2 border-charcoal-700 pl-4" testID={`history-day-${drill.day}`}>
      <Text className="font-medium text-base text-bone">{parts.join(' · ')}</Text>
      {tookFallback ? <Text className="font-sans text-sm text-ash">{copy.detail.fallbackNote}</Text> : null}
      {report ? (
        <View className="mt-2">
          <Text className="font-sans text-sm text-ash">{copy.detail.reportLabel}</Text>
          <Text className="font-sans text-base text-bone">{report.body}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** A drill's state as a square: ✓ done, ✕ dodged, ember outline today, grey outline ahead. */
function DrillMark({ state }: { state: PipState }) {
  const box =
    state === 'done'
      ? 'bg-ember'
      : state === 'dodged'
        ? 'bg-charcoal-700'
        : state === 'current'
          ? 'border-[3px] border-ember'
          : 'border-2 border-charcoal-700';
  return (
    <View
      accessible
      accessibilityLabel={state === 'done' ? todayCopy.drill.did : state === 'dodged' ? todayCopy.drill.dodged : state === 'current' ? copy.detail.pending : ''}
      className={`h-7 w-7 items-center justify-center ${box}`}>
      {state === 'done' ? <Text className="font-bold text-base text-charcoal-950">✓</Text> : null}
      {state === 'dodged' ? <Text className="font-bold text-base text-bone">✕</Text> : null}
    </View>
  );
}
