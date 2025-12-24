import { describe, expect, it } from 'vitest';
import { parseHtml } from '../parse';
import { serializeHtml } from '../serialize';
import { fixImages } from '../imageFix';

const figmaIconInput = `<div data-crypto="Default" class="w-4 h-4 relative overflow-hidden">
  <div class="w-4 h-4 left-0 top-0 absolute bg-amber-500"></div>
  <div class="w-2 h-3 left-[4.59px] top-[3.38px] absolute bg-white"></div>
</div>`;

describe('image fixes', () => {
  it('converts figma icon blocks into empty img placeholders', () => {
    const ast = parseHtml(figmaIconInput);
    fixImages(ast, {
      enableFigmaIcons: true,
      enableBackgroundImages: false,
      enableRoleImages: false
    });
    const output = serializeHtml(ast);

    expect(output).toContain(
      '<img data-crypto="Default" class="w-4 h-4" width="16" height="16" alt="" />'
    );
  });

  it('does not convert when data-crypto is missing', () => {
    const input = `<div class="w-4 h-4 relative">
  <div class="w-4 h-4 absolute bg-amber-500 left-0 top-0"></div>
  <div class="w-2 h-3 absolute bg-white left-1 top-1"></div>
</div>`;
    const ast = parseHtml(input);
    fixImages(ast, { enableFigmaIcons: true, enableBackgroundImages: false, enableRoleImages: false });
    const output = serializeHtml(ast);

    expect(output).not.toContain('<img');
  });

  it('does not convert when child divs are not absolute', () => {
    const input = `<div data-crypto="Default" class="w-4 h-4 relative">
  <div class="w-4 h-4 bg-amber-500 left-0 top-0"></div>
  <div class="w-2 h-3 absolute bg-white left-1 top-1"></div>
</div>`;
    const ast = parseHtml(input);
    fixImages(ast, { enableFigmaIcons: true, enableBackgroundImages: false, enableRoleImages: false });
    const output = serializeHtml(ast);

    expect(output).not.toContain('<img');
  });
});
