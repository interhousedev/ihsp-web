import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ChangeEmisPasswordForm } from "../features/security/components/change-emis-password-form"
import { allowSlowTests, clickButton, fillField, findButton, LOGGED_IN, renderId } from "./helpers"

allowSlowTests()

async function fillAll() {
  await fillField("Current EMIS password", "old-pass")
  await fillField("New password", "new-pass")
  await fillField("Repeat the password", "new-pass")
  await fillField("Current password", "account-pass")
}

describe("ChangeEmisPasswordForm", () => {
  test("stays disabled until the repeated password matches", async () => {
    renderId(<ChangeEmisPasswordForm />, { session: LOGGED_IN })
    await fillAll()
    await fillField("Repeat the password", "other")
    expect(screen.getByRole("alert").textContent).toContain("do not match")
    expect(((await findButton(/change the password/i)) as HTMLButtonElement).disabled).toBe(true)
  })

  test("sends the account password as the second factor and reports success", async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl("/v1/id/me/emis-password/change"), async ({ request }) => {
        sent = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderId(<ChangeEmisPasswordForm />, { session: LOGGED_IN })
    await fillAll()
    await clickButton(/change the password/i)
    await screen.findByText(/was changed/i)
    expect(sent).toEqual({
      current_emis_password: "old-pass",
      new_emis_password: "new-pass",
      account_password: "account-pass",
    })
  })

  test("shows the error when EMIS refuses the current password", async () => {
    server.use(
      http.post(apiUrl("/v1/id/me/emis-password/change"), () =>
        HttpResponse.json(
          {
            type: "id/wrong-emis-password",
            title: "x",
            status: 403,
            message_key: "id-wrong-emis-password",
            params: {},
          },
          { status: 403 },
        ),
      ),
    )
    renderId(<ChangeEmisPasswordForm />, { session: LOGGED_IN })
    await fillAll()
    await clickButton(/change the password/i)
    await screen.findByText(/current emis password is wrong/i)
  })
})
