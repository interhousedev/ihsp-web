import type { MindMapNode } from "@ihsp/api"
import type { NodeSize } from "./layout"

/** Pixel metrics of a node pill at zoom 1. Text is measured with an estimate so that it works without a canvas. */
export const FONT_SIZE = 14
export const LINE_HEIGHT = 18
export const PAD_X = 14
export const PAD_Y = 11
export const ROOT_PAD_X = 20
export const MAX_TEXT_WIDTH = 220
export const MAX_LINES = 3
export const TOGGLE_RADIUS = 10

const NARROW = new Set("iljI.,:;!|'’`()[]/ ".split(""))
const MEDIUM = new Set("frtsJ-–—?".split(""))
const WIDE = new Set("mwMW@%".split(""))

/** Estimated width of one character in `FONT_SIZE` (a proportional sans-serif at weight 500). */
function charWidth(char: string): number {
  if (NARROW.has(char)) return 0.3 * FONT_SIZE
  if (MEDIUM.has(char)) return 0.42 * FONT_SIZE
  if (WIDE.has(char)) return 0.92 * FONT_SIZE
  if (/\p{Lu}/u.test(char)) return 0.68 * FONT_SIZE
  if (/[　-鿿]/u.test(char)) return FONT_SIZE
  if (/\p{N}/u.test(char)) return 0.6 * FONT_SIZE
  return 0.57 * FONT_SIZE
}

/** Estimated width in pixels of `text` in one line. Slightly generous so that the text never touches the border. */
export function estimateTextWidth(text: string): number {
  let width = 0
  for (const char of text) width += charWidth(char)
  return Math.ceil(width * 1.04)
}

function breakLongWord(word: string): string[] {
  const parts: string[] = []
  let current = ""
  for (const char of word) {
    if (current !== "" && estimateTextWidth(current + char) > MAX_TEXT_WIDTH) {
      parts.push(current)
      current = ""
    }
    current += char
  }
  if (current !== "") parts.push(current)
  return parts
}

/** Greedy word wrap into at most `MAX_LINES` lines of at most `MAX_TEXT_WIDTH` pixels; the last line gets an ellipsis. */
export function wrapLabel(label: string): string[] {
  const words = label
    .trim()
    .split(/\s+/)
    .filter((word) => word !== "")
    .flatMap((word) => (estimateTextWidth(word) > MAX_TEXT_WIDTH ? breakLongWord(word) : [word]))
  if (words.length === 0) return [""]

  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current === "" ? word : `${current} ${word}`
    if (current !== "" && estimateTextWidth(candidate) > MAX_TEXT_WIDTH) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  lines.push(current)

  if (lines.length <= MAX_LINES) return lines
  const kept = lines.slice(0, MAX_LINES)
  kept[MAX_LINES - 1] = `${kept[MAX_LINES - 1]?.replace(/[\s.,;:]+$/, "")}…`
  return kept
}

export function isRoot(node: MindMapNode): boolean {
  return node.parent_id === null
}

/** The wrapped lines of a node's label. */
export function linesOf(node: MindMapNode): string[] {
  return wrapLabel(node.label)
}

/** The pill size of a node: its widest line plus padding, at least as wide as it is tall. */
export function measureNode(node: MindMapNode): NodeSize {
  const lines = linesOf(node)
  const text = lines.reduce((widest, line) => Math.max(widest, estimateTextWidth(line)), 0)
  const padX = isRoot(node) ? ROOT_PAD_X : PAD_X
  const height = lines.length * LINE_HEIGHT + PAD_Y * 2
  return { width: Math.max(text + padX * 2, height), height }
}

/** Baseline (y from the top of the pill) of each text line, so that the block is centred vertically. */
export function lineBaselines(count: number, height: number): number[] {
  const top = (height - count * LINE_HEIGHT) / 2
  return Array.from({ length: count }, (_, index) => top + index * LINE_HEIGHT + LINE_HEIGHT * 0.72)
}
