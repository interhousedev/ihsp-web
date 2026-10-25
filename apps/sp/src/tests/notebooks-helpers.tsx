import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import type { RenderWithProvidersOptions, RenderWithProvidersResult } from "@ihsp/test-utils"
import type { ReactElement } from "react"
import en from "../../messages/en.json"
import { renderSp } from "./helpers"

const EN_DIR = join(import.meta.dir, "../../messages/en")

/** `notebooks.json` plus every `notebooks.<area>.json` next to it (parts that are merged into one file at the end). */
function notebooksMessages(): Messages {
  const files = readdirSync(EN_DIR)
    .filter((name) => /^notebooks(\..+)?\.json$/.test(name))
    .toSorted((a, b) => (a === "notebooks.json" ? -1 : b === "notebooks.json" ? 1 : a.localeCompare(b)))
  return files.reduce<Messages>(
    (merged, name) => mergeMessages(merged, JSON.parse(readFileSync(join(EN_DIR, name), "utf8")) as Messages),
    {},
  )
}

const messages = mergeMessages(en as Messages, notebooksMessages())

/** `renderSp` with the English notebook texts on top of the app's own (the app loads them from `en/notebooks.json`). */
export function renderNotebooksSp(
  ui: ReactElement,
  options: Omit<RenderWithProvidersOptions, "messages"> = {},
): RenderWithProvidersResult {
  return renderSp(ui, { ...options, messages })
}
