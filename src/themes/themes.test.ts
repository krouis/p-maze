import { describe, it, expect } from 'vitest';
import { getThemeForLevel, CURATED_THEMES, HIGH_CONTRAST_THEME } from './themes';

describe('themes', () => {
  it('should rotate through 12 curated themes deterministically', () => {
    // Level 1 should be green meadow (index 0)
    expect(getThemeForLevel(1, false).id).toBe(CURATED_THEMES[0].id);

    // Level 13 should wrap back to green meadow
    expect(getThemeForLevel(13, false).id).toBe(CURATED_THEMES[0].id);

    // Level 12 should be index 11
    expect(getThemeForLevel(12, false).id).toBe(CURATED_THEMES[11].id);
  });

  it('should return high contrast theme if requested', () => {
    expect(getThemeForLevel(1, true)).toEqual(HIGH_CONTRAST_THEME);
    expect(getThemeForLevel(100, true)).toEqual(HIGH_CONTRAST_THEME);
  });
});
