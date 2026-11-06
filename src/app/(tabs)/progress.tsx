import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

export default function ProgressScreen() {
  return <NotBuilt title={navigationCopy.tabs.progress} note={navigationCopy.building(4)} />;
}
