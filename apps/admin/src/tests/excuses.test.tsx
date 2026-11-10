/** Admin excuses panel: the list, the detail thread and the decision. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExcusesPage } from "../features/excuses/components/excuses-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("admin excuses (EXC-ADM)", () => {
  test("EXC-ADM-1: lists the pending excuses and switches to approved", async () => {
    const { user } = renderAdmin(<ExcusesPage />, { route: "/excuses/" })
    expect(await screen.findByRole("button", { name: /Brastilov Aleksey/ })).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Approved" }))
    await waitFor(() => expect(screen.getAllByText("Approved").length).toBeGreaterThan(1))
    expect(screen.queryByText("Pending", { selector: "span" })).toBeNull()
  })

  test("EXC-ADM-2: approving a pending excuse posts the decision", async () => {
    const calls: string[] = []
    server.use(
      http.post(apiUrl("/v1/admin/excuses/:id/approve"), ({ params }) => {
        calls.push(String(params.id))
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { user } = renderAdmin(<ExcusesPage />, { route: "/excuses/" })
    await user.click(await screen.findByRole("button", { name: /Brastilov Aleksey/ }))
    await user.click(await screen.findByRole("button", { name: "Approve" }))
    await user.click(await screen.findByRole("button", { name: "Confirm" }))
    await waitFor(() => expect(calls).toHaveLength(1))
  })
})
