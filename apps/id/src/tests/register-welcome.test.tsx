/** The welcome screen shown once after registration. */
import { describe, expect, mock, test } from "bun:test"
import { getConfig } from "@ihsp/config"
import { RegisterWelcome } from "../features/registration/components/register-welcome"
import { clickButton, findHeading, findLink, renderId } from "./helpers"

describe("registration welcome", () => {
  test("explains IHT ID, suggests Telegram, library and LMS, and Continue resumes", async () => {
    const onContinue = mock(() => {})
    renderId(<RegisterWelcome onContinue={onContinue} />, { route: "/register/" })

    await findHeading("Welcome to IHT ID")
    expect((await findLink("Connect Telegram")).getAttribute("href")).toBe("/security/telegram/")
    expect((await findLink("Open library")).getAttribute("href")).toStartWith(
      getConfig().LIBRARY_URL ?? "https://lib.ihsu.uz",
    )
    expect((await findLink("Open LMS")).getAttribute("href")).toStartWith(getConfig().LMS_URL)

    await clickButton("Continue")
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
