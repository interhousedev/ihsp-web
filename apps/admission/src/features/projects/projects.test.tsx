import { apiUrl } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
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
  test("the page sits in the Opportunities tab row with Project ideas selected", async () => {
    renderAdmissionApp(<ProjectsBody />, { messages: { opportunities: { categories: { projects: "Project ideas" } } } })
    const tab = await screen.findByRole("tab", { name: "Project ideas" })
    expect(tab.getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("heading", { level: 1, name: "Opportunities" })).toBeTruthy()
  })

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

    fireEvent.click(screen.getByRole("button", { name: "Copy to discuss with AI" }))
    await waitFor(() => expect(written).toHaveLength(1))
    expect(written[0]).toContain("Water quality tracker")
    expect(written[0]).toContain("Calibrating the sensor")
    expect(written[0]).toContain("Brainstorm")
    expect(written[0]).not.toContain("SECRET-LIKES")
    expect(written[0]).not.toContain("Shows initiative")
    spy.mockRestore()
  })

  test("the future-interest field is sent with the brief and voice fill sets it", async () => {
    const sent: Record<string, unknown>[] = []
    server.use(
      http.post(apiUrl("/v1/admission/projects/ideas"), async ({ request }) => {
        sent.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json(projectsRunFixture)
      }),
      http.post(apiUrl("/v1/admission/voice-fill"), () =>
        HttpResponse.json({ values: { likes: "football", future_interest: "data science" } }),
      ),
    )
    const messages = {
      projects: { form: { future: "Future interest", futureHint: "h" } },
      voiceFill: { talk: "Talk in voice", typedLabel: "Your answer", done: "Fill the form" },
    }
    renderAdmissionApp(<ProjectsBody />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Talk in voice" }))
    fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "football and data science" } })
    fireEvent.click(screen.getByRole("button", { name: "Fill the form" }))
    const future = (await screen.findByLabelText("Future interest")) as HTMLTextAreaElement
    expect(future.value).toBe("data science")
    fireEvent.click(screen.getByRole("button", { name: "Suggest projects" }))
    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]).toMatchObject({ likes: "football", future_interest: "data science" })
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
