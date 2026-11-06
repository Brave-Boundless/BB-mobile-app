import { describe, expect, it } from '@jest/globals';

import { chapterArt, partArt, yourMoveArt } from '../art';
import { parts, rules } from '..';

describe('book art', () => {
  it('has an illustration for every rule except 8 (left out on purpose: store nudity rules)', () => {
    const missing = rules.map((r) => r.number).filter((n) => !chapterArt[n]);
    expect(missing).toEqual([4, 8]);
  });

  it('has a pillar illustration for every part', () => {
    for (const p of parts) expect(partArt[p.id]).toBeDefined();
  });

  it('records a sane aspect ratio for each image', () => {
    for (const art of [...Object.values(chapterArt), ...Object.values(partArt), yourMoveArt]) {
      expect(art!.source).toBeTruthy();
      expect(art!.ratio).toBeGreaterThan(0.5);
      expect(art!.ratio).toBeLessThan(1.5);
    }
  });
});
