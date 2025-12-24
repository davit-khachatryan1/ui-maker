import { isElement, isText, type ParentNode } from '../ast';

const PRESERVE_WHITESPACE_TAGS = new Set(['pre', 'code', 'textarea']);

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ');
}

export function normalizeWhitespace(root: ParentNode, inPreserve = false): void {
  if (!root.childNodes) {
    return;
  }

  for (const child of root.childNodes) {
    if (isText(child)) {
      if (inPreserve) {
        continue;
      }
      const trimmed = normalizeText(child.value);
      child.value = trimmed.trim().length === 0 ? '' : trimmed;
    } else if (isElement(child)) {
      const nextPreserve = inPreserve || PRESERVE_WHITESPACE_TAGS.has(child.tagName);
      normalizeWhitespace(child, nextPreserve);
    }
  }
}
