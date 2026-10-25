/** WO-1: the "Work-off tasks" section of the staff settings. */
import { describe, expect, test } from "bun:test"
import { apiUrl, problem, server, workOffTemplateIds } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { WorkOffTemplates } from "../features/settings/components/work-off-templates"
import { configureTests, renderStaff } from "./helpers"

configureTests()

function capture(method: "post" | "put") {
  const calls: { url: string; body: unknown }[] = []
  const path = method === "post" ? "/v1/staff/work-off-templates" : "/v1/staff/work-off-templates/:id"
  server.use(
    http[method](apiUrl(path), async ({ request }) => {
      calls.push({ url: new URL(request.url).pathname, body: await request.json() })
      return HttpResponse.json(
        {
          id: workOffTemplateIds.second,
          text: "x",
          is_default: false,
          created_at: "2026-09-01T08:00:00Z",
          updated_at: "2026-09-01T08:00:00Z",
        },
        { status: method === "post" ? 201 : 200 },
      )
    }),
  )
  return calls
}

describe("work-off templates settings", () => {
  test("lists the templates with the default one selected", async () => {
    renderStaff(<WorkOffTemplates />)

    expect(await screen.findByRole("radio", { name: "Solve problems 1-5 from the textbook" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Write a short summary of the topic" })).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "No default" })).not.toBeChecked()
  })

  test("adding a template sends its text", async () => {
    const calls = capture("post")
    const { user } = renderStaff(<WorkOffTemplates />)

    await user.click(await screen.findByRole("button", { name: "Add template" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Text" }), "Read chapter 3")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(calls).toEqual([{ url: "/v1/staff/work-off-templates", body: { text: "Read chapter 3" } }]),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("editing a template sends the new text and keeps its default flag", async () => {
    const calls = capture("put")
    const { user } = renderStaff(<WorkOffTemplates />)

    await user.click(await screen.findByRole("button", { name: /Edit template: Solve problems/ }))
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByRole("textbox", { name: "Text" })
    await user.clear(field)
    await user.type(field, "Solve problems 6-10")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(calls).toEqual([
        {
          url: `/v1/staff/work-off-templates/${workOffTemplateIds.default}`,
          body: { text: "Solve problems 6-10", is_default: true },
        },
      ]),
    )
  })

  test("choosing another radio makes that template the default", async () => {
    const calls = capture("put")
    const { user } = renderStaff(<WorkOffTemplates />)

    await user.click(await screen.findByRole("radio", { name: "Write a short summary of the topic" }))

    await waitFor(() =>
      expect(calls).toEqual([
        {
          url: `/v1/staff/work-off-templates/${workOffTemplateIds.second}`,
          body: { text: "Write a short summary of the topic", is_default: true },
        },
      ]),
    )
  })

  test("No default clears the default flag", async () => {
    const calls = capture("put")
    const { user } = renderStaff(<WorkOffTemplates />)

    await user.click(await screen.findByRole("radio", { name: "No default" }))

    await waitFor(() =>
      expect(calls).toEqual([
        {
          url: `/v1/staff/work-off-templates/${workOffTemplateIds.default}`,
          body: { text: "Solve problems 1-5 from the textbook", is_default: false },
        },
      ]),
    )
  })

  test("deleting asks first and removes the template", async () => {
    const deleted: string[] = []
    server.use(
      http.delete(apiUrl("/v1/staff/work-off-templates/:id"), ({ params }) => {
        deleted.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderStaff(<WorkOffTemplates />)

    await user.click(await screen.findByRole("button", { name: /Delete template: Write a short/ }))
    expect(deleted).toEqual([])
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toEqual([workOffTemplateIds.second]))
  })

  test("the limit error is shown in the dialog", async () => {
    server.use(
      http.post(apiUrl("/v1/staff/work-off-templates"), () =>
        problem(422, "work-off/template-limit", "Too many templates"),
      ),
    )
    const { user } = renderStaff(<WorkOffTemplates />)

    await user.click(await screen.findByRole("button", { name: "Add template" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Text" }), "One more")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("You can have up to 20 work-off templates.")
  })
})
