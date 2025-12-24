import { describe, expect, it } from 'vitest';
import { parseHtml } from '../parse';
import { serializeHtml } from '../serialize';
import { flattenSingleChildWrappers } from '../transforms/flattenWrappers';

describe('flatten wrappers', () => {
  it('flattens single-child div wrappers', () => {
    const input = `<div><div><span>Text</span></div></div>`;
    const ast = parseHtml(input);
    flattenSingleChildWrappers(ast);
    const output = serializeHtml(ast);

    expect(output).toBe('<span>Text</span>');
  });
});
