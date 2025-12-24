import { parseFragment } from 'parse5';
import type { DocumentFragment } from './ast';

export function parseHtml(input: string): DocumentFragment {
  return parseFragment(input);
}
