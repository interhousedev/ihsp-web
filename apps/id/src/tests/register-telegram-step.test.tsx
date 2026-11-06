import { describe, expect, mock, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { RegisterTelegramStep } from "../features/registration/components/register-telegram-step"
import { allowSlowTests, clickButton, findButton, findLink, renderId } from "./helpers"

allowSlowTests()

describe("the mandatory Telegram step", () => {
  test("offers the one-time deep link and blocks Continue until linked", async () => {
    renderId(<RegisterTelegramStep code="abc" onContinue={() => {}} />)
    expect((await findLink(/Link Telegram/)).getAttribute("href")).toEndWith("?start=link_abc")
    expect(((await findButton("Continue")) as HTMLButtonElement).disabled).toBe(true)
  })

  test("Continue works once the bot has linked the account", async () => {
    server.use(http.post(apiUrl("/v1/id/register/telegram-status"), () => HttpResponse.json({ linked: true })))
    const onContinue = mock(() => {})
    renderId(<RegisterTelegramStep code="abc" onContinue={onContinue} />)
    await screen.findByText("Telegram is linked.")
    await clickButton("Continue")
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
