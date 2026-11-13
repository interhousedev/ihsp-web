/** HW-DATE: the date view groups the week's homework by due date and marks the strip days. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, homeworkMath, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { HomeworkByDate } from "../features/homework/components/homework-by-date"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()
beforeEach(freezeTime)
afterEach(unfreezeTime)

describe("HW-DATE homework by date", () => {
  test("groups by due date and dots the day", async () => {
    server.use(
      http.get(apiUrl("/v1/me/homework"), () =>
        HttpResponse.json([{ ...homeworkMath, due_date: "2026-10-08", done_at: null, days_overdue: 0 }]),
      ),
    )
    renderSp(<HomeworkByDate />)
    expect(await screen.findByText(homeworkMath.text)).toBeTruthy()
    expect(document.querySelector('[data-dot="primary"]')).not.toBeNull()
    expect(screen.getByRole("heading", { level: 3 }).textContent).toMatch(/Thursday/)
  })

  test("next week shows the empty text", async () => {
    server.use(http.get(apiUrl("/v1/me/homework"), () => HttpResponse.json([])))
    renderSp(<HomeworkByDate />)
    fireEvent.click(await screen.findByRole("button", { name: /next week/i }))
    expect(await screen.findByText(/no homework/i)).toBeTruthy()
  })
})
