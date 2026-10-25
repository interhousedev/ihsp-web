import type {
  ArtifactItem,
  CoursePlanOptions,
  DataTableOptions,
  ExerciseOptions,
  FlashcardsOptions,
  InfographicOptions,
  LessonDraftOptions,
  MindMapOptions,
  QuizOptions,
  ReportOptions,
  SlidesOptions,
} from "@ihsp/api"

/** One readable line of "View prompt": a label and either message keys of the values or plain text. */
export type OptionLine = {
  /** Message key under `notebooks.` */
  labelKey: string
  /** Message keys under `notebooks.`, joined with a comma. */
  valueKeys?: string[]
  /** Text that is shown as it is (a number). */
  text?: string
}

function line(labelKey: string, group: string, value: string | number | undefined): OptionLine[] {
  if (value === undefined) return []
  if (typeof value === "number") return [{ labelKey, text: String(value) }]
  return [{ labelKey, valueKeys: [`opt.${group}.${value}`] }]
}

function kindLines(item: ArtifactItem): OptionLine[] {
  switch (item.kind) {
    case "report": {
      const options = item.options as ReportOptions
      return [...line("opt.detail.label", "detail", options.detail), ...line("opt.style.label", "style", options.style)]
    }
    case "mind_map":
      return line("opt.detail.label", "mapDetail", (item.options as MindMapOptions).detail)
    case "flashcards": {
      const options = item.options as FlashcardsOptions
      return [
        ...line("opt.mode.label", "mode", options.mode),
        ...line("opt.count.label", "count", options.count),
        ...line("opt.difficulty.label", "difficulty", options.difficulty),
      ]
    }
    case "quiz": {
      const options = item.options as QuizOptions
      return [
        ...line("opt.mode.label", "mode", options.mode),
        ...line("opt.count.label", "count", options.count),
        ...line("opt.difficulty.label", "difficulty", options.difficulty),
        ...(options.types && options.types.length > 0
          ? [
              {
                labelKey: "opt.types.label",
                valueKeys: options.types.map((type) => `opt.types.${type}`),
              },
            ]
          : []),
      ]
    }
    case "data_table": {
      const rows = (item.options as DataTableOptions).max_rows
      return rows === undefined ? [] : [{ labelKey: "opt.maxRows.label", text: String(rows) }]
    }
    case "slides": {
      const options = item.options as SlidesOptions
      return [
        ...line("opt.slidesFormat.label", "slidesFormat", options.format),
        ...line("opt.length.label", "length", options.length),
      ]
    }
    case "infographic": {
      const options = item.options as InfographicOptions
      return [
        ...line("opt.orientation.label", "orientation", options.orientation),
        ...line("opt.detail.label", "infoDetail", options.detail),
        ...line("opt.style.label", "infoStyle", options.style),
      ]
    }
    case "exercise": {
      const options = item.options as ExerciseOptions
      return [
        ...line("opt.exam.label", "exam", options.exam),
        ...line("opt.skill.label", "skill", options.skill),
        ...line("opt.exerciseMode.label", "exerciseMode", options.mode),
        ...line("opt.count.label", "count", options.count ?? undefined),
        ...line("opt.difficulty.label", "difficulty", options.difficulty),
      ]
    }
    case "course_plan": {
      const options = item.options as CoursePlanOptions
      return [
        ...line("opt.planDepth.label", "planDepth", options.depth),
        ...(options.sections_hint === undefined
          ? []
          : [
              {
                labelKey: "opt.sectionsHint.label",
                text: String(options.sections_hint),
              },
            ]),
      ]
    }
    case "lesson_draft": {
      const options = item.options as LessonDraftOptions
      return [
        ...line("opt.lessonLength.label", "lessonLength", options.length),
        ...(options.include_test ? [{ labelKey: "opt.includeTest.label", valueKeys: ["opt.yes"] }] : []),
        ...(options.include_flashcards ? [{ labelKey: "opt.includeCards.label", valueKeys: ["opt.yes"] }] : []),
      ]
    }
  }
}

/**
 * The options an artifact was created with, as readable lines for the "View prompt" dialog: the per-kind options and
 * the language. The system prompt is never shown, only what the student chose.
 */
export function optionLines(item: ArtifactItem): OptionLine[] {
  const language = (item.options as { language?: string }).language
  return [
    ...kindLines(item),
    language
      ? { labelKey: "opt.language", valueKeys: [`opt.lang.${language}`] }
      : { labelKey: "opt.language", valueKeys: ["opt.languageAuto"] },
  ]
}
