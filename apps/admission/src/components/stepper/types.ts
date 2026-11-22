import type { ReactNode } from "react"

export type StepValue = string | string[] | undefined
export type StepAnswers = Record<string, StepValue>

export type StepOption = {
  value: string
  label: string
  /** Decoration only (hidden from screen readers); the label carries the meaning. */
  emoji?: string
  /** A multi-choice chip that excludes the others (e.g. "Anywhere"): picking it clears them, picking another clears it. */
  exclusive?: boolean
  icon?: ReactNode
  /** A separate control shown beside a multi-choice chip (e.g. an info button); it does not toggle the chip. */
  info?: ReactNode
  description?: string
}

export type StepQuestionKind =
  /** One of several cards (radio). */
  | "single"
  /** A pair of cards, usually true / false (radio). */
  | "boolean"
  /** Several chips (checkbox). */
  | "multi"
  /** A dropdown for long option lists. */
  | "select"

export type StepQuestion = {
  id: string
  /** Groups the steps; shown as the eyebrow label and drives the segmented progress bar. */
  section: string
  sectionLabel: string
  title: string
  kind: StepQuestionKind
  options: StepOption[]
  placeholder?: string
  /** Next stays open without an answer (the guide invites leaving it open). */
  optional?: boolean
  /** A `select` shown as the searchable bottom sheet of the field pickers instead of a dropdown (long lists). */
  sheet?: boolean
  /** Helper text of the guide panel when no custom `renderGuide` is given. */
  guide?: string
}
