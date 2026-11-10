import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { soundtrackCopy as copy } from '@copy/soundtrack';
import { Rise } from '@/components/motion';
import { partColor, partTextColor } from '@/content/art';
import { playlists, type Playlist } from '@/content/soundtrack';

/** The Soundtrack (from Path): the five playlists, each opening in Spotify. */
export function SoundtrackScreen() {
  return (
    <ScrollView className="flex-1 bg-charcoal-950" contentContainerClassName="px-6 pb-16 pt-2">
      <Rise index={0}>
        <Text accessibilityRole="header" className="font-bold text-4xl uppercase leading-[42px] text-bone">
          {copy.title}
        </Text>
        <Text className="mt-3 font-sans text-lg leading-7 text-ash">{copy.intro}</Text>
      </Rise>
      <View className="mt-8 gap-4">
        {playlists.map((p, i) => (
          <Rise key={p.n} index={i + 1}>
            <PlaylistCard playlist={p} />
          </Rise>
        ))}
      </View>
      <Text className="mt-10 font-bold text-lg leading-7 text-bone">{copy.outro}</Text>
    </ScrollView>
  );
}

function PlaylistCard({ playlist: p }: { playlist: Playlist }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${copy.eyebrow(p.n, p.label)}. ${p.name}. ${copy.playA11y(p.name)}`}
      onPress={() => void Linking.openURL(p.url)}
      testID={`playlist-${p.n}`}
      className="flex-row bg-charcoal-900 active:opacity-80">
      <View style={{ width: 8, backgroundColor: partColor[p.part] }} />
      <View className="flex-1 p-5">
        <Text style={{ color: partTextColor[p.part] }} className="font-bold text-sm uppercase tracking-widest">
          {copy.eyebrow(p.n, p.label)}
        </Text>
        <Text className="mt-2 font-bold text-2xl uppercase text-bone">{p.name}</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ash">{p.body}</Text>
        <Text className="mt-4 font-bold text-base text-ember-soft">{`${copy.play}  ›`}</Text>
      </View>
    </Pressable>
  );
}
