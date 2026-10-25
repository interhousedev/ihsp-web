/** The apps hub of the installable host: the apps to install, with a link to each one's install page; unconfigured apps are hidden. */
import { beforeEach, describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { AppsHub } from "../components/apps-hub"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

beforeEach(() => setRuntimeConfig("pwa", { APP_URL: "http://localhost:3007" }))

describe("AppsHub", () => {
  test("lists the student app and every configured app with a link to its install page on the hub", () => {
    renderPwa(<AppsHub />)

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(5)
    expect(within(items[0] as HTMLElement).getByText("my.iht")).toBeInTheDocument()
    expect(within(items[0] as HTMLElement).getByText("Install with the steps above")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Install lms.iht" })).toHaveAttribute("href", "/install/?app=lms")
    expect(screen.getByRole("link", { name: "Install library.iht" })).toHaveAttribute("href", "/install/?app=library")
    expect(screen.getByRole("link", { name: "Install IHT Учителям" })).toHaveAttribute("href", "/install/?app=staff")
    expect(screen.getByRole("link", { name: "Install admin.iht" })).toHaveAttribute("href", "/install/?app=admin")
  })

  test("marks Staff and Admin as for staff, and nobody else", () => {
    renderPwa(<AppsHub />)

    expect(screen.getAllByText("For staff")).toHaveLength(2)
    for (const name of ["IHT Учителям", "admin.iht"]) {
      const item = screen.getByRole("link", { name: `Install ${name}` }).closest("li") as HTMLElement
      expect(within(item).getByText("For staff")).toBeInTheDocument()
    }
    const lms = screen.getByRole("link", { name: "Install lms.iht" }).closest("li") as HTMLElement
    expect(within(lms).queryByText("For staff")).not.toBeInTheDocument()
  })

  test("hides an app whose address is not configured", () => {
    setRuntimeConfig("pwa", { LIBRARY_URL: "" })

    renderPwa(<AppsHub />)

    expect(screen.queryByRole("link", { name: "Install library.iht" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
  })
})
