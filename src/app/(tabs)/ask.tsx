import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

// Build step 9.
export default function AskMarkTab() {
  return <NotBuilt title={navigationCopy.tabs.askMark} note={navigationCopy.building(9)} />;
}
