import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { journalCopy as copy } from '@copy/journal';
import { useDrillStore } from '@/features/drill/store';

import { JournalScreen } from '../journal-screen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <JournalScreen />
    </SafeAreaProvider>,
  );

function seed() {
  const s = () => useDrillStore.getState();
  s().start('2026-10-01', '07:00');
  const write = (date: string, status: 'done' | 'dodged', body: string) => {
    const id = s().openToday(date)!;
    s().answer(id, status, 'five_minute');
    s().saveReport(id, body);
  };
  jest.setSystemTime(new Date(2026, 9, 1, 20));
  write('2026-10-01', 'done', 'Day one entry.');
  jest.setSystemTime(new Date(2026, 9, 4, 20));
  for (const d of ['02', '03']) s().answer(s().openToday(`2026-10-${d}`)!, 'done', 'five_minute');
  write('2026-10-04', 'dodged', 'Day four entry.');
}

describe('Journal screen', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 5, 9) });
    useDrillStore.getState().reset();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the empty state', async () => {
    await show();
    expect(screen.getByText(copy.empty)).toBeTruthy();
    expect(screen.queryByText(copy.filter.all)).toBeNull();
  });

  it('lists entries newest first with their prompt, and filters by rule', async () => {
    seed();
    await show();
    const bodies = screen.getAllByText(/Day (one|four) entry\./).map((n) => n.props.children);
    expect(bodies).toEqual(['Day four entry.', 'Day one entry.']);
    expect(screen.getByText(copy.meta(4, 2, 'Dodged it'))).toBeTruthy();
    expect(screen.getByText('What did you learn?')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(copy.filter.a11y('Rule 2', false)));
    expect(screen.queryByText('Day one entry.')).toBeNull();
    expect(screen.getByText('Day four entry.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(copy.filter.a11y('Rule 3', false)));
    expect(screen.getByText(copy.emptyFiltered)).toBeTruthy();
  });

  it('edits and deletes an entry', async () => {
    seed();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _b, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await show();
    await fireEvent.press(screen.getAllByText(copy.edit)[0]);
    await fireEvent.changeText(screen.getByTestId('entry-input'), 'Rewritten.');
    await fireEvent.press(screen.getByText(copy.save));
    expect(screen.getByText('Rewritten.')).toBeTruthy();

    await fireEvent.press(screen.getAllByText(copy.delete)[0]);
    expect(Alert.alert).toHaveBeenCalledWith(copy.confirmDelete.title, copy.confirmDelete.body, expect.any(Array));
    expect(screen.queryByText('Rewritten.')).toBeNull();
    expect(screen.getByText('Day one entry.')).toBeTruthy();
  });
});
