/** My group: the head student's marks and attendance table; others are told it is not for them. */
import { describe, expect, test } from "bun:test"
import { apiUrl, notHeadStudentResponse, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { http } from "msw"
import { MyGroupPage } from "../features/my-group/components/my-group-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("my group", () => {
  test("renders the group table", async () => {
    renderSp(<MyGroupPage />)

    const section = await screen.findByRole("region", { name: "Marks & attendance" })
    expect((await within(section).findAllByText("Karimova Aziza")).length).toBeGreaterThan(0)
  })

  test("a student who is not the head student sees a not-allowed message", async () => {
    server.use(http.get(apiUrl("/v1/me/group/progress"), () => notHeadStudentResponse()))

    renderSp(<MyGroupPage />)

    expect(await screen.findByText("Only the head student of the group can see this page.")).toBeInTheDocument()
  })
})
