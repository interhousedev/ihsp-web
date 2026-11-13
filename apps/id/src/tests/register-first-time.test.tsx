import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { RegisterPage } from "../features/registration/components/register-page"
import { allowSlowTests, clickButton, fillField, findButton, renderId } from "./helpers"

allowSlowTests()

const LINK = /never logged into EMIS/i

describe("first-time EMIS registration", () => {
  test("sends the typed ID and the date of birth as the EMIS credentials", async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl("/v1/id/register/emis"), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(
          { type: "emis/auth-failed", title: "x", status: 401, message_key: "emis-auth-failed", params: {} },
          { status: 401 },
        )
      }),
    )
    renderId(<RegisterPage />, { route: "/register/" })
    await clickButton(LINK)
    await fillField("EMIS ID", " 12345 ")
    expect(((await findButton(/^Continue$/)) as HTMLButtonElement).disabled).toBe(true)
    await clickButton(/Pick a date/)
    const dialog = await screen.findByRole("dialog")
    const [month, year] = within(dialog).getAllByRole("combobox") as HTMLSelectElement[]
    fireEvent.change(year as HTMLSelectElement, { target: { value: "2009" } })
    fireEvent.change(month as HTMLSelectElement, { target: { value: "0" } })
    fireEvent.click(within(dialog).getByRole("button", { name: /January 28.*2009/ }))
    await clickButton(/^Continue$/)
    await screen.findByRole("alert")
    expect(sent).toEqual({ emis_login: "12345", emis_password: "28012009" })
  })

  test("a typed date of birth fills the value", async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl("/v1/id/register/emis"), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(
          { type: "emis/auth-failed", title: "x", status: 401, message_key: "emis-auth-failed", params: {} },
          { status: 401 },
        )
      }),
    )
    renderId(<RegisterPage />, { route: "/register/" })
    await clickButton(LINK)
    await fillField("EMIS ID", "12345")
    const field = (await screen.findByRole("textbox", { name: "Date of birth" })) as HTMLInputElement
    expect(field.inputMode).toBe("numeric")
    fireEvent.change(field, { target: { value: "28012009" } })
    expect(field.value).toBe("28.01.2009")
    await clickButton(/^Continue$/)
    await screen.findByRole("alert")
    expect(sent).toEqual({ emis_login: "12345", emis_password: "28012009" })
  })

  test("an impossible or out-of-range typed date is rejected", async () => {
    renderId(<RegisterPage />, { route: "/register/" })
    await clickButton(LINK)
    await fillField("EMIS ID", "12345")
    const field = (await screen.findByRole("textbox", { name: "Date of birth" })) as HTMLInputElement
    for (const bad of ["31022009", "01011949", "01012999"]) {
      fireEvent.change(field, { target: { value: bad } })
      expect(field).toHaveAttribute("aria-invalid", "true")
      expect(((await findButton(/^Continue$/)) as HTMLButtonElement).disabled).toBe(true)
    }
    fireEvent.change(field, { target: { value: "01012009" } })
    expect(field).toHaveAttribute("aria-invalid", "false")
    expect(((await findButton(/^Continue$/)) as HTMLButtonElement).disabled).toBe(false)
  })
})
