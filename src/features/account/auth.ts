// Sign-in. Accounts are optional; everything works signed out.
//
// Methods (Mark, 2026-11-06): email one-time code, Apple, Google. Apple and
// Google stay hidden until their credentials exist and the matching flag is
// set: EXPO_PUBLIC_AUTH_APPLE=1 / EXPO_PUBLIC_AUTH_GOOGLE=1.

import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const authOptions = {
  email: isSupabaseConfigured,
  apple: isSupabaseConfigured && Platform.OS === 'ios' && process.env.EXPO_PUBLIC_AUTH_APPLE === '1',
  google: isSupabaseConfigured && process.env.EXPO_PUBLIC_AUTH_GOOGLE === '1',
};

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const client = getSupabase();
    void client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const { error } = await getSupabase().auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

/** Native Sign in with Apple (iOS), exchanged for a Supabase session. Returns false if the user cancelled. */
export async function signInWithApple(): Promise<boolean> {
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!cred.identityToken) throw new Error('No identity token from Apple');
    const { error } = await getSupabase().auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
    if (error) throw error;
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
}

/** Google via Supabase OAuth in the system browser, back to the app's deep link (PKCE). Returns false if cancelled. */
export async function signInWithGoogle(): Promise<boolean> {
  const client = getSupabase();
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;
  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No auth code in redirect');
  const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}
