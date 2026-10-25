/** UF-BOT-01, ID-19, ID-20: the login page of the bot's mini app. */
import { beforeEach, describe, expect, test } from "bun:test"
import { getConfig } from "@ihsp/config"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TelegramLoginPage } from "../features/telegram-login/components/telegram-login-page"
import { TELEGRAM_INIT_DATA_KEY } from "../features/shared/utils/storage"
import { clickButton, fillField, findHeading, findLink, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"
import { initDataMock } from "./telegram-mock"

allowSlowTests()

type LoginBody = { init_data: string; login: string; password?: string; otp_code?: string }

describe("mini app login", () => {
  beforeEach(() => {
    initDataMock.mockReset()
    initDataMock.mockReturnValue(undefined)
    redirectToMock.mockClear()
  })

  test("outside Telegram it tells the user to open the page from the bot", async () => {
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    await findHeading("Open this page from the bot")

    expect(
      screen.getByText("Telegram signs the data this page needs. Open the page from @ihspbot."),
    ).toBeInTheDocument()
    expect((await findLink("Open @ihspbot")).getAttribute("href")).toBe("https://t.me/ihspbot")
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument()
  })

  test("inside Telegram it posts the signed init_data with the login and opens my.iht", async () => {
    let body = null as LoginBody | null
    initDataMock.mockReturnValue("signed-init-data")
    server.use(
      http.post(apiUrl("/v1/id/telegram/login"), async ({ request }) => {
        body = (await request.json()) as LoginBody
        return HttpResponse.json({ linked: true, login: "brastilov.aleksey" })
      }),
    )
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    await fillField("Login or EMIS login", "brastilov.aleksey")
    await fillField("Password", "Secret123")
    await clickButton("Log in")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(getConfig().SP_URL))
    expect(body).toEqual({ init_data: "signed-init-data", login: "brastilov.aleksey", password: "Secret123" })
  })

  test("an account that is already linked goes straight to my.iht", async () => {
    initDataMock.mockReturnValue("linked")
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(getConfig().SP_URL))
    expect(screen.queryByText("Logged in")).not.toBeInTheDocument()
  })

  test("expired init_data asks the user to press Log in in the bot again", async () => {
    initDataMock.mockReturnValue("old-init-data")
    server.use(
      http.post(apiUrl("/v1/id/telegram/status"), () =>
        HttpResponse.json(
          { type: "auth/unauthorized", title: "Expired", status: 401 },
          { status: 401, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    expect(await findHeading("Press Log in in the bot again")).toBeInTheDocument()
  })

  test("a second factor asks for the code and sends it with the password", async () => {
    const bodies: LoginBody[] = []
    initDataMock.mockReturnValue("signed-init-data")
    server.use(
      http.post(apiUrl("/v1/id/telegram/login"), async ({ request }) => {
        const body = (await request.json()) as LoginBody
        bodies.push(body)
        if (!body.otp_code) {
          return HttpResponse.json({
            redirect_to: null,
            second_factor: { method: "otp", ticket: "t-1", channels: ["telegram"] },
          })
        }
        return HttpResponse.json({ linked: true, login: body.login })
      }),
    )
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    await fillField("Login or EMIS login", "admin.ihsp")
    await fillField("Password", "Secret123")
    await clickButton("Log in")
    await findHeading("Enter the code")
    await fillField("Code", "654321")
    await clickButton("Confirm")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(getConfig().SP_URL))
    expect(bodies.at(-1)).toEqual({
      init_data: "signed-init-data",
      login: "admin.ihsp",
      password: "Secret123",
      otp_code: "654321",
    })
  })

  test("a Telegram account linked elsewhere shows the conflict", async () => {
    initDataMock.mockReturnValue("signed-init-data")
    server.use(
      http.post(apiUrl("/v1/id/telegram/login"), () =>
        HttpResponse.json(
          { type: "telegram/linked-elsewhere", title: "Linked", status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    await fillField("Login or EMIS login", "brastilov.aleksey")
    await fillField("Password", "Secret123")
    await clickButton("Log in")

    expect(await screen.findByText(/already linked to another IHT account/)).toBeInTheDocument()
  })

  test("the registration link keeps init_data for the way back", async () => {
    initDataMock.mockReturnValue("signed-init-data")
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    const link = await findLink("Register with EMIS")

    expect(link.getAttribute("href")).toMatch(/^\/register\/?$/)
    await waitFor(() => expect(window.sessionStorage.getItem(TELEGRAM_INIT_DATA_KEY)).toBe("signed-init-data"))
  })

  test("passwordless OTP asks for the code with init_data instead of a Hydra challenge", async () => {
    let requested = null as { init_data: string; login: string } | null
    const bodies: LoginBody[] = []
    initDataMock.mockReturnValue("signed-init-data")
    server.use(
      http.post(apiUrl("/v1/id/telegram/otp/request"), async ({ request }) => {
        requested = (await request.json()) as { init_data: string; login: string }
        return HttpResponse.json({ sent: true }, { status: 202 })
      }),
      http.post(apiUrl("/v1/id/telegram/login"), async ({ request }) => {
        bodies.push((await request.json()) as LoginBody)
        return HttpResponse.json({ linked: true, login: "brastilov.aleksey" })
      }),
    )
    renderId(<TelegramLoginPage />, { route: "/telegram/" })

    await clickButton("Log in with OTP")
    await fillField("Login or EMIS login", "brastilov.aleksey")
    await clickButton("Send code")
    await findHeading("Enter the code")
    await fillField("Code", "123456")
    await clickButton("Confirm")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(getConfig().SP_URL))
    expect(requested).toEqual({ init_data: "signed-init-data", login: "brastilov.aleksey" })
    expect(bodies.at(-1)).toEqual({ init_data: "signed-init-data", login: "brastilov.aleksey", otp_code: "123456" })
  })
})
