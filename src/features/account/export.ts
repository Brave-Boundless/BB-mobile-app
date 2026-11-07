// "Export my data": one JSON file with everything the user has logged
// (Mark, 2026-11-06). Built from the local store, which holds the full record
// (merged with the server after sign-in).

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { getRule } from '@/content';
import type { DrillData } from '@/features/drill/store';

export const EXPORT_FORMAT = 'brave-and-boundless-export/v1';

export function buildExport(data: DrillData, opts: { now: Date; appVersion: string; email?: string }) {
  const drills = Object.values(data.drills).sort((a, b) => a.day - b.day || a.scheduledFor.localeCompare(b.scheduledFor));
  const ruleOf = new Map(drills.map((d) => [d.id, d]));
  return {
    format: EXPORT_FORMAT,
    exportedAt: opts.now.toISOString(),
    appVersion: opts.appVersion,
    account: opts.email ? { email: opts.email } : null,
    settings: { startedOn: data.startedOn, morningPushAt: data.notifyAt, plannedReminder: data.plan },
    afterDay45: data.practice,
    drills: drills.map((d) => ({
      id: d.id,
      track: d.kind ?? 'spine',
      day: d.day,
      rule: d.ruleId,
      ruleTitle: getRule(d.ruleId).title,
      tier: d.tier,
      date: d.scheduledFor,
      status: d.status,
      respondedAt: d.respondedAt,
      howHard: d.effort ?? null,
      whatGotInTheWay: d.dodgeReason ?? null,
    })),
    journal: Object.values(data.journal)
      .filter((j) => !j.deleted)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((j) => ({
        id: j.id,
        drillId: j.drillDayId,
        day: ruleOf.get(j.drillDayId)?.day ?? null,
        rule: ruleOf.get(j.drillDayId)?.ruleId ?? null,
        writtenAt: j.createdAt,
        body: j.body,
      })),
  };
}

export function exportFileName(now: Date): string {
  return `brave-and-boundless-${now.toISOString().slice(0, 10)}.json`;
}

/** Writes the export and opens the share sheet (download on web). */
export async function shareExport(payload: object, fileName: string): Promise<void> {
  const text = JSON.stringify(payload, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: fileName });
}
