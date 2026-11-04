/** The lesson list of a teacher or student is a named scroll region, so a keyboard user can reach and scroll it. */
import { describe, expect, test } from "bun:test"
import { weekLessons } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { LessonList } from "../features/shared/components/lesson-list"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("scroll lists", () => {
  test("the lesson list is a named, focusable scroll region", async () => {
    renderAdmin(<LessonList lessons={weekLessons} />)

    const region = await screen.findByRole("region", { name: "Lessons by date" })

    expect(region).toHaveAttribute("tabindex", "0")
    expect(region.querySelectorAll("li").length).toBeGreaterThan(0)
  })
})
