import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { rulesCopy as copy } from '@copy/rules';
import { todayCopy } from '@copy/today';
import { DRILL_TIERS, getPart, getRule, type RuleId } from '@/content';
import { useDrillStore } from '@/features/drill/store';
import { Rise } from '@/components/motion';

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

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView className="flex-1 bg-charcoal-950" contentContainerClassName="px-6 pb-12 pt-2">
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
          {DRILL_TIERS.map((tier) => (
            <View key={tier} className="mb-3 rounded-xl bg-charcoal-900 p-4">
              <Text className="font-medium text-sm text-ember-soft">{todayCopy.drill.tier[tier]}</Text>
              <Text className="mt-1 font-sans text-lg text-bone">{rule.drills[tier]}</Text>
            </View>
          ))}
        </Section>

        <Section title={copy.detail.scorecard} index={2}>
          <Text className="font-sans text-lg text-bone">{rule.scorecard}</Text>
        </Section>

        <Section title={copy.detail.mantra} index={3}>
          <Text className="font-bold text-2xl text-ember-soft">{rule.mantra}</Text>
        </Section>

        <Section title={copy.detail.history} index={4}>
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
