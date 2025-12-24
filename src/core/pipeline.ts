import { parseHtml } from './parse';
import { serializeHtml } from './serialize';
import { applyClassRulesToTree, type ClassRuleOptions } from './classRules';
import { fixImages, type ImageFixOptions } from './imageFix';
import {
  convertSemanticTags,
  fixInvalidNesting,
  flattenSingleChildWrappers,
  normalizeWhitespace,
  removeDuplicateAttributes,
  removeEmptyNodes
} from './transforms';
import { toReact, type ReactOutputOptions } from './toReact';
import { formatCode } from './format';
import type { DocumentFragment } from './ast';

export type OutputFormat = 'html' | 'react';

export interface CleanupOptions {
  removeEmpty: boolean;
  flattenWrappers: boolean;
  normalizeWhitespace: boolean;
  removeDuplicateAttrs: boolean;
  fixNesting: boolean;
  semanticTags: boolean;
}

export interface PipelineOptions {
  output: OutputFormat;
  cleanup: CleanupOptions;
  classRules: ClassRuleOptions;
  imageFix: ImageFixOptions;
  react: ReactOutputOptions;
  format: boolean;
}

export function runPipeline(input: string, options: PipelineOptions): string {
  const ast = parseHtml(input);
  applyCleanupTransforms(ast, options.cleanup);
  fixImages(ast, options.imageFix);
  applyClassRulesToTree(ast, options.classRules);

  const rawOutput = options.output === 'react' ? toReact(ast, options.react) : serializeHtml(ast);

  if (!options.format) {
    return rawOutput;
  }

  return formatCode(rawOutput, options.output);
}

function applyCleanupTransforms(ast: DocumentFragment, options: CleanupOptions): void {
  if (options.normalizeWhitespace) {
    normalizeWhitespace(ast);
  }
  if (options.removeEmpty) {
    removeEmptyNodes(ast);
  }
  if (options.semanticTags) {
    convertSemanticTags(ast);
  }
  if (options.flattenWrappers) {
    flattenSingleChildWrappers(ast);
  }
  if (options.removeDuplicateAttrs) {
    removeDuplicateAttributes(ast);
  }
  if (options.fixNesting) {
    fixInvalidNesting(ast);
  }
}
