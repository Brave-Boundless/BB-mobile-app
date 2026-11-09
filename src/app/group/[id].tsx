import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { fetchModeration } from '@/features/groups/api';
import { GroupThread } from '@/features/groups/groups-pane';

/** A moderator reading a group (read-only: moderators act from the queue). */
export default function GroupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mod = useQuery({ queryKey: ['groups', 'moderation'], queryFn: fetchModeration });
  const group = mod.data?.groups.find((g) => g.id === id);
  return <View className="flex-1 bg-charcoal-950">{group ? <GroupThread group={group} mine={{ userId: '', member: null }} readOnly /> : null}</View>;
}
