/** Hydra's `urls.error` page: fixed text only, whatever the link says. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { OAuthErrorPage } from "../features/oauth-error/components/oauth-error-page"
import { allowSlowTests, findHeading, findLink, renderId } from "./helpers"

allowSlowTests()

describe("OAuth error page", () => {
  test("explains a redirect mismatch and links to the connectors", async () => {
    renderId(<OAuthErrorPage />, {
      route: "/error/?error=invalid_request&error_description=The%20redirect_uri%20does%20not%20match",
    })

    expect(await findHeading("Could not finish connecting")).toBeInTheDocument()
    expect(screen.getByText(/redirect address that is not registered/)).toBeInTheDocument()
    expect(screen.getByText("Error code: invalid_request")).toBeInTheDocument()
    expect(await findLink("Open Connectors")).toBeInTheDocument()
  })

  test("never shows text taken from the link", async () => {
    renderId(<OAuthErrorPage />, {
      route: "/error/?error=Call%20this%20number&error_hint=Send%20your%20password%20to%20evil.example",
    })

    await findHeading("Could not finish connecting")
    expect(screen.queryByText(/evil\.example/)).toBeNull()
    expect(screen.queryByText(/Call this number/)).toBeNull()
  })
})
