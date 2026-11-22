import { screen } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CreativePractice, creativeKeys } from "./components/creative-practice"
import { Roadmap } from "./components/roadmap"

describe("Today roadmap and creative practice", () => {
  test("every node links to its page and one is the current step", () => {
    renderAdmissionApp(
      <Roadmap
        streakDays={3}
        nodes={[
          { key: "countries", state: "done", href: "/setup/", progress: null },
          { key: "list", state: "current", href: "/chooser/", progress: "2/6" },
          { key: "tests", state: "locked", href: "/tests/", progress: null },
        ]}
      />,
    )
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"))
    expect(hrefs).toEqual(["/setup", "/chooser", "/tests"])
    expect(document.querySelectorAll('[aria-current="step"]').length).toBe(1)
  })

  test("creative cards open the practice writer with their prompt", () => {
    renderAdmissionApp(<CreativePractice />)
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"))
    expect(hrefs).toEqual(creativeKeys().map((k) => `/essays/practice?theme=${k}`))
    expect(hrefs).toContain("/essays/practice?theme=my_day")
  })
})
