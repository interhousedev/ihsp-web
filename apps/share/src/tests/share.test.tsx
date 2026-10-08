/** SHR-1 to SHR-8 (viewer) and SL-9 (report): the public page behind `/ai/<slug>`. */
import { describe, expect, test } from "bun:test"
import { getConfig } from "@ihsp/config"
import { apiUrl, publicShareGoneSlug, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ShareViewer } from "../features/share/share-viewer"
import { slugFromPathname } from "../features/share/use-share-slug"
import { allowSlowTests, renderShare, shareRoute } from "./helpers"

allowSlowTests()

describe("slug from the path", () => {
  test("reads /ai/<slug>/ and ignores the static page and deeper paths", () => {
    expect(slugFromPathname("/ai/kq7x2m9a/")).toBe("kq7x2m9a")
    expect(slugFromPathname("/ai/kq7x2m9a")).toBe("kq7x2m9a")
    expect(slugFromPathname("/ai/view/")).toBeNull()
    expect(slugFromPathname("/ai/")).toBeNull()
    expect(slugFromPathname("/ai/a/b/")).toBeNull()
  })
})

describe("shared chat", () => {
  test("shows the title, author, the public banner, the messages and the notes of looked-up data", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })

    expect(await screen.findByRole("heading", { name: "Kinematics revision", hidden: true })).toBeInTheDocument()
    expect(screen.getByText(/Shared by Aleksey/)).toBeInTheDocument()
    expect(screen.getByText("Shared publicly")).toBeInTheDocument()
    expect(screen.getByText("Explain uniform motion")).toBeInTheDocument()
    expect(screen.getByText("Looked up your timetable")).toBeInTheDocument()
    expect(screen.getByText("Assistant")).toBeInTheDocument()
  })
})

describe("shared flash cards", () => {
  test("lists the cards and copies the set into the student app", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("zr5t8w1c") })

    expect(await screen.findByRole("heading", { name: "Physics: kinematics", hidden: true })).toBeInTheDocument()
    const copy = screen.getByRole("link", { name: "Copy to my sets", hidden: true })
    expect(copy.getAttribute("href")).toBe(`${getConfig().SP_URL}/flashcards/copy/?share=zr5t8w1c`)
  })

  test("studies in the browser: Show answer, rating keys, a finished screen", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("zr5t8w1c") })
    fireEvent.click(await screen.findByRole("button", { name: "Study", hidden: true }))

    const total = Number(/(\d+) cards/.exec(screen.getByText(/of \d+ cards/).textContent ?? "")?.[1])
    expect(total).toBeGreaterThan(0)
    for (let index = 0; index < total; index += 1) {
      fireEvent.keyDown(window, { key: " " })
      await screen.findByText("Back", { exact: true })
      fireEvent.keyDown(window, { key: "4" })
    }

    expect(await screen.findByRole("heading", { name: "Finished", hidden: true })).toBeInTheDocument()
    expect(screen.getByText(`You reviewed ${total} cards.`)).toBeInTheDocument()
  })
})

describe("states", () => {
  test("an unknown slug is 'Link not found'", async () => {
    renderShare(<ShareViewer />, { route: shareRoute("nope0000") })
    expect(await screen.findByText("Link not found")).toBeInTheDocument()
  })

  test("a removed link is 'This link was removed'", async () => {
    renderShare(<ShareViewer />, { route: shareRoute(publicShareGoneSlug) })
    expect(await screen.findByText("This link was removed")).toBeInTheDocument()
  })

  test("a server error offers a retry", async () => {
    server.use(http.get(apiUrl("/v1/public/shares/:slug"), () => new HttpResponse(null, { status: 500 })))
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    expect(await screen.findByRole("button", { name: /try again/i, hidden: true })).toBeInTheDocument()
  })
})

describe("report", () => {
  test("sends the slug, the reason and the comment", async () => {
    let body = null as { slug: string; reason: string; comment?: string } | null
    server.use(
      http.post(apiUrl("/v1/public/reports"), async ({ request }) => {
        body = (await request.json()) as typeof body
        return new HttpResponse(null, { status: 202 })
      }),
    )
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    fireEvent.click(await screen.findByRole("button", { name: "Report this link", hidden: true }))

    fireEvent.change(await screen.findByLabelText("Reason"), { target: { value: "phishing" } })
    fireEvent.change(screen.getByLabelText("Comment (optional)"), { target: { value: "Looks fake" } })
    fireEvent.click(screen.getByRole("button", { name: "Send report", hidden: true }))

    expect(await screen.findByText("Thank you. Administration will look at this link.")).toBeInTheDocument()
    await waitFor(() => expect(body).toEqual({ slug: "kq7x2m9a", reason: "phishing", comment: "Looks fake" }))
  })

  test("a rate-limited report shows the error", async () => {
    server.use(
      http.post(apiUrl("/v1/public/reports"), () =>
        HttpResponse.json(
          { type: "common/rate-limited", title: "Too many", status: 429, params: { retry_after: 60 } },
          { status: 429, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderShare(<ShareViewer />, { route: shareRoute("kq7x2m9a") })
    fireEvent.click(await screen.findByRole("button", { name: "Report this link", hidden: true }))
    fireEvent.click(await screen.findByRole("button", { name: "Send report", hidden: true }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })
})
