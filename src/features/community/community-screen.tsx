import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { groupsCopy } from '@copy/groups';
import { Chips } from '@/components/chips';
import { TopBar } from '@/components/top-actions';
import { GroupsPane } from '@/features/groups/groups-pane';
import { StoryScreen } from '@/features/story/story-screen';

type Segment = 'groups' | 'story';

/** Community tab (step 11a): Groups · Share Your Story. */
export function CommunityScreen() {
  const [segment, setSegment] = useState<Segment>('groups');
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <TopBar />
      <View className="px-6 pb-2">
        <Chips
          chips={[
            { key: 'groups', label: groupsCopy.tabs.groups },
            { key: 'story', label: groupsCopy.tabs.story },
          ]}
          selected={segment}
          onSelect={setSegment}
          testID="community-segment"
        />
      </View>
      {segment === 'groups' ? <GroupsPane /> : <StoryScreen embedded />}
    </SafeAreaView>
  );
}
