/** Task 3.5: the phone bottom bar, the installed app without a sidebar, the apps hub anchors and linked titles. */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { apiUrl, filePdf, resourceMaterial, server, setTestRoute, userMe } from "@ihsp/test-utils"
import { act, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { FileRow } from "../features/files/components/file-row"
import { ResourceList } from "../features/lessons/components/resource-list"
import { AppsHub } from "../features/pwa/components/apps-hub"
import { setRuntimeConfig } from "../features/pwa/__tests__/pwa-test-support"
import { BottomBarEditor } from "../features/settings/components/bottom-bar-editor"
import { SpShell } from "../features/shell/components/sp-shell"
import {
  BOTTOM_BAR_PREFIX,
  DASHBOARD_MIGRATED,
  DEFAULT_BOTTOM_BAR,
  migrateToDashboard,
  normalizeBottomBar,
  dropLegacyBottomBar,
  readLegacyBottomBar,
} from "../features/shell/utils/bottom-bar"
import { configureTests, renderSp, setViewportWidth, studentWith } from "./helpers"

configureTests()

beforeEach(() => {
  window.localStorage.clear()
  setRuntimeConfig("sp")
})
afterEach(() => {
  setViewportWidth(1280)
  window.history.replaceState(null, "", "/")
  setRuntimeConfig("sp")
})

describe("bottom bar config", () => {
  test("keeps known pages in order, drops duplicates and falls back to the defaults", () => {
    expect(normalizeBottomBar(["grades", "x", "grades", "today"])).toEqual(["grades", "today"])
    expect(normalizeBottomBar([])).toEqual([...DEFAULT_BOTTOM_BAR])
    expect(normalizeBottomBar(["today", "timetable", "grades", "homework", "files"])).toHaveLength(4)
  })

  test("the default bar starts with the Dashboard and leaves Today out", () => {
    expect(DEFAULT_BOTTOM_BAR[0]).toBe("dashboard")
    expect(DEFAULT_BOTTOM_BAR).not.toContain("today")
  })

  test("a list saved before the Dashboard gets the Dashboard in place of Today", () => {
    expect(migrateToDashboard(["timetable", "today", "grades"])).toEqual(["timetable", "dashboard", "grades"])
    expect(migrateToDashboard(["files", "grades"])).toEqual(["files", "grades"])
    expect(migrateToDashboard(["dashboard", "today"])).toEqual(["dashboard", "today"])
  })

  test("a stored account list with Today is migrated once and flagged", async () => {
    const bodies: Record<string, unknown>[] = []
    const session = studentWith({ bottom_nav: ["today", "grades"], onboarding_dismissed: ["welcome"] })
    server.use(
      http.get(apiUrl("/v1/id/me"), () => HttpResponse.json(session.user)),
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        bodies.push(body)
        return HttpResponse.json({ ...userMe.preferences, ...body })
      }),
    )
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
      { session },
    )
    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })
    expect(within(bar).getByRole("link", { name: "Home" })).toBeInTheDocument()
    await waitFor(() =>
      expect(bodies).toEqual([
        { bottom_nav: ["dashboard", "grades"], onboarding_dismissed: ["welcome", DASHBOARD_MIGRATED] },
      ]),
    )
  })

  test("after the migration Today may be chosen again and stays", async () => {
    const bodies: Record<string, unknown>[] = []
    const session = studentWith({ bottom_nav: ["today", "grades"], onboarding_dismissed: [DASHBOARD_MIGRATED] })
    server.use(
      http.get(apiUrl("/v1/id/me"), () => HttpResponse.json(session.user)),
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({})
      }),
    )
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
      { session },
    )
    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })
    expect(within(bar).getByRole("link", { name: "Today" })).toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  test("a device list saved before the Dashboard is migrated", async () => {
    window.localStorage.setItem(`ihsp:sp:bottom-bar:${userMe.id}`, JSON.stringify(["today", "files"]))
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )
    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })
    expect(
      within(bar)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/", "/files"])
  })

  test("reads and drops the legacy account entry", () => {
    const entries = ["welcome", `${BOTTOM_BAR_PREFIX}files,grades`]
    expect(readLegacyBottomBar(entries)).toEqual(["files", "grades"])
    expect(dropLegacyBottomBar(entries)).toEqual(["welcome"])
    expect(readLegacyBottomBar(["welcome"])).toBeNull()
  })

  test("the legacy entry is moved to bottom_nav once", async () => {
    const bodies: Record<string, unknown>[] = []
    const session = studentWith({ onboarding_dismissed: ["welcome", `${BOTTOM_BAR_PREFIX}files,grades`] })
    server.use(
      http.get(apiUrl("/v1/id/me"), () => HttpResponse.json(session.user)),
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        bodies.push(body)
        return HttpResponse.json({ ...userMe.preferences, ...body })
      }),
    )
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
      { session },
    )
    await screen.findByText("page body")
    await waitFor(() =>
      expect(bodies).toEqual([
        { bottom_nav: ["files", "grades"], onboarding_dismissed: ["welcome", DASHBOARD_MIGRATED] },
      ]),
    )
  })

  test("a change in Settings is saved in the account and on the device", async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        bodies.push(body)
        return HttpResponse.json({ ...userMe.preferences, ...body })
      }),
    )
    const { user } = renderSp(<BottomBarEditor />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Move right: Dashboard" }))

    await waitFor(() =>
      expect(bodies.at(-1)).toMatchObject({ bottom_nav: ["timetable", "dashboard", "grades", "homework"] }),
    )
    const stored = window.localStorage.getItem(`ihsp:sp:bottom-bar:v2:${userMe.id}`)
    expect(JSON.parse(stored ?? "[]")).toEqual(["timetable", "dashboard", "grades", "homework"])
  })

  test("the bar shows the saved pages and More", async () => {
    window.localStorage.setItem(`ihsp:sp:bottom-bar:v2:${userMe.id}`, JSON.stringify(["files", "grades"]))
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })
    expect(
      within(bar)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/files", "/grades"])
    expect(within(bar).getByRole("button", { name: "More" })).toBeInTheDocument()
  })

  test("the tab of the current page is marked", async () => {
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
      { route: "/timetable/" },
    )
    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })

    expect(within(bar).getByRole("link", { name: "Calendar" }).getAttribute("aria-current")).toBe("page")
    setTestRoute("/")
  })

  test("a tab is a link to its page", async () => {
    setViewportWidth(360)
    const { user } = renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )
    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })

    const tab = within(bar).getByRole("link", { name: "Calendar" })
    expect(tab.getAttribute("href")).toBe("/timetable")
    expect(tab.getAttribute("aria-current")).toBeNull()
    await user.click(tab)
  })

  test("the More sheet scrolls the current page into view", async () => {
    setViewportWidth(360)
    const scrolled: Element[] = []
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this)
    }
    try {
      const { user } = renderSp(
        <SpShell>
          <p>page body</p>
        </SpShell>,
        { route: "/exams/" },
      )
      await screen.findByText("page body")
      await user.click(screen.getByRole("button", { name: "More" }))

      const current = await screen.findByRole("link", { name: "Exams", current: "page" })
      await waitFor(() => expect(scrolled).toContain(current))
    } finally {
      Element.prototype.scrollIntoView = original
      setTestRoute("/")
    }
  })
})

describe("installed app on a phone", () => {
  test("has no sidebar toggle in pwa mode, but has it in a browser", async () => {
    setViewportWidth(360)
    setRuntimeConfig("pwa", { APP_URL: "http://localhost:3007" })
    const pwa = renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )
    await screen.findByText("page body")
    expect(screen.queryByRole("button", { name: "Toggle the sidebar" })).not.toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Quick navigation" })).toBeInTheDocument()
    pwa.unmount()

    setRuntimeConfig("sp")
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )
    await screen.findByText("page body")
    expect(screen.getByRole("button", { name: "Toggle the sidebar" })).toBeInTheDocument()
  })
})

describe("apps hub anchors", () => {
  test("scrolls to and highlights the card named by the address", async () => {
    setRuntimeConfig("pwa", { APP_URL: "http://localhost:3007" })
    const scroll = spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => undefined)

    renderSp(<AppsHub />)
    act(() => {
      window.history.replaceState(null, "", "/#install-lms")
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    })

    await waitFor(() => expect(document.getElementById("install-lms")?.getAttribute("data-highlighted")).toBe("true"))
    expect(document.getElementById("install-library")?.getAttribute("data-highlighted")).toBe("false")
    expect(scroll).toHaveBeenCalled()
  })
})

describe("linked titles", () => {
  test("a lesson material title links to the material", () => {
    renderSp(<ResourceList items={[resourceMaterial]} />)

    expect(screen.getByRole("link", { name: resourceMaterial.title })).toHaveAttribute(
      "href",
      resourceMaterial.short_url,
    )
  })

  test("a file name links to the file in the list", () => {
    renderSp(<FileRow file={filePdf} onRename={() => undefined} onDelete={() => undefined} />)

    expect(screen.getByRole("link", { name: filePdf.name })).toHaveAttribute("href", `/files/#file-${filePdf.id}`)
  })
})
