import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { todayCopy as copy } from '@copy/today';
import { Button } from '@/components/button';
import { TimeField } from '@/components/time-field';
import { getPart, getRule, type DrillTier } from '@/content';
import { palette } from '@/theme';

import { checkReport } from './journal-rules';
import { requestNotifications, rescheduleMorningPushes } from './notifications';
import { todayState } from './progress';
import { SPINE_LENGTH, milestoneFor, spineDay } from './spine';
import { reportFor, useDrillStore, type DrillDayRow } from './store';
import { useOffline } from './use-sync';
import { useToday } from './use-today';

// ── helpers ──────────────────────────────────────────────────────────────




function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useDrillStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return useDrillStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}

// ── screen ───────────────────────────────────────────────────────────────

export function TodayScreen() {
  const hydrated = useHydrated();
  const today = useToday();
  const offline = useOffline();
  const [pushDenied, setPushDenied] = useState(false);

  const startedOn = useDrillStore((s) => s.startedOn);
  const notificationsAsked = useDrillStore((s) => s.notificationsAsked);
  const notifyAt = useDrillStore((s) => s.notifyAt);
  const drills = useDrillStore((s) => s.drills);
  const openToday = useDrillStore((s) => s.openToday);

  const records = useMemo(() => Object.values(drills), [drills]);
  const state = useMemo(() => todayState(records, today), [records, today]);

  // Create (or carry over) today's drill row once the user has started.
  useEffect(() => {
    if (hydrated && startedOn && state.kind === 'drill') openToday(today);
  }, [hydrated, startedOn, state, today, openToday]);

  // Keep the next 7 mornings scheduled with the right rule.
  const scheduleKey = records.map((r) => `${r.day}:${r.status}:${r.scheduledFor}`).join('|');
  useEffect(() => {
    if (hydrated && startedOn) void rescheduleMorningPushes(records, notifyAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, startedOn, scheduleKey, notifyAt, today]);

  if (!hydrated) return <Shell />;

  let body: React.ReactNode;
  if (!startedOn) body = <StartView today={today} />;
  else if (!notificationsAsked && Platform.OS !== 'web') body = <NotifyAskView onDenied={() => setPushDenied(true)} />;
  else if (state.kind === 'complete') body = <CompleteView />;
  else {
    const row = records.find((r) => r.day === state.day && r.day <= SPINE_LENGTH);
    body = !row ? null : row.status === 'pending' ? <DrillView row={row} /> : <AnsweredView row={row} />;
  }

  return (
    <Shell offline={offline}>
      {pushDenied ? <Text className="mb-6 font-sans text-sm text-ash">{copy.notifications.deniedNote}</Text> : null}
      {body}
    </Shell>
  );
}

function Shell({ children, offline }: { children?: React.ReactNode; offline?: boolean }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      {offline ? (
        <View accessibilityRole="alert" className="bg-charcoal-800 px-6 py-2">
          <Text className="font-sans text-sm text-ash">{copy.offline}</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerClassName="grow px-6 pb-8 pt-6"
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── first run ────────────────────────────────────────────────────────────

function StartView({ today }: { today: string }) {
  const start = useDrillStore((s) => s.start);
  const [notifyAt, setNotifyAt] = useState(useDrillStore.getState().notifyAt);

  return (
    <View className="flex-1 justify-between">
      <View>
        <Text accessibilityRole="header" className="font-bold text-3xl text-bone">
          {copy.start.headline}
        </Text>
        <Text className="mt-4 font-sans text-lg text-ash">{copy.start.body}</Text>

        <View className="mt-10 rounded-xl bg-charcoal-900 p-5">
          <Text className="font-medium text-base text-bone">{copy.start.notifyLabel}</Text>
          <TimeField value={notifyAt} onChange={setNotifyAt} />
          <Text className="mt-2 font-sans text-sm text-ash">{copy.start.notifyHint}</Text>
        </View>
      </View>

      <View className="mt-10">
        <Button label={copy.start.cta} onPress={() => start(today, notifyAt)} testID="start-day-1" />
      </View>
    </View>
  );
}

function NotifyAskView({ onDenied }: { onDenied: () => void }) {
  const markAsked = useDrillStore((s) => s.markNotificationsAsked);

  return (
    <View className="flex-1 justify-between">
      <Text accessibilityRole="header" className="font-bold text-2xl text-bone">
        {copy.notifications.ask}
      </Text>
      <View className="mt-10 gap-3">
        <Button
          label={copy.notifications.allow}
          testID="notify-allow"
          onPress={async () => {
            const granted = await requestNotifications();
            if (!granted) onDenied();
            markAsked();
          }}
        />
        <Button variant="secondary" label={copy.notifications.deny} onPress={markAsked} testID="notify-deny" />
      </View>
    </View>
  );
}

// ── the drill ────────────────────────────────────────────────────────────

function DrillView({ row }: { row: DrillDayRow }) {
  const answer = useDrillStore((s) => s.answer);
  const [fiveMinute, setFiveMinute] = useState(false);
  const rule = getRule(row.ruleId);
  const scheduledTier = spineDay(row.day).tier;
  const tier: DrillTier = fiveMinute ? 'five_minute' : scheduledTier;

  const respond = (status: 'done' | 'dodged') => {
    answer(row.id, status, tier);
    const part = milestoneFor(row.day);
    if (part) router.push(`/milestone/${part}`);
  };

  return (
    <View className="flex-1 justify-between">
      <View>
        <Text className="font-medium text-sm uppercase tracking-widest text-ash">
          {copy.drill.dayOf(row.day, SPINE_LENGTH)}
        </Text>
        <Text className="mt-6 font-medium text-base text-ash">{copy.drill.ruleLabel(rule.number)}</Text>
        <Text accessibilityRole="header" className="mt-1 font-bold text-2xl text-bone">
          {rule.title}
        </Text>

        <Text className="mt-8 font-medium text-sm uppercase tracking-widest text-ember-soft">
          {copy.drill.tier[tier]}
        </Text>
        <Text className="mt-2 font-medium text-2xl leading-9 text-bone" testID="drill-text">
          {rule.drills[tier]}
        </Text>

        {scheduledTier !== 'five_minute' ? (
          <View className="mt-4 items-start">
            <Button
              variant="text"
              label={fiveMinute ? copy.drill.backToFull : copy.drill.fiveMinuteFallback}
              onPress={() => setFiveMinute((v) => !v)}
            />
          </View>
        ) : null}
      </View>

      <View className="mt-10 gap-3">
        <Button label={copy.drill.did} accessibilityLabel={copy.drill.a11y.did} onPress={() => respond('done')} testID="did-it" />
        <Button
          variant="secondary"
          label={copy.drill.dodged}
          accessibilityLabel={copy.drill.a11y.dodged}
          onPress={() => respond('dodged')}
          testID="dodged-it"
        />
      </View>
    </View>
  );
}

// ── after answering ──────────────────────────────────────────────────────

function AnsweredView({ row }: { row: DrillDayRow }) {
  const undo = useDrillStore((s) => s.undo);
  const rule = getRule(row.ruleId);
  const done = row.status === 'done';

  return (
    <View className="flex-1">
      <Text className="font-medium text-sm uppercase tracking-widest text-ash">
        {copy.drill.dayOf(row.day, SPINE_LENGTH)}
      </Text>
      <Text accessibilityRole="header" className="mt-6 font-bold text-3xl text-bone">
        {done ? copy.answered.done : copy.answered.dodged}
      </Text>
      {done ? <Text className="mt-3 font-medium text-2xl text-ember-soft">{rule.mantra}</Text> : null}

      <EveningPrompt row={row} />

      <View className="mt-10">
        <Text className="font-sans text-base text-ash">{copy.answered.nextUnlocks}</Text>
        <View className="mt-2 items-start">
          <Button variant="text" label={copy.answered.undo} onPress={() => undo(row.id)} testID="undo" />
        </View>
      </View>
    </View>
  );
}

function EveningPrompt({ row }: { row: DrillDayRow }) {
  const saveReport = useDrillStore((s) => s.saveReport);
  const skipReport = useDrillStore((s) => s.skipReport);
  const saved = useDrillStore((s) => reportFor(s, row.id));
  const skipped = useDrillStore((s) => !!s.reportSkipped[row.id]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const prompt = row.status === 'done' ? copy.evening.promptDone : copy.evening.promptDodged;

  if (saved) {
    return (
      <View className="mt-10 rounded-xl bg-charcoal-900 p-5">
        <Text className="font-medium text-sm text-ash">{prompt}</Text>
        <Text className="mt-2 font-sans text-lg text-bone">{saved.body}</Text>
        <Text className="mt-3 font-sans text-sm text-ash">{copy.evening.saved}</Text>
      </View>
    );
  }
  if (skipped) return null;

  const onSave = () => {
    const check = checkReport(text);
    if (check.ok) {
      saveReport(row.id, check.body);
      setError(null);
    } else if (check.reason === 'too_long') {
      setError(copy.evening.tooLong);
    }
  };

  return (
    <View className="mt-10 rounded-xl bg-charcoal-900 p-5">
      <Text nativeID="evening-prompt" className="font-bold text-xl text-bone">
        {prompt}
      </Text>
      <TextInput
        accessibilityLabel={prompt}
        accessibilityLabelledBy="evening-prompt"
        value={text}
        onChangeText={(t) => {
          setText(t);
          if (error) setError(null);
        }}
        placeholder={copy.evening.placeholder}
        placeholderTextColor={palette.ash}
        multiline
        maxLength={1000}
        className="mt-3 min-h-24 rounded-lg border border-charcoal-700 bg-charcoal-950 p-3 font-sans text-lg text-bone"
        testID="evening-input"
      />
      {error ? (
        <Text accessibilityRole="alert" className="mt-2 font-sans text-sm text-ember-soft">
          {error}
        </Text>
      ) : null}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <Button label={copy.evening.save} onPress={onSave} disabled={!text.trim()} testID="evening-save" />
        </View>
        <View className="flex-1">
          <Button variant="secondary" label={copy.evening.skip} onPress={() => skipReport(row.id)} testID="evening-skip" />
        </View>
      </View>
    </View>
  );
}

// ── after day 45 (wrap-up is build step 6) ──────────────────────────────

function CompleteView() {
  const part = getPart(4);
  return (
    <View className="flex-1">
      <Text accessibilityRole="header" className="font-bold text-3xl text-bone">
        {copy.milestone.headline(part.name)}
      </Text>
      <Text className="mt-4 font-sans text-lg text-ash">
        {copy.milestone.body(part.rules.length, part.rules.length * 3)}
      </Text>
    </View>
  );
}
