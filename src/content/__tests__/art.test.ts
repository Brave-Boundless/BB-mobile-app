import { describe, expect, it } from '@jest/globals';

import { chapterArt, partArt, yourMoveArt } from '../art';
import { parts, rules } from '..';

describe('book art', () => {
  it('has an illustration for every rule', () => {
    const missing = rules.map((r) => r.number).filter((n) => !chapterArt[n]);
    expect(missing).toEqual([]);
  });

  it('shows every rule’s illustration at the same 3:4 portrait shape', () => {
    for (const art of Object.values(chapterArt)) expect(art!.ratio).toBe(3 / 4);
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
