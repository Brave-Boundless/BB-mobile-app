import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rulesCopy as copy } from '@copy/rules';
import { getRule, parts, type RuleCard } from '@/content';
import { useDrillStore } from '@/features/drill/store';
import { useToday } from '@/features/drill/use-today';
import { Rise } from '@/components/motion';

import { ROMAN, ruleStatus, type RuleStatus } from './history';

function statusText(status: RuleStatus): string {
  switch (status.kind) {
    case 'current':
      return copy.list.current;
    case 'notStarted':
      return copy.list.notStarted(status.startDay);
    case 'tally':
      return copy.list.tally(status.done, status.dodged);
  }
}

export function RulesScreen() {
  const today = useToday();
  const data = useDrillStore();

  const sections = parts.map((part) => ({ part, data: part.rules.map((id) => getRule(id)) }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <ScrollView contentContainerClassName="px-6 pb-10">
        <Text accessibilityRole="header" className="pt-6 font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.list.title}
        </Text>
        {sections.map(({ part, data: partRules }, p) => (
          <Rise key={part.id} index={p}>
            <View accessibilityRole="header" className="mb-3 mt-10">
              <Text className="font-medium text-sm uppercase tracking-widest text-ash">
                {copy.list.partLabel(ROMAN[part.id])}
              </Text>
              <Text className="mt-1 font-bold text-2xl tracking-wide text-ember-soft">{part.name}</Text>
              <Text className="font-sans text-base text-ash">{part.subtitle}</Text>
            </View>
            {partRules.map((rule, i) => (
              <Rise key={rule.number} index={i} base={p * 60 + 80}>
                <RuleRow rule={rule} status={ruleStatus(data, rule.number, today)} />
              </Rise>
            ))}
          </Rise>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function RuleRow({ rule, status }: { rule: RuleCard; status: RuleStatus }) {
  const current = status.kind === 'current';
  const label = statusText(status);
  return (
    <Link href={`/rule/${rule.number}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.list.ruleLabel(rule.number)}. ${rule.title}. ${label}.`}
        testID={`rule-${rule.number}`}
        className={`mb-3 min-h-16 border p-4 active:opacity-80 ${
          current ? 'border-ember bg-charcoal-800' : 'border-charcoal-700 bg-charcoal-900'
        }`}>
        <Text className="font-medium text-sm text-ash">{copy.list.ruleLabel(rule.number)}</Text>
        <Text className="mt-1 font-bold text-lg text-bone">{rule.title}</Text>
        <Text className={`mt-1 font-medium text-sm ${current ? 'text-ember-soft' : 'text-ash'}`}>{label}</Text>
      </Pressable>
    </Link>
  );
}
