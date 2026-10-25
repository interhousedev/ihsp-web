/** UF-MCP-02, MCP-3: the consent page of MCP clients. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, consentInfo, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ConsentPage } from "../features/consent/components/consent-page"
import { clickButton, findHeading, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

const ROUTE = "/consent/?consent_challenge=consent-1"

describe("consent page", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("shows the client as unverified with its redirect domain, server and one checkbox per scope", async () => {
    renderId(<ConsentPage />, { route: ROUTE })

    await findHeading("Allow Claude Desktop?")

    expect(screen.getByText("Unverified")).toBeInTheDocument()
    expect(screen.getByText("claude.ai")).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(document.querySelectorAll('[role="checkbox"]')).toHaveLength(consentInfo.requested_scopes.length)
    expect(screen.getByRole("checkbox", { name: /schedule:read/, hidden: true })).toBeInTheDocument()
  })

  test("allowing sends only the scopes that stay ticked", async () => {
    let body = null as { consent_challenge: string; accept: boolean; grant_scopes: string[] } | null
    server.use(
      http.post(apiUrl("/v1/id/consent"), async ({ request }) => {
        body = (await request.json()) as { consent_challenge: string; accept: boolean; grant_scopes: string[] }
        return HttpResponse.json({ redirect_to: "http://localhost:4444/oauth2/auth?consent_verifier=ok" })
      }),
    )
    const { user } = renderId(<ConsentPage />, { route: ROUTE })
    await findHeading("Allow Claude Desktop?")

    await user.click(screen.getByRole("checkbox", { name: /marks:read/, hidden: true }))
    await clickButton("Allow")

    await waitFor(() =>
      expect(redirectToMock).toHaveBeenCalledWith("http://localhost:4444/oauth2/auth?consent_verifier=ok"),
    )
    expect(body).toEqual({ consent_challenge: "consent-1", accept: true, grant_scopes: ["schedule:read"] })
  })

  test("denying sends accept=false and follows the redirect", async () => {
    renderId(<ConsentPage />, { route: ROUTE })
    await findHeading("Allow Claude Desktop?")

    await clickButton("Deny")

    await waitFor(() =>
      expect(redirectToMock).toHaveBeenCalledWith("http://localhost:4444/oauth2/auth?error=access_denied"),
    )
  })

  test("a first-party client (redirect_to set) is followed without showing the form", async () => {
    server.use(
      http.get(apiUrl("/v1/id/consent"), () =>
        HttpResponse.json({ ...consentInfo, redirect_to: "http://localhost:4444/oauth2/auth?consent_verifier=auto" }),
      ),
    )
    renderId(<ConsentPage />, { route: ROUTE })

    await waitFor(() =>
      expect(redirectToMock).toHaveBeenCalledWith("http://localhost:4444/oauth2/auth?consent_verifier=auto"),
    )
    expect(screen.queryByText("Unverified")).not.toBeInTheDocument()
  })

  test("an Administration server asks for a confirmation code before Allow is possible", async () => {
    server.use(
      http.get(apiUrl("/v1/id/consent"), () =>
        HttpResponse.json({
          ...consentInfo,
          server: "admin",
          requires_otp: true,
          requested_scopes: ["admin:people.read"],
        }),
      ),
    )
    renderId(<ConsentPage />, { route: ROUTE })
    await findHeading("Allow Claude Desktop?")

    const allow = await screen.findByRole("button", { name: "Allow", hidden: true })

    expect(screen.getByText("Administration access needs a confirmation code.")).toBeInTheDocument()
    expect(allow).toBeDisabled()
  })

  test("Send code of an Administration consent posts the consent challenge (no session needed)", async () => {
    let body = null as { consent_challenge: string } | null
    server.use(
      http.get(apiUrl("/v1/id/consent"), () =>
        HttpResponse.json({ ...consentInfo, server: "admin", requires_otp: true, requested_scopes: ["people:read"] }),
      ),
      http.post(apiUrl("/v1/id/consent/otp"), async ({ request }) => {
        body = (await request.json()) as { consent_challenge: string }
        return new HttpResponse(null, { status: 202 })
      }),
    )
    renderId(<ConsentPage />, { route: ROUTE })
    await findHeading("Allow Claude Desktop?")

    await clickButton("Send code")

    expect(await screen.findByText("We sent a code to your OTP channels.")).toBeInTheDocument()
    expect(body).toEqual({ consent_challenge: "consent-1" })
  })
})
