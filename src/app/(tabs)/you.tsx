import { navigationCopy } from '@copy/navigation';
import { SegmentedTab } from '@/components/segments';
import { JournalScreen } from '@/features/journal/journal-screen';
import { SettingsScreen } from '@/features/settings/settings-screen';

const seg = navigationCopy.youTabs;

export default function YouTab() {
  return (
    <SegmentedTab
      segments={[
        { key: 'journal', label: seg.journal, render: () => <JournalScreen embedded /> },
        { key: 'settings', label: seg.settings, render: () => <SettingsScreen embedded /> },
      ]}
    />
  );
}
