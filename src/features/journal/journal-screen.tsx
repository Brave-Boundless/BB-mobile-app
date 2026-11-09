import { router } from 'expo-router';
import { useState } from 'react';
import { TabFrame } from '@/components/screen';
import { AccountIcon } from '@/features/account/account-icon';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { journalCopy as copy } from '@copy/journal';
import { redesignCopy } from '@copy/redesign';
import { todayCopy } from '@copy/today';
import { Button } from '@/components/button';
import { confirmDestructive } from '@/components/confirm';
import { Rise } from '@/components/motion';
import { fadeIn, fadeOut } from '@/theme/motion';
import Animated from 'react-native-reanimated';
import { passages, rules, type RuleId } from '@/content';
import { checkReport } from '@/features/drill/journal-rules';
import { useDrillStore } from '@/features/drill/store';
import { palette } from '@/theme';

import { formatEntryDate, journalItems, type JournalItem } from './entries';

export function JournalScreen({ embedded }: { embedded?: boolean } = {}) {
  const data = useDrillStore();
  const [filter, setFilter] = useState<RuleId | undefined>(undefined);
  const items = journalItems(data, filter);
  const anyAtAll = journalItems(data).length > 0;
  // Reading passages only, the same set Passages → Saved lists.
  const savedCount = passages.filter((p) => p.use !== 'exercise' && data.savedPassages?.[p.id]).length;

  return (
    <TabFrame embedded={embedded}>
      <ScrollView contentContainerClassName="pb-12 pt-4" keyboardShouldPersistTaps="handled">
        {embedded ? null : (
          <View className="flex-row items-center justify-between pl-6 pr-3">
            <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
              {copy.title}
            </Text>
            <AccountIcon />
          </View>
        )}

        <Composer />
        {savedCount > 0 ? (
          <View className="px-6 pt-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/passages', params: { view: 'saved' } })}
              testID="journal-saved-passages"
              className="min-h-12 flex-row items-center justify-between border border-charcoal-700 px-5 active:opacity-80">
              <Text className="font-bold text-base uppercase tracking-wider text-bone">
                {redesignCopy.journal.saved(savedCount)}
              </Text>
              <Text className="font-bold text-lg text-ash">›</Text>
            </Pressable>
          </View>
        ) : null}

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
    </TabFrame>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={copy.filter.a11y(label, selected)}
      onPress={onPress}
      className={`min-h-11 justify-center border px-4 ${
        selected ? 'border-ember bg-ember' : 'border-charcoal-700 bg-charcoal-900'
      }`}>
      <Text className={`font-medium text-base ${selected ? 'text-charcoal-950' : 'text-bone'}`}>{label}</Text>
    </Pressable>
  );
}

/** Write button → a note box. A free note isn't tied to a drill; up to 1000 characters. */
function Composer() {
  const writeNote = useDrillStore((s) => s.writeNote);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const w = redesignCopy.journal;

  if (!open) {
    return (
      <View className="px-6 pt-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${w.write}. ${w.writeHint}`}
          onPress={() => setOpen(true)}
          testID="journal-write"
          className="min-h-16 flex-row items-center gap-3 bg-ember px-5 active:opacity-80">
          <Text className="font-bold text-2xl text-charcoal-950">+</Text>
          <Text className="font-bold text-lg uppercase tracking-wider text-charcoal-950">{w.write}</Text>
          <Text className="ml-auto font-medium text-sm text-charcoal-950">{w.writeHint}</Text>
        </Pressable>
      </View>
    );
  }

  const save = () => {
    const body = text.trim();
    if (!body) return;
    writeNote(body);
    setText('');
    setOpen(false);
  };

  return (
    <Animated.View entering={fadeIn()} className="px-6 pt-4">
      <View className="border border-ember bg-charcoal-900 p-4">
        <TextInput
          accessibilityLabel={w.placeholder}
          value={text}
          onChangeText={setText}
          placeholder={w.placeholder}
          placeholderTextColor={palette.ash}
          multiline
          autoFocus
          maxLength={1000}
          className="min-h-28 font-sans text-lg text-bone"
          testID="journal-note-input"
        />
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Button label={copy.save} onPress={save} disabled={!text.trim()} testID="journal-note-save" />
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              label={copy.cancel}
              onPress={() => {
                setText('');
                setOpen(false);
              }}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function Entry({ item: { entry, drill } }: { item: JournalItem }) {
  const saveReport = useDrillStore((s) => s.saveReport);
  const editNote = useDrillStore((s) => s.editNote);
  const deleteReport = useDrillStore((s) => s.deleteReport);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.body);
  const [error, setError] = useState<string | null>(null);

  const outcome = drill ? (drill.status === 'done' ? todayCopy.drill.did : todayCopy.drill.dodged) : '';
  const prompt = drill
    ? drill.status === 'done'
      ? todayCopy.evening.promptDone
      : todayCopy.evening.promptDodged
    : redesignCopy.journal.placeholder;

  const onSave = () => {
    if (!drill) {
      if (!text.trim()) return;
      editNote(entry.id, text.trim());
      setEditing(false);
      return;
    }
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
    <View className="mb-4 bg-charcoal-900 p-5" testID={`entry-${entry.id}`}>
      <Text className="font-medium text-sm text-ash">{formatEntryDate(entry.createdAt)}</Text>
      <Text className={`mt-1 font-medium text-sm ${drill ? 'text-ember-soft' : 'text-bone'}`}>
        {drill ? copy.meta(drill.day, drill.ruleId, outcome) : redesignCopy.journal.note}
      </Text>
      {drill ? <Text className="mt-3 font-medium text-sm text-ash">{prompt}</Text> : null}

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
            className="mt-2 min-h-24 border border-charcoal-700 bg-charcoal-950 p-3 font-sans text-lg text-bone"
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
