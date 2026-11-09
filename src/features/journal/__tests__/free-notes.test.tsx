import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { redesignCopy } from '@copy/redesign';
import { buildExport } from '@/features/account/export';
import { useDrillStore } from '@/features/drill/store';

import { journalItems } from '../entries';
import { JournalScreen } from '../journal-screen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('Journal free notes', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 10, 21) });
    useDrillStore.getState().reset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('writes a note from the Write button, with no drill behind it', async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <JournalScreen />
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByTestId('journal-write'));
    await fireEvent.changeText(screen.getByTestId('journal-note-input'), '  Long day. Still showed up.  ');
    await fireEvent.press(screen.getByTestId('journal-note-save'));

    const notes = Object.values(useDrillStore.getState().journal);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ drillDayId: null, body: 'Long day. Still showed up.', dirty: true });
    expect(await screen.findByText('Long day. Still showed up.')).toBeTruthy();
    expect(screen.getByText(redesignCopy.journal.note)).toBeTruthy();
  });

  it('lists notes with report-backs, but not under a rule filter; export marks them with no day or rule', () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    const id = s.openToday('2026-11-10')!;
    useDrillStore.getState().answer(id, 'done', 'five_minute');
    useDrillStore.getState().saveReport(id, 'Report.');
    useDrillStore.getState().writeNote('Free.');
    const data = useDrillStore.getState();
    expect(journalItems(data).map((i) => i.entry.body).sort()).toEqual(['Free.', 'Report.']);
    expect(journalItems(data, 1).map((i) => i.entry.body)).toEqual(['Report.']);
    const exported = buildExport(data, { now: new Date(), appVersion: '1.0.0' }).journal.find((j) => j.body === 'Free.');
    expect(exported).toMatchObject({ drillId: null, day: null, rule: null });
  });

  it('keeps free notes when server history merges in on sign-in', () => {
    useDrillStore.getState().writeNote('Mine.');
    useDrillStore.getState().mergeServer({ drills: [], journal: [], practice: null } as never);
    expect(Object.values(useDrillStore.getState().journal).map((j) => j.body)).toEqual(['Mine.']);
  });
});
