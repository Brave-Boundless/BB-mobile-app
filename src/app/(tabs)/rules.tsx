import { navigationCopy } from '@copy/navigation';
import { SegmentedTab } from '@/components/segments';
import { TopActions } from '@/components/top-actions';
import { LibraryScreen } from '@/features/inspiration/library-screen';
import { ProgressScreen } from '@/features/progress/progress-screen';
import { RulesScreen } from '@/features/rules/rules-screen';

const seg = navigationCopy.rulesTabs;

export default function RulesTab() {
  return (
    <SegmentedTab
      accessory={<TopActions help helpTestID="how-it-works-rules" />}
      segments={[
        { key: 'rules', label: seg.rules, render: () => <RulesScreen embedded /> },
        { key: 'progress', label: seg.progress, render: () => <ProgressScreen embedded /> },
        { key: 'passages', label: seg.passages, render: () => <LibraryScreen embedded /> },
      ]}
    />
  );
}
