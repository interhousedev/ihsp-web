import { server } from "@ihsp/test-utils"
import { projectsHandlers, resetProjectsHandlers } from "../../../../../packages/test-utils/src/handlers/projects"
import { fireEvent, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { ProjectHelpersBody } from "./components/project-helpers-page"

beforeEach(() => {
  resetProjectsHandlers()
  server.use(...projectsHandlers)
})

describe("project helpers staff page", () => {
  test("creates a helper", async () => {
    renderAdmissionApp(<ProjectHelpersBody />)
    await screen.findByText("Makers Hub")
    fireEvent.click(screen.getByRole("button", { name: "Add helper" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Pitch Club" } })
    for (const lang of ["EN", "RU", "UZ"])
      fireEvent.change(within(dialog).getByLabelText(`Description (${lang})`), { target: { value: `Text ${lang}` } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Pitching" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))
    await screen.findByText("Pitch Club")
  })

  test("rejects a bad email without calling the API", async () => {
    renderAdmissionApp(<ProjectHelpersBody />)
    await screen.findByText("Makers Hub")
    fireEvent.click(screen.getByRole("button", { name: "Add helper" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "X" } })
    fireEvent.change(within(dialog).getByLabelText("Email"), { target: { value: "nope" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))
    await within(dialog).findByText("Enter a valid email.")
  })
})
