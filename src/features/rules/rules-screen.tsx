import { Link } from 'expo-router';
import { TabFrame } from '@/components/screen';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { rulesCopy as copy } from '@copy/rules';
import { getRule, parts, type RuleCard } from '@/content';
import { chapterArt, partArt, partColor, partTextColor } from '@/content/art';
import { ArtThumb, PillarArt } from '@/components/art';
import { Pips } from '@/features/drill/pips';
import { useDrillStore } from '@/features/drill/store';
import { rulePips, type PipState } from '@/features/drill/structure';
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

export function RulesScreen({ embedded }: { embedded?: boolean } = {}) {
  const today = useToday();
  const data = useDrillStore();

  const sections = parts.map((part) => ({ part, data: part.rules.map((id) => getRule(id)) }));

  return (
    <TabFrame embedded={embedded}>
      <ScrollView contentContainerClassName="px-6 pb-10">
        {embedded ? null : (
        <Text accessibilityRole="header" className="pt-6 font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.list.title}
        </Text>
        )}
        {sections.map(({ part, data: partRules }, p) => (
          <Rise key={part.id} index={p}>
            <View accessibilityRole="header" className="mb-3 mt-10 flex-row items-center gap-4">
              <PillarArt art={partArt[part.id]} color={partColor[part.id]} size={64} testID={`part-art-${part.id}`} />
              <View className="flex-1">
                <Text className="font-medium text-sm uppercase tracking-widest text-ash">
                  {copy.list.partLabel(ROMAN[part.id])}
                </Text>
                <Text className="mt-1 font-bold text-2xl tracking-wide" style={{ color: partTextColor[part.id] }}>
                  {part.name}
                </Text>
                <Text className="font-sans text-base text-ash">{part.subtitle}</Text>
              </View>
            </View>
            {partRules.map((rule, i) => (
              <Rise key={rule.number} index={i} base={p * 60 + 80}>
                <RuleRow rule={rule} status={ruleStatus(data, rule.number, today)} pips={rulePips(data, rule.number)} />
              </Rise>
            ))}
          </Rise>
        ))}
      </ScrollView>
    </TabFrame>
  );
}

function RuleRow({ rule, status, pips }: { rule: RuleCard; status: RuleStatus; pips: readonly PipState[] }) {
  const current = status.kind === 'current';
  const label = statusText(status);
  const art = chapterArt[rule.number];
  return (
    <Link href={`/rule/${rule.number}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.list.ruleLabel(rule.number)}. ${rule.title}. ${label}.`}
        testID={`rule-${rule.number}`}
        className={`mb-3 min-h-16 flex-row items-center gap-4 border p-4 active:opacity-80 ${
          current ? 'border-ember bg-charcoal-800' : 'border-charcoal-700 bg-charcoal-900'
        }`}>
        <View className="flex-1">
          <Text className="font-medium text-sm text-ash">{copy.list.ruleLabel(rule.number)}</Text>
          <Text className="mt-1 font-bold text-lg text-bone">{rule.title}</Text>
          <View className="mt-2 flex-row items-center gap-3">
            <Pips pips={pips} label="" />
            <Text className={`font-medium text-sm ${current ? 'text-ember-soft' : 'text-ash'}`}>{label}</Text>
          </View>
        </View>
        {art ? <ArtThumb art={art} width={48} /> : null}
      </Pressable>
    </Link>
  );
}
