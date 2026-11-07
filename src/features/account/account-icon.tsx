import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { navigationCopy } from "@copy/navigation";
import { useSession } from "./auth";

/** First and last initials from a name: "Mark A. Nead" → "MN", "Mark" → "M". */
export function initialsFromName(
  name: string | undefined | null,
): string | null {
  const words = (name ?? "")
    .split(/\s+/)
    .map((w) => w.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((c): c is string => !!c);
  if (!words.length) return null;
  return (
    words.length === 1 ? words[0] : words[0] + words[words.length - 1]
  ).toUpperCase();
}

interface AccountUser {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * What the account icon shows for a signed-in reader: their provider photo
 * (Google sends one; Apple never does), else initials from their name (Apple
 * sends it on first sign-in; Google always), else from their email.
 */
export function accountLook(user: AccountUser | null | undefined): {
  photo: string | null;
  initials: string | null;
} {
  if (!user) return { photo: null, initials: null };
  const meta = user.user_metadata ?? {};
  const str = (k: string) =>
    typeof meta[k] === "string" ? (meta[k] as string) : undefined;
  const photoUrl = str("avatar_url") ?? str("picture");
  const photo = photoUrl && /^https:\/\//.test(photoUrl) ? photoUrl : null;
  const initials =
    initialsFromName(str("full_name") ?? str("name")) ??
    initialsFor(user.email);
  return { photo, initials };
}

/** Up to two initials from an email's name part: "mark.nead@…" → "MN", "mark@…" → "M". */
export function initialsFor(email: string | undefined | null): string | null {
  const local = email?.split("@")[0]?.trim();
  if (!local) return null;
  const parts = local.split(/[._+-]+/).filter((p) => /[a-z0-9]/i.test(p));
  const letters = parts
    .slice(0, 2)
    .map((p) => p.match(/[a-z0-9]/i)![0].toUpperCase());
  return letters.length ? letters.join("") : null;
}

/** Head and shoulders, solid, reversed out of the grey circle (Mark). */
function PersonSilhouette() {
  return (
    <View
      className="h-full w-full items-center justify-end"
      importantForAccessibility="no-hide-descendants"
    >
      <View
        className="bg-charcoal-950"
        style={{ width: 10, height: 10, borderRadius: 5, marginBottom: 1.5 }}
      />
      <View
        className="bg-charcoal-950"
        style={{
          width: 20,
          height: 9,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
      />
    </View>
  );
}

/**
 * Account icon at the top right of every tab. Opens Settings (push time,
 * Ask Mark, sign in / out, export, delete). A circle (Mark), like the part
 * pillars: one of the few round shapes in a square brand. Solid grey with the
 * person (or initials) reversed out, so it reads apart from the outlined "?".
 * 44 × 44 hit area.
 */
export function AccountIcon() {
  const session = useSession();
  const { photo, initials } = accountLook(session?.user);
  const [photoFailed, setPhotoFailed] = useState<string | null>(null);
  const showPhoto = photo && photoFailed !== photo;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={navigationCopy.account.a11y}
      hitSlop={8}
      onPress={() => router.push("/settings")}
      testID="account-icon"
      className="h-11 w-11 items-center justify-center active:opacity-60"
    >
      <View
        className="h-7 w-7 items-center justify-center overflow-hidden bg-ash"
        style={{ borderRadius: 14 }}
      >
        {showPhoto ? (
          <Image
            source={{ uri: photo }}
            style={{ width: 28, height: 28 }}
            onError={() => setPhotoFailed(photo)}
            accessibilityIgnoresInvertColors
            testID="account-photo"
          />
        ) : initials ? (
          <Text
            className="font-bold text-xs text-charcoal-950"
            importantForAccessibility="no"
          >
            {initials}
          </Text>
        ) : (
          <PersonSilhouette />
        )}
      </View>
    </Pressable>
  );
}
