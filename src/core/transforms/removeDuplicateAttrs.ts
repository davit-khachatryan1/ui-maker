import { isElement, type ParentNode } from '../ast';

export function removeDuplicateAttributes(root: ParentNode): void {
  if (!root.childNodes) {
    return;
  }

  for (const child of root.childNodes) {
    if (isElement(child)) {
      const seen = new Set<string>();
      child.attrs = child.attrs.filter((attr) => {
        const key = attr.name.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      removeDuplicateAttributes(child);
    }
  }
}
