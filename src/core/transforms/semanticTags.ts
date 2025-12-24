import { getAttrValue, getClassTokens, isElement, removeAttr, type ParentNode } from '../ast';

const ROLE_TO_TAG: Record<string, string> = {
  banner: 'header',
  navigation: 'nav',
  main: 'main',
  contentinfo: 'footer',
  complementary: 'aside',
  button: 'button'
};

const CLASS_TO_TAG: Record<string, string> = {
  header: 'header',
  footer: 'footer',
  nav: 'nav',
  navigation: 'nav',
  main: 'main',
  section: 'section',
  article: 'article',
  aside: 'aside'
};

export function convertSemanticTags(root: ParentNode): void {
  if (!root.childNodes) {
    return;
  }

  for (const child of root.childNodes) {
    if (isElement(child)) {
      if (child.tagName === 'div') {
        const role = getAttrValue(child, 'role');
        if (role && ROLE_TO_TAG[role]) {
          child.tagName = ROLE_TO_TAG[role];
          child.nodeName = ROLE_TO_TAG[role];
          removeAttr(child, 'role');
        } else {
          const classTokens = getClassTokens(child);
          const match = classTokens.find((token) => CLASS_TO_TAG[token]);
          if (match) {
            child.tagName = CLASS_TO_TAG[match];
            child.nodeName = CLASS_TO_TAG[match];
          }
        }
      }
      convertSemanticTags(child);
    }
  }
}
