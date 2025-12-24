import { isElement, isText, type ParentNode } from '../ast';

function hasMeaningfulAttrs(attrs: { name: string; value: string }[]): boolean {
  return attrs.some((attr) => attr.value.trim() !== '');
}

function hasNonWhitespaceText(node: ParentNode): boolean {
  return node.childNodes.some((child) => isText(child) && child.value.trim().length > 0);
}

export function flattenSingleChildWrappers(root: ParentNode): void {
  if (!root.childNodes) {
    return;
  }

  for (let index = 0; index < root.childNodes.length; index += 1) {
    const child = root.childNodes[index];
    if (isElement(child)) {
      if (child.childNodes && child.childNodes.length > 0) {
        flattenSingleChildWrappers(child);
      }

      const onlyChild = child.childNodes.filter((node) => isElement(node));
      const isSingleElementChild = onlyChild.length === 1 && child.childNodes.length === 1;
      const isWrapperTag = child.tagName === 'div' || child.tagName === 'span';

      if (
        isWrapperTag &&
        isSingleElementChild &&
        !hasMeaningfulAttrs(child.attrs) &&
        !hasNonWhitespaceText(child)
      ) {
        const replacement = onlyChild[0];
        replacement.parentNode = root;
        root.childNodes[index] = replacement;
        index -= 1;
      }
    }
  }
}
