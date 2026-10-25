/** WEB-6, UF-WEB-04: the private calendar feed link. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CalendarFeedDialog } from "../features/calendar-feed/components/calendar-feed-dialog"
import { CalendarFeedPanel } from "../features/calendar-feed/components/calendar-feed-panel"
import { googleCalendarUrl, webcalUrl } from "../features/calendar-feed/utils/feed-links"
import { configureTests, renderSp } from "./helpers"

configureTests()

/** Answers `POST /v1/me/calendar-token` with a new link each time and records the request bodies. */
function recordTokens(): string[] {
  const bodies: string[] = []
  server.use(
    http.post(apiUrl("/v1/me/calendar-token"), async ({ request }) => {
      bodies.push(await request.text())
      return HttpResponse.json({ url: `https://ihsp.test/ical/token-${bodies.length}.ics` })
    }),
  )
  return bodies
}

describe("feed links", () => {
  test("webcal replaces the scheme", () => {
    expect(webcalUrl("https://h/ical/x.ics")).toBe("webcal://h/ical/x.ics")
    expect(webcalUrl("http://h/x.ics")).toBe("webcal://h/x.ics")
  })

  test("the Google link carries the encoded webcal url", () => {
    expect(googleCalendarUrl("https://h/ical/x.ics")).toBe(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent("webcal://h/ical/x.ics")}`,
    )
  })
})

describe("calendar feed panel", () => {
  test("creates a link and shows it with the calendar app links", async () => {
    const bodies = recordTokens()
    const { user } = renderSp(<CalendarFeedPanel />)

    await user.click(screen.getByRole("button", { name: "Create link" }))

    const input = await screen.findByLabelText("Calendar feed link")
    expect(input).toHaveValue("https://ihsp.test/ical/token-1.ics")
    expect(bodies).toHaveLength(1)
    expect(screen.getByRole("link", { name: "Add to Apple Calendar" })).toHaveAttribute(
      "href",
      "webcal://ihsp.test/ical/token-1.ics",
    )
    expect(screen.getByRole("link", { name: "Add to Google Calendar" })).toHaveAttribute(
      "href",
      googleCalendarUrl("https://ihsp.test/ical/token-1.ics"),
    )
    expect(screen.queryByRole("button", { name: "Create link" })).toBeNull()
  })

  test("regenerating asks first and then replaces the link", async () => {
    const bodies = recordTokens()
    const { user } = renderSp(<CalendarFeedPanel />)
    await user.click(screen.getByRole("button", { name: "Create link" }))
    await screen.findByLabelText("Calendar feed link")

    await user.click(screen.getByRole("button", { name: "Regenerate link" }))
    await screen.findByText("Regenerate the link?")
    expect(bodies).toHaveLength(1)
    await user.click(screen.getByRole("button", { name: "Regenerate" }))

    await waitFor(() =>
      expect(screen.getByLabelText("Calendar feed link")).toHaveValue("https://ihsp.test/ical/token-2.ics"),
    )
    expect(bodies).toHaveLength(2)
    expect(screen.queryByText("Regenerate the link?")).toBeNull()
  })

  test("an API error is shown and no link appears", async () => {
    server.use(http.post(apiUrl("/v1/me/calendar-token"), () => HttpResponse.json({ detail: "boom" }, { status: 500 })))
    const { user } = renderSp(<CalendarFeedPanel />)

    await user.click(screen.getByRole("button", { name: "Create link" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.queryByLabelText("Calendar feed link")).toBeNull()
    expect(screen.getByRole("button", { name: "Create link" })).toBeEnabled()
  })
})

describe("calendar feed dialog", () => {
  test("the button opens the panel in a dialog", async () => {
    const { user } = renderSp(<CalendarFeedDialog />)

    await user.click(screen.getByRole("button", { name: "Subscribe to calendar" }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create link" })).toBeInTheDocument()
  })
})
