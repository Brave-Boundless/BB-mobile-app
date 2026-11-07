import { navigationCopy } from '@copy/navigation';
import { NotBuilt } from '@/components/screen';

// Build step 10 (Share Your Story); groups in step 11.
export default function CommunityTab() {
  return <NotBuilt title={navigationCopy.tabs.community} note={navigationCopy.building(10)} />;
}
