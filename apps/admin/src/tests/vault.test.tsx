/** Vault: status, one key share per submit (input cleared), progress and the two error codes. */
import { describe, expect, test } from "bun:test"
import { screen, waitFor } from "@testing-library/react"
import { VaultPage } from "../features/vault/components/vault-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

async function submit(user: ReturnType<typeof renderAdmin>["user"], key: string): Promise<HTMLInputElement> {
  const input = (await screen.findByLabelText("Key share")) as HTMLInputElement
  await user.type(input, key)
  await user.type(screen.getByLabelText("Confirmation code"), "123456")
  await user.click(screen.getByRole("button", { name: "Send key share" }))
  return input
}

describe("vault page", () => {
  test("shows the sealed state and progress", async () => {
    renderAdmin(<VaultPage />, { route: "/vault/" })

    expect(await screen.findByText("Sealed")).toBeInTheDocument()
    expect(screen.getByTestId("vault-progress").textContent).toBe("0 of 3 key shares entered")
    const input = screen.getByLabelText("Key share") as HTMLInputElement
    expect(input.type).toBe("password")
    expect(input.autocomplete).toBe("off")
  })

  test("a share is cleared after submit and the progress grows", async () => {
    const { user } = renderAdmin(<VaultPage />, { route: "/vault/" })

    const input = await submit(user, "share-1")

    await waitFor(() => expect(screen.getByTestId("vault-progress").textContent).toBe("1 of 3 key shares entered"))
    expect(input.value).toBe("")
  })

  test("a rejected share shows its message and the input is cleared", async () => {
    const { user } = renderAdmin(<VaultPage />, { route: "/vault/" })

    const input = await submit(user, "rejected")

    expect(await screen.findByText("The key share was rejected.")).toBeInTheDocument()
    expect(input.value).toBe("")
  })

  test("an unavailable vault shows its message", async () => {
    const { user } = renderAdmin(<VaultPage />, { route: "/vault/" })

    await submit(user, "unavailable")

    expect(await screen.findByText("The vault is unavailable. Try again later.")).toBeInTheDocument()
  })
})
