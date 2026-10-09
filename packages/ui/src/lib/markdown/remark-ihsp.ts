/// <reference types="remark-parse" />
import type { Nodes, Root } from "mdast"
import { type InlineMath, mathFromMarkdown } from "mdast-util-math"
import type { Processor, Transformer } from "unified"
import { mathSyntax } from "./math-syntax"
import { spoilerFromMarkdown, spoilerSyntax } from "./spoiler-syntax"
import { pairUnderlineTags } from "./underline-tags"

/**
 * The IHSP additions to GFM, shared by the renderer and the editor (use after `remark-gfm`):
 *
 * - math: `$x$` inline (strict single-dollar rules, see `mathSyntax`), `$$x$$` display, `$$` lines for a display block;
 * - spoilers: `||text||`;
 * - underline: `<u>text</u>`.
 */
export const remarkIhsp = remarkIhspPlugin

/** A unified plugin: unified calls it with the processor as `this`. */
function remarkIhspPlugin(this: Processor): Transformer<Root, Root> {
  const data = this.data()
  ;(data.micromarkExtensions ??= []).push(mathSyntax(), spoilerSyntax())
  ;(data.fromMarkdownExtensions ??= []).push(mathFromMarkdown(), spoilerFromMarkdown())
  return (tree, file) => {
    adjustInlineMath(tree, String(file.value), false)
    pairUnderlineTags(tree)
  }
}

/** Whether inline math was written with two or more dollars (`$$x$$` in a sentence): it renders as display math. */
export function isDisplayInlineMath(node: InlineMath, source: string): boolean {
  const offset = node.position?.start.offset
  return offset !== undefined && source.startsWith("$$", offset)
}

/**
 * Marks `$$x$$` in a sentence as display math and, inside GFM table cells, turns `\|` into `|` (the pipe escape a
 * cell needs, handled like GFM does for code spans).
 */
function adjustInlineMath(node: Nodes, source: string, inTable: boolean): void {
  if (node.type === "inlineMath") {
    const value = inTable
      ? node.value.replace(/\\([\\|])/g, (pair, next: string) => (next === "|" ? next : pair))
      : node.value
    const display = isDisplayInlineMath(node, source)
    node.value = value
    node.data = {
      ...node.data,
      hProperties: { className: ["language-math", display ? "math-display" : "math-inline"] },
      hChildren: [{ type: "text", value }],
    }
  }
  if ("children" in node) {
    for (const child of node.children) adjustInlineMath(child, source, inTable || node.type === "table")
  }
}
