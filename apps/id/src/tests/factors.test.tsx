/** The authenticator app (TOTP) and passkeys: login steps and the security settings pages. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { currentFactors, loginResultRedirect, setFactorsState, TOTP_TEST_RECOVERY_CODES } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { LoginPage } from "../features/login/components/login-page"
import { PasskeysPage } from "../features/security/components/passkeys-page"
import { TotpSettingsPage } from "../features/security/components/totp-settings-page"
import { clickButton, fillField, findButton, findHeading, LOGGED_IN, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

const ROUTE = "/login/?login_challenge=challenge-1"
const bytes = (...values: number[]) => new Uint8Array(values).buffer

/** A fake PublicKeyCredential as navigator.credentials returns it. */
function fakeCredential(kind: "get" | "create") {
  return {
    id: "AQI",
    rawId: bytes(1, 2),
    type: "public-key",
    authenticatorAttachment: "platform",
    getClientExtensionResults: () => ({}),
    response:
      kind === "get"
        ? { clientDataJSON: bytes(3), authenticatorData: bytes(4), signature: bytes(5), userHandle: bytes(6) }
        : { clientDataJSON: bytes(3), attestationObject: bytes(7), getTransports: () => ["internal"] },
  }
}

const credentials = { get: mock(async () => fakeCredential("get")), create: mock(async () => fakeCredential("create")) }
const win = window as unknown as Record<string, unknown>
function PublicKeyCredential() {}

beforeEach(() => {
  redirectToMock.mockClear()
  credentials.get.mockClear()
  credentials.create.mockClear()
  win.PublicKeyCredential = PublicKeyCredential
  Object.defineProperty(navigator, "credentials", { value: credentials, configurable: true })
})

afterEach(() => {
  delete win.PublicKeyCredential
})

describe("login", () => {
  test("Sign in with a passkey asks the browser and follows redirect_to", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await clickButton("Sign in with a passkey")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
    expect(credentials.get).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText("Login or EMIS login").getAttribute("autocomplete")).toBe("username webauthn")
  })

  test("without WebAuthn the passkey button is hidden", async () => {
    delete win.PublicKeyCredential
    renderId(<LoginPage />, { route: ROUTE })

    await screen.findByLabelText("Password")
    expect(screen.queryByRole("button", { name: "Sign in with a passkey", hidden: true })).not.toBeInTheDocument()
  })

  test("an account with the authenticator app asks for its code, also a recovery code", async () => {
    renderId(<LoginPage />, { route: ROUTE })
    await fillField("Login or EMIS login", "totp.user")
    await fillField("Password", "Secret123")
    await clickButton("Log in")

    await findHeading("Enter the code from the app")
    await fillField("Code from the app", "000000")
    await clickButton("Confirm")
    expect(await screen.findByText("Wrong code. Attempts left: 4.")).toBeInTheDocument()

    await clickButton("Use a recovery code")
    await fillField("Recovery code", "k7mqa-2xpab")
    await clickButton("Confirm")
    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
  })
})

describe("authenticator app settings", () => {
  test("setup shows the QR code and key, confirms a code and shows the recovery codes once", async () => {
    renderId(<TotpSettingsPage />, { route: "/security/totp/", session: LOGGED_IN })

    await clickButton("Set up")
    expect(
      await screen.findByRole("img", { name: "QR code for the authenticator app", hidden: true }),
    ).toBeInTheDocument()
    expect(screen.getByTestId("totp-secret").textContent).toContain("JBSW Y3DP")
    await fillField("Code from the app", "123456")
    await clickButton("Turn on")

    expect(
      await screen.findByText(
        "Each code works once if you lose your phone. Save them somewhere safe: they are shown only now.",
      ),
    ).toBeInTheDocument()
    for (const code of TOTP_TEST_RECOVERY_CODES) expect(screen.getByText(code)).toBeInTheDocument()
    await clickButton("I saved the codes")
    expect(await screen.findByText("The authenticator app is on. Recovery codes left: 3.")).toBeInTheDocument()
  })

  test("turning it off needs a valid code", async () => {
    setFactorsState({ totp_enabled: true, recovery_codes_left: 5 })
    renderId(<TotpSettingsPage />, { route: "/security/totp/", session: LOGGED_IN })

    await fillField("Code from the app", "000000")
    await clickButton("Turn off")
    expect(await screen.findByText("Wrong code. Attempts left: 4.")).toBeInTheDocument()
    await fillField("Code from the app", "654321")
    await clickButton("Turn off")

    await findButton("Set up")
    expect(currentFactors().totp_enabled).toBe(false)
  })
})

describe("passkeys settings", () => {
  test("lists, adds, renames and removes passkeys (with a confirmation)", async () => {
    renderId(<PasskeysPage />, { route: "/security/passkeys/", session: LOGGED_IN })

    expect(await screen.findByText("MacBook")).toBeInTheDocument()
    await clickButton("Add a passkey")
    await waitFor(() => expect(currentFactors().passkeys).toHaveLength(2))
    expect(credentials.create).toHaveBeenCalledTimes(1)

    const [renameFirst] = await screen.findAllByRole("button", { name: "Rename", hidden: true })
    fireEvent.click(renameFirst!)
    await fillField("Passkey name", "Work laptop")
    await clickButton("Save")
    expect(await screen.findByText("Work laptop")).toBeInTheDocument()

    const [removeFirst] = await screen.findAllByRole("button", { name: "Remove", hidden: true })
    fireEvent.click(removeFirst!)
    await findHeading('Remove the passkey "Work laptop"?')
    const dialogButtons = await screen.findAllByRole("button", { name: "Remove", hidden: true })
    fireEvent.click(dialogButtons.at(-1)!)
    await waitFor(() => expect(currentFactors().passkeys.map((p) => p.name)).not.toContain("Work laptop"))
  })

  test("password sign-in can be turned off only with a passkey", async () => {
    setFactorsState({ passkeys: [] })
    const view = renderId(<PasskeysPage />, { route: "/security/passkeys/", session: LOGGED_IN })
    expect(await findButton("Turn off password sign-in")).toBeDisabled()
    view.unmount()

    setFactorsState({ passkeys: [{ ...currentPasskey(), id: "p1" }] })
    renderId(<PasskeysPage />, { route: "/security/passkeys/", session: LOGGED_IN })
    await clickButton("Turn off password sign-in")
    await findHeading("Sign in with passkeys only?")
    const buttons = await screen.findAllByRole("button", { name: "Turn off password sign-in", hidden: true })
    fireEvent.click(buttons.at(-1)!)

    expect(await screen.findByText(/Password sign-in is off: only passkeys work/)).toBeInTheDocument()
    expect(currentFactors().password_login_enabled).toBe(false)
  })
})

function currentPasskey() {
  return {
    id: "x",
    name: "Phone",
    transports: ["hybrid"],
    backed_up: true,
    created_at: "2026-09-01T08:00:00Z",
    last_used_at: null,
  }
}
