/** Monitoring → Processes: worker jobs with their progress, and stopping one. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ProcessesTab } from "../features/monitoring/components/processes-tab"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

describe("processes", () => {
  test("lists the running job with its progress", async () => {
    renderAdmin(<ProcessesTab />)

    expect(await screen.findByText("EMIS materials 2026-2027/1")).toBeInTheDocument()
    expect(screen.getByText(/3 \/ 12 · files: 41 · links: 5/)).toBeInTheDocument()
    expect(screen.getByText("Running")).toBeInTheDocument()
  })

  test("Stop asks the backend to cancel the job", async () => {
    let cancelled: string | undefined
    server.use(
      http.post(apiUrl("/v1/admin/jobs/:id/cancel"), ({ params }) => {
        cancelled = String(params.id)
        return HttpResponse.json({})
      }),
    )
    renderAdmin(<ProcessesTab />)

    fireEvent.click(await screen.findByRole("button", { name: "Stop EMIS materials 2026-2027/1" }))

    await waitUntil(() => cancelled !== undefined)
    expect(cancelled).toBe("job-1")
  })

  test("an empty list says so", async () => {
    server.use(http.get(apiUrl("/v1/admin/jobs"), () => HttpResponse.json({ items: [] })))
    renderAdmin(<ProcessesTab />)

    expect(await screen.findByText("No processes are running.")).toBeInTheDocument()
  })
})
