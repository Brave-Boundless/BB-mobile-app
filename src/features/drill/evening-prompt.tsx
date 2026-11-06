import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { todayCopy as copy } from '@copy/today';
import { Button } from '@/components/button';
import { palette } from '@/theme';

import { checkReport } from './journal-rules';
import { reportFor, useDrillStore, type DrillDayRow } from './store';

/** Optional evening report-back for one drill (1-3 sentences, saved to the Journal). */
export function EveningPrompt({ row }: { row: DrillDayRow }) {
  const saveReport = useDrillStore((s) => s.saveReport);
  const skipReport = useDrillStore((s) => s.skipReport);
  const saved = useDrillStore((s) => reportFor(s, row.id));
  const skipped = useDrillStore((s) => !!s.reportSkipped[row.id]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const prompt = row.status === 'done' ? copy.evening.promptDone : copy.evening.promptDodged;

  if (saved) {
    return (
      <View className="mt-10 rounded-xl bg-charcoal-900 p-5">
        <Text className="font-medium text-sm text-ash">{prompt}</Text>
        <Text className="mt-2 font-sans text-lg text-bone">{saved.body}</Text>
        <Text className="mt-3 font-sans text-sm text-ash">{copy.evening.saved}</Text>
      </View>
    );
  }
  if (skipped) return null;

  const onSave = () => {
    const check = checkReport(text);
    if (check.ok) {
      saveReport(row.id, check.body);
      setError(null);
    } else if (check.reason === 'too_long') {
      setError(copy.evening.tooLong);
    }
  };

  return (
    <View className="mt-10 rounded-xl bg-charcoal-900 p-5">
      <Text nativeID="evening-prompt" className="font-bold text-xl text-bone">
        {prompt}
      </Text>
      <TextInput
        accessibilityLabel={prompt}
        accessibilityLabelledBy="evening-prompt"
        value={text}
        onChangeText={(t) => {
          setText(t);
          if (error) setError(null);
        }}
        placeholder={copy.evening.placeholder}
        placeholderTextColor={palette.ash}
        multiline
        maxLength={1000}
        className="mt-3 min-h-24 rounded-lg border border-charcoal-700 bg-charcoal-950 p-3 font-sans text-lg text-bone"
        testID="evening-input"
      />
      {error ? (
        <Text accessibilityRole="alert" className="mt-2 font-sans text-sm text-ember-soft">
          {error}
        </Text>
      ) : null}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <Button label={copy.evening.save} onPress={onSave} disabled={!text.trim()} testID="evening-save" />
        </View>
        <View className="flex-1">
          <Button variant="secondary" label={copy.evening.skip} onPress={() => skipReport(row.id)} testID="evening-skip" />
        </View>
      </View>
    </View>
  );
}
