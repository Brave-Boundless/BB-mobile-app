import { Image, Linking, Pressable, View } from 'react-native';

import { socialCopy } from '@copy/social';
import { socialLinks } from '@/content/social';
import { palette } from '@/theme';

/**
 * A row of social logos. Each opens its https link, which iOS and Android
 * hand to the installed app (universal / app links) or the browser.
 */
export function SocialLinks() {
  return (
    <View className="-ml-3 flex-row" testID="social-links">
      {socialLinks.map((s) => (
        <Pressable
          key={s.key}
          accessibilityRole="link"
          accessibilityLabel={socialCopy.a11y(s.name)}
          onPress={() => void Linking.openURL(s.url)}
          testID={`social-${s.key}`}
          className="h-12 w-12 items-center justify-center active:opacity-60">
          <Image source={s.icon} style={{ width: 24, height: 24, tintColor: palette.bone }} accessibilityIgnoresInvertColors />
        </Pressable>
      ))}
    </View>
  );
}
