const TAILWIND_SIZE_MAP: Record<number, number> = {
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48
};

function parseBracketSize(token: string, prefix: string): number | undefined {
  const match = token.match(new RegExp(`^${prefix}-\\[(\\d+(?:\\.\\d+)?)px\\]$`));
  if (!match) {
    return undefined;
  }
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function parseScaleSize(token: string, prefix: string): number | undefined {
  const match = token.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!match) {
    return undefined;
  }
  const key = Number.parseInt(match[1], 10);
  return TAILWIND_SIZE_MAP[key];
}

function parseSize(token: string, prefix: string): number | undefined {
  return parseBracketSize(token, prefix) ?? parseScaleSize(token, prefix);
}

export function extractSizePxFromClasses(classTokens: string[]): {
  width: number;
  height: number;
} {
  let width: number | undefined;
  let height: number | undefined;

  for (const token of classTokens) {
    if (width === undefined && token.startsWith('w-')) {
      width = parseSize(token, 'w');
    }
    if (height === undefined && token.startsWith('h-')) {
      height = parseSize(token, 'h');
    }
    if (width !== undefined && height !== undefined) {
      break;
    }
  }

  return {
    width: width ?? 16,
    height: height ?? 16
  };
}
