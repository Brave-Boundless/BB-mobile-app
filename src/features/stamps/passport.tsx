import { Image, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { stampsCopy as copy } from '@copy/stamps';
import { getRule, rules, type RuleId } from '@/content';
import type { DrillData } from '@/features/drill/store';
import { pop } from '@/theme/motion';

import { stampArt, stampFor, type Stamp } from './stamps';

// A stamp is never pressed perfectly straight. Fixed per rule so it doesn't
// change between renders.
const TILT = [-6, 4, -3, 7, -5, 2, -7, 5, -2, 6, -4, 3, -6, 4, -3];

/** One stamp image at a given width, tilted like it was pressed by hand. */
export function StampImage({ ruleId, width, testID }: { ruleId: RuleId; width: number; testID?: string }) {
  const art = stampArt[ruleId];
  return (
    <Image
      accessible={false}
      importantForAccessibility="no"
      testID={testID}
      source={art.source}
      resizeMode="contain"
      style={{ width, height: Math.round(width / art.ratio), transform: [{ rotate: `${TILT[ruleId - 1]}deg` }] }}
    />
  );
}

/**
 * The Passport: a bone page with a slot per rule. Stamp inks only work on
 * bone (crimson is 2.1:1 on black), so the page is the brand's paper.
 */
export function Passport({ data, slot }: { data: DrillData; slot: number }) {
  const stamps = rules.map((r) => stampFor(data, r.number));
  const count = stamps.filter(Boolean).length;
  return (
    <View className="bg-bone p-4" testID="passport">
      <Text accessibilityRole="header" className="font-bold text-xl uppercase tracking-wide text-charcoal-950">
        {copy.passport.title}
      </Text>
      <Text className="mt-1 font-sans text-sm text-charcoal-700">{copy.passport.hint}</Text>
      <Text className="mt-1 font-medium text-sm text-charcoal-950" testID="passport-count">
        {copy.passport.count(count)}
      </Text>
      <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
        {rules.map((r, i) => (
          <Slot key={r.number} ruleId={r.number} stamp={stamps[i]} size={slot} index={i} />
        ))}
      </View>
    </View>
  );
}

function Slot({ ruleId, stamp, size, index }: { ruleId: RuleId; stamp?: Stamp; size: number; index: number }) {
  const title = getRule(ruleId).title;
  return (
    <View
      accessible
      accessibilityLabel={stamp ? copy.a11y.earned(ruleId, title, stamp.done) : copy.a11y.notYet(ruleId, title)}
      testID={`passport-slot-${ruleId}`}
      style={{ width: size, height: size }}
      className={`items-center justify-center ${stamp ? '' : 'border border-dashed border-charcoal-700'}`}>
      {stamp ? (
        <Animated.View entering={pop(index)}>
          <StampImage ruleId={ruleId} width={size} testID={`stamp-${ruleId}`} />
        </Animated.View>
      ) : (
        <Text className="font-medium text-base text-charcoal-700">{ruleId}</Text>
      )}
    </View>
  );
}
