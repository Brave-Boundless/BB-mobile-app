import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { navigationCopy } from '@copy/navigation';
import { progressCopy } from '@copy/progress';
import { soundtrackCopy } from '@copy/soundtrack';
import { redesignCopy } from '@copy/redesign';
import { rulesCopy } from '@copy/rules';
import { stampsCopy } from '@copy/stamps';
import { structureCopy } from '@copy/structure';
import { PillarArt } from '@/components/art';
import { Rise } from '@/components/motion';
import { TabFrame } from '@/components/screen';
import { TopActions } from '@/components/top-actions';
import { getRule, parts, type RuleCard } from '@/content';
import { partArt, partColor, partTextColor } from '@/content/art';
import { Pips } from '@/features/drill/pips';
import { useDrillStore, type DrillData } from '@/features/drill/store';
import { answeredCount, rulePips } from '@/features/drill/structure';
import { useToday } from '@/features/drill/use-today';
import { streak } from '@/features/progress/stats';
import { ruleStatus } from '@/features/rules/history';
import { StampImage } from '@/features/stamps/passport';
import { earnedStamps, stampFor } from '@/features/stamps/stamps';

/**
 * Path (redesign step 2): the 15 rules as tiles in their four parts. An earned
 * stamp fills its tile; today's rule is outlined in ember. Tap a tile to open
 * the rule. Replaces the Rules tab; Progress and Passages open from the top.
 */
export function PathScreen() {
  const today = useToday();
  const data = useDrillStore();
  const stamps = earnedStamps(data).length;
  const streakNow = streak(data);

  return (
    <TabFrame>
      <ScrollView contentContainerClassName="pb-10">
        <View className="flex-row items-start justify-between pl-6 pr-3 pt-2">
          <View className="flex-1 pt-2">
            <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
              {redesignCopy.path.title}
            </Text>
            <Text className="mt-1 font-medium text-base text-ash" testID="path-stats">
              {`${structureCopy.progress(answeredCount(data))} · ${stampsCopy.passport.count(stamps)}`}
            </Text>
            {streakNow > 0 ? (
              <Text className="mt-1 font-medium text-base text-ember-soft" testID="path-streak">
                {redesignCopy.streakLine(progressCopy.streak.value(streakNow))}
              </Text>
            ) : null}
          </View>
          <TopActions help helpTestID="how-it-works-path" />
        </View>

        <View className="mt-3 flex-row gap-3 px-6">
          <PathLink label={navigationCopy.rulesTabs.progress} onPress={() => router.push('/progress')} testID="open-progress" />
          <PathLink label={navigationCopy.rulesTabs.passages} onPress={() => router.push('/passages')} testID="open-passages" />
          <PathLink label={soundtrackCopy.pathButton} onPress={() => router.push('/soundtrack')} testID="open-soundtrack" />
        </View>

        {parts.map((part, p) => (
          <Rise key={part.id} index={p}>
            <View className="mt-8 px-6">
              <View accessibilityRole="header" className="flex-row items-center gap-3">
                <PillarArt art={partArt[part.id]} color={partColor[part.id]} size={40} testID={`part-art-${part.id}`} />
                <View className="flex-1">
                  <Text className="font-bold text-lg tracking-widest" style={{ color: partTextColor[part.id] }}>
                    {part.name}
                  </Text>
                  <Text className="font-sans text-sm text-ash">{part.subtitle}</Text>
                </View>
              </View>
              <View className="mt-3 flex-row gap-2">
                {part.rules.map((id) => (
                  <RuleTile key={id} rule={getRule(id)} data={data} today={today} />
                ))}
                {/* FIELD has three rules: keep its tiles the same size as the others. */}
                {Array.from({ length: 4 - part.rules.length }, (_, i) => (
                  <View key={`gap-${i}`} className="flex-1" />
                ))}
              </View>
            </View>
          </Rise>
        ))}
      </ScrollView>
    </TabFrame>
  );
}

function PathLink({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      className="min-h-11 flex-1 items-center justify-center border border-charcoal-700 active:opacity-70">
      <Text numberOfLines={1} adjustsFontSizeToFit className="font-bold text-sm uppercase tracking-wide text-bone">
        {label}
      </Text>
    </Pressable>
  );
}

function RuleTile({ rule, data, today }: { rule: RuleCard; data: DrillData; today: string }) {
  const stamp = stampFor(data, rule.number);
  const status = ruleStatus(data, rule.number, today);
  const current = status.kind === 'current';
  const label = stamp
    ? stampsCopy.a11y.earned(rule.number, rule.title, stamp.done)
    : `${rulesCopy.list.ruleLabel(rule.number)}. ${rule.title}.${current ? ` ${rulesCopy.list.current}.` : ''}`;
  return (
    <Link href={`/rule/${rule.number}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={`rule-${rule.number}`}
        className={`h-20 flex-1 items-center justify-center overflow-hidden active:opacity-80 ${
          current ? 'border-2 border-ember bg-charcoal-800' : 'border border-charcoal-700 bg-charcoal-900'
        }`}>
        {stamp ? (
          <StampImage ruleId={rule.number} width={72} testID={`tile-stamp-${rule.number}`} />
        ) : (
          <>
            <Text className={`font-bold text-2xl ${current ? 'text-bone' : 'text-ash'}`}>{rule.number}</Text>
            <View className="mt-1">
              <Pips pips={rulePips(data, rule.number)} size={8} label="" />
            </View>
          </>
        )}
        {current ? (
          <View className="absolute left-0 top-0 bg-ember px-1">
            <Text className="font-bold text-[9px] uppercase tracking-widest text-charcoal-950">{rulesCopy.list.current}</Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}
