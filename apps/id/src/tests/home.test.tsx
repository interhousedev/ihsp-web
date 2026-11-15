/** The entry page: log in or register, both keeping the Hydra challenge. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { HomePage } from "../features/home/components/home-page"
import { allowSlowTests, findButton, findLink, renderId } from "./helpers"
import "./redirect-mock"

allowSlowTests()

describe("home page", () => {
  test("shows the two buttons and carries the login challenge to both", async () => {
    renderId(<HomePage />, { route: "/?login_challenge=challenge-1" })

    expect(await findLink("I have an IHT ID account")).toHaveAttribute("href", "/login?login_challenge=challenge-1")
    expect(await findLink("Register with EMIS")).toHaveAttribute("href", "/register?login_challenge=challenge-1")
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument()
  })

  test("without a challenge the login button starts the OAuth login and registration is a plain link", async () => {
    renderId(<HomePage />, { route: "/" })

    expect(await findButton("I have an IHT ID account")).toBeInTheDocument()
    expect(await findLink("Register with EMIS")).toHaveAttribute("href", "/register")
  })
})
