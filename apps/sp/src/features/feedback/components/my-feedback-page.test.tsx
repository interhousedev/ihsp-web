import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, renderWithProviders, server } from "@ihsp/test-utils"
import { configure, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MyFeedbackPage } from "./my-feedback-page"

configure({ asyncUtilTimeout: 8000 })
setDefaultTimeout(30_000)

describe("MyFeedbackPage", () => {
  it("lists my reports with their status, kind and section", async () => {
    renderWithProviders(<MyFeedbackPage />, { route: "/feedback/" })

    expect(await screen.findByRole("heading", { name: "Расписание не открывается" })).toBeInTheDocument()
    const first = screen.getByRole("heading", { name: "Расписание не открывается" }).closest("article")
    expect(within(first as HTMLElement).getByText("In review")).toBeInTheDocument()
    expect(within(first as HTMLElement).getByText("Problem")).toBeInTheDocument()
    expect(within(first as HTMLElement).getByText("my.iht")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Экспорт блокнота в PDF" })).toBeInTheDocument()
  })

  it("opens a report with the administrators' responses, text and images", async () => {
    server.use(
      http.get(apiUrl("/v1/files/:id/url"), ({ params }) =>
        HttpResponse.json({ url: `https://storage.test/${String(params.id)}`, expires_at: "2026-10-25T12:00:00Z" }),
      ),
    )
    const { user } = renderWithProviders(<MyFeedbackPage />, { route: "/feedback/" })
    await screen.findByRole("heading", { name: "Расписание не открывается" })

    await user.click(screen.getAllByRole("button", { name: "Show responses" })[0] as HTMLElement)

    expect(
      await screen.findByText("Спасибо, проблему воспроизвели. Исправим в следующем обновлении."),
    ).toBeInTheDocument()
    expect(await screen.findByRole("img", { name: "fix.png" })).toBeInTheDocument()
  })

  it("says that no response exists yet for a report nobody answered", async () => {
    renderWithProviders(<MyFeedbackPage />, { route: "/feedback/" })

    expect(await screen.findByText("No response yet.")).toBeInTheDocument()
  })

  it("explains when nothing was sent yet", async () => {
    server.use(http.get(apiUrl("/v1/feedback/mine"), () => HttpResponse.json({ items: [] })))
    renderWithProviders(<MyFeedbackPage />, { route: "/feedback/" })

    expect(await screen.findByText("You have not sent any feedback yet.")).toBeInTheDocument()
  })
})
