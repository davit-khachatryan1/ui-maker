import {
  isComment,
  isDocumentFragment,
  isElement,
  isText,
  type Attr,
  type Element,
  type Node,
  type TextNode
} from './ast';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

export function serializeHtml(node: Node): string {
  if (isDocumentFragment(node)) {
    return node.childNodes.map((child) => serializeHtml(child)).join('');
  }

  if (isText(node)) {
    return escapeText((node as TextNode).value);
  }

  if (isComment(node)) {
    return `<!--${node.data}-->`;
  }

  if (isElement(node)) {
    return serializeElement(node);
  }

  return '';
}

function serializeElement(node: Element): string {
  const tag = node.tagName;
  const attrs = serializeAttributes(node.attrs);

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs} />`;
  }

  const children = node.childNodes.map((child) => serializeHtml(child)).join('');
  return `<${tag}${attrs}>${children}</${tag}>`;
}

function serializeAttributes(attrs: Attr[]): string {
  if (!attrs || attrs.length === 0) {
    return '';
  }

  return attrs
    .map((attr) => {
      const name = normalizeAttrName(attr.name);
      if (!name) {
        return '';
      }
      return ` ${name}="${escapeAttr(attr.value)}"`;
    })
    .join('');
}

function normalizeAttrName(name: string): string {
  if (name === 'classname') {
    return 'class';
  }
  if (name === 'htmlfor') {
    return 'for';
  }

  return name;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}
