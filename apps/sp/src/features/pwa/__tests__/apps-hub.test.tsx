/** The apps hub of the installable host: the apps to install, with a link to each one's host; unconfigured apps are hidden. */
import { beforeEach, describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { AppsHub } from "../components/apps-hub"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

beforeEach(() => setRuntimeConfig("pwa", { APP_URL: "http://localhost:3007" }))

describe("AppsHub", () => {
  test("lists the student app and every configured app with a link to its host", () => {
    renderPwa(<AppsHub />)

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(5)
    expect(within(items[0] as HTMLElement).getByText("SP")).toBeInTheDocument()
    expect(within(items[0] as HTMLElement).getByText("Install with the steps above")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Install LMS" })).toHaveAttribute("href", "http://localhost:3005")
    expect(screen.getByRole("link", { name: "Install Library" })).toHaveAttribute("href", "http://localhost:3008")
    expect(screen.getByRole("link", { name: "Install Staff" })).toHaveAttribute("href", "http://localhost:3003")
    expect(screen.getByRole("link", { name: "Install Admin" })).toHaveAttribute("href", "http://localhost:3004")
  })

  test("marks Staff and Admin as for staff, and nobody else", () => {
    renderPwa(<AppsHub />)

    expect(screen.getAllByText("For staff")).toHaveLength(2)
    for (const name of ["Staff", "Admin"]) {
      const item = screen.getByRole("link", { name: `Install ${name}` }).closest("li") as HTMLElement
      expect(within(item).getByText("For staff")).toBeInTheDocument()
    }
    const lms = screen.getByRole("link", { name: "Install LMS" }).closest("li") as HTMLElement
    expect(within(lms).queryByText("For staff")).not.toBeInTheDocument()
  })

  test("hides an app whose address is not configured", () => {
    setRuntimeConfig("pwa", { LIBRARY_URL: "" })

    renderPwa(<AppsHub />)

    expect(screen.queryByRole("link", { name: "Install Library" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
  })
})
