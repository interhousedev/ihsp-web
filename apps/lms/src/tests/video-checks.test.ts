import { describe, expect, it } from "bun:test"
import { cueSeconds, isSubtitles, parseSubtitles, prepareTranscript } from "../features/step-editor/utils/transcript"
import {
  cardDrafts,
  cardsToBlock,
  checkDrafts,
  checkReady,
  checkToInteraction,
} from "../features/step-editor/utils/video-checks"

const VTT = `\uFEFFWEBVTT

NOTE made by hand

1
00:00:01.000 --> 00:00:04.500
<v Teacher>Today we study <b>photosynthesis</b>.

00:01:30.250 --> 00:01:33.000 align:start
Light is absorbed
by chlorophyll.

00:01:33.000 --> 00:01:35.000
by chlorophyll.
`

const SRT = `1\r\n00:00:02,000 --> 00:00:05,000\r\n{\\an8}Hello there\r\n\r\n2\r\n01:02:03,500 --> 01:02:07,000\r\nThe end\r\n`

describe("subtitles", () => {
  it("reads stamps with dots, commas and hours", () => {
    expect(cueSeconds("00:01:30.250")).toBe(90.25)
    expect(cueSeconds("01:02,500")).toBe(62.5)
    expect(cueSeconds("1:02:03.000")).toBe(3723)
  })

  it("parses WebVTT: drops header, notes, numbers and tags, joins lines", () => {
    expect(parseSubtitles(VTT)).toEqual([
      { start: 1, end: 4.5, text: "Today we study photosynthesis." },
      { start: 90.25, end: 93, text: "Light is absorbed by chlorophyll." },
      { start: 93, end: 95, text: "by chlorophyll." },
    ])
  })

  it("parses SubRip with CRLF and merges a repeated cue", () => {
    const cues = parseSubtitles(`${SRT}\r\n3\r\n01:02:07,000 --> 01:02:09,000\r\nThe end\r\n`)
    expect(cues).toEqual([
      { start: 2, end: 5, text: "Hello there" },
      { start: 3723.5, end: 3729, text: "The end" },
    ])
  })

  it("turns subtitles into timed lines with the video length; plain text passes through", () => {
    expect(isSubtitles(SRT)).toBe(true)
    expect(prepareTranscript(SRT)).toEqual({ transcript: "0:02 Hello there\n1:02:03 The end", durationSeconds: 3727 })
    expect(isSubtitles("1:30 we start")).toBe(false)
    expect(prepareTranscript("  1:30 we start \n")).toEqual({ transcript: "1:30 we start", durationSeconds: null })
  })
})

describe("video check suggestions", () => {
  const check = {
    at_seconds: 150.04,
    question: " Predict? ",
    options: ["A", " ", "C"],
    correct_index: 2,
    explanation: "x",
  }

  it("sorts drafts by time and gives each a key", () => {
    const drafts = checkDrafts([{ ...check, at_seconds: 300 }, check])
    expect(drafts.map((d) => d.at_seconds)).toEqual([150.04, 300])
    expect(drafts[0]?.key).not.toBe(drafts[1]?.key)
  })

  it("is ready with a question and the correct option filled", () => {
    expect(checkReady(check)).toBe(true)
    expect(checkReady({ ...check, correct_index: 1 })).toBe(false)
    expect(checkReady({ ...check, question: " " })).toBe(false)
    expect(checkReady({ ...check, options: ["A", ""], correct_index: 0 })).toBe(false)
  })

  it("becomes a single-choice pause without empty options", () => {
    const interaction = checkToInteraction(check)
    expect(interaction).toMatchObject({ at_sec: 150, kind: "question", text: "Predict?", multiple: false, points: 1 })
    expect(interaction.options.map((o) => [o.text, o.correct])).toEqual([
      ["A", false],
      ["C", true],
    ])
  })

  it("adds only kept, filled cards as a flash cards block", () => {
    const drafts = cardDrafts([
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "" },
      { front: "Q3", back: "A3" },
    ])
    const third = drafts[2]
    if (third) third.keep = false
    expect(cardsToBlock(drafts)?.cards.map((c) => [c.front, c.back])).toEqual([["Q1", "A1"]])
    expect(cardsToBlock(drafts.map((d) => ({ ...d, keep: false })))).toBeNull()
  })
})
