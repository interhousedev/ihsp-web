/** Delete group: the confirm button waits for the typed name; success toasts and returns to the list; errors show. */
import type { UserEvent } from "@testing-library/user-event"
import { describe, expect, spyOn, test } from "bun:test"
import { apiUrl, ids, problem, selectDropdownValue, server, testRouter } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { GroupDetailPage } from "../features/groups/components/group-detail-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

const GROUP = `/groups/view/?id=${ids.group2TN2}`

async function openDialog(user: UserEvent) {
  await screen.findByRole("heading", { name: "2TN2" })
  await user.click(screen.getByRole("button", { name: "Delete group" }))
  return screen.findByRole("alertdialog")
}

describe("group page: delete group", () => {
  test("the dialog says students are kept and the confirm button needs the typed name", async () => {
    const calls: string[] = []
    server.use(
      http.delete(apiUrl("/v1/admin/groups/:id"), ({ params }) => {
        calls.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    const dialog = await openDialog(user)

    expect(dialog.textContent).toContain("Its students are not deleted")
    const confirm = screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement
    expect(confirm).toBeDisabled()

    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN")
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(calls).toEqual([])

    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    expect(confirm).toBeEnabled()
  })

  test("confirming deletes the group, toasts and goes back to the list", async () => {
    const calls: string[] = []
    server.use(
      http.delete(apiUrl("/v1/admin/groups/:id"), ({ params }) => {
        calls.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const success = spyOn(toast, "success")
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    await openDialog(user)
    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    await user.click(screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement)

    await waitUntil(() => testRouter.push.mock.calls.length > 0, "no redirect")
    expect(calls).toEqual([ids.group2TN2])
    expect(success).toHaveBeenCalledWith("Group 2TN2 deleted")
    expect(testRouter.push).toHaveBeenCalledWith("/groups/")
  })

  test("a problem+json error is shown in the dialog and the page stays", async () => {
    server.use(http.delete(apiUrl("/v1/admin/groups/:id"), () => problem(409, "common/conflict", "Group is in use")))
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    const dialog = await openDialog(user)
    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    await user.click(screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(dialog).toBeInTheDocument()
  })

  test("a double click on confirm sends one DELETE", async () => {
    let calls = 0
    server.use(
      http.delete(apiUrl("/v1/admin/groups/:id"), async () => {
        calls += 1
        await new Promise((resolve) => setTimeout(resolve, 50))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    await openDialog(user)
    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    await user.dblClick(screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement)

    await waitUntil(() => testRouter.push.mock.calls.length > 0, "no redirect")
    expect(calls).toBe(1)
  })

  test("after a 404 focus stays in the dialog and closing leads to the list", async () => {
    server.use(http.delete(apiUrl("/v1/admin/groups/:id"), () => problem(404, "common/not-found", "Group not found")))
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    const dialog = await openDialog(user)
    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    await user.click(screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement)

    const alert = await screen.findByRole("alert")
    await waitUntil(() => dialog.contains(document.activeElement), "focus left the dialog")
    expect(alert).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Keep group" }))
    await waitUntil(() => testRouter.push.mock.calls.length > 0, "no redirect")
    expect(testRouter.push).toHaveBeenCalledWith("/groups/")
  })

  test("the move switch needs a target group and sends it with the delete", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.delete(apiUrl("/v1/admin/groups/:id"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("move_students_to"))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const success = spyOn(toast, "success")
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    await openDialog(user)
    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    const confirm = screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement
    expect(confirm).toBeEnabled()

    await user.click(screen.getByRole("switch", { name: "Move all students to another group" }))
    expect(confirm).toBeDisabled()
    await selectDropdownValue(user, await screen.findByLabelText("Target group"), ids.group1TN1)
    expect(confirm).toBeEnabled()
    await user.click(confirm)

    await waitUntil(() => seen.length > 0, "no delete request")
    expect(seen).toEqual([ids.group1TN1])
    await waitUntil(() => success.mock.calls.length > 0, "no toast")
    expect(String(success.mock.calls[0]?.[0])).toContain("students moved to")
  })

  test("without the switch no target is sent", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.delete(apiUrl("/v1/admin/groups/:id"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("move_students_to"))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<GroupDetailPage />, { route: GROUP })
    await openDialog(user)
    setValue(screen.getByLabelText(/Type the group name 2TN2/), "2TN2")
    await user.click(screen.getAllByRole("button", { name: "Delete group" }).at(-1) as HTMLElement)

    await waitUntil(() => seen.length > 0, "no delete request")
    expect(seen).toEqual([null])
  })
})
