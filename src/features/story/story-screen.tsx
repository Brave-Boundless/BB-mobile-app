import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/top-actions';

import { storyCopy as copy } from '@copy/story';
import { Button } from '@/components/button';
import { Chips } from '@/components/chips';
import { Rise } from '@/components/motion';
import { useSession } from '@/features/account/auth';
import { palette } from '@/theme';
import { fadeIn } from '@/theme/motion';

import { StoryRequestError, checkStory, submitStory, type StoryKind } from './kit';
import { useStoryStore } from './store';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View className="mt-5">
      <Text className="font-medium text-base text-bone">{label}</Text>
      <View className="mt-2">{children}</View>
      {hint ? <Text className="mt-1 font-sans text-sm text-ash">{hint}</Text> : null}
    </View>
  );
}

const input = 'min-h-12 border border-charcoal-700 bg-charcoal-950 px-3 py-3 font-sans text-base text-bone';

/** Community tab: Share Your Story (step 10). Groups come in step 11. */
export function StoryScreen() {
  const session = useSession();
  const draft = useStoryStore((s) => s.draft);
  const edit = useStoryStore((s) => s.edit);
  const clear = useStoryStore((s) => s.clear);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<'missing' | 'empty' | 'offline' | 'failed' | null>(null);

  // A signed-in reader's email fills in once, while the field is empty.
  const accountEmail = session?.user.email ?? '';
  const [filledFromAccount, setFilledFromAccount] = useState(false);
  if (accountEmail && !draft.email && !filledFromAccount) {
    setFilledFromAccount(true);
    edit({ email: accountEmail });
  }

  const send = async () => {
    const problem = checkStory(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setState('sending');
    try {
      await submitStory(draft);
      clear();
      setState('sent');
    } catch (e) {
      setError(e instanceof StoryRequestError ? e.kind : 'failed');
      setState('idle');
    }
  };

  const kinds = (Object.keys(copy.form.kinds) as StoryKind[]).map((k) => ({ key: k, label: copy.form.kinds[k] }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <TopBar />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-16 pt-2" keyboardShouldPersistTaps="handled">
          <Rise index={0}>
            <Text className="font-medium text-sm uppercase tracking-widest text-ember-soft">{copy.intro.eyebrow}</Text>
            <Text className="mt-3 font-sans text-lg leading-7 text-bone">{copy.intro.body}</Text>
          </Rise>

          <Rise index={1}>
            {[copy.intro.madeIt, copy.intro.inIt].map((k) => (
              <View key={k.title} className="mt-5 border-l-2 border-ember bg-charcoal-900 p-4">
                <Text className="font-bold text-lg text-bone">{k.title}</Text>
                <Text className="mt-2 font-sans text-base leading-6 text-ash">{k.body}</Text>
                <Text className="mt-2 font-medium text-base text-bone">{k.line}</Text>
              </View>
            ))}
            <Text className="mt-5 font-sans text-sm text-ash">{copy.intro.groupsSoon}</Text>
          </Rise>

          <Rise index={2}>
            <View className="mt-10 bg-charcoal-900 p-5" testID="story-form">
              <Text accessibilityRole="header" className="font-bold text-2xl text-bone">
                {copy.form.title}
              </Text>
              <Text className="mt-2 font-sans text-base text-ash">{copy.form.sub}</Text>

              {state === 'sent' ? (
                <Animated.View entering={fadeIn()}>
                  <Text accessibilityRole="alert" className="mt-6 font-medium text-lg leading-7 text-ember-soft" testID="story-sent">
                    {copy.sent}
                  </Text>
                  <View className="mt-3 items-start">
                    <Button variant="text" label={copy.another} onPress={() => setState('idle')} testID="story-another" />
                  </View>
                </Animated.View>
              ) : (
                <>
                  <Field label={copy.form.name}>
                    <TextInput
                      value={draft.name}
                      onChangeText={(name) => edit({ name })}
                      accessibilityLabel={copy.form.name}
                      autoComplete="name"
                      textContentType="givenName"
                      testID="story-name"
                      className={input}
                    />
                  </Field>
                  <Field
                    label={copy.form.email}
                    hint={accountEmail && draft.email === accountEmail ? copy.form.emailFromAccount : undefined}>
                    <TextInput
                      value={draft.email}
                      onChangeText={(email) => edit({ email })}
                      accessibilityLabel={copy.form.email}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      testID="story-email"
                      className={input}
                    />
                  </Field>
                  <Field label={copy.form.kind}>
                    <Chips chips={kinds} selected={draft.kind} onSelect={(kind) => edit({ kind: draft.kind === kind ? null : kind })} testID="story-kind" />
                  </Field>
                  <Field label={copy.form.story}>
                    <TextInput
                      value={draft.story}
                      onChangeText={(story) => edit({ story })}
                      accessibilityLabel={copy.form.story}
                      placeholder={copy.form.storyPlaceholder}
                      placeholderTextColor={palette.ash}
                      multiline
                      textAlignVertical="top"
                      maxLength={10000}
                      testID="story-text"
                      className={`${input} min-h-40`}
                    />
                  </Field>

                  <Pressable
                    accessible={false}
                    onPress={() => edit({ newsletter: !draft.newsletter })}
                    className="mt-5 flex-row items-center gap-4">
                    <Text className="flex-1 font-sans text-base text-bone">{copy.form.newsletter}</Text>
                    <Switch
                      value={draft.newsletter}
                      onValueChange={(newsletter) => edit({ newsletter })}
                      accessibilityLabel={copy.form.newsletter}
                      trackColor={{ true: palette.ember.DEFAULT, false: palette.charcoal[700] }}
                      thumbColor={palette.bone}
                      {...({ activeThumbColor: palette.bone } as object)}
                      testID="story-newsletter"
                    />
                  </Pressable>

                  {error ? (
                    <Text accessibilityRole="alert" className="mt-4 font-medium text-base text-ember-soft" testID="story-error">
                      {copy.errors[error]}
                    </Text>
                  ) : null}

                  <View className="mt-6">
                    <Button
                      label={state === 'sending' ? copy.form.sending : copy.form.submit}
                      disabled={state === 'sending'}
                      onPress={() => void send()}
                      testID="story-submit"
                    />
                  </View>
                  <Text className="mt-3 font-sans text-sm text-ash">{copy.form.note}</Text>
                </>
              )}
            </View>
          </Rise>

          <Rise index={3}>
            <View className="mt-10">
              <Text className="font-medium text-sm uppercase tracking-widest text-ash">{copy.next.eyebrow}</Text>
              <Text accessibilityRole="header" className="mt-2 font-bold text-2xl text-bone">
                {copy.next.title}
              </Text>
              {copy.next.items.map((it) => (
                <View key={it.title} className="mt-4 border-l-2 border-charcoal-700 pl-4">
                  <Text className="font-bold text-base text-bone">{it.title}</Text>
                  <Text className="mt-1 font-sans text-base leading-6 text-ash">{it.body}</Text>
                </View>
              ))}
            </View>
          </Rise>

          <Rise index={4}>
            <View className="mt-10 bg-charcoal-900 p-5">
              <Text accessibilityRole="header" className="font-bold text-xl text-bone">
                {copy.privacy.title}
              </Text>
              <Text className="mt-2 font-sans text-base leading-6 text-ash">{copy.privacy.body}</Text>
              <Text className="mt-4 font-sans text-base leading-6 text-bone">{copy.privacy.crisis}</Text>
              <View className="mt-4">
                <Button variant="secondary" label={copy.privacy.call988} onPress={() => void Linking.openURL('tel:988')} testID="story-988" />
              </View>
            </View>
          </Rise>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
