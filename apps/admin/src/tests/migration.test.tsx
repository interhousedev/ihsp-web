/** Server migration: start with a step-up code, progress, rollback with confirm, completed state. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, setAdminMigration } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MigrationPage } from "../features/migration/components/migration-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const TOKEN = `ihsp-pair-v1.${"a".repeat(60)}`

describe("migration page", () => {
  test("starts a migration with the step-up code and shows progress", async () => {
    let posted: Record<string, unknown> | undefined
    server.use(
      http.post(apiUrl("/v1/admin/migration/start"), async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>
        setAdminMigration({ phase: "queued", migration_id: "mig-1", target_host: "10.0.0.5", target_port: 22 })
        return HttpResponse.json({
          configured: true,
          phase: "queued",
          steps: [{ key: "stop_services", state: "pending" }],
        })
      }),
    )
    const { user } = renderAdmin(<MigrationPage />, { route: "/migration/" })

    await user.type(await screen.findByLabelText("Target host"), "10.0.0.5")
    await user.type(screen.getByLabelText("Pairing token"), TOKEN)
    await user.click(screen.getByRole("button", { name: "Start the migration" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.type(within(dialog).getByLabelText("Confirmation code"), "123456")
    await user.click(within(dialog).getByRole("button", { name: "Start the migration" }))

    await waitFor(() =>
      expect(posted).toMatchObject({
        target_host: "10.0.0.5",
        target_port: 22,
        pairing_token: TOKEN,
        otp_code: "123456",
      }),
    )
    expect((await screen.findByTestId("migration-phase")).textContent).toBe("Queued")
    expect(screen.getByTestId("step-stop_services")).toBeInTheDocument()
  })

  test("shows the steps of a running migration", async () => {
    setAdminMigration({
      phase: "running",
      migration_id: "mig-1",
      target_host: "10.0.0.5",
      target_port: 22,
      steps: [
        { key: "stop_services", state: "done" },
        { key: "dump_postgres", state: "running" },
        { key: "snapshot_redis", state: "pending" },
      ],
    })
    renderAdmin(<MigrationPage />, { route: "/migration/" })

    expect((await screen.findByTestId("migration-phase")).textContent).toBe("Running")
    expect(within(screen.getByTestId("step-stop_services")).getByText("Done")).toBeInTheDocument()
    expect(within(screen.getByTestId("step-dump_postgres")).getByText("In progress")).toBeInTheDocument()
    expect(screen.queryByLabelText("Pairing token")).toBeNull()
  })

  test("rolls back after confirmation and returns to the start form", async () => {
    setAdminMigration({ phase: "running", migration_id: "mig-1", target_host: "10.0.0.5", target_port: 22 })
    let posted: unknown
    server.use(
      http.post(apiUrl("/v1/admin/migration/rollback"), async ({ request }) => {
        posted = await request.json()
        setAdminMigration({ phase: "idle", migration_id: null })
        return HttpResponse.json({ configured: true, phase: "idle", steps: [] })
      }),
    )
    const { user } = renderAdmin(<MigrationPage />, { route: "/migration/" })

    await user.click(await screen.findByRole("button", { name: "Roll back" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.type(within(dialog).getByLabelText("Confirmation code"), "123456")
    await user.click(within(dialog).getByRole("button", { name: "Roll back" }))

    await waitFor(() => expect(posted).toMatchObject({ otp_code: "123456" }))
    expect(await screen.findByLabelText("Pairing token")).toBeInTheDocument()
  })

  test("a completed migration links to the new server", async () => {
    setAdminMigration({
      phase: "completed",
      migration_id: "mig-1",
      target_host: "10.0.0.5",
      target_port: 22,
      target_url: "https://new.example",
    })
    renderAdmin(<MigrationPage />, { route: "/migration/" })

    const done = await screen.findByTestId("migration-completed")
    const link = within(done).getByRole("link", { name: "Open the new server" })
    expect(link.getAttribute("href")).toBe("https://new.example")
  })
})
