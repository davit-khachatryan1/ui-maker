import {
  getAttrValue,
  getClassTokens,
  isElement,
  isText,
  type Attr,
  type Element,
  type ParentNode
} from './ast';
import { isFigmaIconNode } from './detectFigmaIcon';
import { extractSizePxFromClasses } from './size';

export interface ImageFixOptions {
  enableFigmaIcons: boolean;
  enableBackgroundImages: boolean;
  enableRoleImages: boolean;
}

const DEFAULT_OPTIONS: ImageFixOptions = {
  enableFigmaIcons: true,
  enableBackgroundImages: true,
  enableRoleImages: true
};

export function fixImages(root: ParentNode, options: Partial<ImageFixOptions> = {}): void {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!root.childNodes) {
    return;
  }

  for (let index = 0; index < root.childNodes.length; index += 1) {
    const child = root.childNodes[index];
    if (!isElement(child)) {
      continue;
    }

    if (config.enableFigmaIcons && isFigmaIconNode(child)) {
      const replacement = createFigmaIconImg(child);
      replacement.parentNode = root;
      root.childNodes[index] = replacement;
      continue;
    }

    if (child.childNodes && child.childNodes.length > 0) {
      fixImages(child, config);
    }

    if (!config.enableBackgroundImages && !config.enableRoleImages) {
      continue;
    }

    if (child.tagName !== 'div') {
      continue;
    }

    const styleValue = getAttrValue(child, 'style') ?? '';
    const url = extractBackgroundUrl(styleValue);
    const hasRoleImage = isRoleImage(child);
    const hasMeaningfulChildren = hasContentChildren(child);
    const allowBackground = Boolean(url) && config.enableBackgroundImages;
    const allowRole = config.enableRoleImages && hasRoleImage;

    if (!allowBackground && !allowRole) {
      continue;
    }

    if (hasMeaningfulChildren) {
      continue;
    }

    const imgNode = createImgFromDiv(child, url ?? undefined);
    imgNode.parentNode = root;
    root.childNodes[index] = imgNode;
  }
}

function isRoleImage(node: Element): boolean {
  const role = getAttrValue(node, 'role');
  const ariaLabel = getAttrValue(node, 'aria-label');
  const ariaLabelledBy = getAttrValue(node, 'aria-labelledby');
  return role === 'img' || Boolean(ariaLabel) || Boolean(ariaLabelledBy);
}

function extractBackgroundUrl(styleValue: string): string | null {
  const match = styleValue.match(/url\((['"]?)([^'"\)]+)\1\)/i);
  return match ? match[2] : null;
}

function hasContentChildren(node: Element): boolean {
  if (!node.childNodes || node.childNodes.length === 0) {
    return false;
  }

  return node.childNodes.some((child) => {
    if (isElement(child)) {
      return true;
    }
    if (isText(child)) {
      return child.value.trim().length > 0;
    }
    return false;
  });
}

function createFigmaIconImg(source: Element): Element {
  const classTokens = getClassTokens(source);
  const sizeTokens = classTokens.filter((token) => token.startsWith('w-') || token.startsWith('h-'));
  const { width, height } = extractSizePxFromClasses(classTokens);
  const dataCrypto = getAttrValue(source, 'data-crypto');
  const attrs: Attr[] = [];

  if (dataCrypto !== undefined) {
    attrs.push({ name: 'data-crypto', value: dataCrypto });
  }

  if (sizeTokens.length > 0) {
    attrs.push({ name: 'class', value: Array.from(new Set(sizeTokens)).join(' ') });
  }

  attrs.push({ name: 'width', value: String(width) });
  attrs.push({ name: 'height', value: String(height) });
  attrs.push({ name: 'alt', value: '' });

  return {
    nodeName: 'img',
    tagName: 'img',
    attrs,
    namespaceURI: source.namespaceURI,
    childNodes: []
  };
}

function createImgFromDiv(source: Element, src?: string): Element {
  const attrs: Attr[] = [];
  const classTokens = getClassTokens(source);
  const ariaLabel = getAttrValue(source, 'aria-label');

  if (classTokens.length > 0) {
    attrs.push({ name: 'class', value: classTokens.join(' ') });
  }

  const dataAttrs = source.attrs.filter((attr) => attr.name.startsWith('data-'));
  attrs.push(...dataAttrs);

  if (src) {
    attrs.push({ name: 'src', value: src });
  }

  if (ariaLabel) {
    attrs.push({ name: 'alt', value: ariaLabel });
  } else {
    attrs.push({ name: 'alt', value: '' });
  }

  const styleValue = getAttrValue(source, 'style');
  if (styleValue) {
    attrs.push({ name: 'style', value: styleValue });
  }

  return {
    nodeName: 'img',
    tagName: 'img',
    attrs,
    namespaceURI: source.namespaceURI,
    childNodes: []
  };
}
