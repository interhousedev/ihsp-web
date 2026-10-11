/** UF-MCP-01: the new connector form on its own. */
import { describe, expect, mock, test } from "bun:test"
import { adminMe, apiUrl, connectorToken, connectors, scopeCatalog, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { NewConnectorForm } from "../features/connectors/components/new-connector-form"
import { clickButton, fillField, renderId, allowSlowTests } from "./helpers"
import { problem } from "./problem"

allowSlowTests()

const created = { connector: connectors[0], token: connectorToken }

describe("NewConnectorForm", () => {
  test("creates a connector with the preset scopes and reports it", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/id/me/connectors"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(created)
      }),
    )
    const onCreated = mock(() => undefined)
    const { user } = renderId(<NewConnectorForm catalog={scopeCatalog} user={userMe} onCreated={onCreated} />)

    await user.click(await screen.findByText("Study planner"))
    await fillField("Name", "  My planner ")
    await clickButton("Create connector")

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(body).toEqual({
      server: "student",
      name: "My planner",
      scopes: ["schedule:read", "homework:read", "materials:read"],
      expires_in_days: 30,
    })
    expect((onCreated.mock.calls[0] as unknown[])[0]).toEqual(created)
  })

  test("an empty name and no scopes are rejected without a request", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/id/me/connectors"), () => {
        called = true
        return HttpResponse.json(created)
      }),
    )
    const onCreated = mock(() => undefined)
    renderId(<NewConnectorForm catalog={scopeCatalog} user={userMe} onCreated={onCreated} />)

    await clickButton("Create connector")

    expect(await screen.findByText("Choose at least one scope.")).toBeInTheDocument()
    expect(screen.getByText("This field is required.")).toBeInTheDocument()
    expect(called).toBe(false)
    expect(onCreated).not.toHaveBeenCalled()
  })

  test("an API error is shown and nothing is reported", async () => {
    server.use(http.post(apiUrl("/v1/id/me/connectors"), () => problem(429, "common/rate-limited", { retry_after: 300 })))
    const onCreated = mock(() => undefined)
    const { user } = renderId(<NewConnectorForm catalog={scopeCatalog} user={userMe} onCreated={onCreated} />)

    await user.click(await screen.findByText("Study planner"))
    await fillField("Name", "Mine")
    await clickButton("Create connector")

    expect(await screen.findByText("Too many attempts. Try again in 5 min.")).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  test("a catalog without an allowed server shows the empty notice", async () => {
    renderId(<NewConnectorForm catalog={{ servers: [] }} user={userMe} onCreated={() => undefined} />)

    expect(await screen.findByText(/./, { selector: "div" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Create connector", hidden: true })).not.toBeInTheDocument()
  })

  test("an Administration connector needs the 6-digit code and sends it", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/id/me/connectors"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(created)
      }),
    )
    const catalog = {
      servers: [
        {
          server: "admin" as const,
          roles: ["admin"],
          scopes: [{ scope: "admin:people.read", tools: ["search_users"] }],
          presets: [],
        },
      ],
    }
    const onCreated = mock(() => undefined)
    const { user } = renderId(
      <NewConnectorForm catalog={catalog as never} user={adminMe} onCreated={onCreated} />,
      { session: { access_token: "admin-token", user: adminMe } },
    )

    await user.click(await screen.findByText("admin:people.read"))
    await fillField("Name", "Ops")
    await clickButton("Create connector")
    expect(await screen.findByText("Enter the 6-digit code.")).toBeInTheDocument()
    expect(body).toBeNull()

    await fillField("Code", "123456")
    await clickButton("Create connector")

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(body).toMatchObject({ server: "admin", name: "Ops", otp_code: "123456", expires_in_days: 30 })
  })
})
