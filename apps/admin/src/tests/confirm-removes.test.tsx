/** Destructive removes ask first: a non-study or moved day of a term, the AI extension of a student. */
import { describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { DaysEditor } from "../features/terms/components/days-editor"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("days editor", () => {
  test("removing a non-study day is confirmed first and cancelling keeps it", async () => {
    const changes: string[][] = []
    const { user } = renderAdmin(
      <DaysEditor
        nonStudyDays={["2026-12-31"]}
        movedDays={[{ date: "2026-12-13", follows_weekday: 1 }]}
        onNonStudyChange={(days) => changes.push(days)}
        onMovedChange={() => undefined}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Remove 31 Dec 2026" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Remove 31 Dec 2026?")).toBeInTheDocument()
    expect(within(dialog).getByText("The change applies when the term is saved.")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(changes).toEqual([])

    await user.click(screen.getByRole("button", { name: "Remove 31 Dec 2026" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove 31 Dec 2026" }))
    expect(changes).toEqual([[]])
  })

  test("removing a moved day goes through the same confirmation", async () => {
    const changes: { date: string }[][] = []
    const { user } = renderAdmin(
      <DaysEditor
        nonStudyDays={[]}
        movedDays={[{ date: "2026-12-13", follows_weekday: 1 }]}
        onNonStudyChange={() => undefined}
        onMovedChange={(days) => changes.push(days)}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Remove 13 Dec 2026" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove 13 Dec 2026" }))
    expect(changes).toEqual([[]])
  })
})
