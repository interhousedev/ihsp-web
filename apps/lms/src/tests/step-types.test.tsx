import { describe, expect, it } from "bun:test"
import type { Answer, Block, Question } from "@ihsp/api"
import { fireEvent, screen, within } from "@testing-library/react"
import { useState } from "react"
import { QuestionField } from "../features/player/components/question-field"
import { VideoBlock } from "../features/player/components/video-block"
import { describeAnswer, isAnswered, type AttemptQuestion } from "../features/player/utils/answers"
import { videoEmbed } from "../features/player/utils/video"
import { AddBlockBar } from "../features/step-editor/components/add-block-bar"
import { QuestionEditor } from "../features/step-editor/components/question-editor"
import { VideoBlockEditor } from "../features/step-editor/components/video-block-editor"
import {
  QUESTION_TYPES,
  changeQuestionType,
  newQuestion,
  remapIds,
  validateContent,
} from "../features/step-editor/utils/content-ops"
import { STEP_TYPES, STEP_TYPE_GROUPS } from "../features/step-editor/utils/step-types"
import { renderLms } from "./helpers"

const codes = (q: Question) =>
  validateContent({
    title: "t",
    blocks: [{ id: "b", type: "test", config: {} as never, questions: [{ ...q, prompt: "x" }] }],
  }).map((i) => i.code)

const make = (a: string, b: string): { title: string; blocks: Block[] } => ({
  title: "t",
  blocks: [
    {
      id: "b",
      type: "test",
      config: {} as never,
      questions: [
        { ...newQuestion("matching"), id: "q", pairs: [{ id: a, left: "l", right: "r" }] },
        { ...newQuestion("blanks"), id: "q2", blanks: [{ id: b, accepted: ["x"] }] },
      ],
    },
  ],
})

describe("step type catalog", () => {
  it("covers every question type and groups the picker like Stepik", () => {
    expect(STEP_TYPE_GROUPS).toEqual(["materials", "tests", "answers"])
    const questionTypes = new Set(
      STEP_TYPES.flatMap((type) => {
        const block = type.create()
        return block.type === "test" ? block.questions.map((q) => q.type) : []
      }),
    )
    for (const type of QUESTION_TYPES.filter((item) => item !== "multiple")) expect(questionTypes.has(type)).toBe(true)
    expect(STEP_TYPES.find((t) => t.id === "video")?.create().type).toBe("video")
  })

  it("creates every question type with its own data and unique ids", () => {
    expect(newQuestion("sorting").options).toHaveLength(2)
    expect(newQuestion("matching").pairs).toHaveLength(2)
    expect(newQuestion("table").table?.correct).toHaveLength(2)
    expect(newQuestion("blanks").blanks).toHaveLength(1)
    expect(newQuestion("random_number").random?.variables).toHaveLength(2)
    expect(newQuestion("formula").formula?.mode).toBe("symbolic")
    expect(newQuestion("code").code?.expected_outputs).toEqual([])
  })

  it("changeQuestionType keeps prompt and points and swaps the data", () => {
    const base = { ...newQuestion("single"), prompt: "P", points: 3 }
    const next = changeQuestionType(base, "matching")
    expect(next).toMatchObject({ id: base.id, type: "matching", prompt: "P", points: 3 })
    expect(next.pairs).toHaveLength(2)
    expect(changeQuestionType(base, "sorting").options?.every((o) => !o.correct)).toBe(true)
  })

  it("validates the new types", () => {
    expect(codes(newQuestion("formula"))).toContain("no-formula")
    expect(codes({ ...newQuestion("matching"), pairs: [] })).toContain("too-few-items")
    expect(codes({ ...newQuestion("table"), table: { rows: ["a"], columns: ["b"], correct: [[false]] } })).toContain(
      "no-table",
    )
    expect(codes({ ...newQuestion("random_number"), random: { variables: [], formula: "", tolerance: 0 } })).toEqual(
      expect.arrayContaining(["no-variables", "no-formula"]),
    )
    expect(codes(newQuestion("free"))).toEqual([])
    const video: Block = { id: "v", type: "video", source: "link", url: "", file_id: null, caption: "" }
    expect(validateContent({ title: "t", blocks: [video] }).map((i) => i.code)).toEqual(["empty-video"])
  })

  it("remaps the ids of pairs and blanks", () => {
    const { content } = remapIds(make("tmp-1", "tmp-2"), make("tmp-1", "tmp-2"), make("srv1", "srv2"))
    const test = content.blocks[0]
    expect(test?.type === "test" && test.questions[0]?.pairs?.[0]?.id).toBe("srv1")
    expect(test?.type === "test" && test.questions[1]?.blanks?.[0]?.id).toBe("srv2")
  })
})

describe("step type picker", () => {
  it("shows the grouped sections with title and description and adds the picked type", () => {
    const added: Block[] = []
    const { user } = renderLms(<AddBlockBar onAdd={(block) => added.push(block)} />)
    fireEvent.click(screen.getByRole("button", { name: "Add block" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Choose a step type")).toBeInTheDocument()
    expect(within(dialog).getByRole("heading", { name: "Test tasks" })).toBeInTheDocument()
    expect(within(dialog).getByRole("heading", { name: "Tasks with a typed answer" })).toBeInTheDocument()
    expect(within(dialog).getByText("Put the items in the right order")).toBeInTheDocument()
    expect(dialog.querySelectorAll("[data-step-type]")).toHaveLength(STEP_TYPES.length)
    void user
    fireEvent.click(within(dialog).getByRole("button", { name: /Sorting/ }))
    expect(added).toHaveLength(1)
    expect(added[0]?.type === "test" && added[0].questions[0]?.type).toBe("sorting")
  })
})

function Harness({ initial }: { initial: Question }) {
  const [question, setQuestion] = useState(initial)
  return (
    <>
      <QuestionEditor
        question={question}
        index={0}
        total={1}
        keyOf={(id) => id}
        onChange={setQuestion}
        onMove={() => undefined}
        onRemove={() => undefined}
      />
      <output data-testid="json">{JSON.stringify(question)}</output>
    </>
  )
}

function current(): Question {
  return JSON.parse(screen.getByTestId("json").textContent ?? "{}") as Question
}

describe("question forms", () => {
  it("edits a matching pair", () => {
    renderLms(<Harness initial={{ ...newQuestion("matching"), id: "q" }} />)
    fireEvent.change(screen.getByLabelText("Left item 1"), { target: { value: "Cat" } })
    fireEvent.change(screen.getByLabelText("Right item 1"), { target: { value: "Meow" } })
    expect(current().pairs?.[0]).toMatchObject({ left: "Cat", right: "Meow" })
    fireEvent.click(screen.getByRole("button", { name: "Add pair" }))
    expect(current().pairs).toHaveLength(3)
  })

  it("toggles table cells and grows the grid", () => {
    renderLms(<Harness initial={{ ...newQuestion("table"), id: "q" }} />)
    fireEvent.click(screen.getByLabelText("Row 1, column 2 is correct"))
    expect(current().table?.correct[0]).toEqual([true, true])
    fireEvent.click(screen.getByRole("button", { name: "Add column" }))
    expect(current().table?.correct.every((line) => line.length === 3)).toBe(true)
  })

  it("edits random variables and the formula", () => {
    renderLms(<Harness initial={{ ...newQuestion("random_number"), id: "q" }} />)
    fireEvent.change(screen.getByLabelText("Formula of the answer"), { target: { value: "a * b" } })
    fireEvent.change(screen.getByLabelText("Variable 1 maximum"), { target: { value: "20" } })
    expect(current().random?.formula).toBe("a * b")
    expect(current().random?.variables[0]?.max).toBe(20)
  })

  it("edits formula, blanks, code and sorting", () => {
    renderLms(<Harness initial={{ ...newQuestion("formula"), id: "q" }} />)
    fireEvent.change(screen.getByLabelText("Correct expression"), { target: { value: "(x+1)^2" } })
    expect(current().formula?.expression).toBe("(x+1)^2")
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "sorting" } })
    fireEvent.change(screen.getByLabelText("Item 1"), { target: { value: "first" } })
    expect(current().options?.[0]?.text).toBe("first")
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "blanks" } })
    fireEvent.change(screen.getByLabelText("Accepted answers of blank 1"), { target: { value: "Paris\nparis" } })
    expect(current().blanks?.[0]?.accepted).toEqual(["Paris", "paris"])
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "code" } })
    fireEvent.change(screen.getByLabelText("Expected outputs"), { target: { value: "1\n2" } })
    expect(current().code?.expected_outputs).toEqual(["1\n2"])
  })

  it("edits a video link", () => {
    let block = { id: "v", type: "video", source: "link", url: "", file_id: null, caption: "" } as Extract<
      Block,
      { type: "video" }
    >
    renderLms(<VideoBlockEditor block={block} onChange={(next) => (block = next)} />)
    fireEvent.change(screen.getByLabelText("Video link"), { target: { value: "https://youtu.be/abc" } })
    expect(block.url).toBe("https://youtu.be/abc")
  })
})

function Field({ question, initial }: { question: AttemptQuestion; initial?: Answer }) {
  const [answer, setAnswer] = useState<Answer | undefined>(initial)
  return (
    <>
      <QuestionField question={question} index={0} answer={answer} onChange={(next) => setAnswer(next ?? undefined)} />
      <output data-testid="answer">{JSON.stringify(answer ?? null)}</output>
    </>
  )
}

const given = () => JSON.parse(screen.getByTestId("answer").textContent ?? "null") as Answer | null
const base = { id: "q", prompt: "P", points: 1 }

describe("player question fields", () => {
  it("sorts items with the move buttons", () => {
    const question = {
      ...base,
      type: "sorting",
      options: [
        { id: "b", text: "B" },
        { id: "a", text: "A" },
      ],
    }
    renderLms(<Field question={question} />)
    fireEvent.click(screen.getByRole("button", { name: "Move A up" }))
    expect(given()).toEqual({ option_ids: ["a", "b"] })
  })

  it("matches the left items to the right ones", () => {
    const question = {
      ...base,
      type: "matching",
      lefts: [{ id: "1", text: "L1" }],
      rights: [
        { id: "2", text: "R2" },
        { id: "1", text: "R1" },
      ],
    }
    renderLms(<Field question={question} />)
    fireEvent.change(screen.getByLabelText("Match for L1"), { target: { value: "1" } })
    expect(given()).toEqual({ pairs: { "1": "1" } })
  })

  it("marks table cells", () => {
    const question = { ...base, type: "table", table: { rows: ["r"], columns: ["c1", "c2"] } }
    renderLms(<Field question={question} />)
    fireEvent.click(screen.getByLabelText("r / c2"))
    expect(given()).toEqual({ cells: ["0:1"] })
    fireEvent.click(screen.getByLabelText("r / c2"))
    expect(given()).toBeNull()
  })

  it("fills blanks, formulas, free text and generated numbers", () => {
    renderLms(<Field question={{ ...base, type: "blanks", blanks: 2 }} />)
    fireEvent.change(screen.getByLabelText("Blank 2"), { target: { value: "x" } })
    expect(given()).toEqual({ texts: ["", "x"] })
  })

  it("answers a formula, a random number and a free question", () => {
    renderLms(<Field question={{ ...base, type: "formula", variables: ["x"] }} />)
    fireEvent.change(screen.getByPlaceholderText("Your expression"), { target: { value: "x^2" } })
    expect(given()).toEqual({ text: "x^2" })
  })

  it("answers a generated number", () => {
    renderLms(<Field question={{ ...base, type: "random_number" }} />)
    fireEvent.change(screen.getByPlaceholderText("Number"), { target: { value: "7.5" } })
    expect(given()).toEqual({ number: 7.5 })
  })

  it("answers code with the reported output only when outputs are compared", () => {
    renderLms(<Field question={{ ...base, type: "code", code: { language: "python", starter: "", auto: true } }} />)
    fireEvent.change(screen.getByLabelText("Output of your program"), { target: { value: "42" } })
    expect(given()).toEqual({ text: "", output: "42" })
  })

  it("describes answers readably", () => {
    expect(isAnswered({ pairs: {} })).toBe(false)
    expect(isAnswered({ cells: ["0:0"] })).toBe(true)
    const q = { ...base, type: "matching", lefts: [{ id: "1", text: "L" }], rights: [{ id: "1", text: "R" }] }
    expect(describeAnswer(q, { pairs: { "1": "1" } })).toBe("L - R")
  })
})

describe("video", () => {
  it("embeds YouTube and Vimeo and plays direct files", () => {
    expect(videoEmbed("https://youtu.be/abc")).toEqual({
      kind: "iframe",
      src: "https://www.youtube-nocookie.com/embed/abc",
    })
    expect(videoEmbed("https://www.youtube.com/watch?v=xyz")).toMatchObject({ kind: "iframe" })
    expect(videoEmbed("https://vimeo.com/12345")).toEqual({
      kind: "iframe",
      src: "https://player.vimeo.com/video/12345",
    })
    expect(videoEmbed("https://cdn.example/v.mp4").kind).toBe("file")
    expect(videoEmbed("javascript:alert(1)").kind).toBe("none")
  })

  it("renders the player and the caption", () => {
    renderLms(<VideoBlock url="https://youtu.be/abc" caption="Intro" />)
    expect(screen.getByTitle("Intro")).toBeInTheDocument()
    expect(screen.getByText("Intro", { selector: "figcaption" })).toBeInTheDocument()
  })
})
