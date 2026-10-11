/** UF-ID-09 step 2: the code sent to the new recovery email. */
import { describe, expect, mock, test } from "bun:test"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EmailCodeStep } from "../features/security/components/email-code-step"
import { clickButton, fillField, renderId, allowSlowTests } from "./helpers"
import { problem } from "./problem"

allowSlowTests()

const values = { password: "Secret123", email: "new@example.org" }

describe("EmailCodeStep", () => {
  test("names the address, confirms the code and reports the changed user", async () => {
    let body = null as { code: string } | null
    const changed = { ...userMe, recovery_email: values.email }
    server.use(
      http.post(apiUrl("/v1/id/me/email/change/confirm"), async ({ request }) => {
        body = (await request.json()) as { code: string }
        return HttpResponse.json(changed)
      }),
    )
    const onChanged = mock(() => undefined)
    renderId(<EmailCodeStep values={values} onBack={() => undefined} onChanged={onChanged} />)

    expect(await screen.findByText("We sent a 6-digit code to new@example.org.")).toBeInTheDocument()
    await fillField("Code", "654321")
    await clickButton("Confirm the change")

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
    expect(body).toEqual({ code: "654321" })
    expect((onChanged.mock.calls[0] as unknown[])[0]).toEqual(changed)
  })

  test("a short code is rejected before any request", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/id/me/email/change/confirm"), () => {
        called = true
        return HttpResponse.json(userMe)
      }),
    )
    renderId(<EmailCodeStep values={values} onBack={() => undefined} onChanged={() => undefined} />)

    await fillField("Code", "123")
    await clickButton("Confirm the change")

    expect(await screen.findByText("Enter the 6-digit code.")).toBeInTheDocument()
    expect(called).toBe(false)
  })

  test("a wrong code shows the error and does not report success", async () => {
    server.use(
      http.post(apiUrl("/v1/id/me/email/change/confirm"), () => problem(401, "auth/otp-invalid", { attempts_left: 1 })),
    )
    const onChanged = mock(() => undefined)
    renderId(<EmailCodeStep values={values} onBack={() => undefined} onChanged={onChanged} />)

    await fillField("Code", "000000")
    await clickButton("Confirm the change")

    expect(await screen.findByText("Wrong code. Attempts left: 1.")).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })

  test("Change the email calls onBack", async () => {
    const onBack = mock(() => undefined)
    renderId(<EmailCodeStep values={values} onBack={onBack} onChanged={() => undefined} />)

    await clickButton("Change the email")

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
