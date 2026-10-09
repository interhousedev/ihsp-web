// Test helpers for the notebooks components (not exported from the package).
import { mock, setDefaultTimeout } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { Locale, Messages } from "@ihsp/i18n"
import { mergeMessages } from "@ihsp/i18n"
import { nbIds, renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { ReactElement } from "react"
import { WorkspaceProvider, type WorkspaceActions } from "./workspace-context"

const MESSAGES_DIR = join(import.meta.dir, "../../../../apps/sp/messages")

/**
 * The notebooks messages of `apps/sp`: `notebooks.json` plus any `notebooks.<area>.json` next to it (tasks that run
 * in parallel add their own keys to a part file; the parts are merged into `notebooks.json` at the end).
 */
export function notebookMessages(locale: Locale = "en"): Messages {
  const dir = join(MESSAGES_DIR, locale)
  const files = readdirSync(dir)
    .filter((name) => /^notebooks(\..+)?\.json$/.test(name))
    .toSorted((a, b) => (a === "notebooks.json" ? -1 : b === "notebooks.json" ? 1 : a.localeCompare(b)))
  return files.reduce<Messages>(
    (merged, name) => mergeMessages(merged, JSON.parse(readFileSync(join(dir, name), "utf8")) as Messages),
    {},
  )
}

/** Large trees render slowly in a cold test run; call at the top of a test file. */
export function allowSlowRenders(): void {
  configure({ asyncUtilTimeout: 8000 })
  setDefaultTimeout(30_000)
}

export type RenderNotebookOptions = Omit<RenderWithProvidersOptions, "messages"> & {
  /** Override single workspace actions; the others are spies. */
  actions?: Partial<WorkspaceActions>
}

/**
 * `renderWithProviders` with the notebooks messages and a `WorkspaceProvider` whose actions are spies:
 * `const { actions } = renderNotebook(<X />); expect(actions.ask).toHaveBeenCalledWith(...)`.
 */
export function renderNotebook(ui: ReactElement, options: RenderNotebookOptions = {}) {
  const { actions: overrides, ...rest } = options
  const actions: WorkspaceActions = {
    notebookId: nbIds.notebook,
    openSource: mock(() => undefined),
    openArtifact: mock(() => undefined),
    closeViewer: mock(() => undefined),
    showTab: mock(() => undefined),
    ask: mock(() => undefined),
    openAddSources: mock(() => undefined),
    openNoteEditor: mock(() => undefined),
    ...overrides,
  }
  const result = renderWithProviders(<WorkspaceProvider value={actions}>{ui}</WorkspaceProvider>, {
    ...rest,
    messages: notebookMessages(rest.locale ?? "en"),
  })
  return Object.assign(result, { actions })
}
