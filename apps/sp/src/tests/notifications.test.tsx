/** WEB-27, UF-WEB-15: the notification center and the header bell. */
import { describe, expect, test } from "bun:test"
import { apiUrl, notificationItems, server } from "@ihsp/test-utils"
import { NotificationBell, NotificationCenter } from "@ihsp/features-core"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests, renderSp } from "./helpers"

configureTests()

const UNREAD = notificationItems.filter((item) => item.read_at === null).length

describe("NotificationCenter", () => {
  test("lists everything with the unread ones marked", async () => {
    renderSp(<NotificationCenter />)

    const items = await screen.findAllByTestId("notification-item")

    expect(items).toHaveLength(notificationItems.length)
    expect(items.filter((item) => item.getAttribute("data-unread") === "true")).toHaveLength(UNREAD)
    expect(screen.getByText("Autumn break schedule")).toBeInTheDocument()
  })

  test("the Announcements filter asks for announcements and shows only them", async () => {
    const filters: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/notifications"), ({ request }) => {
        const filter = new URL(request.url).searchParams.get("filter")
        filters.push(filter)
        const items = notificationItems.filter((item) =>
          filter === "announcements" ? item.type.startsWith("broadcast.") : true,
        )
        return HttpResponse.json({ items, next_cursor: null })
      }),
    )
    const { user } = renderSp(<NotificationCenter />)

    await screen.findAllByTestId("notification-item")
    await user.click(screen.getByRole("tab", { name: "Announcements" }))

    await waitFor(() => expect(screen.getAllByTestId("notification-item")).toHaveLength(2))
    expect(filters).toEqual(["all", "announcements"])
    expect(screen.queryByText("New marks")).not.toBeInTheDocument()
  })

  test("the Activity filter shows no announcements", async () => {
    const { user } = renderSp(<NotificationCenter />)

    await screen.findAllByTestId("notification-item")
    await user.click(screen.getByRole("tab", { name: "Activity" }))

    await waitFor(() => expect(screen.queryByText("Autumn break schedule")).not.toBeInTheDocument())
    expect(screen.getByText("New marks")).toBeInTheDocument()
  })

  test("Mark all as read posts read-all and clears the unread state", async () => {
    let calls = 0
    server.use(
      http.post(apiUrl("/v1/notifications/read-all"), () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderSp(<NotificationCenter />)

    await screen.findAllByTestId("notification-item")
    await user.click(screen.getByRole("button", { name: "Mark all as read" }))

    await waitFor(() => expect(calls).toBe(1))
    await waitFor(() =>
      expect(
        screen.getAllByTestId("notification-item").every((item) => item.getAttribute("data-unread") === "false"),
      ).toBe(true),
    )
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeDisabled()
  })

  test("opening an unread notification marks it read and links to the related page", async () => {
    const read: string[] = []
    server.use(
      http.post(apiUrl("/v1/notifications/:id/read"), ({ params }) => {
        read.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderSp(<NotificationCenter />)

    const link = await screen.findByRole("link", { name: /New marks/ })
    expect(link.getAttribute("href")).toMatch(/^\/grades\/?\?tab=day$/)
    await user.click(link)

    await waitFor(() => expect(read).toEqual([notificationItems[0]?.id]))
  })

  test("an empty inbox and a failed request have their own states", async () => {
    server.use(http.get(apiUrl("/v1/notifications"), () => HttpResponse.json({ items: [], next_cursor: null })))
    renderSp(<NotificationCenter />)

    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument()
  })

  test("a failed request shows a retry button", async () => {
    server.use(
      http.get(apiUrl("/v1/notifications"), () =>
        HttpResponse.json({ type: "common/internal", status: 500, title: "x" }, { status: 500 }),
      ),
    )
    renderSp(<NotificationCenter />)

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("Show more loads the next page", async () => {
    server.use(
      http.get(apiUrl("/v1/notifications"), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor")
        return cursor
          ? HttpResponse.json({ items: notificationItems.slice(3), next_cursor: null })
          : HttpResponse.json({ items: notificationItems.slice(0, 3), next_cursor: "3" })
      }),
    )
    const { user } = renderSp(<NotificationCenter />)

    await screen.findAllByTestId("notification-item")
    expect(screen.getAllByTestId("notification-item")).toHaveLength(3)
    await user.click(screen.getByRole("button", { name: "Show more" }))

    await waitFor(() => expect(screen.getAllByTestId("notification-item")).toHaveLength(notificationItems.length))
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument()
  })
})

describe("NotificationBell", () => {
  test("shows the unread count and opens the latest notifications", async () => {
    const { user } = renderSp(<NotificationBell />)

    const bell = await screen.findByRole("button", { name: `Notifications, ${UNREAD} unread` })
    expect(screen.getByTestId("unread-count")).toHaveTextContent(String(UNREAD))
    await user.click(bell)

    const all = await screen.findByRole("link", { name: "View all notifications" })
    expect(all.getAttribute("href")).toMatch(/^\/notifications\/?$/)
    expect((await screen.findAllByTestId("notification-item")).length).toBeGreaterThan(0)
  })

  test("without unread notifications there is no count", async () => {
    server.use(http.get(apiUrl("/v1/notifications/unread-count"), () => HttpResponse.json({ count: 0 })))
    renderSp(<NotificationBell />)

    expect(await screen.findByRole("button", { name: "Notifications" })).toBeInTheDocument()
    expect(screen.queryByTestId("unread-count")).not.toBeInTheDocument()
  })
})
