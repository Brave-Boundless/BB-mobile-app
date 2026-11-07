import { Pressable, ScrollView, Text, View } from 'react-native';

import { signupCopy as copy } from '@copy/signup';
import { Rise } from '@/components/motion';
import { SignIn } from '@/features/settings/settings-screen';

import { useAccountStore } from './account-store';

/** The newsletter box: unticked by default (App Store 5.1.1, CAN-SPAM, GDPR). */
function NewsletterBox() {
  const wanted = useAccountStore((s) => s.newsletterWanted);
  const setWanted = useAccountStore((s) => s.setNewsletterWanted);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: wanted }}
      accessibilityLabel={`${copy.newsletter.label} ${copy.newsletter.detail}`}
      onPress={() => setWanted(!wanted)}
      testID="newsletter-box"
      className="mt-6 min-h-12 flex-row items-start gap-3"
    >
      <View className={`mt-0.5 h-6 w-6 items-center justify-center border-2 ${wanted ? 'border-ember bg-ember' : 'border-ash'}`}>
        {wanted ? <Text className="font-bold text-sm text-charcoal-950">✓</Text> : null}
      </View>
      <View className="flex-1">
        <Text className="font-medium text-base text-bone">{copy.newsletter.label}</Text>
        <Text className="mt-1 font-sans text-sm text-ash">{copy.newsletter.detail}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Required sign-up. `new`: a first-time reader, after the 45-day intro.
 * `existing`: someone with progress on this phone and no account yet.
 */
export function SignUpScreen({
  variant,
  answered = 0,
  offline,
}: {
  variant: 'new' | 'existing';
  answered?: number;
  offline?: boolean;
}) {
  const isNew = variant === 'new';
  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerClassName="grow px-6 pb-12 pt-6"
      keyboardShouldPersistTaps="handled"
      testID="signup"
    >
      <Rise index={0}>
        <Text accessibilityRole="header" className="font-bold text-3xl text-bone">
          {isNew ? copy.screen.headline : copy.existing.headline}
        </Text>
        <Text className="mt-3 font-sans text-lg text-ash">{isNew ? copy.screen.body : copy.existing.body(answered)}</Text>
      </Rise>
      <Rise index={1}>
        {isNew ? (
          <View className="mt-6 gap-2">
            {copy.screen.why.map((line) => (
              <View key={line} className="flex-row items-start gap-3">
                <View className="mt-2.5 h-1.5 w-1.5 bg-ember" />
                <Text className="flex-1 font-medium text-base leading-6 text-bone">{line}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-4 font-sans text-base text-bone">{copy.existing.note}</Text>
        )}
      </Rise>
      <Rise index={2}>
        {offline ? (
          <Text accessibilityRole="alert" className="mt-6 font-sans text-base text-ember-soft">
            {copy.offline}
          </Text>
        ) : null}
        <View className="mt-4">
          <SignIn hideWhy />
        </View>
        <NewsletterBox />
        <Text className="mt-6 font-sans text-sm text-ash">{copy.screen.privacy}</Text>
      </Rise>
    </ScrollView>
  );
}
