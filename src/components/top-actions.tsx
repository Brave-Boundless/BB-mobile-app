import { View } from 'react-native';

import { AccountIcon } from '@/features/account/account-icon';
import { HowItWorksIcon } from '@/features/howitworks/how-it-works-icon';

/** Top-right icons on a tab: How this works (where it applies), then the account icon. */
export function TopActions({ help, helpTestID }: { help?: boolean; helpTestID?: string }) {
  return (
    <View className="flex-row items-center">
      {help ? <HowItWorksIcon testID={helpTestID} /> : null}
      <AccountIcon />
    </View>
  );
}

/** A right-aligned row for the top of a tab screen that has no header row of its own. */
export function TopBar(props: { help?: boolean; helpTestID?: string }) {
  return (
    <View className="flex-row justify-end px-3 pt-1">
      <TopActions {...props} />
    </View>
  );
}
