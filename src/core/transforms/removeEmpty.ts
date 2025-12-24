import { isElement, isText, type ParentNode } from '../ast';

function isWhitespaceOnly(value: string): boolean {
  return value.trim().length === 0;
}

export function removeEmptyNodes(root: ParentNode): void {
  if (!root.childNodes) {
    return;
  }

  for (let index = root.childNodes.length - 1; index >= 0; index -= 1) {
    const child = root.childNodes[index];
    if (isElement(child)) {
      if (child.childNodes && child.childNodes.length > 0) {
        removeEmptyNodes(child);
      }

      const isEmptyElement =
        (child.tagName === 'div' || child.tagName === 'span') &&
        child.childNodes.every((node) =>
          isText(node) ? isWhitespaceOnly(node.value) : !isElement(node)
        );

      if (isEmptyElement) {
        root.childNodes.splice(index, 1);
      }
    } else if (isText(child) && isWhitespaceOnly(child.value)) {
      root.childNodes.splice(index, 1);
    }
  }
}
