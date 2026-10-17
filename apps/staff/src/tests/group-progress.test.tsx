/** Group marks and attendance table on My group → Students. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StudentsPage } from "../features/group/components/students-page"
import { configureTests, freezeTime, renderStaff, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(unfreezeTime)

describe("group progress", () => {
  test("renders students by subjects with marks and absences", async () => {
    renderStaff(<StudentsPage />)

    const section = await screen.findByRole("region", { name: "Marks & attendance" })
    const table = await within(section).findByRole("table")
    expect(within(table).getByText("Karimova Aziza")).toBeInTheDocument()
    expect(within(table).getByText("Math")).toBeInTheDocument()
    expect(within(table).getAllByText("1/20 · 5%").length).toBeGreaterThan(0)
  })

  test("switching the semester refetches the table", async () => {
    renderStaff(<StudentsPage />)
    const section = await screen.findByRole("region", { name: "Marks & attendance" })
    await within(section).findByRole("table")
    expect(within(section).getByText("4.5")).toBeInTheDocument()

    await userEvent.click(within(section).getByRole("combobox", { name: "Semester" }))
    await userEvent.click(await screen.findByRole("option", { name: "Semester 2" }))

    await waitFor(() => expect(within(section).getByText("3.9")).toBeInTheDocument())
  })

  test("opening a student shows the details per subject", async () => {
    renderStaff(<StudentsPage />)
    const section = await screen.findByRole("region", { name: "Marks & attendance" })

    await userEvent.click((await within(section).findAllByRole("button", { name: /Karimova Aziza/ }))[0]!)

    expect((await screen.findAllByText("Midterm (PC)")).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Lesson average").length).toBeGreaterThan(0)
  })
})
