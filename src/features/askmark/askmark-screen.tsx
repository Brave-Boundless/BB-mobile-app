import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountIcon } from '@/features/account/account-icon';

import { askMarkCopy as copy } from '@copy/askmark';
import { Button } from '@/components/button';
import { confirmDestructive } from '@/components/confirm';
import { dodgePattern } from '@/features/drill/after-answer';
import { useDrillStore } from '@/features/drill/store';
import { useToday } from '@/features/drill/use-today';
import { EMAIL_RE } from '@/features/account/server';
import { useSession } from '@/features/account/auth';
import { palette } from '@/theme';
import { fadeIn } from '@/theme/motion';

import { AskMarkRequestError, askMark, sendTranscript, type AskMarkError, type ChatMessage } from './api';
import { askMarkContext, drillStarter } from './context';
import { AnswerText } from './format';
import { useAskMarkStore } from './store';

function shuffled<T>(xs: readonly T[], seed: number): T[] {
  const out = [...xs];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ask Mark: the website's chat, in the app, knowing where the reader is. */
export function AskMarkScreen() {
  const params = useLocalSearchParams<{ prefill?: string }>();
  const today = useToday();
  const drills = useDrillStore((s) => s.drills);
  const practice = useDrillStore((s) => s.practice);
  const startedOn = useDrillStore((s) => s.startedOn);
  const { messages, conversationId, shareProgress, add, setConversationId, clear } = useAskMarkStore();

  const context = useMemo(
    () => askMarkContext({ drills, practice, startedOn }, today, shareProgress),
    [drills, practice, startedOn, today, shareProgress],
  );

  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AskMarkError | null>(null);
  const [seed, setSeed] = useState(() => Date.now() % 233280);
  const [emailOpen, setEmailOpen] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  // "Ask Mark about this drill" from Go deeper arrives as a prefilled question.
  // Applied once per distinct prefill, during render (no effect needed).
  const [appliedPrefill, setAppliedPrefill] = useState<string | undefined>(undefined);
  if (params.prefill && params.prefill !== appliedPrefill) {
    setAppliedPrefill(params.prefill);
    setDraft(params.prefill);
  }

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...useAskMarkStore.getState().messages, { role: 'user', content: question }];
    add({ role: 'user', content: question });
    setDraft('');
    await ask(next);
  };

  const ask = async (history: ChatMessage[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await askMark(history, { conversationId, context });
      add({ role: 'assistant', content: res.message });
      if (res.conversationId) setConversationId(res.conversationId);
    } catch (e) {
      setError(e instanceof AskMarkRequestError ? e.kind : 'failed');
    } finally {
      setBusy(false);
    }
  };

  // The last question went unanswered: ask it again.
  const retry = () => void ask(useAskMarkStore.getState().messages);

  const starterKey = drillStarter(context, !!dodgePattern({ drills }));
  const starters = [
    ...(starterKey ? [copy.drillStarters[starterKey]] : []),
    ...shuffled(copy.starters, seed),
  ].slice(0, 3);

  const knows =
    !shareProgress ? copy.knowsOff : context?.phase === 'spine' ? copy.knows(context.day, context.rule) : context?.phase === 'practice' ? copy.knowsAfter45 : null;

  const empty = messages.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center gap-3 border-b border-charcoal-700 px-6 pb-4 pt-4">
          <View className="h-10 w-10 items-center justify-center bg-ember">
            <Text className="font-bold text-lg text-charcoal-950">M</Text>
          </View>
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-bold text-xl text-bone">
              {copy.title}
            </Text>
            <Text className="font-sans text-sm text-ash">{copy.subtitle}</Text>
          </View>
          <AccountIcon />
        </View>

        <ScrollView
          ref={scroll}
          className="flex-1"
          contentContainerClassName="px-6 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => !empty && scroll.current?.scrollToEnd({ animated: true })}>
          {knows ? (
            <Text className="mb-4 font-sans text-sm text-ash" testID="askmark-knows">
              {knows}
            </Text>
          ) : null}

          {empty ? (
            <View>
              <Text className="font-bold text-2xl text-bone">{copy.welcome.title}</Text>
              <Text className="mt-3 font-sans text-base leading-6 text-ash">{copy.welcome.body}</Text>

              <View className="mt-8 flex-row items-center justify-between">
                <Text className="font-medium text-sm uppercase tracking-widest text-ash">{copy.welcome.startersLabel}</Text>
                <Button variant="text" label={copy.welcome.shuffle} onPress={() => setSeed((s) => (s * 7 + 13) % 233280)} testID="askmark-shuffle" />
              </View>
              <View className="mt-2 gap-2">
                {starters.map((q, i) => (
                  <Pressable
                    key={q}
                    accessibilityRole="button"
                    onPress={() => void send(q)}
                    testID={`askmark-starter-${i}`}
                    className="min-h-12 justify-center border border-charcoal-700 bg-charcoal-900 px-4 py-3 active:opacity-80">
                    <Text className="font-medium text-base text-bone">{q}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-8 font-medium text-sm uppercase tracking-widest text-ash">{copy.welcome.ownLabel}</Text>

              <View className="mt-10 border-t border-charcoal-700 pt-4">
                <Text className="font-sans text-sm leading-5 text-ash">{copy.disclaimer}</Text>
                <Text className="mt-2 font-medium text-sm text-bone">{copy.crisis}</Text>
              </View>
            </View>
          ) : (
            messages.map((m, i) => <Bubble key={i} message={m} />)
          )}

          {busy ? (
            <Animated.View entering={fadeIn()} accessibilityLiveRegion="polite">
              <Text accessibilityLabel={copy.writingA11y} className="mt-4 font-medium text-base text-ash" testID="askmark-writing">
                {copy.writing}
              </Text>
            </Animated.View>
          ) : null}

          {error ? (
            <View accessibilityRole="alert" className="mt-4 flex-row items-center gap-4">
              <Text className="flex-1 font-medium text-base text-ember-soft" testID="askmark-error">
                {copy.errors[error]}
              </Text>
              {messages[messages.length - 1]?.role === 'user' ? (
                <Button variant="text" label={copy.errors.retry} onPress={retry} testID="askmark-retry" />
              ) : null}
            </View>
          ) : null}

          {messages.length >= 2 && !busy ? (
            <View className="mt-6 flex-row flex-wrap gap-x-6">
              <Button variant="text" label={copy.email.button} onPress={() => setEmailOpen(true)} testID="askmark-email" />
              <Button
                variant="text"
                label={copy.newChat}
                onPress={() =>
                  confirmDestructive({
                    title: copy.newChatConfirm,
                    body: '',
                    confirm: copy.newChatYes,
                    keep: copy.newChatNo,
                    onConfirm: () => {
                      clear();
                      setError(null);
                      setSeed(Date.now() % 233280);
                    },
                  })
                }
                testID="askmark-new"
              />
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row items-end gap-2 border-t border-charcoal-700 px-4 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={empty ? copy.placeholder : copy.followUp}
            placeholderTextColor={palette.ash}
            accessibilityLabel={empty ? copy.placeholder : copy.followUp}
            multiline
            maxLength={2000}
            editable={!busy}
            testID="askmark-input"
            className="max-h-32 min-h-12 flex-1 border border-charcoal-700 bg-charcoal-900 px-3 py-3 font-sans text-base text-bone"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.sendA11y}
            accessibilityState={{ disabled: busy || !draft.trim() }}
            disabled={busy || !draft.trim()}
            onPress={() => void send(draft)}
            testID="askmark-send"
            className={`min-h-12 justify-center px-4 ${busy || !draft.trim() ? 'bg-charcoal-800' : 'bg-ember'}`}>
            <Text className={`font-bold text-base ${busy || !draft.trim() ? 'text-ash' : 'text-charcoal-950'}`}>{copy.send}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {emailOpen ? <EmailSheet onClose={() => setEmailOpen(false)} messages={messages} conversationId={conversationId} /> : null}
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user';
  return (
    <Animated.View entering={fadeIn()}>
      <View
        accessible
        accessibilityLabel={`${mine ? copy.you : copy.title}: ${message.content}`}
        className={`mt-4 px-4 py-3 ${mine ? 'ml-10 self-end bg-charcoal-800' : 'mr-4 border-l-2 border-ember bg-charcoal-900'}`}>
        {mine ? (
          <Text className="font-sans text-base leading-6 text-bone">{message.content}</Text>
        ) : (
          <AnswerText text={message.content} className="font-sans text-base leading-6 text-bone" />
        )}
      </View>
    </Animated.View>
  );
}

/** Mounted only while open, so it starts fresh each time. */
function EmailSheet({
  onClose,
  messages,
  conversationId,
}: {
  onClose: () => void;
  messages: ChatMessage[];
  conversationId: string | null;
}) {
  const session = useSession();
  const remembered = useAskMarkStore((s) => s.transcriptEmail);
  const remember = useAskMarkStore((s) => s.setTranscriptEmail);
  const [email, setEmail] = useState(() => remembered || session?.user.email || '');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | AskMarkError>('idle');

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) return;
    setState('sending');
    try {
      await sendTranscript(email.trim(), messages, conversationId);
      remember(email.trim());
      setState('sent');
    } catch (e) {
      setState(e instanceof AskMarkRequestError ? e.kind : 'failed');
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-charcoal-900 p-6 pb-10">
          <Text accessibilityRole="header" className="font-bold text-xl text-bone">
            {copy.email.title}
          </Text>
          <Text className="mt-2 font-sans text-base text-ash">{copy.email.body}</Text>
          <Text className="mt-1 font-sans text-sm text-ash">{copy.email.note}</Text>
          {state === 'sent' ? (
            <Text className="mt-6 font-medium text-lg text-ember-soft" testID="askmark-email-sent">
              {copy.email.sent}
            </Text>
          ) : (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={copy.email.placeholder}
              placeholderTextColor={palette.ash}
              accessibilityLabel={copy.email.placeholder}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="askmark-email-input"
              className="mt-5 min-h-12 border border-charcoal-700 bg-charcoal-950 px-3 font-sans text-base text-bone"
            />
          )}
          {state === 'offline' || state === 'busy' || state === 'failed' ? (
            <Text accessibilityRole="alert" className="mt-2 font-sans text-sm text-ember-soft">
              {copy.errors[state]}
            </Text>
          ) : null}
          <View className="mt-6 flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label={state === 'sent' ? copy.newChatNo : copy.email.cancel} onPress={onClose} testID="askmark-email-cancel" />
            </View>
            {state !== 'sent' ? (
              <View className="flex-1">
                <Button
                  label={state === 'sending' ? copy.email.sending : copy.email.send}
                  disabled={state === 'sending' || !EMAIL_RE.test(email.trim())}
                  onPress={() => void submit()}
                  testID="askmark-email-send"
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
