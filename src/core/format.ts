import * as prettier from 'prettier/standalone';
import * as parserHtmlModule from 'prettier/parser-html';
import * as parserBabelModule from 'prettier/parser-babel';

export type FormatTarget = 'html' | 'react';

type PrettierPlugin = {
  languages?: unknown;
  parsers?: unknown;
};

const parserHtml = unwrapPlugin(parserHtmlModule);
const parserBabel = unwrapPlugin(parserBabelModule);

export function formatCode(code: string, target: FormatTarget): string {
  const parser = target === 'react' ? 'babel-ts' : 'html';
  const plugins = [parserHtml, parserBabel].filter(isPlugin);

  if (plugins.length === 0) {
    return code;
  }

  try {
    const formatted = prettier.format(code, {
      parser,
      plugins,
      printWidth: 80,
      singleQuote: true,
      trailingComma: 'none'
    });
    return typeof formatted === 'string' ? formatted : code;
  } catch {
    return code;
  }
}

function unwrapPlugin(module: unknown): unknown {
  if (module && typeof module === 'object' && 'default' in module) {
    return (module as { default: unknown }).default;
  }
  return module;
}

function isPlugin(module: unknown): module is PrettierPlugin {
  return Boolean(
    module &&
      typeof module === 'object' &&
      'languages' in (module as PrettierPlugin) &&
      'parsers' in (module as PrettierPlugin)
  );
}
