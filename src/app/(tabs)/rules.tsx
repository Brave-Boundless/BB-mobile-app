import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';
import { SegmentedTab } from '@/components/segments';
import { ProgressScreen } from '@/features/progress/progress-screen';
import { RulesScreen } from '@/features/rules/rules-screen';

const seg = navigationCopy.rulesTabs;

export default function RulesTab() {
  return (
    <SegmentedTab
      segments={[
        { key: 'rules', label: seg.rules, render: () => <RulesScreen embedded /> },
        { key: 'progress', label: seg.progress, render: () => <ProgressScreen embedded /> },
        // Build step 8.
        { key: 'passages', label: seg.passages, render: () => <NotBuilt title={seg.passages} note={navigationCopy.building(8)} /> },
      ]}
    />
  );
}
