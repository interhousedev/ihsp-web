import { describe, expect, it } from "bun:test"
import type { ReadingListEntry } from "@ihsp/api"
import {
  libIds,
  libListPhysics,
  libListSummerDraft,
  apiUrl,
  server,
  setLibraryActor,
  setUniLibrary,
  userMe,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import type { ReadingListCard } from "@ihsp/api"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { essentialProgress, groupByImportance, groupByWeek, hasWeekLabels } from "./reading-list-entries"
import { ReadingListPage, ReadingListsPage } from "./reading-list-pages"
import { movedWithinGroup } from "./reading-list-sortable"
import { ReadingListView } from "./reading-list-view"

allowSlowRenders()

const entries = libListPhysics.entries

describe("reading list grouping", () => {
  it("groups by importance in the fixed order and keeps the entry order", () => {
    const groups = groupByImportance(entries)

    expect(groups.map((group) => group.importance)).toEqual(["essential", "recommended", "further"])
    expect(groups[0]!.entries.map((entry) => entry.position)).toEqual([1, 2])
  })

  it("groups by week label in order of appearance, with unlabelled entries last", () => {
    const groups = groupByWeek(entries)

    expect(groups.map((group) => group.label)).toEqual(["Week 1", "Week 2", null])
    expect(hasWeekLabels(entries)).toBe(true)
    expect(hasWeekLabels(entries.map((entry) => ({ ...entry, week_label: null })))).toBe(false)
  })

  it("derives the progress on the essential entries from the read status", () => {
    expect(essentialProgress(entries)).toEqual({ done: 1, total: 2 })
    const none: ReadingListEntry[] = entries.map((entry) => ({ ...entry, read_state: null }))
    expect(essentialProgress(none)).toEqual({ done: 0, total: 2 })
  })
})

describe("ReadingListView", () => {
  it("shows the header, the progress on the essential entries and the entries by week", async () => {
    renderLibrary(<ReadingListView list={libListPhysics} />)

    expect(screen.getByRole("heading", { level: 1, name: libListPhysics.title })).toBeInTheDocument()
    expect(screen.getByText("1 of 2 essential entries read")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Week 1" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Week 2" })).toBeInTheDocument()
    const week1 = screen.getByRole("region", { name: "Week 1" })
    expect(within(week1).getAllByRole("listitem")).toHaveLength(2)
    expect(within(week1).getAllByText("Essential")).toHaveLength(2)
  })

  it("regroups by importance and shows a plain link as an external link", async () => {
    const { user } = renderLibrary(<ReadingListView list={libListPhysics} />)

    await user.click(screen.getByRole("button", { name: "Importance" }))

    expect(screen.getByRole("heading", { name: "Essential" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Recommended" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Further reading" })).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /Kinematics: worked examples/ })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("hides a UniLibrary entry while UniLibrary is off and shows it when on", async () => {
    const external = {
      ...entries[0]!,
      position: 9,
      item: {
        ...entries[0]!.item!,
        kind: "external" as const,
        title: "Only on UniLibrary",
        tag: { source: "unilibrary" as const, label: "UniLibrary" },
      },
    }
    const list = { ...libListPhysics, entries: [...entries, external] }

    const off = renderLibrary(<ReadingListView list={list} />)
    expect(screen.queryByText("Only on UniLibrary")).not.toBeInTheDocument()
    off.unmount()

    setUniLibrary({ enabled: true })
    renderLibrary(<ReadingListView list={list} />)
    expect(await screen.findByText("Only on UniLibrary")).toBeInTheDocument()
  })

  it("links the editor only when the list can be edited", () => {
    const { rerender } = renderLibrary(<ReadingListView list={libListPhysics} />)
    expect(screen.queryByRole("link", { name: "Edit list" })).not.toBeInTheDocument()

    rerender(<ReadingListView list={{ ...libListPhysics, can_edit: true }} />)
    expect(screen.getByRole("link", { name: "Edit list" })).toBeInTheDocument()
  })
})

describe("reading list pages", () => {
  it("loads a list by its id", async () => {
    renderLibrary(<ReadingListPage />, { route: `/lists/view/?id=${libIds.listPhysics}` })

    expect(await screen.findByRole("heading", { level: 1, name: libListPhysics.title })).toBeInTheDocument()
  })

  it("says 'not available' for an unknown list", async () => {
    renderLibrary(<ReadingListPage />, { route: "/lists/view/?id=nope" })

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })

  it("lists the reading lists of the student without a New list button", async () => {
    renderLibrary(<ReadingListsPage />, { route: "/lists/" })

    expect(await screen.findByRole("link", { name: libListPhysics.title })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "New list" })).not.toBeInTheDocument()
  })
})

const card = (id: string, sort_order: number, pinned = false): ReadingListCard => ({
  ...libListPhysics,
  id,
  title: id,
  pinned,
  sort_order,
})

describe("movedWithinGroup", () => {
  it("swaps neighbours in the same group and never crosses the pinned boundary", () => {
    const lists = [card("p", 1, true), card("a", 2), card("b", 3)]

    expect(movedWithinGroup(lists, "b", -1).map((l) => l.id)).toEqual(["p", "b", "a"])
    expect(movedWithinGroup(lists, "a", -1).map((l) => l.id)).toEqual(["p", "a", "b"])
    expect(movedWithinGroup(lists, "b", 1).map((l) => l.id)).toEqual(["p", "a", "b"])
  })
})

describe("reading lists: pin and order", () => {
  const librarian = { user: { ...userMe, roles: ["student" as const, "librarian" as const] } }
  const titles = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)

  it("shows a student the pin indicator, pinned lists first and no controls", async () => {
    server.use(
      http.get(apiUrl("/v1/library/reading-lists"), () =>
        HttpResponse.json([card("Later", 2), card("Pinned one", 5, true)]),
      ),
    )
    renderLibrary(<ReadingListsPage />, { route: "/lists/" })

    await screen.findByRole("link", { name: "Pinned one" })
    expect(titles()).toEqual(["Pinned one", "Later"])
    expect(screen.getByText("Pinned")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Pin / })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Move .* up/ })).not.toBeInTheDocument()
  })

  it("lets a librarian move a list up and saves the order", async () => {
    setLibraryActor("librarian")
    let sent: unknown = null
    server.use(
      http.put(apiUrl("/v1/library/reading-lists/order"), async ({ request }) => {
        sent = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderLibrary(<ReadingListsPage />, { route: "/lists/", session: librarian })

    await screen.findByRole("link", { name: libListSummerDraft.title })
    expect(titles()).toEqual([libListPhysics.title, libListSummerDraft.title])
    expect(screen.getByRole("button", { name: `Move ${libListPhysics.title} up` })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: `Move ${libListSummerDraft.title} up` }))

    await waitFor(() => expect(sent).toEqual({ ids: [libListSummerDraft.id, libListPhysics.id] }))
  })

  it("lets a librarian pin a list, which then comes first", async () => {
    setLibraryActor("librarian")
    const { user } = renderLibrary(<ReadingListsPage />, { route: "/lists/", session: librarian })

    await user.click(await screen.findByRole("button", { name: `Pin ${libListSummerDraft.title}` }))

    await waitFor(() => expect(titles()[0]).toBe(libListSummerDraft.title))
    expect(await screen.findByRole("button", { name: `Unpin ${libListSummerDraft.title}` })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })
})
