import type { Root } from "mdast"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { remarkIhsp } from "./remark-ihsp"

/** The remark plugins of `Markdown`: GFM plus math, spoilers and underline. */
export const markdownRemarkPlugins = [remarkGfm, remarkIhsp]

let processor: ReturnType<typeof createProcessor> | null = null

function createProcessor() {
  return unified().use(remarkParse).use(remarkGfm).use(remarkIhsp).freeze()
}

/**
 * Parses Markdown exactly like `Markdown` renders it and returns the mdast tree with source positions (the editor
 * reads formatting from it).
 */
export function parseMarkdown(source: string): Root {
  processor ??= createProcessor()
  return processor.runSync(processor.parse(source), source)
}
