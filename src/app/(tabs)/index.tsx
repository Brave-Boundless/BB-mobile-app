import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

export default function TodayScreen() {
  return <NotBuilt title={navigationCopy.tabs.today} note={navigationCopy.building(2)} />;
}
