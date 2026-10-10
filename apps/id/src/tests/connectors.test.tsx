/** UF-MCP-01, UF-MCP-04, MCP-2, MCP-4: MCP connectors. */
import { describe, expect, test } from "bun:test"
import { adminMe, apiUrl, connectorToken, connectors, scopeCatalog, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ConnectorsPage } from "../features/connectors/components/connectors-page"
import { NewConnectorPage } from "../features/connectors/components/new-connector-page"
import { expiryOptions } from "../features/connectors/utils/connector-config"
import { clickButton, fillField, findButton, LOGGED_IN, renderId, allowSlowTests } from "./helpers"

allowSlowTests()

describe("new connector page", () => {
  test("the token is shown once with a config snippet and is gone after Done", async () => {
    const { user, queryClient } = renderId(<NewConnectorPage />, { route: "/connectors/new/", session: LOGGED_IN })

    await user.click(await screen.findByText("Study planner"))
    await fillField("Name", "Claude planner")
    await clickButton("Create connector")

    const token = await screen.findByTestId("connector-token")
    expect(token.textContent).toBe(connectorToken)
    expect(screen.getByText("Copy the token now")).toBeInTheDocument()
    expect(document.querySelector("pre")?.textContent).toContain(`"url": "http://localhost:8000/mcp/student"`)
    expect(document.querySelector("pre")?.textContent).toContain(`"Authorization": "Bearer ${connectorToken}"`)
    const cached = queryClient
      .getQueryCache()
      .getAll()
      .some((query) => JSON.stringify(query.state.data ?? null).includes(connectorToken))
    expect(cached).toBe(false)

    await clickButton("Done")

    expect(testRouter.push).toHaveBeenCalledWith("/connectors/")
    expect(screen.queryByText(connectorToken)).not.toBeInTheDocument()
    expect(screen.queryByTestId("connector-token")).not.toBeInTheDocument()
  })

  test("sends the chosen scopes, name and expiry", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/id/me/connectors"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ connector: { ...connectors[0], name: "Mine" }, token: connectorToken })
      }),
    )
    const { user } = renderId(<NewConnectorPage />, { route: "/connectors/new/", session: LOGGED_IN })

    await user.click(await screen.findByText("Study planner"))
    fireEvent.change(await screen.findByLabelText("Expires after"), { target: { value: "90" } })
    await fillField("Name", "Mine")
    await clickButton("Create connector")

    await screen.findByTestId("connector-token")
    expect(body).toEqual({
      server: "student",
      name: "Mine",
      scopes: ["schedule:read", "homework:read", "materials:read"],
      expires_in_days: 90,
    })
  })

  test("the LMS server offers a module-editor preset that grants no course scope", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/id/me/connectors"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ connector: { ...connectors[0], name: "Mod" }, token: connectorToken })
      }),
    )
    renderId(<NewConnectorPage />, { route: "/connectors/new/", session: LOGGED_IN })

    fireEvent.change(await screen.findByLabelText("Server"), { target: { value: "lms" } })
    expect(await screen.findByText("Read courses, steps and attempts.")).toBeInTheDocument()
    expect(screen.getByText("Edit modules, lessons and steps.")).toBeInTheDocument()
    fireEvent.click(await screen.findByText("Module editor"))
    await fillField("Name", "Mod")
    await clickButton("Create connector")

    await screen.findByTestId("connector-token")
    expect(body?.scopes).toEqual(["lms.courses.read", "lms.modules.write"])
  })

  test("a connector without a name or scope is not sent", async () => {
    renderId(<NewConnectorPage />, { route: "/connectors/new/", session: LOGGED_IN })

    await clickButton("Create connector")

    expect(await screen.findByText("Choose at least one scope.")).toBeInTheDocument()
    expect(screen.getByText("This field is required.")).toBeInTheDocument()
    expect(screen.queryByTestId("connector-token")).not.toBeInTheDocument()
  })

  test("Administration connectors last at most 30 days and need a confirmation code", async () => {
    server.use(
      http.get(apiUrl("/v1/id/mcp-scopes"), () =>
        HttpResponse.json({
          servers: [
            ...scopeCatalog.servers,
            {
              server: "admin",
              roles: ["admin"],
              scopes: [{ scope: "admin:people.read", tools: ["search_users"] }],
              presets: [],
            },
          ],
        }),
      ),
    )
    renderId(<NewConnectorPage />, {
      route: "/connectors/new/",
      session: { access_token: "admin-token", user: adminMe },
    })

    fireEvent.change(await screen.findByLabelText("Server"), { target: { value: "admin" } })

    expect(await screen.findByText("Administration connectors need a confirmation code.")).toBeInTheDocument()
    expect(screen.getByText("Administration connectors last at most 30 days.")).toBeInTheDocument()
    expect(
      document.querySelectorAll("#" + CSS.escape((await screen.findByLabelText("Expires after")).id) + " option"),
    ).toHaveLength(1)
    expect(expiryOptions("admin")).toEqual([30])
    expect(expiryOptions("lms")).toEqual([30, 90, 365])
  })
})

describe("connectors page", () => {
  test("lists connectors with server, scopes and dates, and revokes after a confirmation", async () => {
    let revoked = null as string | null
    server.use(
      http.delete(apiUrl("/v1/id/me/connectors/:id"), ({ params }) => {
        revoked = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderId(<ConnectorsPage />, { route: "/connectors/", session: LOGGED_IN })

    expect(await screen.findByText("Claude Desktop")).toBeInTheDocument()
    expect(screen.getByText("marks:read")).toBeInTheDocument()
    await user.click(await findButton("Revoke"))
    expect(await screen.findByText("Revoke Claude Desktop?")).toBeInTheDocument()
    expect(revoked).toBeNull()
    await user.click((await screen.findAllByRole("button", { name: "Revoke", hidden: true })).at(-1) as HTMLElement)

    await waitFor(() => expect(revoked).toBe(connectors[0]?.id ?? ""))
  })
})
