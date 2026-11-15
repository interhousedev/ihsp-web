import { describe, expect, it } from "bun:test"
import { ApiError } from "@ihsp/api"
import { apiUrl, pendingLegalItem, renderWithProviders, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LegalGate } from "./legal-gate"

describe("LegalGate", () => {
  it("renders nothing when nothing is pending", async () => {
    const { queryClient } = renderWithProviders(<LegalGate />)
    await waitFor(() => expect(queryClient.getQueryData(["legal", "pending"])).toBeDefined())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("blocks with the pending document, ignores Escape and closes after accepting", async () => {
    let accepted: unknown = null
    server.use(
      http.get(apiUrl("/v1/me/legal/pending"), () => HttpResponse.json({ items: [pendingLegalItem("privacy")] })),
      http.post(apiUrl("/v1/me/legal/accept"), async ({ request }) => {
        accepted = await request.json()
        return HttpResponse.json({ items: [] })
      }),
    )
    const { user } = renderWithProviders(<LegalGate />)

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Document privacy")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Accept and continue" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(accepted).toEqual({ items: [{ kind: "privacy", version: 2 }] })
  })

  it("shows the gate when any request is refused for missing consent", async () => {
    const { queryClient } = renderWithProviders(<LegalGate />)
    await waitFor(() => expect(queryClient.getQueryData(["legal", "pending"])).toBeDefined())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    server.use(
      http.get(apiUrl("/v1/me/legal/pending"), () => HttpResponse.json({ items: [pendingLegalItem("privacy")] })),
    )
    const refused = new ApiError({ type: "legal/acceptance-required", status: 403, title: "Forbidden" })
    await queryClient
      .fetchQuery({
        queryKey: ["notes"],
        queryFn: () => {
          throw refused
        },
        retry: false,
      })
      .catch(() => undefined)

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
