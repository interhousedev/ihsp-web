// Librarian area and UniLibrary administration (docs/reference/study-library.md §§ 3.4, 3.6, 9.2 "Librarian area").
// One folder per screen; the app pages in `apps/library/src/app/manage/**` are thin wrappers around these exports.

export * from "./queue"
export * from "./reports"
export * from "./books"
export * from "./editor"
export * from "./topics"
export * from "./collections"
export * from "./stats"
export * from "./unilibrary"
export { ReasonDialog, type ReasonDialogProps } from "./shared/reason-dialog"
