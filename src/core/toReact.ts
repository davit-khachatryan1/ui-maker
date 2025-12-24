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

export interface ReactOutputOptions {
  componentName: string;
  wrapComponent: boolean;
  useClassName: boolean;
  useFragments: boolean;
  styleMode: 'object' | 'string';
}

export function toReact(root: Node, options: ReactOutputOptions): string {
  const jsx = serializeReact(root, options);
  const needsWrap =
    isDocumentFragment(root) && Array.isArray(root.childNodes) && root.childNodes.length > 1;
  if (!options.wrapComponent) {
    return wrapIfNeeded(jsx, options.useFragments, needsWrap);
  }

  const body = wrapIfNeeded(jsx, options.useFragments, needsWrap);
  const componentName = options.componentName || 'FigmaComponent';

  return `export default function ${componentName}() {\n  return (${body});\n}`;
}

function wrapIfNeeded(jsx: string, useFragments: boolean, needsWrap: boolean): string {
  const trimmed = jsx.trim();
  if (!needsWrap) {
    return trimmed;
  }

  if (useFragments) {
    return `<>${trimmed}</>`;
  }

  return `<div>${trimmed}</div>`;
}

function serializeReact(node: Node, options: ReactOutputOptions): string {
  if (isDocumentFragment(node)) {
    return node.childNodes.map((child) => serializeReact(child, options)).join('');
  }

  if (isText(node)) {
    return escapeText((node as TextNode).value);
  }

  if (isComment(node)) {
    return `{/*${node.data}*/}`;
  }

  if (isElement(node)) {
    return serializeElement(node, options);
  }

  return '';
}

function serializeElement(node: Element, options: ReactOutputOptions): string {
  const tag = node.tagName;
  const attrs = serializeAttributes(node.attrs, options);

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs} />`;
  }

  const children = node.childNodes.map((child) => serializeReact(child, options)).join('');
  return `<${tag}${attrs}>${children}</${tag}>`;
}

function serializeAttributes(attrs: Attr[], options: ReactOutputOptions): string {
  if (!attrs || attrs.length === 0) {
    return '';
  }

  return attrs
    .map((attr) => {
      const name = normalizeAttrName(attr.name, options.useClassName);
      if (!name) {
        return '';
      }

      if (name === 'style') {
        const preserveKeys = options.styleMode === 'string';
        const styleObject = styleStringToObject(attr.value, preserveKeys);
        return ` style={${styleObject}}`;
      }

      if (isNumericAttr(name, attr.value)) {
        return ` ${name}={${attr.value}}`;
      }

      return ` ${name}="${escapeAttr(attr.value)}"`;
    })
    .join('');
}

function normalizeAttrName(name: string, useClassName: boolean): string {
  if (useClassName) {
    if (name === 'class' || name === 'classname') {
      return 'className';
    }
  } else if (name === 'classname') {
    return 'class';
  }

  if (name === 'for' || name === 'htmlfor') {
    return 'htmlFor';
  }

  return name;
}

function isNumericAttr(name: string, value: string): boolean {
  if (name !== 'width' && name !== 'height') {
    return false;
  }
  return /^-?\d+(?:\.\d+)?$/.test(value);
}

function styleStringToObject(styleValue: string, preserveKeys: boolean): string {
  const entries = styleValue
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [rawKey, ...rest] = rule.split(':');
      const rawValue = rest.join(':').trim();
      if (!rawKey || !rawValue) {
        return null;
      }
      const key = rawKey.trim();
      const value = rawValue.trim();
      return [key, value] as const;
    })
    .filter(Boolean) as Array<[string, string]>;

  if (entries.length === 0) {
    return '{}';
  }

  const props = entries.map(([key, value]) => {
    if (key.startsWith('--')) {
      return `'${key}': ${JSON.stringify(value)}`;
    }
    if (preserveKeys) {
      return `'${key}': ${JSON.stringify(value)}`;
    }
    const camelKey = key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    return `${camelKey}: ${JSON.stringify(value)}`;
  });

  return `{ ${props.join(', ')} }`;
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
