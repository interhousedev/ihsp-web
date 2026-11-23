import type { ExamKind, ExamModule, ExamSection } from "@ihsp/api"
import { newQuestion, newTempId, type ExamBlock, type QuestionType } from "../../utils/content-ops"

/** Question types an exam module may ask (EXAM_QUESTION_TYPES of the backend). */
export const EXAM_QUESTION_TYPES: readonly QuestionType[] = ["single", "multiple", "number", "text", "free"]

export const EXAM_MAX_SECTIONS = 6
export const EXAM_MAX_MODULES = 4

export function newExamModule(title: string, minutes: number, type: QuestionType = "single"): ExamModule {
  return { id: newTempId(), title, time_limit_sec: minutes * 60, questions: [newQuestion(type)] }
}

export function newExamSection(title: string, modules: ExamModule[], adaptive = false): ExamSection {
  return { id: newTempId(), title, adaptive, modules }
}

/** Replace the structure with a preset; keeps the id, title, directions and reference sheet. */
export function applyPreset(block: ExamBlock, kind: ExamKind): ExamBlock {
  if (kind === "sat") {
    const adaptive = (title: string, minutes: number, type: QuestionType) =>
      newExamSection(
        title,
        [
          newExamModule("Module 1", minutes, type),
          newExamModule("Module 2 (harder)", minutes, type),
          newExamModule("Module 2 (easier)", minutes, type),
        ],
        true,
      )
    return {
      ...block,
      kind,
      calculator: "graphing",
      scaling: { min_score: 200, max_score: 800 },
      sections: [adaptive("Reading and Writing", 32, "single"), adaptive("Math", 35, "number")],
    }
  }
  if (kind === "ap") {
    return {
      ...block,
      kind,
      calculator: "scientific",
      scaling: { min_score: 1, max_score: 5 },
      sections: [
        newExamSection("Multiple choice", [newExamModule("Section I", 90, "single")]),
        newExamSection("Free response", [newExamModule("Section II", 90, "free")]),
      ],
    }
  }
  return {
    ...block,
    kind,
    sections:
      block.sections.length > 0 ? block.sections : [newExamSection("Section 1", [newExamModule("Module 1", 30)])],
  }
}
