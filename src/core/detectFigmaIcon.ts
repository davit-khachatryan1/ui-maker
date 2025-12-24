import type { Element } from './ast';
import { getAttrValue, getClassTokens, isElement } from './ast';

function hasPrefix(tokens: string[], prefix: string): boolean {
  return tokens.some((token) => token.startsWith(prefix));
}

export function isFigmaIconNode(node: Element): boolean {
  if (node.tagName !== 'div') {
    return false;
  }

  if (!getAttrValue(node, 'data-crypto')) {
    return false;
  }

  const rootTokens = getClassTokens(node);
  const hasSize = hasPrefix(rootTokens, 'w-') && hasPrefix(rootTokens, 'h-');
  if (!hasSize || !rootTokens.includes('relative')) {
    return false;
  }

  const childDivs = node.childNodes.filter(
    (child): child is Element => isElement(child) && child.tagName === 'div'
  );

  if (childDivs.length < 2) {
    return false;
  }

  for (const child of childDivs) {
    const tokens = getClassTokens(child);
    if (!tokens.includes('absolute')) {
      return false;
    }
    if (!hasPrefix(tokens, 'bg-')) {
      return false;
    }
    if (!hasPrefix(tokens, 'w-') || !hasPrefix(tokens, 'h-')) {
      return false;
    }
    if (!hasPrefix(tokens, 'left-') || !hasPrefix(tokens, 'top-')) {
      return false;
    }
  }

  return true;
}
