import type { ArtifactCreate, ArtifactItem, ArtifactKind, NotebookDetail, NotebookUsage, ReportFormat } from "@ihsp/api"
import {
  IconBook2,
  IconBulb,
  IconCards,
  IconChecklist,
  IconFileText,
  IconLayoutDashboard,
  IconListDetails,
  IconListTree,
  IconPresentation,
  IconReportAnalytics,
  IconSitemap,
  IconTable,
  type Icon,
} from "@tabler/icons-react"

/** One button of the Studio tile grid. `conspect` is a report with its own tile; `report` opens the format picker. */
export type StudioTileId =
  | "mind_map"
  | "conspect"
  | "report"
  | "flashcards"
  | "quiz"
  | "data_table"
  | "slides"
  | "infographic"
  | "course_plan"
  | "lesson_draft"

export type StudioTile = {
  id: StudioTileId
  kind: ArtifactKind
  /** Set for the Conspect tile. */
  format?: ReportFormat
  /** Message key (under `notebooks.kind.`) of the tile label. */
  labelKey: string
  icon: Icon
  /** Phase of the feature (1 and 2 are built). */
  phase: 1 | 2
}

/** The tiles in grid order. There is no audio or video overview tile: those features are not offered. */
export const STUDIO_TILES: readonly StudioTile[] = [
  { id: "slides", kind: "slides", labelKey: "slides", icon: IconPresentation, phase: 2 },
  { id: "mind_map", kind: "mind_map", labelKey: "mind_map", icon: IconSitemap, phase: 1 },
  { id: "conspect", kind: "report", format: "conspect", labelKey: "conspect", icon: IconFileText, phase: 1 },
  { id: "report", kind: "report", labelKey: "report", icon: IconReportAnalytics, phase: 1 },
  { id: "flashcards", kind: "flashcards", labelKey: "flashcards", icon: IconCards, phase: 1 },
  { id: "quiz", kind: "quiz", labelKey: "quiz", icon: IconChecklist, phase: 1 },
  { id: "infographic", kind: "infographic", labelKey: "infographic", icon: IconLayoutDashboard, phase: 2 },
  { id: "data_table", kind: "data_table", labelKey: "data_table", icon: IconTable, phase: 1 },
]

/**
 * The tiles of a course workspace: the two course outputs first, then the quiz and the flash cards under their
 * course names ("Test questions" fills a test block, "Flash cards" a flash cards block of a step), then the rest.
 */
export const COURSE_STUDIO_TILES: readonly StudioTile[] = [
  { id: "course_plan", kind: "course_plan", labelKey: "course_plan", icon: IconListTree, phase: 2 },
  { id: "lesson_draft", kind: "lesson_draft", labelKey: "lesson_draft", icon: IconBook2, phase: 2 },
  { id: "quiz", kind: "quiz", labelKey: "course_quiz", icon: IconChecklist, phase: 1 },
  { id: "flashcards", kind: "flashcards", labelKey: "course_flashcards", icon: IconCards, phase: 1 },
  { id: "conspect", kind: "report", format: "conspect", labelKey: "conspect", icon: IconFileText, phase: 1 },
  { id: "mind_map", kind: "mind_map", labelKey: "mind_map", icon: IconSitemap, phase: 1 },
  { id: "slides", kind: "slides", labelKey: "slides", icon: IconPresentation, phase: 2 },
]

/** The tiles a notebook offers: the course set for the workspace of a course, the student set otherwise. */
export function studioTilesFor(notebook: Pick<NotebookDetail, "course_id">): readonly StudioTile[] {
  return notebook.course_id ? COURSE_STUDIO_TILES : STUDIO_TILES
}

/** Kinds whose output can be written into the course draft with "Apply". */
export const APPLICABLE_KINDS: readonly ArtifactKind[] = ["course_plan", "lesson_draft", "quiz", "flashcards"]

/** The request a tile sends with default options and an empty focus. */
export function defaultCreate(tile: Pick<StudioTile, "kind" | "format">): ArtifactCreate {
  switch (tile.kind) {
    case "report":
      return { kind: "report", options: { format: tile.format ?? "conspect", detail: "standard", style: "outline" } }
    case "mind_map":
      return { kind: "mind_map", options: { detail: "overview" } }
    case "flashcards":
      return { kind: "flashcards", options: { count: "standard", difficulty: "medium" } }
    case "quiz":
      return {
        kind: "quiz",
        options: { count: "standard", difficulty: "medium", types: ["single", "multiple", "true_false"] },
      }
    case "data_table":
      return { kind: "data_table", options: { max_rows: 25 } }
    case "slides":
      return { kind: "slides", options: { format: "presenter", length: "default" } }
    case "infographic":
      return { kind: "infographic", options: { orientation: "portrait", detail: "standard", style: "clean" } }
    case "course_plan":
      return { kind: "course_plan", options: { depth: "overview" } }
    case "lesson_draft":
      return { kind: "lesson_draft", options: { step_id: null, length: "standard" } }
  }
}

/** Icon of an artifact in lists (a conspect uses the document icon, other reports the analytics icon). */
export function artifactIcon(item: Pick<ArtifactItem, "kind" | "format">): Icon {
  if (item.kind === "report") return item.format === "conspect" ? IconFileText : IconReportAnalytics
  return STUDIO_TILES.find((tile) => tile.kind === item.kind)?.icon ?? IconBulb
}

/** Message key under `notebooks.kind.` for an artifact (`conspect` for a conspect, `report` for other reports). */
export function artifactKindKey(item: Pick<ArtifactItem, "kind" | "format">): string {
  return item.kind === "report" && item.format === "conspect" ? "conspect" : item.kind
}

/** Whether the artifact is still being produced (the list polls while this is true). */
export function isActive(item: Pick<ArtifactItem, "status">): boolean {
  return item.status === "queued" || item.status === "generating"
}

export const LIST_ICON = IconListDetails

/** Daily quota kinds the usage endpoint reports; every other kind counts against `artifacts` only. */
export function quotaKeyFor(kind: ArtifactKind): "artifacts" | "slides" | "infographic" {
  return kind === "slides" || kind === "infographic" ? kind : "artifacts"
}

/** True when the per-kind or the overall daily count of `kind` is used up. */
export function quotaReached(usage: NotebookUsage | undefined, kind: ArtifactKind): boolean {
  if (!usage) return false
  const overall = usage.quotas.artifacts
  const own = usage.quotas[quotaKeyFor(kind)]
  return overall.used >= overall.limit || own.used >= own.limit
}
