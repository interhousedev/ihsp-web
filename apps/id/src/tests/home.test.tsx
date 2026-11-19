/** The entry page: log in or register, both keeping the Hydra challenge. */
import { describe, expect, test } from "bun:test"
import { screen, waitFor } from "@testing-library/react"
import { HomePage } from "../features/home/components/home-page"
import { LOGGED_IN, allowSlowTests, findButton, findLink, renderId } from "./helpers"
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

  test("a signed-in user does not see the anonymous page", async () => {
    renderId(<HomePage />, { route: "/", session: LOGGED_IN })

    await waitFor(() => expect(screen.queryByText("I have an IHT ID account")).not.toBeInTheDocument())
    expect(screen.queryByText("Register with EMIS")).not.toBeInTheDocument()
  })
})
