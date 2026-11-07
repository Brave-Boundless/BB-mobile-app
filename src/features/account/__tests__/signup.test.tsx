import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { signupCopy as copy } from '@copy/signup';
import { KIT_NEWSLETTER_FORM } from '@/features/story/kit';

import { useAccountStore } from '../account-store';
import { joinNewsletter } from '../newsletter';
import { SignUpScreen } from '../signup-screen';

jest.mock('@/features/account/auth', () => ({
  authOptions: { email: true, apple: false, google: false },
  useSession: () => null,
  sendEmailCode: jest.fn(async () => undefined),
  verifyEmailCode: jest.fn(async () => undefined),
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}));

describe('joinNewsletter', () => {
  it('posts only the email to the Kit newsletter form', async () => {
    const f = jest.fn(async (_url: string, _init: RequestInit) => ({ ok: true }) as Response);
    await joinNewsletter(' mark@example.com ', f as unknown as typeof fetch);
    expect(f).toHaveBeenCalledWith(
      `https://app.kit.com/forms/${KIT_NEWSLETTER_FORM}/subscriptions`,
      expect.objectContaining({ method: 'POST', body: 'email_address=mark%40example.com' }),
    );
  });

  it('throws when Kit refuses or the phone is offline', async () => {
    await expect(joinNewsletter('a@b.co', (async () => ({ ok: false })) as unknown as typeof fetch)).rejects.toThrow('failed');
    await expect(
      joinNewsletter('a@b.co', (async () => {
        throw new Error('net');
      }) as unknown as typeof fetch),
    ).rejects.toThrow('offline');
  });
});

describe('SignUpScreen', () => {
  beforeEach(() => useAccountStore.getState().reset());

  it('new reader: the reasons, the sign-in, and an unticked newsletter box', async () => {
    await render(<SignUpScreen variant="new" />);
    expect(screen.getByText(copy.screen.headline)).toBeTruthy();
    for (const line of copy.screen.why) expect(screen.getByText(line)).toBeTruthy();
    expect(screen.getByTestId('email-sign-in')).toBeTruthy();
    const box = screen.getByTestId('newsletter-box');
    expect(box.props.accessibilityState).toEqual({ checked: false });
    fireEvent.press(box);
    expect(useAccountStore.getState().newsletterWanted).toBe(true);
  });

  it('existing reader: their drill count and that progress moves over', async () => {
    await render(<SignUpScreen variant="existing" answered={12} offline />);
    expect(screen.getByText(copy.existing.body(12))).toBeTruthy();
    expect(screen.getByText(copy.existing.note)).toBeTruthy();
    expect(screen.getByText(copy.offline)).toBeTruthy();
    expect(copy.existing.body(1)).toContain('1 drill.');
  });
});
