/** The Curriculum tab of the group page: the curriculum stored from EMIS and the "Sync from EMIS" button. */
import { describe, expect, spyOn, test } from "bun:test"
import type { CurriculumView } from "@ihsp/api"
import { apiUrl, curriculumView, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { GroupDetailPage } from "../features/groups/components/group-detail-page"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

const GROUP = `/groups/view/?id=${ids.group2TN2}`
const CURRICULUM_URL = `/v1/admin/groups/${ids.group2TN2}/curriculum`
const SYNC_URL = `${CURRICULUM_URL}/sync`

/** A request that stays open until `release()` is called. */
function gate() {
  const handle: { release: () => void } = { release: () => undefined }
  const open = new Promise<void>((resolve) => {
    handle.release = resolve
  })
  return { open, release: () => handle.release() }
}

const refreshed: CurriculumView = { ...curriculumView, name: "ТН, МТН, БТН 2025-2027 (обновлён)" }

describe("group page: Curriculum tab", () => {
  test("Overview is the default tab; the Curriculum tab shows the stored curriculum with a subject table", async () => {
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    await screen.findByRole("heading", { name: "2TN2" })

    expect(screen.getByRole("tab", { name: "Overview", selected: true })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Save subgroups/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sync from EMIS" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Curriculum" }))

    const heading = await screen.findByRole("heading", { name: "Curriculum" })
    const card = within(heading.closest("[data-slot=card]") as HTMLElement)
    expect(card.getByText(/ТН, МТН, БТН 2025-2027/)).toBeInTheDocument()
    expect(card.getByText(/EMIS 5021/)).toBeInTheDocument()
    expect(card.getByText("Semester 3")).toBeInTheDocument()
    expect(card.getByText("Final exam: mathematics")).toBeInTheDocument()
    const tables = card.getAllByRole("table")
    expect(tables).toHaveLength(2)
    const physics = within(tables[1] as HTMLElement).getByRole("row", { name: /^Fizika/ })
    expect(
      within(physics)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Fizika", "In-depth", "102", "68", "34", "Yes"])
    expect(screen.getByRole("button", { name: "Sync from EMIS" })).toBeEnabled()
    expect(screen.queryByRole("button", { name: /Save subgroups/ })).not.toBeInTheDocument()
  })

  test("?tab=curriculum opens the tab directly", async () => {
    renderAdmin(<GroupDetailPage />, { route: `${GROUP}&tab=curriculum` })

    expect(await screen.findByRole("heading", { name: "Curriculum" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Curriculum", selected: true })).toBeInTheDocument()
  })

  test("a group without a stored curriculum says so and points to the sync button", async () => {
    renderAdmin(<GroupDetailPage />, { route: `/groups/view/?id=${ids.group1TN1}&tab=curriculum` })

    expect(
      await screen.findByText("No curriculum is stored for this group yet. Use “Sync from EMIS” to load it."),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sync from EMIS" })).toBeEnabled()
  })

  test("Sync from EMIS: disabled while the request runs, then the result and the refreshed curriculum", async () => {
    const hold = gate()
    let reads = 0
    let synced = false
    let body: unknown
    server.use(
      http.get(apiUrl(CURRICULUM_URL), () => {
        reads += 1
        return HttpResponse.json(synced ? refreshed : curriculumView)
      }),
      http.post(apiUrl(SYNC_URL), async ({ request }) => {
        body = await request.json()
        await hold.open
        synced = true
        return HttpResponse.json({ status: "synced", curriculum: refreshed })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: `${GROUP}&tab=curriculum` })
    const button = await screen.findByRole("button", { name: "Sync from EMIS" })
    await screen.findByText(/ТН, МТН, БТН 2025-2027/)
    expect(reads).toBe(1)

    await user.click(button)

    await waitUntil(() => (button as HTMLButtonElement).disabled, "the button stays enabled while syncing")
    expect(screen.getByText("Loading the curriculum from EMIS…")).toBeInTheDocument()
    await user.click(button)
    hold.release()

    expect(await screen.findByText("The curriculum was updated from EMIS.")).toBeInTheDocument()
    expect(await screen.findByText(/\(обновлён\)/)).toBeInTheDocument()
    expect(reads).toBe(2)
    expect(body).toEqual({})
    expect(screen.queryByText("Loading the curriculum from EMIS…")).not.toBeInTheDocument()
    await waitUntil(() => !(button as HTMLButtonElement).disabled, "the button stays disabled")
  })

  test("Sync from EMIS: a group without a usable EMIS login shows the 409 message and keeps what is stored", async () => {
    const error = spyOn(toast, "error").mockImplementation(() => "")
    try {
      const { user } = renderAdmin(<GroupDetailPage />, { route: `/groups/view/?id=${ids.group1TN1}&tab=curriculum` })
      await screen.findByText(/No curriculum is stored/)

      await user.click(screen.getByRole("button", { name: "Sync from EMIS" }))

      await waitUntil(() => error.mock.calls.length > 0, "no error shown")
      expect(error).toHaveBeenCalledWith("No student of this group has a working EMIS login yet.")
      expect(screen.queryByText("The curriculum was updated from EMIS.")).not.toBeInTheDocument()
      expect(screen.getByText(/No curriculum is stored/)).toBeInTheDocument()
    } finally {
      error.mockRestore()
    }
  })

  test("a failed sync re-enables the button and shows no success message", async () => {
    server.use(http.post(apiUrl(SYNC_URL), () => HttpResponse.json({ title: "boom" }, { status: 500 })))
    const { user } = renderAdmin(<GroupDetailPage />, { route: `${GROUP}&tab=curriculum` })
    const button = await screen.findByRole("button", { name: "Sync from EMIS" })

    await user.click(button)

    await waitUntil(
      () => !(button as HTMLButtonElement).disabled && !screen.queryByText("Loading the curriculum from EMIS…"),
    )
    expect(screen.queryByText("The curriculum was updated from EMIS.")).not.toBeInTheDocument()
  })

  test("the stored curriculum is shown as it is: no automatic refresh", async () => {
    let reads = 0
    server.use(
      http.get(apiUrl(CURRICULUM_URL), () => {
        reads += 1
        return HttpResponse.json(curriculumView)
      }),
    )
    renderAdmin(<GroupDetailPage />, { route: `${GROUP}&tab=curriculum` })
    await screen.findByText(/ТН, МТН, БТН 2025-2027/)
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(reads).toBe(1)
  })
})
