// Features that are built in pieces. A flag flips when its build step lands.

export const features = {
  /** Ask Mark in the app (build step 9). Until then the "Ask Mark about this" buttons stay hidden. */
  askMark: false,
} as const;
