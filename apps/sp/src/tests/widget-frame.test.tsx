/** A dashboard tile grows with its content; nothing scrolls inside it. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { DashboardCard } from "../features/today/dashboard/widget-frame"
import type { Widget } from "../features/today/dashboard/model"
import { configureTests, renderSp } from "./helpers"

configureTests()

const widget = { id: "w1", kind: "homework", size: "1x1" } as Widget

describe("DashboardCard", () => {
  test("has no inner vertical scroll", () => {
    renderSp(
      <DashboardCard widget={widget} title="Homework">
        <p>Body</p>
      </DashboardCard>,
    )
    const card = screen.getByRole("region", { name: "Homework" })
    expect(card.innerHTML).not.toContain("overflow-y-auto")
    expect(card.querySelector(".overflow-y-auto")).toBeNull()
  })
})
