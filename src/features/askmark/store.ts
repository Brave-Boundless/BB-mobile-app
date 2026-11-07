// The current Ask Mark conversation and the sharing setting. On this phone
// only: conversations are not synced (the website doesn't keep them either).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ChatMessage } from './api';

interface AskMarkState {
  messages: ChatMessage[];
  conversationId: string | null;
  /** "Share my drill progress" in Settings. On by default (Mark, 2026-11-07). */
  shareProgress: boolean;
  /** The email used for "Email me this chat", remembered for next time. */
  transcriptEmail: string;
  add(m: ChatMessage): void;
  setConversationId(id: string): void;
  setShareProgress(v: boolean): void;
  setTranscriptEmail(v: string): void;
  clear(): void;
  reset(): void;
}

const initial = { messages: [] as ChatMessage[], conversationId: null, shareProgress: true, transcriptEmail: '' };

export const useAskMarkStore = create<AskMarkState>()(
  persist(
    (set) => ({
      ...initial,
      add: (m) => set((s) => ({ messages: [...s.messages, m] })),
      setConversationId: (id) => set(() => ({ conversationId: id })),
      setShareProgress: (v) => set(() => ({ shareProgress: v })),
      setTranscriptEmail: (v) => set(() => ({ transcriptEmail: v })),
      clear: () => set(() => ({ messages: [], conversationId: null })),
      reset: () => set(() => ({ ...initial })),
    }),
    {
      name: 'bb.askmark.v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
