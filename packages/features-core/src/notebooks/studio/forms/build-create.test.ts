import { describe, expect, it } from "bun:test"
import { defaultCreate, STUDIO_TILES } from "../../lib/artifact-kinds"
import {
  buildCreate,
  buildDataTableCreate,
  buildFlashcardsCreate,
  buildInfographicCreate,
  buildMindMapCreate,
  buildQuizCreate,
  buildReportCreate,
  buildSlidesCreate,
  clampRows,
} from "./build-create"
import {
  formProblem,
  initialState,
  type DataTableState,
  type FlashcardsState,
  type InfographicState,
  type MindMapState,
  type QuizState,
  type ReportState,
  type SlidesState,
} from "./form-state"

function report(patch: Partial<ReportState> = {}): ReportState {
  return { ...(initialState("report", "conspect") as ReportState), ...patch }
}

describe("initialState + buildCreate = the default request of a tile", () => {
  const tiles = STUDIO_TILES.filter((tile) => tile.id !== "report")

  for (const tile of tiles) {
    it(tile.id, () => {
      expect(buildCreate(initialState(tile.kind, tile.format))).toEqual(defaultCreate(tile))
    })
  }

  it("a report picked in the picker starts without a style", () => {
    expect(buildCreate(initialState("report", "study_guide"))).toEqual({
      kind: "report",
      options: { format: "study_guide", detail: "standard" },
    })
  })
})

function tableState(maxRows: string): DataTableState {
  return { ...(initialState("data_table") as DataTableState), maxRows }
}

describe("buildReportCreate", () => {
  it("sends the format, detail and style of a conspect", () => {
    expect(buildReportCreate(report({ style: "cornell", detail: "long" }))).toEqual({
      kind: "report",
      options: { format: "conspect", detail: "long", style: "cornell" },
    })
  })

  it("leaves the style out for every other format", () => {
    for (const format of ["study_guide", "briefing", "faq", "timeline", "article", "custom"] as const) {
      const body = buildReportCreate(report({ format, style: "thesis" }))
      expect(body.kind === "report" && body.options).toEqual({ format, detail: "standard" })
    }
  })

  it("puts the trimmed focus text in `prompt` and leaves it out when empty", () => {
    expect(buildReportCreate(report({ format: "custom", focus: "  A table of the stages  " })).prompt).toBe(
      "A table of the stages",
    )
    expect("prompt" in buildReportCreate(report({ focus: "   " }))).toBe(false)
  })

  it("cuts the focus text to 1000 characters", () => {
    expect(buildReportCreate(report({ focus: "a".repeat(1200) })).prompt).toHaveLength(1000)
  })

  it("sends an explicit language and omits Auto", () => {
    const explicit = buildReportCreate(report({ language: "ru" }))
    expect(explicit.kind === "report" && explicit.options.language).toBe("ru")
    const auto = buildReportCreate(report({ language: "auto" }))
    expect(auto.kind === "report" && "language" in auto.options).toBe(false)
  })
})

describe("the other builders", () => {
  it("mind map", () => {
    const state: MindMapState = { ...(initialState("mind_map") as MindMapState), detail: "detailed", language: "uz" }
    expect(buildMindMapCreate(state)).toEqual({ kind: "mind_map", options: { detail: "detailed", language: "uz" } })
  })

  it("flash cards", () => {
    const state: FlashcardsState = {
      ...(initialState("flashcards") as FlashcardsState),
      count: "more",
      difficulty: "hard",
      focus: "Dates only",
    }
    expect(buildFlashcardsCreate(state)).toEqual({
      kind: "flashcards",
      options: { count: "more", difficulty: "hard", mode: "auto" },
      prompt: "Dates only",
    })
  })

  it("quiz keeps the types in their canonical order", () => {
    const state: QuizState = {
      ...(initialState("quiz") as QuizState),
      count: "fewer",
      difficulty: "easy",
      types: ["true_false", "single"],
    }
    expect(buildQuizCreate(state)).toEqual({
      kind: "quiz",
      options: { count: "fewer", difficulty: "easy", mode: "auto", types: ["single", "true_false"] },
    })
  })

  it("data table clamps the rows between 10 and 40", () => {
    expect(buildDataTableCreate(tableState("30"))).toEqual({ kind: "data_table", options: { max_rows: 30 } })
    expect(clampRows("3")).toBe(10)
    expect(clampRows("500")).toBe(40)
    expect(clampRows("17.6")).toBe(18)
    expect(clampRows("")).toBe(25)
    expect(clampRows("abc")).toBe(25)
  })

  it("slides", () => {
    const state: SlidesState = {
      ...(initialState("slides") as SlidesState),
      format: "detailed",
      length: "long",
      language: "en",
    }
    expect(buildSlidesCreate(state)).toEqual({
      kind: "slides",
      options: { format: "detailed", length: "long", language: "en" },
    })
  })

  it("infographic", () => {
    const state: InfographicState = {
      ...(initialState("infographic") as InfographicState),
      orientation: "landscape",
      detail: "concise",
      style: "playful",
    }
    expect(buildInfographicCreate(state)).toEqual({
      kind: "infographic",
      options: { orientation: "landscape", detail: "concise", style: "playful" },
    })
  })
})

describe("formProblem", () => {
  it("requires a prompt for a custom report only", () => {
    expect(formProblem(report({ format: "custom", focus: "  " }))).toBe("focus-required")
    expect(formProblem(report({ format: "custom", focus: "Compare the stages" }))).toBeNull()
    expect(formProblem(report({ format: "briefing", focus: "" }))).toBeNull()
  })

  it("requires at least one quiz type", () => {
    expect(formProblem({ ...(initialState("quiz") as QuizState), types: [] })).toBe("types-required")
    expect(formProblem(initialState("quiz"))).toBeNull()
  })

  it("checks an exact count: flash cards 1 to 150, quiz questions 1 to 100", () => {
    const cards = (customCount: string): FlashcardsState => ({
      ...(initialState("flashcards") as FlashcardsState),
      count: "custom",
      customCount,
    })
    const quiz = (customCount: string): QuizState => ({
      ...(initialState("quiz") as QuizState),
      count: "custom",
      customCount,
    })

    expect(formProblem(cards(""))).toBe("count-invalid")
    expect(formProblem(cards("0"))).toBe("count-invalid")
    expect(formProblem(cards("151"))).toBe("count-invalid")
    expect(formProblem(cards("2.5"))).toBe("count-invalid")
    expect(formProblem(cards("1"))).toBeNull()
    expect(formProblem(cards("150"))).toBeNull()
    expect(formProblem(quiz("101"))).toBe("count-invalid")
    expect(formProblem(quiz("100"))).toBeNull()
    expect(formProblem(initialState("flashcards"))).toBeNull()
  })
})

describe("exact counts in the request", () => {
  it("a custom flash card count is sent as a number", () => {
    const state: FlashcardsState = {
      ...(initialState("flashcards") as FlashcardsState),
      count: "custom",
      customCount: " 42 ",
    }
    expect(buildFlashcardsCreate(state)).toEqual({
      kind: "flashcards",
      options: { count: 42, difficulty: "medium", mode: "auto" },
    })
  })

  it("a custom quiz count is sent as a number and a preset is still a word", () => {
    const custom: QuizState = { ...(initialState("quiz") as QuizState), count: "custom", customCount: "7" }
    expect(buildQuizCreate(custom)).toEqual({
      kind: "quiz",
      options: { count: 7, difficulty: "medium", mode: "auto", types: ["single", "multiple", "true_false"] },
    })
    expect(buildQuizCreate(initialState("quiz") as QuizState).options).toMatchObject({ count: "standard" })
  })
})

describe("the test type of a quiz and a flash-card set", () => {
  it("starts on Auto, which the server resolves from the sources", () => {
    expect(buildQuizCreate(initialState("quiz") as QuizState).options).toMatchObject({ mode: "auto" })
    expect(buildFlashcardsCreate(initialState("flashcards") as FlashcardsState).options).toMatchObject({ mode: "auto" })
  })

  it("sends the chosen test type as mode", () => {
    const quiz = { ...(initialState("quiz") as QuizState), mode: "reading_test" as const }
    const cards = { ...(initialState("flashcards") as FlashcardsState), mode: "formula_recall" as const }

    expect(buildQuizCreate(quiz).options).toMatchObject({ mode: "reading_test" })
    expect(buildFlashcardsCreate(cards).options).toMatchObject({ mode: "formula_recall" })
  })
})

describe("buildCreate: exercise", () => {
  it("sends the exam, skill, mode and difficulty, and the count only when typed", () => {
    const state = initialState("exercise")
    expect(buildCreate(state)).toEqual({
      kind: "exercise",
      options: { exam: "ielts_academic", skill: "reading", difficulty: "medium", mode: "auto" },
    })
    if (state.kind !== "exercise") throw new Error("not an exercise")
    expect(buildCreate({ ...state, skill: "writing", count: "5", language: "uz" })).toEqual({
      kind: "exercise",
      options: {
        exam: "ielts_academic",
        skill: "writing",
        difficulty: "medium",
        mode: "auto",
        count: 5,
        language: "uz",
      },
    })
    expect(formProblem({ ...state, count: "61" })).toBe("count-invalid")
    expect(formProblem({ ...state, count: "" })).toBeNull()
  })
})
