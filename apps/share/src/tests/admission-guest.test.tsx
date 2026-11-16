/** The guest page: the link token comes from the fragment only, and never reaches a URL. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { GuestViewer } from "../features/admission-guest/guest-viewer"
import { allowSlowTests, renderShare } from "./helpers"

allowSlowTests()

const view = {
  first_name: "Aziza",
  kind: "website",
  brief: "Please review my site",
  status: "accepted",
  scope: ["activities"],
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  activities: [{ position: "Captain", org: "Robotics club", description: "Led a team", kind: "club" }],
  responses: [],
}

/** The test router resets the URL on render, so the fragment is set just before the viewer mounts. */
function Seeded({ hash }: { hash: string }) {
  window.location.hash = hash
  return <GuestViewer />
}

function setup() {
  const urls: string[] = []
  const auth: Record<string, string | null> = {}
  server.use(
    http.post(apiUrl("/v1/public/admission/guest/session"), ({ request }) => {
      urls.push(request.url)
      auth.session = request.headers.get("authorization")
      return HttpResponse.json({ token: "gss_session", expires_at: view.expires_at })
    }),
    http.get(apiUrl("/v1/public/admission/guest"), ({ request }) => {
      urls.push(request.url)
      return HttpResponse.json(view)
    }),
    http.post(apiUrl("/v1/public/admission/guest/respond"), async ({ request }) => {
      urls.push(request.url)
      auth.respond = request.headers.get("authorization")
      return HttpResponse.json({ id: "r1", text: "ok", url: null, created_at: view.expires_at }, { status: 201 })
    }),
  )
  return { urls, auth }
}

describe("admission guest page", () => {
  test("exchanges the fragment token in a header, clears the fragment and keeps the URL token-free", async () => {
    const { urls, auth } = setup()
    renderShare(<Seeded hash="#gst_secret123" />, { route: "/ai/admission-guest/" })

    expect(await screen.findByText("Robotics club")).toBeInTheDocument()
    expect(auth.session).toBe("Bearer gst_secret123")
    expect(window.location.hash).toBe("")
    expect(urls.some((url) => url.includes("gst_secret123") || url.includes("?"))).toBe(false)

    fireEvent.change(screen.getByLabelText("Your reply"), { target: { value: "Looks good" } })
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(auth.respond).toBe("Bearer gss_session"))
  })

  test("a token in the query string is ignored", async () => {
    const { urls } = setup()
    renderShare(<GuestViewer />, { route: "/ai/admission-guest/?t=gst_inquery" })

    expect(await screen.findByText("This link is incomplete")).toBeInTheDocument()
    expect(urls).toEqual([])
  })
})
