import Constants from 'expo-constants';
import { TabFrame } from '@/components/screen';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { settingsCopy as copy } from '@copy/settings';
import { Button } from '@/components/button';
import { confirmDestructive } from '@/components/confirm';
import { Rise } from '@/components/motion';
import { TimeField } from '@/components/time-field';
import { fadeIn } from '@/theme/motion';
import Animated from 'react-native-reanimated';
import {
  authOptions,
  sendEmailCode,
  signInWithApple,
  signInWithGoogle,
  signOut,
  useSession,
  verifyEmailCode,
} from '@/features/account/auth';
import { eraseLocalData } from '@/features/account/erase';
import { buildExport, exportFileName, shareExport } from '@/features/account/export';
import { EMAIL_RE, deleteAccountOnServer } from '@/features/account/server';
import { notificationsAllowed, rescheduleMorningPushes } from '@/features/drill/notifications';
import { pendingCount, useDrillStore } from '@/features/drill/store';
import { syncNow, useSyncState } from '@/features/drill/use-sync';
import { signupCopy } from '@copy/signup';
import { useAccountStore } from '@/features/account/account-store';
import { joinNewsletter } from '@/features/account/newsletter';
import { askMarkSettingsCopy } from '@copy/askmark';
import { howItWorksCopy } from '@copy/howitworks';
import { useAskMarkStore } from '@/features/askmark/store';
import { getSupabase } from '@/lib/supabase';
import { palette } from '@/theme';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Rise>
    <View className="mt-10">
      <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ash">
        {title}
      </Text>
      <View className="mt-3">{children}</View>
    </View>
    </Rise>
  );
}

/** Ask Mark: whether the app tells it where the reader is in the 45 drills. */
function AskMarkSection() {
  const share = useAskMarkStore((s) => s.shareProgress);
  const setShare = useAskMarkStore((s) => s.setShareProgress);
  return (
    <Section title={askMarkSettingsCopy.title}>
      <View className="flex-row items-center gap-4 bg-charcoal-900 p-5">
        <View className="flex-1">
          <Text nativeID="askmark-share-label" className="font-medium text-base text-bone">
            {askMarkSettingsCopy.share}
          </Text>
          <Text className="mt-1 font-sans text-sm text-ash">{askMarkSettingsCopy.shareHint}</Text>
        </View>
        <Switch
          accessibilityLabel={askMarkSettingsCopy.share}
          accessibilityLabelledBy="askmark-share-label"
          value={share}
          onValueChange={setShare}
          trackColor={{ true: palette.ember.DEFAULT, false: palette.charcoal[700] }}
          thumbColor={palette.bone}
          // react-native-web ignores thumbColor when on and uses its own teal.
          {...({ activeThumbColor: palette.bone } as object)}
          testID="askmark-share"
        />
      </View>
    </Section>
  );
}

function Message({ text, tone = 'muted' }: { text: string | null; tone?: 'muted' | 'error' }) {
  if (!text) return null;
  return (
    <Animated.View key={text} entering={fadeIn()}>
      <Text
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        className={`mt-2 font-sans text-sm ${tone === 'error' ? 'text-ember-soft' : 'text-ash'}`}>
        {text}
      </Text>
    </Animated.View>
  );
}

/** `stacked`: opened from the account icon on the root stack, under a back header. */
export function SettingsScreen({ embedded, stacked }: { embedded?: boolean; stacked?: boolean } = {}) {
  const session = useSession();
  const email = session?.user.email ?? undefined;

  return (
    <TabFrame embedded={embedded || stacked}>
      <ScrollView contentContainerClassName="px-6 pb-16 pt-6" keyboardShouldPersistTaps="handled">
        {embedded && !stacked ? null : (
        <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.title}
        </Text>
        )}
        <PushSection />
        <AskMarkSection />
        <AccountSection email={email} signedIn={!!session} />
        <DataSection email={email} />
        <DeleteSection signedIn={!!session} />
        <View className="mt-10">
          <Button variant="secondary" label={howItWorksCopy.link} onPress={() => router.push('/how-it-works')} testID="how-it-works-settings" />
        </View>
        <View className="mt-12 items-center">
          <Text className="font-sans text-sm text-ash">{copy.about.book}</Text>
          <Text className="mt-1 font-sans text-sm text-ash">{copy.about.version(appVersion)}</Text>
          <Text className="mt-4 font-bold text-sm tracking-widest text-ember-soft">{copy.about.tagline}</Text>
        </View>
      </ScrollView>
    </TabFrame>
  );
}

// ── Morning push ───────────────────────────────────────────────────────────

function PushSection() {
  const notifyAt = useDrillStore((s) => s.notifyAt);
  const asked = useDrillStore((s) => s.notificationsAsked);
  const setNotifyAt = useDrillStore((s) => s.setNotifyAt);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') void notificationsAllowed().then(setAllowed);
  }, []);

  const onChange = (hhmm: string) => {
    setNotifyAt(hhmm);
    void rescheduleMorningPushes(useDrillStore.getState(), hhmm);
  };

  return (
    <Section title={copy.push.title}>
      <View className=" bg-charcoal-900 p-5">
        <Text className="font-medium text-base text-bone">{copy.push.timeLabel}</Text>
        <TimeField value={notifyAt} onChange={onChange} />
        {asked && allowed === false ? (
          <>
            <Message text={copy.push.off} />
            <View className="mt-1 items-start">
              <Button variant="text" label={copy.push.openSettings} onPress={() => void Linking.openSettings()} />
            </View>
          </>
        ) : null}
      </View>
    </Section>
  );
}

// ── Account ────────────────────────────────────────────────────────────────

type EmailStep = { kind: 'closed' } | { kind: 'email' } | { kind: 'code'; email: string };

function AccountSection({ signedIn, email }: { signedIn: boolean; email?: string }) {
  const pending = useDrillStore(pendingCount);
  const syncState = useSyncState();

  if (signedIn) {
    const status = syncState === 'syncing' ? copy.account.syncing : pending > 0 ? copy.account.pending : copy.account.synced;
    return (
      <>
        <Section title={copy.account.title}>
          <Text className="font-medium text-lg text-bone">{copy.account.signedInAs(email ?? '')}</Text>
          <Message text={status} />
          <SignOutButton />
          <Message text={signupCopy.settings.signOutNote} />
        </Section>
        <NewsletterSection email={email} />
      </>
    );
  }

  return (
    <Section title={copy.account.title}>
      <Text className="font-sans text-lg text-bone">{copy.account.signedOut}</Text>
      {authOptions.email ? <SignIn /> : null}
    </Section>
  );
}

/**
 * Sign out. Accounts are required, so signing out returns to first run and
 * clears the phone (the next person to sign in mustn't inherit this record).
 * Everything is backed up first; if something can't go yet, nothing is cleared.
 */
function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const run = async () => {
    setBusy(true);
    setBlocked(false);
    try {
      await syncNow();
      if (pendingCount(useDrillStore.getState()) > 0) {
        setBlocked(true);
        return;
      }
      await signOut();
      await eraseLocalData();
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View className="mt-4">
      <Button variant="secondary" label={copy.account.signOut} onPress={() => void run()} disabled={busy} testID="sign-out" />
      {blocked ? <Message text={copy.account.pending} tone="error" /> : null}
    </View>
  );
}

/** Newsletter: join from here (Kit's public form); leave via Kit's unsubscribe link. */
function NewsletterSection({ email }: { email?: string }) {
  const joined = useAccountStore((s) => s.newsletterJoined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const join = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      await joinNewsletter(email);
      useAccountStore.getState().markNewsletterJoined();
    } catch {
      setError(copy.account.failed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title={signupCopy.settings.newsletterTitle}>
      {joined ? (
        <Text className="font-medium text-lg text-bone" testID="newsletter-joined">
          {signupCopy.settings.newsletterJoined}
        </Text>
      ) : (
        <Button
          variant="secondary"
          label={signupCopy.settings.newsletterJoin}
          onPress={() => void join()}
          disabled={busy || !email}
          testID="newsletter-join"
        />
      )}
      <Message text={error} tone="error" />
      <Message text={signupCopy.settings.newsletterHint} />
    </Section>
  );
}

/** Apple / Google / email-code sign-in. Used in Settings and on the sign-up screen. */
export function SignIn({ hideWhy }: { hideWhy?: boolean } = {}) {
  const [step, setStep] = useState<EmailStep>({ kind: 'closed' });
  const [emailText, setEmailText] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, onError: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError(onError);
    } finally {
      setBusy(false);
    }
  };

  const send = (addr: string) =>
    run(async () => {
      await sendEmailCode(addr);
      setStep({ kind: 'code', email: addr });
      setCode('');
    }, copy.account.failed);

  return (
    <View>
      {hideWhy ? null : <Message text={copy.account.why} />}
      <View className="mt-4 gap-3">
        {authOptions.apple ? (
          <Button label={copy.account.apple} onPress={() => void run(signInWithApple, copy.account.failed)} disabled={busy} />
        ) : null}
        {authOptions.google ? (
          <Button
            variant={authOptions.apple ? 'secondary' : 'primary'}
            label={copy.account.google}
            onPress={() => void run(signInWithGoogle, copy.account.failed)}
            disabled={busy}
          />
        ) : null}
        {step.kind === 'closed' ? (
          <Button
            variant="secondary"
            label={copy.account.email}
            onPress={() => setStep({ kind: 'email' })}
            testID="email-sign-in"
          />
        ) : null}
      </View>

      {step.kind === 'email' ? (
        <Rise>
        <View className="mt-5 bg-charcoal-900 p-5">
          <Text nativeID="email-label" className="font-medium text-base text-bone">
            {copy.account.emailLabel}
          </Text>
          <TextInput
            accessibilityLabelledBy="email-label"
            accessibilityLabel={copy.account.emailLabel}
            value={emailText}
            onChangeText={(t) => {
              setEmailText(t);
              setError(null);
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholderTextColor={palette.ash}
            className="mt-2 min-h-12 border border-charcoal-700 bg-charcoal-950 px-3 font-sans text-lg text-bone"
            testID="email-input"
          />
          <Message text={error} tone="error" />
          <View className="mt-4">
            <Button
              label={copy.account.sendCode}
              disabled={busy || !emailText.trim()}
              onPress={() => {
                const addr = emailText.trim().toLowerCase();
                if (!EMAIL_RE.test(addr)) setError(copy.account.badEmail);
                else void send(addr);
              }}
              testID="send-code"
            />
          </View>
        </View>
        </Rise>
      ) : null}

      {step.kind === 'code' ? (
        <Rise>
        <View className="mt-5 bg-charcoal-900 p-5">
          <Text className="font-sans text-base text-bone">{copy.account.codeSent(step.email)}</Text>
          <Text nativeID="code-label" className="mt-4 font-medium text-base text-bone">
            {copy.account.codeLabel}
          </Text>
          <TextInput
            accessibilityLabelledBy="code-label"
            accessibilityLabel={copy.account.codeLabel}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            className="mt-2 min-h-12 border border-charcoal-700 bg-charcoal-950 px-3 font-bold text-2xl tracking-widest text-bone"
            testID="code-input"
          />
          <Message text={error} tone="error" />
          <View className="mt-4">
            <Button
              label={copy.account.verify}
              disabled={busy || code.length !== 6}
              onPress={() => void run(() => verifyEmailCode(step.email, code), copy.account.wrongCode)}
              testID="verify-code"
            />
          </View>
          <View className="mt-1 items-start">
            <Button variant="text" label={copy.account.resend} disabled={busy} onPress={() => void send(step.email)} />
          </View>
        </View>
        </Rise>
      ) : null}
    </View>
  );
}

// ── Your data ──────────────────────────────────────────────────────────────

function DataSection({ email }: { email?: string }) {
  const [error, setError] = useState<string | null>(null);
  const onExport = async () => {
    setError(null);
    try {
      const now = new Date();
      await shareExport(
        buildExport(useDrillStore.getState(), { now, appVersion, email, askMark: useAskMarkStore.getState().messages }),
        exportFileName(now),
      );
    } catch {
      setError(copy.data.exportFailed);
    }
  };
  return (
    <Section title={copy.data.title}>
      <Text className="font-sans text-base text-bone">{copy.data.exportBody}</Text>
      <View className="mt-4">
        <Button variant="secondary" label={copy.data.export} onPress={() => void onExport()} testID="export" />
      </View>
      <Message text={error} tone="error" />
    </Section>
  );
}

// ── Delete ─────────────────────────────────────────────────────────────────

function DeleteSection({ signedIn }: { signedIn: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      if (signedIn) {
        // Server first: if it fails, nothing on the phone is touched either.
        await deleteAccountOnServer(getSupabase());
        await getSupabase().auth.signOut({ scope: 'local' });
      }
      await eraseLocalData();
      router.replace('/');
    } catch {
      setError(copy.delete.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={copy.delete.title}>
      <Text className="font-sans text-base text-bone">{signedIn ? copy.delete.bodySignedIn : copy.delete.bodySignedOut}</Text>
      <View className="mt-4">
        <Button
          variant="secondary"
          label={copy.delete.button}
          disabled={busy}
          onPress={() => confirmDestructive({ ...copy.delete.confirm, onConfirm: () => void doDelete() })}
          testID="delete-everything"
        />
      </View>
      <Message text={error} tone="error" />
    </Section>
  );
}
