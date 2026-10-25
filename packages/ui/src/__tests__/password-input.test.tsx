import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { PasswordInput } from "../components/ui/password-input"

describe("PasswordInput", () => {
  it("hides the password by default and has a labelled eye button", () => {
    renderWithProviders(<PasswordInput aria-label="Password" defaultValue="secret" />)

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password")
    const toggle = screen.getByRole("button", { name: "Show password" })
    expect(toggle).toHaveAttribute("type", "button")
    expect(toggle).not.toHaveAttribute("aria-pressed") // the name changes instead; both would be announced twice
  })

  it("shows the password on click and hides it again", async () => {
    const { user } = renderWithProviders(<PasswordInput aria-label="Password" defaultValue="secret" />)

    await user.click(screen.getByRole("button", { name: "Show password" }))

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text")
    expect(screen.getByLabelText("Password")).toHaveValue("secret")
    const hide = screen.getByRole("button", { name: "Hide password" })

    await user.click(hide)

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password")
  })

  it("does not submit the form when the eye is pressed", async () => {
    let submitted = 0
    const { user } = renderWithProviders(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted += 1
        }}
      >
        <PasswordInput aria-label="Password" />
      </form>,
    )

    await user.click(screen.getByRole("button", { name: "Show password" }))

    expect(submitted).toBe(0)
  })

  it("keeps the touch target at 44 px", () => {
    renderWithProviders(<PasswordInput aria-label="Password" />)

    const toggle = screen.getByRole("button", { name: "Show password" })
    expect(toggle.className).toContain("size-11")
  })

  it("is labelled in Russian and Uzbek", () => {
    const ru = renderWithProviders(<PasswordInput aria-label="Пароль" />, { locale: "ru" })
    expect(screen.getByRole("button", { name: "Показать пароль" })).toBeInTheDocument()
    ru.unmount()

    renderWithProviders(<PasswordInput aria-label="Parol" />, { locale: "uz" })
    expect(screen.getByRole("button", { name: "Parolni koʻrsatish" })).toBeInTheDocument()
  })

  it("passes the usual input props through", () => {
    renderWithProviders(<PasswordInput aria-label="Password" autoComplete="current-password" disabled />)

    const input = screen.getByLabelText("Password")
    expect(input).toHaveAttribute("autocomplete", "current-password")
    expect(input).toBeDisabled()
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled()
  })
})
