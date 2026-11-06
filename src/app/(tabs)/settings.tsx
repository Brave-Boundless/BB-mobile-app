import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

export default function SettingsScreen() {
  return <NotBuilt title={navigationCopy.tabs.settings} note={navigationCopy.building(5)} />;
}
