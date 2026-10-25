import { math } from "micromark-extension-math"
import { asciiDigit, markdownLineEnding, markdownLineEndingOrSpace, markdownSpace } from "micromark-util-character"
import type { Code, Construct, Effects, Event, Extension, State, Token, TokenizeContext } from "micromark-util-types"

const DOLLAR = 36
const BACKSLASH = 92
const SPACE = 32

/**
 * Math in text with stricter rules for a single `$` than `micromark-extension-math`, so prices stay text:
 *
 * - `$…$` is inline math only when the opening `$` is followed by a non-space character and does not follow a digit,
 *   and the first unescaped `$` after it is preceded by a non-space character and not followed by a digit
 *   (Pandoc's rule). Otherwise the opening `$` is plain text: `$5 and $10`, `10$-20$`, `costs $ 5`.
 * - `$$…$$` (two or more dollars) in text closes at the next sequence of the same length, as in `remark-math`.
 * - `\$` outside math is a literal dollar (CommonMark escape); inside math a `$` after an odd number of backslashes
 *   is part of the formula (`$\$5$` renders “$5”), so it never closes the math.
 *
 * Display math in its own block (`$$` lines, as in `remark-math`) comes from `micromark-extension-math`.
 */
export function mathSyntax(): Extension {
  return { flow: math().flow, text: { [DOLLAR]: mathText } }
}

const mathText: Construct = {
  name: "mathText",
  tokenize: tokenizeMathText,
  resolve: resolveMathText,
  previous,
}

function tokenizeMathText(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
  const before = this.previous
  let sizeOpen = 0
  let size = 0
  let sequence: Token | undefined
  /** The last character of the formula so far is whitespace: a single `$` can't close after it. */
  let afterWhitespace = false
  /** Backslashes right before the current character: an odd count escapes a `$`. */
  let backslashes = 0

  return start

  function start(code: Code): State | undefined {
    effects.enter("mathText")
    effects.enter("mathTextSequence")
    return sequenceOpen(code)
  }

  function sequenceOpen(code: Code): State | undefined {
    if (code === DOLLAR) {
      effects.consume(code)
      sizeOpen += 1
      return sequenceOpen
    }
    if (sizeOpen === 1 && (code === null || markdownLineEndingOrSpace(code) || asciiDigit(before))) return nok(code)
    effects.exit("mathTextSequence")
    return between(code)
  }

  /** Between formula chunks: a `$` here is never escaped, since `data` consumes escaped ones. */
  function between(code: Code): State | undefined {
    if (code === null) return nok(code)
    if (code === DOLLAR) {
      sequence = effects.enter("mathTextSequence")
      size = 0
      return sequenceClose(code)
    }
    if (code === SPACE || markdownLineEnding(code)) {
      const type = code === SPACE ? "space" : "lineEnding"
      effects.enter(type)
      effects.consume(code)
      effects.exit(type)
      afterWhitespace = true
      backslashes = 0
      return between
    }
    effects.enter("mathTextData")
    return data(code)
  }

  /** Formula characters up to whitespace or an unescaped `$`. */
  function data(code: Code): State | undefined {
    const escapedDollar = code === DOLLAR && backslashes % 2 === 1
    if (code === null || code === SPACE || markdownLineEnding(code) || (code === DOLLAR && !escapedDollar)) {
      effects.exit("mathTextData")
      return between(code)
    }
    effects.consume(code)
    afterWhitespace = markdownSpace(code)
    backslashes = code === BACKSLASH ? backslashes + 1 : 0
    return data
  }

  function sequenceClose(code: Code): State | undefined {
    if (code === DOLLAR) {
      effects.consume(code)
      size += 1
      return sequenceClose
    }
    if (size === sizeOpen && (sizeOpen > 1 || (!afterWhitespace && !asciiDigit(code)))) {
      effects.exit("mathTextSequence")
      effects.exit("mathText")
      return ok(code)
    }
    // After a single `$`, the first unescaped `$` decides: it closes the formula or there is no formula at all.
    if (sizeOpen === 1 || !sequence) return nok(code)
    // A sequence of another length inside `$$…$$` is part of the formula.
    sequence.type = "mathTextData"
    afterWhitespace = false
    backslashes = 0
    return data(code)
  }
}

/** A `$` can't start math right after another `$`, unless that one was escaped. */
function previous(this: TokenizeContext, code: Code): boolean {
  return code !== DOLLAR || this.events.at(-1)?.[1].type === "characterEscape"
}

/** Trims one space or line ending on both sides (like code spans) and merges the formula into data tokens. */
function resolveMathText(events: Event[]): Event[] {
  let tailExitIndex = events.length - 4
  let headEnterIndex = 3
  const head = events[headEnterIndex]?.[1]
  const tail = events[tailExitIndex]?.[1]
  if (head && tail && isSpaceOrLineEnding(head) && isSpaceOrLineEnding(tail)) {
    for (let index = headEnterIndex + 1; index < tailExitIndex; index++) {
      if (events[index]?.[1].type === "mathTextData") {
        tail.type = "mathTextPadding"
        head.type = "mathTextPadding"
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  }

  let enter: number | undefined
  tailExitIndex += 1
  for (let index = headEnterIndex; index <= tailExitIndex; index++) {
    const token = events[index]?.[1]
    if (enter === undefined) {
      if (index !== tailExitIndex && token?.type !== "lineEnding") enter = index
      continue
    }
    if (index !== tailExitIndex && token?.type !== "lineEnding") continue
    const first = events[enter]?.[1]
    const last = events[index - 1]?.[1]
    if (first && last) {
      first.type = "mathTextData"
      if (index !== enter + 2) {
        first.end = last.end
        events.splice(enter + 2, index - enter - 2)
        tailExitIndex -= index - enter - 2
        index = enter + 2
      }
    }
    enter = undefined
  }
  return events
}

function isSpaceOrLineEnding(token: Token): boolean {
  return token.type === "lineEnding" || token.type === "space"
}
