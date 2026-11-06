import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { palette } from '@/theme';

import { Button } from './button';

export function hhmmToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function dateToHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatTime(hhmm: string): string {
  return hhmmToDate(hhmm).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Time of day picker: inline spinner on iOS, system dialog on Android, read-only on web. */
export function TimeField({ value, onChange }: { value: string; onChange: (hhmm: string) => void }) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'web') {
    return <Text className="mt-2 font-bold text-2xl text-ember-soft">{formatTime(value)}</Text>;
  }
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={hhmmToDate(value)}
        mode="time"
        display="spinner"
        themeVariant="dark"
        textColor={palette.bone}
        minuteInterval={5}
        onChange={(_, d) => d && onChange(dateToHhmm(d))}
      />
    );
  }
  return (
    <View className="mt-1 items-start">
      <Button variant="text" label={formatTime(value)} onPress={() => setOpen(true)} />
      {open ? (
        <DateTimePicker
          value={hhmmToDate(value)}
          mode="time"
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(dateToHhmm(d));
          }}
        />
      ) : null}
    </View>
  );
}
