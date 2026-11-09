import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { settingsCopy as copy } from '@copy/settings';
import { sendEmailCode, verifyEmailCode } from '@/features/account/auth';
import { useDrillStore } from '@/features/drill/store';

import { SettingsScreen } from '../settings-screen';

jest.mock('@/features/account/auth', () => ({
  authOptions: { email: true, apple: false, google: false },
  useSession: () => null,
  sendEmailCode: jest.fn(async () => undefined),
  verifyEmailCode: jest.fn(async () => undefined),
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 3000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })}>
      <SafeAreaProvider initialMetrics={metrics}>
        <SettingsScreen />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

describe('Settings screen (signed out)', () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
    const s = useDrillStore.getState();
    s.start('2026-10-01', '07:00');
    s.answer(s.openToday('2026-10-01')!, 'done', 'five_minute');
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the signed-out account state, About and tagline', async () => {
    await show();
    expect(screen.getByTestId('settings-contact')).toBeTruthy();
    expect(screen.getByText(copy.account.signedOut)).toBeTruthy();
    expect(screen.getByText(copy.delete.bodySignedOut)).toBeTruthy();
    expect(screen.getByText(copy.about.tagline)).toBeTruthy();
    // Apple and Google are off until credentials exist
    expect(screen.queryByText(copy.account.apple)).toBeNull();
    expect(screen.queryByText(copy.account.google)).toBeNull();
  });

  it('runs the email code flow with validation', async () => {
    await show();
    await fireEvent.press(screen.getByText(copy.account.email));
    await fireEvent.changeText(screen.getByLabelText(copy.account.emailLabel), 'not-an-email');
    await fireEvent.press(screen.getByText(copy.account.sendCode));
    expect(screen.getByText(copy.account.badEmail)).toBeTruthy();
    expect(sendEmailCode).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText(copy.account.emailLabel), ' Mark@Example.com ');
    await fireEvent.press(screen.getByText(copy.account.sendCode));
    await waitFor(() => expect(screen.getByText(copy.account.codeSent('mark@example.com'))).toBeTruthy());
    expect(sendEmailCode).toHaveBeenCalledWith('mark@example.com');

    await fireEvent.changeText(screen.getByLabelText(copy.account.codeLabel), '12a3456');
    await fireEvent.press(screen.getByText(copy.account.verify));
    await waitFor(() => expect(verifyEmailCode).toHaveBeenCalledWith('mark@example.com', '123456'));
  });

  it('shows the wrong-code message when verification fails', async () => {
    jest.mocked(verifyEmailCode).mockRejectedValueOnce(new Error('bad'));
    await show();
    await fireEvent.press(screen.getByText(copy.account.email));
    await fireEvent.changeText(screen.getByLabelText(copy.account.emailLabel), 'a@b.co');
    await fireEvent.press(screen.getByText(copy.account.sendCode));
    await waitFor(() => screen.getByLabelText(copy.account.codeLabel));
    await fireEvent.changeText(screen.getByLabelText(copy.account.codeLabel), '000000');
    await fireEvent.press(screen.getByText(copy.account.verify));
    await waitFor(() => expect(screen.getByText(copy.account.wrongCode)).toBeTruthy());
  });

  it('exports through the share sheet', async () => {
    await show();
    await fireEvent.press(screen.getByText(copy.data.export));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(jest.mocked(Sharing.shareAsync).mock.calls[0][0]).toMatch(/brave-and-boundless-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('delete everything (signed out) asks first, then erases the phone and returns to Today', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _b, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await show();
    await fireEvent.press(screen.getByText(copy.delete.button));
    expect(alert).toHaveBeenCalledWith(copy.delete.confirm.title, copy.delete.confirm.body, expect.any(Array));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(useDrillStore.getState().startedOn).toBeNull();
    expect(useDrillStore.getState().drills).toEqual({});
  });

  it('keeps everything if the user backs out of delete', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await show();
    await fireEvent.press(screen.getByText(copy.delete.button));
    expect(useDrillStore.getState().startedOn).toBe('2026-10-01');
  });
});
