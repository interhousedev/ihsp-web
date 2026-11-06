import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MediaPage } from "../features/media/components/media-page"
import { readBody, renderLms } from "./helpers"

setDefaultTimeout(60_000)

const ROUTE = apiUrl("/v1/lms/media/redeem")

describe("media link page", () => {
  it("sends the token once and offers the file", async () => {
    let sent: unknown
    server.use(
      http.post(ROUTE, async ({ request }) => {
        sent = await readBody(request)
        return HttpResponse.json({ url: "https://s3.test/video", expires_in: 900, title: "Ohm's law", tier: "anon" })
      }),
    )
    renderLms(<MediaPage readToken={() => "secret-token"} />)
    expect(await screen.findByText("Ohm's law")).toBeInTheDocument()
    expect(sent).toEqual({ token: "secret-token" })
    expect(screen.getByRole("link", { name: "Open the file" })).toHaveAttribute("href", "https://s3.test/video")
  })

  it("shows only a neutral message on refusal", async () => {
    server.use(http.post(ROUTE, () => HttpResponse.json({ type: "lms/media-not-available" }, { status: 404 })))
    renderLms(<MediaPage readToken={() => "stale"} />)
    expect(await screen.findByText("This link is not available.")).toBeInTheDocument()
  })

  it("asks nothing without a token", async () => {
    renderLms(<MediaPage readToken={() => null} />)
    expect(await screen.findByText("This link is not available.")).toBeInTheDocument()
  })
})
