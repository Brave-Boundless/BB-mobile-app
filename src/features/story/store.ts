// The story draft, kept on the phone so nothing is lost offline or if the app
// closes. Cleared once Kit has it.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StoryInput } from './kit';

interface StoryState {
  draft: StoryInput;
  edit(patch: Partial<StoryInput>): void;
  clear(): void;
}

export const emptyStory: StoryInput = { name: '', email: '', kind: null, story: '', newsletter: false };

export const useStoryStore = create<StoryState>()(
  persist(
    (set) => ({
      draft: emptyStory,
      edit: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      // Keeps name and email for next time; the story and choices start fresh.
      clear: () => set((s) => ({ draft: { ...emptyStory, name: s.draft.name, email: s.draft.email } })),
    }),
    { name: 'bb.story.v1', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
