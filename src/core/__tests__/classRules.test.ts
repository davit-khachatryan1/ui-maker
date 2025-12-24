import { describe, expect, it } from 'vitest';
import { applyClassRulesToTokens } from '../classRules';

describe('class rules', () => {
  it('removes, renames, prefixes, and dedupes tokens', () => {
    const tokens = ['figma-bg', 'btn-primary', 'u-1', 'dup', 'dup'];
    const result = applyClassRulesToTokens(tokens, {
      remove: ['u-1'],
      removeRegex: ['^figma-'],
      rename: [{ from: '^btn-(.*)$', to: 'button-$1', isRegex: true }],
      prefix: 'tw-'
    });

    expect(result).toEqual(['tw-button-primary', 'tw-dup']);
  });
});
