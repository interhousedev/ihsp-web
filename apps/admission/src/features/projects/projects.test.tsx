import { server } from "@ihsp/test-utils"
import { projectsHandlers, resetProjectsHandlers } from "../../../../../packages/test-utils/src/handlers/projects"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, spyOn, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { ProjectsBody } from "./components/projects-page"
import { buildProjectPrompt } from "./prompt"
import { projectsRunFixture } from "../../../../../packages/test-utils/src/handlers/projects"
import type { Project } from "./api"

beforeEach(() => {
  resetProjectsHandlers()
  server.use(...projectsHandlers)
})

describe("project ideas", () => {
  test("brief to results to a prompt that holds only the project fields", async () => {
    const written: string[] = []
    const spy = spyOn(navigator.clipboard, "writeText").mockImplementation(async (v: string) => void written.push(v))
    renderAdmissionApp(<ProjectsBody />)
    fireEvent.change(await screen.findByLabelText("What do you like and care about?"), {
      target: { value: "SECRET-LIKES rivers and robots" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Suggest projects" }))
    await screen.findByText("Water quality tracker")
    expect(screen.getByText("Abroad")).toBeTruthy()
    expect(screen.getByText("Uzbekistan")).toBeTruthy()
    const link = screen.getByRole("link", { name: /River Watch/ })
    expect(link.getAttribute("target")).toBe("_blank")

    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }))
    await waitFor(() => expect(written).toHaveLength(1))
    expect(written[0]).toContain("Water quality tracker")
    expect(written[0]).toContain("Calibrating the sensor")
    expect(written[0]).toContain("Brainstorm")
    expect(written[0]).not.toContain("SECRET-LIKES")
    expect(written[0]).not.toContain("Shows initiative")
    spy.mockRestore()
  })

  test("helpers drawer lists the matching helpers with contact links", async () => {
    renderAdmissionApp(<ProjectsBody />)
    fireEvent.change(await screen.findByLabelText("What do you like and care about?"), { target: { value: "rivers" } })
    fireEvent.click(screen.getByRole("button", { name: "Suggest projects" }))
    await screen.findByText("Water quality tracker")
    fireEvent.click(screen.getByRole("button", { name: "Helpers" }))
    const drawer = await screen.findByRole("dialog")
    await within(drawer).findByText("Makers Hub")
    expect(within(drawer).getByRole("link", { name: "hub@example.org" }).getAttribute("href")).toBe(
      "mailto:hub@example.org",
    )
  })

  test("buildProjectPrompt never includes the application effect", () => {
    const text = buildProjectPrompt(projectsRunFixture.projects[0] as unknown as Project)
    expect(text).not.toContain("initiative")
  })
})
