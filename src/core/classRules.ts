import { getClassTokens, isElement, setClassTokens, type ParentNode } from './ast';

export interface ClassRenameRule {
  from: string;
  to: string;
  isRegex: boolean;
}

export interface ClassRuleOptions {
  remove: string[];
  removeRegex: string[];
  rename: ClassRenameRule[];
  prefix?: string;
}

export function applyClassRulesToTokens(tokens: string[], rules: ClassRuleOptions): string[] {
  let nextTokens = tokens.slice();

  if (rules.remove.length > 0 || rules.removeRegex.length > 0) {
    const removeSet = new Set(rules.remove);
    const removeRegexes = rules.removeRegex
      .map((pattern) => safeRegex(pattern))
      .filter((regex): regex is RegExp => Boolean(regex));

    nextTokens = nextTokens.filter((token) => {
      if (removeSet.has(token)) {
        return false;
      }
      return !removeRegexes.some((regex) => regex.test(token));
    });
  }

  if (rules.rename.length > 0) {
    nextTokens = nextTokens.map((token) => {
      let current = token;
      for (const rule of rules.rename) {
        if (!rule.from) {
          continue;
        }
        if (rule.isRegex) {
          const regex = safeRegex(rule.from);
          if (regex && regex.test(current)) {
            current = current.replace(regex, rule.to);
          }
        } else if (current === rule.from) {
          current = rule.to;
        }
      }
      return current;
    });
  }

  if (rules.prefix) {
    nextTokens = nextTokens.map((token) => `${rules.prefix}${token}`);
  }

  return dedupeTokens(nextTokens);
}

export function applyClassRulesToTree(root: ParentNode, rules: ClassRuleOptions): void {
  if (!root.childNodes) {
    return;
  }

  for (const child of root.childNodes) {
    if (isElement(child)) {
      const tokens = getClassTokens(child);
      if (tokens.length > 0) {
        const nextTokens = applyClassRulesToTokens(tokens, rules);
        setClassTokens(child, nextTokens);
      }
      applyClassRulesToTree(child, rules);
    }
  }
}

function dedupeTokens(tokens: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const token of tokens) {
    if (!token || seen.has(token)) {
      continue;
    }
    seen.add(token);
    result.push(token);
  }
  return result;
}

function safeRegex(pattern: string): RegExp | null {
  try {
    const normalized = normalizeRegexPattern(pattern);
    return new RegExp(normalized);
  } catch {
    return null;
  }
}

function normalizeRegexPattern(pattern: string): string {
  if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
    return pattern.slice(1, -1);
  }
  return pattern;
}
