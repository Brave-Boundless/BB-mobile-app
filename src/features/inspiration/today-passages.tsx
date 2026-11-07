import { View } from 'react-native';

import { inspirationCopy as copy } from '@copy/inspiration';
import { reportFor, useDrillStore, type DrillDayRow } from '@/features/drill/store';

import { eveningPassage, morningPassage } from './daily';
import { PassageCard } from './passage-card';

/** "This morning": the day's passage, under the drill (Mark, 2026-11-07). */
export function MorningPassage({ row, today }: { row: DrillDayRow; today: string }) {
  const drills = useDrillStore((s) => s.drills);
  const pick = morningPassage({ drills }, today, row.ruleId, row.day);
  if (!pick) return null;
  return (
    <View className="mt-10">
      <PassageCard passage={pick.passage} label={copy.morning} testID="morning-passage" />
    </View>
  );
}

/** "Before you close the day": shown once the evening note is saved or skipped. */
export function EveningPassage({ row }: { row: DrillDayRow }) {
  const closed = useDrillStore((s) => !!reportFor(s, row.id) || !!s.reportSkipped[row.id]);
  const passage = eveningPassage(row.ruleId, row.day);
  if (!closed || !passage) return null;
  return (
    <View className="mt-10">
      <PassageCard passage={passage} label={copy.evening} testID="evening-passage" />
    </View>
  );
}
