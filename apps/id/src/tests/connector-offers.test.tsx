/** A7, MCP-B5: offers of new permissions and media links on the connectors page. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ConnectorsPage } from "@ihsp/features-core/id-account"
import { clickButton, findButton, LOGGED_IN, renderId, allowSlowTests } from "./helpers"

allowSlowTests()

const offer = {
  id: "11111111-1111-4111-8111-111111111111",
  release_id: "2026-11-mcp-1",
  server: "student",
  read_scopes: ["learning:read"],
  write_scopes: ["sync:run"],
  connector_names: ["Claude Desktop"],
  expires_at: "2030-01-01T10:00:00Z",
}

const grant = {
  id: "22222222-2222-4222-8222-222222222222",
  course_id: "33333333-3333-4333-8333-333333333333",
  step_id: "44444444-4444-4444-8444-444444444444",
  block_id: "vid",
  created_at: "2030-01-01T10:00:00Z",
  expires_at: "2030-01-01T15:00:00Z",
  revoked_at: null,
  redeem_count: 3,
}

function withOffer(answer: (grant: boolean) => void, result: string): void {
  let open = true
  server.use(
    http.get(apiUrl("/v1/id/me/connectors/offers"), () => HttpResponse.json(open ? [offer] : [])),
    http.post(apiUrl("/v1/id/me/connectors/offers/:id/decision"), async ({ request }) => {
      const body = (await request.json()) as { grant: boolean }
      answer(body.grant)
      open = false
      return HttpResponse.json({ result, connector_names: [] })
    }),
  )
}

describe("offers of new permissions", () => {
  test("accepting names the scopes, sends the decision and removes the offer", async () => {
    let sent = null as boolean | null
    withOffer((value) => (sent = value), "granted")
    renderId(<ConnectorsPage />, { route: "/connectors/", session: LOGGED_IN })

    expect(await screen.findByText("sync:run")).toBeInTheDocument()
    expect(screen.getByText("learning:read")).toBeInTheDocument()
    await clickButton("Accept")

    await waitFor(() => expect(sent).toBe(true))
    expect(await screen.findByText("Permissions added.")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument())
  })

  test("declining sends no grant", async () => {
    let sent = null as boolean | null
    withOffer((value) => (sent = value), "declined")
    renderId(<ConnectorsPage />, { route: "/connectors/", session: LOGGED_IN })

    await clickButton("Decline")

    await waitFor(() => expect(sent).toBe(false))
    expect(await screen.findByText("Permissions not added.")).toBeInTheDocument()
  })

  test("no offer shows no section", async () => {
    renderId(<ConnectorsPage />, { route: "/connectors/", session: LOGGED_IN })

    expect(await screen.findByText("Claude Desktop")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument()
  })
})

describe("media links", () => {
  test("a link can be stopped after a confirmation", async () => {
    let stopped = null as string | null
    server.use(
      http.get(apiUrl("/v1/lms/media/grants"), () => HttpResponse.json({ items: [grant] })),
      http.delete(apiUrl("/v1/lms/media/grants/:id"), ({ params }) => {
        stopped = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderId(<ConnectorsPage />, { route: "/connectors/", session: LOGGED_IN })

    await user.click(await findButton("Stop link"))
    expect(await screen.findByText("Stop this link?")).toBeInTheDocument()
    expect(stopped).toBeNull()
    await user.click((await screen.findAllByRole("button", { name: "Stop link", hidden: true })).at(-1) as HTMLElement)

    await waitFor(() => expect(stopped).toBe(grant.id))
  })
})
