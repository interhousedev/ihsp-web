import { describe, expect, test } from "bun:test"
import type { BotCreate, BotPatch } from "@ihsp/api"
import { http, HttpResponse } from "msw"
import { renderWithProviders, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import adminMessages from "../../../../messages/en.json"
import { BotsPage } from "./bots-page"

function card(name: string): HTMLElement {
  const title = screen.getByText(name)
  const root = title.closest("[data-slot='card']")
  if (!(root instanceof HTMLElement)) throw new Error(`no card for ${name}`)
  return root
}

describe("BOTS page", () => {
  test("lists the bots with the token mask and locks the main bot on", async () => {
    renderWithProviders(<BotsPage />, { messages: adminMessages })

    expect(await screen.findByText("Main bot")).toBeInTheDocument()
    expect(screen.getByText("…a1b2")).toBeInTheDocument()
    expect(screen.getByText("…zz99")).toBeInTheDocument()
    expect(within(card("Main bot")).getByRole("switch")).toHaveAttribute("aria-disabled", "true")
    expect(within(card("News bot")).getByRole("switch")).not.toHaveAttribute("aria-disabled", "true")
  })

  test("saves feature switches as one partial features patch with a step-up code", async () => {
    const bodies: BotPatch[] = []
    server.use(
      http.patch("*/v1/admin/bots/:id", async ({ request }) => {
        bodies.push((await request.json()) as BotPatch)
        return HttpResponse.json({})
      }),
    )
    const { user } = renderWithProviders(<BotsPage />, { messages: adminMessages })

    await screen.findByText("News bot")
    const news = card("News bot")
    expect(within(news).queryByRole("button", { name: "Save changes" })).toBeNull()
    await user.click(within(news).getByRole("checkbox", { name: "Assistant for guests" }))
    expect(bodies).toEqual([])
    const save = within(news).getByRole("button", { name: "Save changes" })
    expect(save).toBeDisabled()
    await user.type(within(news).getByLabelText("Confirmation code"), "123456")
    await user.click(save)

    expect(bodies).toEqual([{ features: { open_ai_agent: true }, otp_code: "123456" }])
  })

  test("offers only enabled bots with announcements for an announcement", async () => {
    renderWithProviders(<BotsPage />, { messages: adminMessages })

    await screen.findByText("Main bot")
    const fieldset = screen.getByRole("group", { name: "Bots" })
    expect(
      within(fieldset)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent),
    ).toEqual(["Main bot (@main_test_bot)", "News bot (@news_test_bot)"])
  })

  test("adds a bot only with a step-up code and sends it", async () => {
    const bodies: BotCreate[] = []
    server.use(
      http.post("*/v1/admin/bots", async ({ request }) => {
        bodies.push((await request.json()) as BotCreate)
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(<BotsPage />, { messages: adminMessages })

    await screen.findByText("Main bot")
    await user.type(screen.getByLabelText(/^Name/), "Extra")
    await user.type(screen.getByLabelText(/^Token from/), "123456789:ABCDEFGHIJKLMNOPQRST")
    const submit = screen.getByRole("button", { name: "Add" })
    expect(submit).toBeDisabled()
    const [addCode] = screen.getAllByLabelText("Confirmation code")
    if (!addCode) throw new Error("no code input")
    await user.type(addCode, "123456")
    await user.click(submit)

    expect(bodies).toEqual([{ name: "Extra", token: "123456789:ABCDEFGHIJKLMNOPQRST", otp_code: "123456" }])
  })
})
