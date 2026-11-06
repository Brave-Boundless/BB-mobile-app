import { Alert, Platform } from 'react-native';

/** Destructive confirmation: native alert on iOS/Android, window.confirm on web. */
export function confirmDestructive(opts: { title: string; body: string; confirm: string; keep: string; onConfirm: () => void }) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${opts.title}\n\n${opts.body}`)) opts.onConfirm();
    return;
  }
  Alert.alert(opts.title, opts.body, [
    { text: opts.keep, style: 'cancel' },
    { text: opts.confirm, style: 'destructive', onPress: opts.onConfirm },
  ]);
}
