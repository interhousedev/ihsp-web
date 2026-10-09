import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { Locale } from "@ihsp/i18n"
import { notebookDetail } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { StudioPanel } from "./studio-panel"
import { UsageDialog } from "./usage-dialog"

allowSlowRenders()

const MESSAGES = join(import.meta.dir, "../../../../../apps/sp/messages")
const LOCALES: readonly Locale[] = ["en", "ru", "uz"]

type Tree = { [key: string]: string | Tree }

function load(locale: Locale): Tree {
  return JSON.parse(readFileSync(join(MESSAGES, locale, "notebooks.json"), "utf8")) as Tree
}

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
    if (typeof value === "string") return { ...flat, [`${prefix}${key}`]: value }
    return { ...flat, ...flatten(value, `${prefix}${key}.`) }
  }, {})
}

const RAW_KEY = /notebooks\.[a-z_]+\.[\w.]+/gi

/** A missing message renders as its key path (`notebooks.opt.x`) in tests: look in the text and in attributes. */
function rawKeys(): string[] {
  const attributes = [...document.body.querySelectorAll("[placeholder], [title], [aria-label]")].flatMap((element) =>
    ["placeholder", "title", "aria-label"].map((name) => element.getAttribute(name) ?? ""),
  )
  return [document.body.textContent ?? "", ...attributes].flatMap((text) => text.match(RAW_KEY) ?? [])
}

async function closeTopDialog(user: UserEvent): Promise<void> {
  await user.keyboard("{Escape}")
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
}

describe("Studio messages", () => {
  it("has the same keys in en, ru and uz", () => {
    const [en, ru, uz] = LOCALES.map((locale) => Object.keys(flatten(load(locale))).toSorted())
    expect(ru).toEqual(en)
    expect(uz).toEqual(en)
  })

  it("has every plural form in Russian and the ta form in Uzbek", () => {
    const ru = flatten(load("ru"))["notebooks.studio.itemSubtitle"] ?? ""
    for (const form of ["one", "few", "many", "other"]) expect(ru).toContain(`${form} {`)
    expect(flatten(load("uz"))["notebooks.studio.itemSubtitle"]).toContain("{count} ta manba")
  })

  for (const locale of LOCALES) {
    it(`renders every form, the picker and the usage dialog in ${locale} without a missing message`, async () => {
      const { user, unmount } = renderNotebook(<StudioPanel notebook={notebookDetail} />, { locale })
      await screen.findByRole("list", { name: /./ })
      const pencils = screen
        .getAllByRole("button")
        .filter((button) => button.querySelector(".tabler-icon-pencil") !== null)
      expect(pencils).toHaveLength(8)

      for (const pencil of pencils) {
        await user.click(pencil)
        await screen.findByRole("dialog")
        expect(rawKeys()).toEqual([])
        await closeTopDialog(user)
      }
      expect(rawKeys()).toEqual([])
      unmount()

      renderNotebook(<UsageDialog open onOpenChange={() => undefined} />, { locale })
      await waitFor(() => expect(screen.getAllByRole("progressbar").length).toBe(2))
      expect(rawKeys()).toEqual([])
    })
  }
})
