import type { SourceInput, SourceItem } from "@ihsp/api"
import type { AddSelection } from "./use-add-selection"
import type { NotebookUploader } from "./use-upload-to-notebook"

/** One thing the student ticked or typed, waiting for the footer button. `label` names it in rejection messages. */
export type PendingItem = { key: string; input: SourceInput; label: string }

export type AddTab = "files" | "chats" | "lessons" | "flashcards" | "courses" | "course_steps" | "text" | "link"

export const ADD_TABS: readonly AddTab[] = ["files", "chats", "lessons", "flashcards", "courses", "text", "link"]

/** The tabs of a course workspace: the student pickers (chats, lessons, cards, enrolled courses) make no sense there. */
export const COURSE_ADD_TABS: readonly AddTab[] = ["files", "course_steps", "text", "link"]

/** What every picking tab gets from the dialog. */
export type PickTabProps = {
  /** The notebook's current sources (to disable what is already added). */
  sources: readonly SourceItem[]
  selection: AddSelection
  /** The selection cannot grow any more (20 per request, or the notebook is full). */
  full: boolean
}

export type FilesTabProps = PickTabProps & { uploader: NotebookUploader }
