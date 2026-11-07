import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { deeperCopy as copy } from '@copy/deeper';
import { todayCopy } from '@copy/today';
import { Button } from '@/components/button';
import { Rise } from '@/components/motion';
import {
  DRILL_TIERS,
  deeperExercise,
  deeperPassages,
  drillOutcome,
  getRule,
  splitExercise,
  type DrillTier,
  type RuleId,
} from '@/content';
import { features } from '@/lib/features';

function Section({ title, children, index }: { title: string; children: React.ReactNode; index: number }) {
  return (
    <Rise index={index} base={80}>
      <View className="mt-8">
        <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ash">
          {title}
        </Text>
        <View className="mt-2">{children}</View>
      </View>
    </Rise>
  );
}

/**
 * Go deeper: one drill, explained. Why it matters (the card), what it builds
 * (approved new writing), lines from the book, and the chapter exercise.
 * Book text is shown verbatim.
 */
export function DeeperScreen() {
  const params = useLocalSearchParams<{ rule: string; tier: string }>();
  const ruleId = Number(params.rule);
  const tier = params.tier as DrillTier;
  if (!Number.isInteger(ruleId) || ruleId < 1 || ruleId > 15 || !DRILL_TIERS.includes(tier)) return null;

  const rule = getRule(ruleId as RuleId);
  const passages = deeperPassages(rule.number, tier);
  const exercise = deeperExercise(rule.number, tier);
  const ex = exercise ? splitExercise(exercise.text) : undefined;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView className="flex-1 bg-charcoal-950" contentContainerClassName="px-6 pb-12 pt-2" testID="deeper">
        <Text className="font-medium text-base text-ash">{todayCopy.drill.ruleLabel(rule.number)}</Text>
        <Text accessibilityRole="header" className="mt-1 font-bold text-3xl text-bone">
          {rule.title}
        </Text>
        <Text className="mt-6 font-medium text-sm uppercase tracking-widest text-ember-soft">{todayCopy.drill.tier[tier]}</Text>
        <Text className="mt-2 font-medium text-2xl leading-9 text-bone">{rule.drills[tier]}</Text>

        <Section title={copy.whyItMatters} index={0}>
          <Text className="font-medium text-xl leading-8 text-bone">{rule.why_it_matters}</Text>
        </Section>

        <Section title={copy.whatItBuilds} index={1}>
          <Text className="font-sans text-lg leading-7 text-bone" testID="what-it-builds">
            {drillOutcome(rule.number, tier)}
          </Text>
        </Section>

        {passages.length > 0 ? (
          <Section title={copy.fromTheBook} index={2}>
            {passages.map((p) => (
              <View key={p.id} className="mb-4 border-l-2 border-ember pl-4" testID={`passage-${p.id}`}>
                <Text className="font-sans text-lg leading-7 text-bone">{p.text}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {ex ? (
          <Section title={copy.exercise} index={3}>
            <View className="bg-charcoal-900 p-4" testID="exercise">
              {ex.name ? <Text className="font-bold text-lg text-bone">{ex.name}</Text> : null}
              <Text className="mt-1 font-sans text-base leading-6 text-bone">{ex.body}</Text>
              <Text className="mt-3 font-sans text-sm text-ash">{copy.exerciseHint}</Text>
            </View>
          </Section>
        ) : null}

        {features.askMark ? (
          <Rise index={4} base={80}>
            <View className="mt-10">
              <Button
                variant="secondary"
                label={copy.askMark}
                onPress={() =>
                  router.push({
                    pathname: '/ask',
                    params: { prefill: copy.askMarkPrompt(rule.number, rule.title, todayCopy.drill.tier[tier], rule.drills[tier]) },
                  })
                }
                testID="deeper-ask-mark"
              />
            </View>
          </Rise>
        ) : null}
      </ScrollView>
    </>
  );
}
