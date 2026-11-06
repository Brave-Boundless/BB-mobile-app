import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { journalCopy as copy } from '@copy/journal';
import { todayCopy } from '@copy/today';
import { Button } from '@/components/button';
import { confirmDestructive } from '@/components/confirm';
import { Rise } from '@/components/motion';
import { fadeIn, fadeOut } from '@/theme/motion';
import Animated from 'react-native-reanimated';
import { rules, type RuleId } from '@/content';
import { checkReport } from '@/features/drill/journal-rules';
import { useDrillStore } from '@/features/drill/store';
import { palette } from '@/theme';

import { formatEntryDate, journalItems, type JournalItem } from './entries';

export function JournalScreen() {
  const data = useDrillStore();
  const [filter, setFilter] = useState<RuleId | undefined>(undefined);
  const items = journalItems(data, filter);
  const anyAtAll = journalItems(data).length > 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <ScrollView contentContainerClassName="pb-12 pt-6" keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" className="px-6 font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.title}
        </Text>

        {anyAtAll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-6 pt-6">
            <Chip label={copy.filter.all} selected={filter === undefined} onPress={() => setFilter(undefined)} />
            {rules.map((r) => (
              <Chip
                key={r.number}
                label={copy.filter.rule(r.number)}
                selected={filter === r.number}
                onPress={() => setFilter(r.number)}
              />
            ))}
          </ScrollView>
        ) : null}

        <View className="px-6 pt-6">
          {items.length === 0 ? (
            <Animated.View entering={fadeIn()}>
              <Text className="font-sans text-lg text-ash">{anyAtAll ? copy.emptyFiltered : copy.empty}</Text>
            </Animated.View>
          ) : (
            // Keyed by filter so switching rules re-runs the stagger; deletes fade out and the rest close up.
            items.map((item, i) => (
              <Rise key={`${filter ?? 'all'}:${item.entry.id}`} index={i} exiting={fadeOut} layout>
                <Entry item={item} />
              </Rise>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={copy.filter.a11y(label, selected)}
      onPress={onPress}
      className={`min-h-11 justify-center rounded-full border px-4 ${
        selected ? 'border-ember bg-ember' : 'border-charcoal-700 bg-charcoal-900'
      }`}>
      <Text className={`font-medium text-base ${selected ? 'text-charcoal-950' : 'text-bone'}`}>{label}</Text>
    </Pressable>
  );
}

function Entry({ item: { entry, drill } }: { item: JournalItem }) {
  const saveReport = useDrillStore((s) => s.saveReport);
  const deleteReport = useDrillStore((s) => s.deleteReport);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.body);
  const [error, setError] = useState<string | null>(null);

  const outcome = drill.status === 'done' ? todayCopy.drill.did : todayCopy.drill.dodged;
  const prompt = drill.status === 'done' ? todayCopy.evening.promptDone : todayCopy.evening.promptDodged;

  const onSave = () => {
    const check = checkReport(text);
    if (!check.ok) {
      setError(check.reason === 'too_long' ? todayCopy.evening.tooLong : null);
      return;
    }
    saveReport(drill.id, check.body);
    setEditing(false);
    setError(null);
  };

  const onDelete = () => confirmDestructive({ ...copy.confirmDelete, onConfirm: () => deleteReport(entry.id) });

  return (
    <View className="mb-4 rounded-xl bg-charcoal-900 p-5" testID={`entry-${entry.id}`}>
      <Text className="font-medium text-sm text-ash">{formatEntryDate(entry.createdAt)}</Text>
      <Text className="mt-1 font-medium text-sm text-ember-soft">{copy.meta(drill.day, drill.ruleId, outcome)}</Text>
      <Text className="mt-3 font-medium text-sm text-ash">{prompt}</Text>

      {editing ? (
        <>
          <TextInput
            accessibilityLabel={prompt}
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (error) setError(null);
            }}
            multiline
            maxLength={1000}
            placeholderTextColor={palette.ash}
            className="mt-2 min-h-24 rounded-lg border border-charcoal-700 bg-charcoal-950 p-3 font-sans text-lg text-bone"
            testID="entry-input"
          />
          {error ? (
            <Text accessibilityRole="alert" className="mt-2 font-sans text-sm text-ember-soft">
              {error}
            </Text>
          ) : null}
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Button label={copy.save} onPress={onSave} disabled={!text.trim()} />
            </View>
            <View className="flex-1">
              <Button
                variant="secondary"
                label={copy.cancel}
                onPress={() => {
                  setText(entry.body);
                  setEditing(false);
                  setError(null);
                }}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <Text className="mt-1 font-sans text-lg text-bone">{entry.body}</Text>
          <View className="mt-2 flex-row gap-2">
            <Button variant="text" label={copy.edit} onPress={() => setEditing(true)} />
            <Button variant="text" label={copy.delete} onPress={onDelete} />
          </View>
        </>
      )}
    </View>
  );
}
