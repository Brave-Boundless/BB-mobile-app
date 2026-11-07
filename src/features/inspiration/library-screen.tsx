import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { inspirationCopy as copy } from '@copy/inspiration';
import { Chips } from '@/components/chips';
import { TabFrame } from '@/components/screen';
import { SITUATIONS, getRule, passages, type Passage, type Situation } from '@/content';
import { useDrillStore } from '@/features/drill/store';

import { PassageCard } from './passage-card';

type View3 = 'all' | 'saved' | 'byRule';
type Row = { kind: 'header'; key: string; title: string } | { kind: 'passage'; key: string; passage: Passage };

// Reading passages only. The chapter exercises live on each drill's Go deeper page.
const READING = passages.filter((p) => p.use !== 'exercise');

/** The Passages library: every reading passage, by what you're facing, by rule, or saved. */
export function LibraryScreen({ embedded }: { embedded?: boolean } = {}) {
  const [view, setView] = useState<View3>('all');
  const [situation, setSituation] = useState<Situation | null>(null);
  const saved = useDrillStore((s) => s.savedPassages);

  const rows: Row[] = useMemo(() => {
    if (view === 'saved') {
      return READING.filter((p) => saved[p.id])
        .sort((a, b) => saved[b.id].localeCompare(saved[a.id]))
        .map((p) => ({ kind: 'passage', key: p.id, passage: p }));
    }
    if (view === 'byRule') {
      const out: Row[] = [];
      for (let r = 1; r <= 15; r++) {
        const rule = getRule(r as Passage['rule']);
        out.push({ kind: 'header', key: `h${r}`, title: `Rule ${r} · ${rule.title}` });
        for (const p of READING.filter((x) => x.rule === r)) out.push({ kind: 'passage', key: p.id, passage: p });
      }
      return out;
    }
    return READING.filter((p) => !situation || p.situations.includes(situation)).map((p) => ({ kind: 'passage', key: p.id, passage: p }));
  }, [view, situation, saved]);

  const header = (
    <View className="px-6 pt-6">
      {embedded ? null : (
        <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.library.title}
        </Text>
      )}
      <Text className="font-sans text-base text-ash">{copy.library.intro}</Text>
      <View className="mt-4">
        <Chips
          chips={[
            { key: 'all', label: copy.library.all },
            { key: 'saved', label: copy.library.savedFilter },
            { key: 'byRule', label: copy.library.byRule },
          ]}
          selected={view}
          onSelect={(k) => setView(k as View3)}
          testID="library-view"
        />
      </View>
      {view === 'all' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerClassName="gap-2">
          {SITUATIONS.map((s) => {
            const on = s === situation;
            return (
              <Pressable
                key={s}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setSituation(on ? null : s)}
                testID={`situation-${s}`}
                className={`min-h-11 justify-center border px-3 active:opacity-80 ${on ? 'border-ember bg-ember' : 'border-charcoal-700'}`}>
                <Text className={`font-medium text-sm ${on ? 'text-charcoal-950' : 'text-bone'}`}>{copy.library.situations[s]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <TabFrame embedded={embedded}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text className="px-6 pt-6 font-sans text-base text-ash" testID="library-empty">
            {copy.library.empty}
          </Text>
        }
        contentContainerClassName="pb-12"
        initialNumToRender={8}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text accessibilityRole="header" className="mt-8 px-6 font-bold text-lg text-bone">
              {item.title}
            </Text>
          ) : (
            <View className="mt-4 px-6">
              <PassageCard passage={item.passage} testID={`passage-${item.passage.id}`} />
            </View>
          )
        }
      />
    </TabFrame>
  );
}
