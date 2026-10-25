/** Pick your name: group, then name, then EMIS password; the numeric EMIS login is never shown or sent. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { RegisterPage } from "../features/registration/components/register-page"
import { allowSlowTests, clickButton, fillField, renderId } from "./helpers"

allowSlowTests()

const start = {
  registration_token: "reg-token",
  profile: {
    first_name: "Ali",
    last_name: "Aliyev",
    middle_name: null,
    group_name: "2TN2",
    login: "20240123456",
  },
  imported_match: null,
}

describe("registration by picking a name", () => {
  test("RC-PICK-01 picks a group and a name, asks the EMIS password, then continues without showing the login", async () => {
    let cueBody = null as Record<string, unknown> | null
    let namesPath = ""
    server.use(
      http.get(apiUrl("/v1/id/login-cues/groups"), () => HttpResponse.json([{ group_id: "g-2tn2", name: "2TN2" }])),
      http.get(apiUrl("/v1/id/login-cues/groups/:groupId"), ({ request }) => {
        namesPath = new URL(request.url).pathname
        return HttpResponse.json([{ cue_id: "cue-7", display_name: "Aliyev Ali" }])
      }),
      http.post(apiUrl("/v1/id/register/emis/cue"), async ({ request }) => {
        cueBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(start)
      }),
    )
    const { user } = renderId(<RegisterPage />, { route: "/register/" })

    await user.click(await screen.findByRole("button", { name: "Pick my name from a list" }))
    const select = await screen.findByLabelText("Group")
    await waitFor(() => expect(screen.getByRole("option", { name: "2TN2" })).toBeInTheDocument())
    fireEvent.change(select, { target: { value: "g-2tn2" } })
    await clickButton("Continue")

    await user.click(await screen.findByRole("button", { name: "Aliyev Ali" }))
    await fillField("EMIS password", "emis-secret")
    await clickButton("Continue")

    await waitFor(() => expect(cueBody).not.toBeNull())
    expect(cueBody).toEqual({ cue_id: "cue-7", emis_password: "emis-secret" })
    expect(namesPath).toBe("/v1/id/login-cues/groups/g-2tn2")
    expect(await screen.findByRole("heading", { name: "Is this you?" })).toBeInTheDocument()
    expect(screen.queryByText("20240123456")).toBeNull()
  })
})
