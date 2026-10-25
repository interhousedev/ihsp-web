import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown"
import { splice } from "micromark-util-chunked"
import { classifyCharacter } from "micromark-util-classify-character"
import { resolveAll } from "micromark-util-resolve-all"
import type { Code, Construct, Effects, Event, Extension, State, TokenizeContext } from "micromark-util-types"
import type { Spoiler } from "./mdast-nodes"

const PIPE = 124
const PUNCTUATION = 2
/** Emphasis and strikethrough markers: a spoiler may open before them or close after them inside a word. */
const NEIGHBOUR_MARKERS = new Set<Code>([42, 95, 126])

declare module "micromark-util-types" {
  interface TokenTypeMap {
    spoiler: "spoiler"
    spoilerSequence: "spoilerSequence"
    spoilerSequenceTemporary: "spoilerSequenceTemporary"
    spoilerText: "spoilerText"
  }
}

/**
 * `||hidden text||` (Telegram's spoiler). Works like GFM strikethrough with exactly two pipes: the sequences follow
 * the emphasis flanking rules, `\|` is a literal pipe and `|||` is text. Inside GFM table rows the pipes split cells,
 * so spoilers don't work in tables.
 */
export function spoilerSyntax(): Extension {
  const construct: Construct = { name: "spoiler", tokenize: tokenizeSpoiler, resolveAll: resolveAllSpoiler }
  return {
    text: { [PIPE]: construct },
    insideSpan: { null: [construct] },
    attentionMarkers: { null: [PIPE] },
  }
}

/** Turns the spoiler tokens into `spoiler` mdast nodes, rendered as `<span data-spoiler>`. */
export function spoilerFromMarkdown(): FromMarkdownExtension {
  return {
    canContainEols: ["spoiler"],
    enter: {
      spoiler(token) {
        const node: Spoiler = {
          type: "spoiler",
          children: [],
          data: { hName: "span", hProperties: { dataSpoiler: "" } },
        }
        this.enter(node, token)
      },
    },
    exit: {
      spoiler(token) {
        this.exit(token)
      },
    },
  }
}

function tokenizeSpoiler(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
  const previous = this.previous
  const events = this.events
  let size = 0
  return start

  function start(code: Code): State | undefined {
    if (previous === PIPE && events.at(-1)?.[1].type !== "characterEscape") return nok(code)
    effects.enter("spoilerSequenceTemporary")
    return more(code)
  }

  function more(code: Code): State | undefined {
    if (code === PIPE) {
      if (size > 1) return nok(code)
      effects.consume(code)
      size += 1
      return more
    }
    if (size < 2) return nok(code)
    const token = effects.exit("spoilerSequenceTemporary")
    const before = classifyCharacter(previous)
    const after = classifyCharacter(code)
    token._open = !after || (after === PUNCTUATION && Boolean(before)) || NEIGHBOUR_MARKERS.has(code)
    token._close = !before || (before === PUNCTUATION && Boolean(after)) || NEIGHBOUR_MARKERS.has(previous)
    return ok(code)
  }
}

/** Pairs an opening and a closing `||` (nearest first) into a spoiler; unpaired pipes stay text. */
function resolveAllSpoiler(events: Event[], context: TokenizeContext): Event[] {
  let index = -1
  while (++index < events.length) {
    const closer = events[index]
    if (!closer || closer[0] !== "enter" || closer[1].type !== "spoilerSequenceTemporary" || !closer[1]._close) continue
    let open = index
    while (open--) {
      const opener = events[open]
      if (!opener || opener[0] !== "exit" || opener[1].type !== "spoilerSequenceTemporary" || !opener[1]._open) continue
      closer[1].type = "spoilerSequence"
      opener[1].type = "spoilerSequence"
      const spoiler = { type: "spoiler" as const, start: { ...opener[1].start }, end: { ...closer[1].end } }
      const text = { type: "spoilerText" as const, start: { ...opener[1].end }, end: { ...closer[1].start } }
      const next: Event[] = [
        ["enter", spoiler, context],
        ["enter", opener[1], context],
        ["exit", opener[1], context],
        ["enter", text, context],
      ]
      const insideSpan = context.parser.constructs.insideSpan.null
      if (insideSpan) splice(next, next.length, 0, resolveAll(insideSpan, events.slice(open + 1, index), context))
      splice(next, next.length, 0, [
        ["exit", text, context],
        ["enter", closer[1], context],
        ["exit", closer[1], context],
        ["exit", spoiler, context],
      ])
      splice(events, open - 1, index - open + 3, next)
      index = open + next.length - 2
      break
    }
  }
  for (const event of events) {
    if (event[1].type === "spoilerSequenceTemporary") event[1].type = "data"
  }
  return events
}
