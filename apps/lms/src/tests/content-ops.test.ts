import { describe, expect, it } from "bun:test"
import type { StepContent } from "@ihsp/api"
import {
  changeQuestionType,
  isTempId,
  moveItem,
  newQuestion,
  newTestBlock,
  remapIds,
  validateContent,
} from "../features/step-editor/utils/content-ops"

describe("new content", () => {
  it("creates unique placeholder ids", () => {
    const a = newTestBlock()
    const b = newTestBlock()
    expect(isTempId(a.id)).toBe(true)
    expect(a.id).not.toBe(b.id)
    const options = a.questions[0]?.options ?? []
    expect(new Set(options.map((option) => option.id)).size).toBe(options.length)
  })

  it("starts a single choice with one correct option", () => {
    const question = newQuestion("single")
    expect(question.options?.filter((option) => option.correct)).toHaveLength(1)
    expect(newQuestion("number").answer).toEqual({ value: 0, tolerance: 0 })
  })
})

describe("changeQuestionType", () => {
  it("keeps options between single and multiple and leaves one correct for single", () => {
    const multiple = {
      ...newQuestion("multiple"),
      options: [
        { id: "o1", text: "a", correct: true, pinned: false },
        { id: "o2", text: "b", correct: true, pinned: false },
      ],
    }
    const single = changeQuestionType(multiple, "single")
    expect(single.type).toBe("single")
    expect(single.options?.map((option) => option.correct)).toEqual([true, false])
  })

  it("swaps options for answer data when the type is text or number", () => {
    const text = changeQuestionType({ ...newQuestion("single"), prompt: "Q" }, "text")
    expect(text.options).toBeUndefined()
    expect(text.answer?.accepted).toEqual([""])
    expect(text.prompt).toBe("Q")
  })
})

describe("remapIds", () => {
  it("swaps placeholder ids for the server's and keeps newer local edits", () => {
    const sent: StepContent = {
      title: "T",
      blocks: [{ id: "tmp-1", type: "flashcards", cards: [{ id: "tmp-2", front: "f", back: "b" }] }],
    }
    const returned: StepContent = {
      title: "T",
      blocks: [{ id: "srv1", type: "flashcards", cards: [{ id: "srv2", front: "f", back: "b" }] }],
    }
    const local: StepContent = {
      title: "T edited",
      blocks: [{ id: "tmp-1", type: "flashcards", cards: [{ id: "tmp-2", front: "f2", back: "b" }] }],
    }
    const { content, aliases } = remapIds(local, sent, returned)
    expect(aliases).toEqual([
      ["tmp-1", "srv1"],
      ["tmp-2", "srv2"],
    ])
    expect(content.title).toBe("T edited")
    expect(content.blocks[0]).toEqual({
      id: "srv1",
      type: "flashcards",
      cards: [{ id: "srv2", front: "f2", back: "b" }],
    })
  })

  it("is the identity when nothing was renamed", () => {
    const content: StepContent = { title: "T", blocks: [{ id: "b1", type: "text", markdown: "x" }] }
    expect(remapIds(content, content, content)).toEqual({ content, aliases: [] })
  })
})

describe("validateContent", () => {
  it("reports empty prompts, missing correct options and empty cards", () => {
    const test = newTestBlock()
    const question = test.questions[0]
    if (!question) throw new Error("expected a question")
    const options = (question.options ?? []).map((option) => ({ ...option, correct: false, text: "x" }))
    const content: StepContent = {
      title: "T",
      blocks: [
        { ...test, questions: [{ ...question, prompt: " ", options }] },
        { id: "c", type: "flashcards", cards: [{ id: "c1", front: "f", back: "" }] },
      ],
    }
    expect(validateContent(content).map((issue) => issue.code)).toEqual(["empty-prompt", "no-correct", "empty-card"])
  })

  it("accepts a complete test", () => {
    const test = newTestBlock()
    const question = test.questions[0]
    if (!question) throw new Error("expected a question")
    const options = (question.options ?? []).map((option) => ({ ...option, text: "x" }))
    const content: StepContent = {
      title: "T",
      blocks: [{ ...test, questions: [{ ...question, prompt: "Q?", options }] }],
    }
    expect(validateContent(content)).toEqual([])
  })
})

describe("moveItem", () => {
  it("moves within bounds and ignores out-of-range indexes", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1])
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3])
  })
})
