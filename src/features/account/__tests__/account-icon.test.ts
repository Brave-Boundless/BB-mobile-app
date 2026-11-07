import { describe, expect, it } from '@jest/globals';

import { initialsFor } from '../account-icon';

describe('initialsFor', () => {
  it('takes up to two initials from the name part of the email', () => {
    expect(initialsFor('mark@braveandboundless.com')).toBe('M');
    expect(initialsFor('mark.nead@example.com')).toBe('MN');
    expect(initialsFor('jo_ann-smith@example.com')).toBe('JA');
    expect(initialsFor('a+tag@example.com')).toBe('AT');
  });

  it('returns null when there is nothing to show', () => {
    expect(initialsFor(undefined)).toBeNull();
    expect(initialsFor(null)).toBeNull();
    expect(initialsFor('')).toBeNull();
    expect(initialsFor('@example.com')).toBeNull();
    expect(initialsFor('..@example.com')).toBeNull();
  });
});
