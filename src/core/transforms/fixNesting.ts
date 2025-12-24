import { isElement, type ParentNode } from '../ast';

const INVALID_P_CHILDREN = new Set([
  'div',
  'p',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'main',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr'
]);

export function fixInvalidNesting(root: ParentNode): void {
  if (!root.childNodes) {
    return;
  }

  for (const child of root.childNodes) {
    if (isElement(child)) {
      if (child.tagName === 'p') {
        for (const nested of child.childNodes) {
          if (isElement(nested) && INVALID_P_CHILDREN.has(nested.tagName)) {
            nested.tagName = 'span';
            nested.nodeName = 'span';
          }
        }
      }
      fixInvalidNesting(child);
    }
  }
}
