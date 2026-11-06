import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { progressCopy as copy } from '@copy/progress';
import { getRule } from '@/content';
import { SPINE_LENGTH } from '@/features/drill/spine';
import { useDrillStore } from '@/features/drill/store';
import { useToday } from '@/features/drill/use-today';
import { Reveal, Rise } from '@/components/motion';
import { pop } from '@/theme/motion';
import { Passport } from '@/features/stamps/passport';

import { position, ruleTallies, streak, streakMantra, type Position, type RuleTally, type Shade } from './stats';

const CELL: Record<Shade, { box: string; text: string }> = {
  all: { box: 'bg-ember', text: 'text-charcoal-950' },
  most: { box: 'bg-ember-mid', text: 'text-bone' },
  some: { box: 'bg-ember-dim', text: 'text-bone' },
  none: { box: 'border border-charcoal-700 bg-charcoal-950', text: 'text-ash' },
};

function positionText(p: Position): string {
  if (p.kind === 'notStarted') return copy.day.notStarted;
  if (p.kind === 'complete') return copy.day.complete(SPINE_LENGTH);
  return copy.day.value(p.day, SPINE_LENGTH);
}

function Heading({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ash">
      {children}
    </Text>
  );
}

export function ProgressScreen() {
  const today = useToday();
  const data = useDrillStore();
  const pos = position(data, today);
  const run = streak(data);
  const mantra = streakMantra(data);
  const tallies = ruleTallies(data);
  // Passport: 3 slots a row inside the 24pt gutters.
  const { width: screen } = useWindowDimensions();
  const slot = Math.floor((Math.min(screen, 560) - 48 - 24) / 3);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <ScrollView contentContainerClassName="px-6 pb-12 pt-6">
        <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.title}
        </Text>

        <Rise index={0}>
        <View className="mt-8 flex-row gap-3">
          <View className="flex-1 bg-charcoal-900 p-4">
            <Heading>{copy.day.label}</Heading>
            <Text className="mt-2 font-bold text-2xl text-bone" testID="progress-day">
              {positionText(pos)}
            </Text>
          </View>
          <View className="flex-1 bg-charcoal-900 p-4">
            <Heading>{copy.streak.label}</Heading>
            <Text className="mt-2 font-bold text-2xl text-bone" testID="progress-streak">
              {run > 0 ? copy.streak.value(run) : copy.streak.zero}
            </Text>
          </View>
        </View>
        </Rise>
        {run > 0 && mantra ? (
          <Reveal delay={300}>
            <Text className="mt-3 font-medium text-lg text-ember-soft">{mantra}</Text>
          </Reveal>
        ) : null}

        <Rise index={1}>
        <View className="mt-10">
          <Heading>{copy.map.title}</Heading>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {tallies.map((t, i) => (
              <MapCell key={t.ruleId} tally={t} index={i} />
            ))}
          </View>
          <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {(['all', 'most', 'some', 'none'] as const).map((s) => (
              <View key={s} className="flex-row items-center gap-2">
                <View className={`h-4 w-4 ${CELL[s].box}`} />
                <Text className="font-sans text-sm text-ash">{copy.map.legend[s]}</Text>
              </View>
            ))}
          </View>
        </View>
        </Rise>

        <Rise index={2}>
          <View className="mt-10">
            <Passport data={data} slot={slot} />
          </View>
        </Rise>

        <Rise index={3}>
        <View className="mt-10">
          <Heading>{copy.scorecards.title}</Heading>
          <Text className="mt-2 font-sans text-base text-ash">{copy.scorecards.hint}</Text>
          {tallies.map((t, i) => (
            <Rise key={t.ruleId} index={i} base={250}>
              <ScorecardRow tally={t} />
            </Rise>
          ))}
        </View>
        </Rise>
      </ScrollView>
    </SafeAreaView>
  );
}

function MapCell({ tally: { ruleId, done, answered, shade }, index }: { tally: RuleTally; index: number }) {
  const style = CELL[shade];
  // The 15 cells pop in left to right, top to bottom.
  return (
    <Animated.View entering={pop(index)} style={{ width: '18%' }}>
    <View
      accessible
      accessibilityLabel={copy.map.cellA11y(ruleId, done, answered)}
      testID={`map-cell-${ruleId}`}
      className={`h-16 w-full items-center justify-center ${style.box}`}>
      <Text className={`font-bold text-lg ${style.text}`}>{ruleId}</Text>
      <Text className={`font-sans text-xs ${style.text}`}>{answered === 0 ? '–' : `${done}/${answered}`}</Text>
    </View>
    </Animated.View>
  );
}

function ScorecardRow({ tally: { ruleId, done, answered } }: { tally: RuleTally }) {
  const rule = getRule(ruleId);
  return (
    <View className="mt-4 border-b border-charcoal-800 pb-4">
      <Text className="font-bold text-base text-bone">{rule.title}</Text>
      <Text className="mt-1 font-sans text-base text-ash">{rule.scorecard}</Text>
      <Text className={`mt-1 font-medium text-base ${answered ? 'text-ember-soft' : 'text-ash'}`}>
        {answered ? copy.scorecards.tally(done, answered) : copy.scorecards.notReached}
      </Text>
    </View>
  );
}
