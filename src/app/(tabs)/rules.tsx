import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

export default function RulesScreen() {
  return <NotBuilt title={navigationCopy.tabs.rules} note={navigationCopy.building(3)} />;
}
