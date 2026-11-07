import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { navigationCopy } from '@copy/navigation';
import { useSession } from './auth';

/** Up to two initials from an email's name part: "mark.nead@…" → "MN", "mark@…" → "M". */
export function initialsFor(email: string | undefined | null): string | null {
  const local = email?.split('@')[0]?.trim();
  if (!local) return null;
  const parts = local.split(/[._+-]+/).filter((p) => /[a-z0-9]/i.test(p));
  const letters = parts.slice(0, 2).map((p) => p.match(/[a-z0-9]/i)![0].toUpperCase());
  return letters.length ? letters.join('') : null;
}

/** Plain head-and-shoulders outline, drawn with Views. */
function PersonOutline() {
  return (
    <View className="items-center" importantForAccessibility="no-hide-descendants">
      <View className="h-2 w-2 border border-ash" style={{ borderRadius: 4 }} />
      <View
        className="mt-0.5 h-1.5 w-3.5 border border-b-0 border-ash"
        style={{ borderTopLeftRadius: 7, borderTopRightRadius: 7 }}
      />
    </View>
  );
}

/**
 * Account icon at the top right of every tab. Opens Settings (push time,
 * Ask Mark, sign in / out, export, delete). A circle (Mark), like the part
 * pillars: one of the few round shapes in a square brand. 44 × 44 hit area.
 */
export function AccountIcon() {
  const session = useSession();
  const initials = initialsFor(session?.user.email);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={navigationCopy.account.a11y}
      hitSlop={8}
      onPress={() => router.push('/settings')}
      testID="account-icon"
      className="h-11 w-11 items-center justify-center active:opacity-60">
      <View
        className={`h-7 w-7 items-center justify-center border ${initials ? 'border-ember bg-charcoal-800' : 'border-ash'}`}
        style={{ borderRadius: 14 }}>
        {initials ? (
          <Text className="font-bold text-xs text-bone" importantForAccessibility="no">
            {initials}
          </Text>
        ) : (
          <PersonOutline />
        )}
      </View>
    </Pressable>
  );
}
