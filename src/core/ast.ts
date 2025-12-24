import type { DefaultTreeAdapterMap } from 'parse5';

export type Node = DefaultTreeAdapterMap['node'];
export type Element = DefaultTreeAdapterMap['element'];
export type ParentNode = DefaultTreeAdapterMap['parentNode'];
export type Attr = DefaultTreeAdapterMap['attribute'];
export type TextNode = DefaultTreeAdapterMap['textNode'];
export type CommentNode = DefaultTreeAdapterMap['commentNode'];
export type DocumentFragment = DefaultTreeAdapterMap['documentFragment'];

export function isElement(node: Node): node is Element {
  return typeof (node as Element).tagName === 'string';
}

export function isText(node: Node): node is TextNode {
  return node.nodeName === '#text';
}

export function isComment(node: Node): node is CommentNode {
  return node.nodeName === '#comment';
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
  return node.nodeName === '#document-fragment';
}

export function getAttrValue(node: Element, name: string): string | undefined {
  const target = name.toLowerCase();
  return node.attrs.find((attr) => attr.name === target)?.value;
}

export function setAttr(node: Element, name: string, value: string): void {
  const target = name.toLowerCase();
  const existing = node.attrs.find((attr) => attr.name === target);
  if (existing) {
    existing.value = value;
    return;
  }
  node.attrs.push({ name: target, value });
}

export function removeAttr(node: Element, name: string): void {
  const target = name.toLowerCase();
  node.attrs = node.attrs.filter((attr) => attr.name !== target);
}

export function getClassAttrName(node: Element): 'class' | 'classname' | null {
  if (node.attrs.some((attr) => attr.name === 'class')) {
    return 'class';
  }
  if (node.attrs.some((attr) => attr.name === 'classname')) {
    return 'classname';
  }
  return null;
}

export function getClassTokens(node: Element): string[] {
  const classValue = [getAttrValue(node, 'class'), getAttrValue(node, 'classname')]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!classValue) {
    return [];
  }

  return classValue.split(/\s+/).filter(Boolean);
}

export function setClassTokens(node: Element, tokens: string[]): void {
  const className = getClassAttrName(node) ?? 'class';
  if (tokens.length === 0) {
    removeAttr(node, className);
    return;
  }
  setAttr(node, className, tokens.join(' '));
}

export function hasChildElements(node: ParentNode): boolean {
  return (node.childNodes ?? []).some((child) => isElement(child));
}
