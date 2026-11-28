/** My group: the group card, homeroom teacher, head student and members; marks only for the head student. */
import { describe, expect, test } from "bun:test"
import { apiUrl, problem, myGroupForMember, myGroupUnassigned, server, userPreferences } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { MyGroupPage } from "../features/my-group/components/my-group-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("my group", () => {
  test("shows the group card with its name and size", async () => {
    renderSp(<MyGroupPage />)

    const card = await screen.findByRole("region", { name: "2TN2" })
    expect(within(card).getByText(/Students: 4/)).toBeInTheDocument()
  })

  test("shows the homeroom teacher with role label, initials and public contacts", async () => {
    renderSp(<MyGroupPage />)

    const teacher = await screen.findByRole("group", { name: "Curator" })
    expect(within(teacher).getByText("DR")).toBeInTheDocument()
    expect(within(teacher).getByText("Dilnoza Rakhimova")).toBeInTheDocument()
    expect(within(teacher).getByText("@dilnoza_r")).toBeInTheDocument()
    expect(within(teacher).getByText("204")).toBeInTheDocument()
  })

  test("shows the head student by name with no contacts", async () => {
    renderSp(<MyGroupPage />)

    const head = await screen.findByRole("group", { name: "Head student" })
    expect(within(head).getByText("Demo Student")).toBeInTheDocument()
    expect(within(head).queryByText("Telegram")).not.toBeInTheDocument()
  })

  test("lists the members and marks the head student", async () => {
    renderSp(<MyGroupPage />)

    const members = await screen.findByRole("list", { name: "Members" })
    const items = within(members).getAllByRole("listitem")
    expect(items).toHaveLength(4)
    const head = items.find((item) => item.textContent?.includes("Demo Student"))
    expect(head).toHaveTextContent("Head")
    expect(head).toHaveTextContent("You")
  })

  test("the head student sees the marks table", async () => {
    renderSp(<MyGroupPage />)

    expect(await screen.findByRole("region", { name: "Marks & attendance" })).toBeInTheDocument()
  })

  test("a member who is not the head sees the group without the marks table", async () => {
    server.use(http.get(apiUrl("/v1/me/group"), () => HttpResponse.json(myGroupForMember)))

    renderSp(<MyGroupPage />)

    expect(await screen.findByRole("group", { name: "Head student" })).toHaveTextContent("Aziza Karimova")
    expect(screen.queryByRole("region", { name: "Marks & attendance" })).not.toBeInTheDocument()
  })

  test("unassigned roles say so instead of showing a person", async () => {
    server.use(http.get(apiUrl("/v1/me/group"), () => HttpResponse.json(myGroupUnassigned)))

    renderSp(<MyGroupPage />)

    const teacher = await screen.findByRole("group", { name: "Curator" })
    expect(within(teacher).getByText("Not assigned yet")).toBeInTheDocument()
    const head = screen.getByRole("group", { name: "Head student" })
    expect(within(head).getByText("Not assigned yet")).toBeInTheDocument()
  })

  test("a load failure shows the error state", async () => {
    server.use(http.get(apiUrl("/v1/me/group"), () => HttpResponse.json({}, { status: 500 })))

    renderSp(<MyGroupPage />)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  test("classmates are shown in a grid with an initials fallback", async () => {
    renderSp(<MyGroupPage />)

    const members = await screen.findByRole("list", { name: "Members" })
    const bobur = within(members)
      .getAllByRole("listitem")
      .find((item) => item.textContent?.includes("Bobur Rashidov"))
    expect(bobur).toHaveTextContent("BR")
  })

  test("shows a loading state before the group arrives", () => {
    server.use(http.get(apiUrl("/v1/me/group"), () => new Promise(() => {})))

    renderSp(<MyGroupPage />)

    expect(screen.queryByRole("region", { name: "2TN2" })).not.toBeInTheDocument()
    expect(screen.queryByRole("list", { name: "Members" })).not.toBeInTheDocument()
  })

  test("SP-UX-b1: a student without a record sees the notice, not an error", async () => {
    server.use(
      http.get(apiUrl("/v1/me/group"), () =>
        problem(404, "academic/student-not-found", "The user has no student record"),
      ),
    )

    renderSp(<MyGroupPage />)

    expect(await screen.findByTestId("no-student-record")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
  })

  test("the photo switch saves the opt-out through the preferences API", async () => {
    const patches: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const patch = await request.json()
        patches.push(patch)
        return HttpResponse.json({ ...userPreferences, ...(patch as object) })
      }),
    )
    renderSp(<MyGroupPage />)

    const toggle = await screen.findByRole("switch", { name: "Do not show my photo to my classmates" })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)

    await waitFor(() => expect(patches).toEqual([{ hide_photo_from_classmates: true }]))
    await waitFor(() => expect(toggle).toBeChecked())
  })
})
