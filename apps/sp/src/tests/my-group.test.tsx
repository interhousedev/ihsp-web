/** My group: the group card, homeroom teacher, head student and members; marks only for the head student. */
import { describe, expect, test } from "bun:test"
import { apiUrl, myGroupForMember, myGroupUnassigned, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MyGroupPage } from "../features/my-group/components/my-group-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("my group", () => {
  test("shows the group card with its name and size", async () => {
    renderSp(<MyGroupPage />)

    const card = await screen.findByRole("region", { name: "2TN2" })
    expect(within(card).getByText("Students: 4")).toBeInTheDocument()
  })

  test("shows the homeroom teacher with role label, initials and public contacts", async () => {
    renderSp(<MyGroupPage />)

    const teacher = await screen.findByRole("group", { name: "Homeroom teacher" })
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

    const teacher = await screen.findByRole("group", { name: "Homeroom teacher" })
    expect(within(teacher).getByText("Not assigned yet")).toBeInTheDocument()
    const head = screen.getByRole("group", { name: "Head student" })
    expect(within(head).getByText("Not assigned yet")).toBeInTheDocument()
  })

  test("a load failure shows the error state", async () => {
    server.use(http.get(apiUrl("/v1/me/group"), () => HttpResponse.json({}, { status: 500 })))

    renderSp(<MyGroupPage />)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })
})
