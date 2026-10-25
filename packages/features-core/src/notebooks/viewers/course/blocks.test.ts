import { describe, expect, it } from "bun:test"
import { applyPreviewStep, lessonDraftContent } from "@ihsp/test-utils"
import { blockText, lineDiff, toDisplayBlocks } from "./blocks"

describe("toDisplayBlocks", () => {
  it("reads the blocks of a lesson draft (no ids)", () => {
    const [text, test, cards] = toDisplayBlocks(lessonDraftContent.blocks)
    expect(text).toEqual({ type: "text", markdown: expect.stringContaining("Goal") })
    expect(test?.type === "test" && test.questions[0]?.options.filter((o) => o.correct)).toHaveLength(1)
    expect(test?.type === "test" && test.passingScore).toBe(60)
    expect(cards?.type === "flashcards" && cards.cards).toHaveLength(1)
  })

  it("reads the blocks of an LMS step (with ids) the same way", () => {
    const blocks = toDisplayBlocks(applyPreviewStep.step?.new_blocks ?? [])
    expect(blocks.map((block) => block.type)).toEqual(["text", "flashcards"])
  })

  it("puts text and number answers in words", () => {
    const [block] = toDisplayBlocks([
      {
        type: "test",
        questions: [
          { type: "number", prompt: "g?", number: 9.8, tolerance: 0.1 },
          { type: "text", prompt: "Unit?", accepted_answers: ["N", "newton"], regex: "^n" },
        ],
      },
    ])
    expect(block?.type === "test" && block.questions.map((q) => q.answers)).toEqual([
      ["9.8 ± 0.1"],
      ["N", "newton", "/^n/"],
    ])
  })

  it("flattens a block to text for the diff", () => {
    expect(blockText({ type: "flashcards", cards: [{ front: "Q", back: "A" }] })).toBe("Q → A")
  })
})

describe("lineDiff", () => {
  it("marks added, removed and unchanged lines", () => {
    expect(lineDiff("a\nb\nc", "a\nc\nd")).toEqual([
      { kind: "same", text: "a" },
      { kind: "removed", text: "b" },
      { kind: "same", text: "c" },
      { kind: "added", text: "d" },
    ])
  })

  it("handles empty sides", () => {
    expect(lineDiff("", "x")).toEqual([{ kind: "added", text: "x" }])
    expect(lineDiff("x", "")).toEqual([{ kind: "removed", text: "x" }])
    expect(lineDiff("", "")).toEqual([])
  })
})
