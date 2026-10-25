import type { AssessmentItem } from "@ihsp/api"

/** The name of a control: its control week when it has one, otherwise its kind (`other` is a quiz or similar). */
export type ControlKey = "midterm1" | "midterm2" | "midterm" | "final" | "other"

export function controlKeyOf(item: Pick<AssessmentItem, "control" | "kind">): ControlKey {
  if (item.control === "midterm_1") return "midterm1"
  if (item.control === "midterm_2") return "midterm2"
  if (item.control === "final") return "final"
  if (item.kind === "midterm") return "midterm"
  return item.kind === "final" ? "final" : "other"
}
