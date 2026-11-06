import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

export default function JournalScreen() {
  return <NotBuilt title={navigationCopy.tabs.journal} note={navigationCopy.building(5)} />;
}
