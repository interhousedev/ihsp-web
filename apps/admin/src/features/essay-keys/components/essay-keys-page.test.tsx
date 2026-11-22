import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { EssayKeysStatus } from "@ihsp/api"
import { problem, renderWithProviders, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import adminMessages from "../../../../messages/en.json"
import { EssayKeysPage } from "./essay-keys-page"

const IDLE: EssayKeysStatus = {
  students_with_keys: 12,
  generation: 3,
  exported_at: null,
  exported_by: null,
  rotation: { state: "idle", total: 0, done: 0, unreadable: 0, started_at: null, finished_at: null },
}

const PASSPHRASE = "correct horse battery"

const originalCreate = URL.createObjectURL
let downloads: string[] = []

beforeEach(() => {
  downloads = []
  URL.createObjectURL = () => "blob:essay-keys"
  HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
    downloads.push(this.download)
  }
  server.use(http.get("*/v1/admin/essay-keys/status", () => HttpResponse.json(IDLE)))
})

afterEach(() => {
  URL.createObjectURL = originalCreate
})

describe("ESSAY KEYS page", () => {
  test("shows the status", async () => {
    renderWithProviders(<EssayKeysPage />, { messages: adminMessages })

    expect(await screen.findByTestId("essay-keys-students")).toHaveTextContent("12")
    expect(screen.getByTestId("essay-keys-generation")).toHaveTextContent("3")
    expect(screen.getByTestId("essay-keys-backup")).toHaveTextContent("No backup yet")
  })

  test("downloads the backup under the server filename", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post("*/v1/admin/essay-keys/backup", async ({ request }) => {
        bodies.push(await request.json())
        return new HttpResponse('{"keys":{}}', {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="essay-keys-g3.json"',
          },
        })
      }),
    )
    const { user } = renderWithProviders(<EssayKeysPage />, { messages: adminMessages })

    await screen.findByTestId("essay-keys-students")
    const submit = screen.getByRole("button", { name: "Download the backup" })
    expect(submit).toBeDisabled()
    await user.type(screen.getByLabelText("Passphrase"), PASSPHRASE)
    await user.type(screen.getByLabelText("Repeat the passphrase"), "different phrase!")
    expect(screen.getByText("The passphrases do not match")).toBeInTheDocument()
    expect(submit).toBeDisabled()
    await user.clear(screen.getByLabelText("Repeat the passphrase"))
    await user.type(screen.getByLabelText("Repeat the passphrase"), PASSPHRASE)
    await user.click(submit)

    await waitFor(() => expect(downloads).toEqual(["essay-keys-g3.json"]))
    expect(bodies).toEqual([{ passphrase: PASSPHRASE }])
  })

  test("says the generation is already backed up on 409", async () => {
    server.use(
      http.post("*/v1/admin/essay-keys/backup", () =>
        problem(409, "admission/essay_keys_backup_taken", "Backup taken"),
      ),
    )
    const { user } = renderWithProviders(<EssayKeysPage />, { messages: adminMessages })

    await screen.findByTestId("essay-keys-students")
    await user.type(screen.getByLabelText("Passphrase"), PASSPHRASE)
    await user.type(screen.getByLabelText("Repeat the passphrase"), PASSPHRASE)
    await user.click(screen.getByRole("button", { name: "Download the backup" }))

    expect(await screen.findByText("The keys are already backed up for this generation.")).toBeInTheDocument()
    expect(downloads).toEqual([])
  })

  test("restores from a file and shows restored, skipped and conflicts", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post("*/v1/admin/essay-keys/restore", async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({
          restored: 4,
          skipped: 2,
          conflicts: ["11111111-1111-4111-8111-111111111111"],
        })
      }),
    )
    const { user } = renderWithProviders(<EssayKeysPage />, { messages: adminMessages })

    await screen.findByTestId("essay-keys-students")
    await user.upload(
      screen.getByLabelText("Backup file (JSON)"),
      new File(['{"keys":{"a":"b"}}'], "backup.json", { type: "application/json" }),
    )
    await user.type(screen.getByLabelText("Backup passphrase"), PASSPHRASE)
    await user.click(screen.getByRole("button", { name: "Restore the keys" }))

    const result = await screen.findByTestId("essay-keys-restore-result")
    expect(result).toHaveTextContent("Restored: 4")
    expect(result).toHaveTextContent("Skipped (already present): 2")
    expect(result).toHaveTextContent("11111111-1111-4111-8111-111111111111")
    expect(bodies).toEqual([{ backup: { keys: { a: "b" } }, passphrase: PASSPHRASE }])
  })

  test("rotates only after the confirmation", async () => {
    let calls = 0
    server.use(
      http.post("*/v1/admin/essay-keys/rotate", () => {
        calls += 1
        return HttpResponse.json(
          { ...IDLE, rotation: { ...IDLE.rotation, state: "running", total: 10, done: 2 } },
          { status: 202 },
        )
      }),
    )
    const { user } = renderWithProviders(<EssayKeysPage />, { messages: adminMessages })

    await screen.findByTestId("essay-keys-students")
    await user.click(screen.getByRole("button", { name: "Rotate the keys" }))
    expect(await screen.findByText(/take a new backup straight away/)).toBeInTheDocument()
    expect(calls).toBe(0)
    await user.click(screen.getByRole("button", { name: "Rotate" }))

    await waitFor(() => expect(calls).toBe(1))
    expect(await screen.findByText("2 of 10 essays re-encrypted")).toBeInTheDocument()
  })
})
