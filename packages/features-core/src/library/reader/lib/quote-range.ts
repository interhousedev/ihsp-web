// A highlight is stored with its quote and a locator that names only the page (`{ page }`) or the CFI. To draw it on
// a PDF page or in Markdown, the reader looks for the quote in the text that is on screen. The match ignores
// whitespace and case entirely: a selection joins lines with new lines while a PDF text layer has no separators
// between its lines, and PDF text items are often cut in the middle of a word.

type Squeezed = { text: string; origin: number[] }

/** The text without whitespace, lower case, and for each kept character the offset it had in `source`. */
function squeeze(source: string): Squeezed {
  let text = ""
  const origin: number[] = []
  for (let index = 0; index < source.length; ) {
    const point = source.codePointAt(index)!
    const char = String.fromCodePoint(point)
    if (!/\s|\u00ad|\u200b/u.test(char)) {
      for (const lower of char.toLowerCase()) {
        text += lower
        for (let unit = 0; unit < lower.length; unit += 1) origin.push(index)
      }
    }
    index += char.length
  }
  return { text, origin }
}

export type TextNodes = { nodes: Text[]; starts: number[]; full: string }

/** The text nodes under `root` in document order, with the offset of each in the joined text `full`. */
export function collectText(root: Node): TextNodes {
  const doc = root.ownerDocument ?? (root as Document)
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  const starts: number[] = []
  let full = ""
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text
    nodes.push(text)
    starts.push(full.length)
    full += text.data
  }
  return { nodes, starts, full }
}

function locate({ nodes, starts }: TextNodes, offset: number): { node: Text; offset: number } | null {
  let low = 0
  let high = nodes.length - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (starts[middle]! <= offset) low = middle
    else high = middle - 1
  }
  const node = nodes[low]
  return node ? { node, offset: Math.min(offset - starts[low]!, node.data.length) } : null
}

/** The range of `full[start, end)` (offsets into `collectText(...).full`), or `null` when it is outside the text. */
export function rangeFromOffsets(collected: TextNodes, start: number, end: number, doc: Document): Range | null {
  if (end <= start) return null
  const from = locate(collected, start)
  const to = locate(collected, end - 1)
  if (!from || !to) return null
  const range = doc.createRange()
  range.setStart(from.node, from.offset)
  range.setEnd(to.node, Math.min(to.offset + 1, to.node.data.length))
  return range
}

/** The first range inside `root` whose text is `quote` (whitespace and case do not matter), or `null`. */
export function findQuoteRange(root: Node, quote: string): Range | null {
  const wanted = squeeze(quote).text
  if (wanted.length < 2) return null
  const collected = collectText(root)
  const haystack = squeeze(collected.full)
  const index = haystack.text.indexOf(wanted)
  if (index < 0) return null
  const startOffset = haystack.origin[index]!
  const lastOffset = haystack.origin[index + wanted.length - 1]!
  const start = locate(collected, startOffset)
  const end = locate(collected, lastOffset)
  if (!start || !end) return null
  const doc = root.ownerDocument ?? (root as Document)
  const range = doc.createRange()
  range.setStart(start.node, start.offset)
  const lastLength = (collected.full.codePointAt(lastOffset) ?? 0) > 0xffff ? 2 : 1
  range.setEnd(end.node, Math.min(end.offset + lastLength, end.node.data.length))
  return range
}

export type Box = { left: number; top: number; width: number; height: number }

/** The rectangles of a range relative to `origin` (the page element), merged when they sit on the same line. */
export function rangeBoxes(range: Range, origin: DOMRect): Box[] {
  const boxes: Box[] = []
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width < 1 || rect.height < 1) continue
    const next = { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height }
    const last = boxes.at(-1)
    if (last && Math.abs(last.top - next.top) < 3 && Math.abs(last.height - next.height) < 3) {
      const right = Math.max(last.left + last.width, next.left + next.width)
      last.left = Math.min(last.left, next.left)
      last.width = right - last.left
    } else boxes.push(next)
  }
  return boxes
}
