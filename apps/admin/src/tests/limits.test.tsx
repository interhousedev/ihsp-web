/** Limits & usage (admin): the cost cards and charts, the editor (a saved limit) and the user extensions. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { http } from "msw"
import { LimitsPage } from "../features/limits/components/limits-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("limits and usage", () => {
  test("shows the cost cards, the charts, the top users and the limits in force", async () => {
    renderAdmin(<LimitsPage />, { route: "/limits/" })

    expect(await screen.findByText("Cost this month")).toBeInTheDocument()
    expect(await screen.findByText("Daily cost by feature")).toBeInTheDocument()
    expect(screen.getByText("Cost by model")).toBeInTheDocument()
    expect(screen.getByText("Cost by role")).toBeInTheDocument()
    expect(screen.getByText("Aziza Karimova")).toBeInTheDocument()
    expect(screen.getByLabelText("Assistant tokens per day")).toHaveValue("600000")
  })

  test("saving a changed limit sends only that limit", async () => {
    const sent: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/admin/ai/limits"), async ({ request }) => {
        sent.push(await request.clone().json())
        return undefined
      }),
    )
    renderAdmin(<LimitsPage />, { route: "/limits/" })

    setValue(await screen.findByLabelText("Notebook questions per minute"), "25")
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitUntil(() => sent.length === 1)
    expect(sent[0]).toEqual({ limits: { nb_chat_per_minute: 25 } })
  })

  test("a student extension is added for a found student and sent with its multiplier", async () => {
    const sent: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/admin/ai/limit-extensions/:user_id"), async ({ request }) => {
        sent.push(await request.clone().json())
        return undefined
      }),
    )
    renderAdmin(<LimitsPage />, { route: "/limits/" })

    fireEvent.click(await screen.findByRole("button", { name: "Add extension" }))
    setValue(await screen.findByLabelText("Name or login (2+ letters)"), "Aziz")
    fireEvent.click(await screen.findByRole("button", { name: /Aziza Karimova/ }))
    fireEvent.click(screen.getByRole("button", { name: "Save extension" }))

    await waitUntil(() => sent.length === 1)
    expect(sent[0]).toEqual({ multiplier: 2, values: {}, expires_on: null, note: "" })
  })
})
