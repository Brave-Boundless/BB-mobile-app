import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Share, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { inspirationCopy as copy } from '@copy/inspiration';
import { Button } from '@/components/button';
import { getRule, type Passage } from '@/content';
import { useDrillStore } from '@/features/drill/store';

import { CARD, ShareCard } from './share-card';

/** One passage, verbatim, with its source and Save / Share. */
export function PassageCard({ passage, label, testID }: { passage: Passage; label?: string; testID?: string }) {
  const rule = getRule(passage.rule);
  const saved = useDrillStore((s) => !!s.savedPassages[passage.id]);
  const toggle = useDrillStore((s) => s.toggleSavedPassage);
  const share = useSharePassage(passage);

  return (
    <View className="border-l-2 border-ember bg-charcoal-900 py-4 pl-4 pr-3" testID={testID}>
      {label ? <Text className="mb-2 font-medium text-sm uppercase tracking-widest text-ash">{label}</Text> : null}
      <Text className="font-sans text-lg leading-7 text-bone">{passage.text}</Text>
      <Text className="mt-2 font-sans text-sm text-ash">{copy.source(rule.number, rule.chapter)}</Text>
      <View className="mt-1 flex-row gap-4">
        <Button
          variant="text"
          label={saved ? copy.saved : copy.save}
          accessibilityLabel={saved ? `${copy.saved}. Tap to remove.` : copy.save}
          onPress={() => toggle(passage.id)}
          testID={testID ? `${testID}-save` : undefined}
        />
        <Button
          variant="text"
          label={copy.share.button}
          accessibilityLabel={copy.share.a11y}
          onPress={share.start}
          testID={testID ? `${testID}-share` : undefined}
        />
      </View>
      {share.error ? <Text className="font-sans text-sm text-ash">{copy.share.failed}</Text> : null}
      {share.card}
    </View>
  );
}

/**
 * Share as an image: render the card off screen, capture it at 1080 x 1920,
 * hand it to the share sheet (which includes Instagram, Messages, WhatsApp).
 * On web there is no file share, so it shares the text instead.
 */
function useSharePassage(passage: Passage) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const message = copy.share.message(passage.text);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const uri = await captureRef(ref, { format: 'png', width: 1080, height: 1920, result: 'tmpfile' });
        if (cancelled) return;
        if (Platform.OS === 'ios') await Share.share({ url: uri, message });
        else await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: copy.share.button });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setActive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, message]);

  const start = async () => {
    setError(false);
    if (Platform.OS === 'web') {
      try {
        await Share.share({ message });
      } catch {
        setError(true);
      }
      return;
    }
    setActive(true);
  };

  const card = active ? (
    // Off screen, never read by VoiceOver.
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: -CARD.width * 4, top: 0 }}>
      <ShareCard ref={ref} passage={passage} ruleTitle={getRule(passage.rule).title} />
    </View>
  ) : null;

  return { start, card, error };
}
