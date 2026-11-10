/** UF-MCP-05, MCP-5: the setup wizard for ChatGPT, Gemini, Claude and Custom. */
import { describe, expect, test } from "bun:test"
import { apiUrl, mcpClientSecret, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MCP_LINKS, NewConnectorPage } from "@ihsp/features-core/id-account"
import { allowSlowTests, clickButton, fillField, findButton, findLink, LOGGED_IN, renderId } from "./helpers"

allowSlowTests()

const YES = "Yes, create it for me"
const NO = "No, I will set it up myself"

/** Opens a service; the chat services first ask whether the wizard may pre-create the needed data (MCP-5). */
async function openService(name: RegExp, answer: typeof YES | typeof NO | null = null) {
  const { user } = renderId(<NewConnectorPage />, { route: "/connectors/new/", session: LOGGED_IN })
  await user.click(await findButton(name))
  if (answer) await user.click(await findButton(answer))
  return user
}

const CREATED_CLIENT = "mcp_client_chatgpt_student_01"

describe("MCP setup wizard", () => {
  test("offers the four services first and shows only the chosen service's facts", async () => {
    renderId(<NewConnectorPage />, { route: "/connectors/new/", session: LOGGED_IN })

    expect(await findButton(/^ChatGPT/)).toBeInTheDocument()
    expect(await findButton(/^Gemini/)).toBeInTheDocument()
    expect(await findButton(/^Claude/)).toBeInTheDocument()
    expect(await findButton(/^Custom MCP client/)).toBeInTheDocument()
    expect(screen.queryByText(/Business, Enterprise and Edu/)).not.toBeInTheDocument()

    fireEvent.click(await findButton(/^ChatGPT/))
    expect(await screen.findByText("Do you want us to pre-create the needed data?")).toBeInTheDocument()
    expect(screen.queryByText(/Business, Enterprise and Edu/)).not.toBeInTheDocument()
    fireEvent.click(await findButton(NO))
    expect(await screen.findByText(/Business, Enterprise and Edu/)).toBeInTheDocument()
    expect(screen.queryByText(/Gemini app/)).not.toBeInTheDocument()
  })

  test("No shows the manual steps as text, with no screenshot slot, and creates nothing", async () => {
    let posted = false
    server.use(
      http.post(apiUrl("/v1/id/me/mcp-setup/:service"), () => {
        posted = true
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    await openService(/^ChatGPT/, NO)

    expect(await screen.findByText(/Business, Enterprise and Edu/)).toBeInTheDocument()
    expect(document.querySelector("figure")).toBeNull()
    expect(screen.queryByText(/screenshot/i)).not.toBeInTheDocument()
    expect(screen.queryByText(CREATED_CLIENT)).not.toBeInTheDocument()
    expect(posted).toBe(false)
  })

  test("embeds the vendor guide as a link to its allowlisted address", async () => {
    await openService(/^ChatGPT/, NO)

    const link = await findLink("Developer mode guide")
    expect(link.getAttribute("href")).toBe(MCP_LINKS.chatgptHelp)
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  test("every value has its own copy button", async () => {
    await openService(/^Claude/, NO)

    expect(await findButton("Copy Server URL")).toBeInTheDocument()
    expect(await findButton("Copy Token route")).toBeInTheDocument()
  })

  test("Yes pre-creates the client once and fills the values in with copy buttons", async () => {
    let calls = 0
    server.use(
      http.post(apiUrl("/v1/id/me/mcp-setup/:service"), () => {
        calls += 1
        return HttpResponse.json({
          client: {
            client_id: CREATED_CLIENT,
            name: "ChatGPT",
            redirect_uris: [],
            server: "student",
            service: "chatgpt",
          },
          client_secret: mcpClientSecret,
          created: true,
        })
      }),
    )
    await openService(/^ChatGPT/, YES)

    expect((await screen.findByTestId("mcp-client-secret")).textContent).toBe(mcpClientSecret)
    expect(screen.getByText(CREATED_CLIENT)).toBeInTheDocument()
    expect(await findButton("Copy Client ID")).toBeInTheDocument()
    expect(calls).toBe(1)
  })

  test("a repeated Yes shows the existing client and no secret", async () => {
    server.use(
      http.post(apiUrl("/v1/id/me/mcp-setup/:service"), () =>
        HttpResponse.json({
          client: {
            client_id: CREATED_CLIENT,
            name: "ChatGPT",
            redirect_uris: [],
            server: "student",
            service: "chatgpt",
          },
          client_secret: null,
          created: false,
        }),
      ),
    )
    await openService(/^ChatGPT/, YES)

    expect(await screen.findByText(CREATED_CLIENT)).toBeInTheDocument()
    expect(screen.queryByTestId("mcp-client-secret")).not.toBeInTheDocument()
  })

  test("the custom service shows every OAuth setting and the token route, with no question", async () => {
    await openService(/^Custom MCP client/)

    expect(screen.queryByText("Do you want us to pre-create the needed data?")).not.toBeInTheDocument()
    expect(await screen.findByText("Token endpoint")).toBeInTheDocument()
    expect(screen.getByText("https://id.ihsu.uz/oauth/token")).toBeInTheDocument()
    expect(screen.getByText("Revocation endpoint")).toBeInTheDocument()
    expect(screen.getByText("/v1/id/me/connectors")).toBeInTheDocument()
  })

  test("the custom service's own client keeps its secret in state only", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/id/me/mcp-clients"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          {
            client: {
              client_id: "mcp_client_custom_new",
              name: "custom",
              redirect_uris: [String(body.redirect_uri)],
              server: "student",
              service: "custom",
            },
            client_secret: mcpClientSecret,
            token_endpoint_auth_method: "client_secret_post",
          },
          { status: 201 },
        )
      }),
    )
    await openService(/^Custom MCP client/)

    await fillField("Redirect URI", "http://localhost:8080/callback")
    await clickButton("Create client")

    expect((await screen.findByTestId("mcp-client-secret")).textContent).toBe(mcpClientSecret)
    expect(body).toMatchObject({ service: "custom", server: "student" })
    expect(JSON.stringify(Object.values(window.localStorage ?? {}))).not.toContain(mcpClientSecret)
    expect(JSON.stringify(Object.values(window.sessionStorage ?? {}))).not.toContain(mcpClientSecret)
    expect(window.location.href).not.toContain(mcpClientSecret)
  })

  test("refuses a custom redirect URI that is not https and sends nothing", async () => {
    let posted = false
    server.use(
      http.post(apiUrl("/v1/id/me/mcp-clients"), () => {
        posted = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    await openService(/^Custom MCP client/)

    await fillField("Redirect URI", "http://example.org/callback")
    await clickButton("Create client")

    expect(await screen.findByText("Use an https address, or http on localhost.")).toBeInTheDocument()
    expect(posted).toBe(false)
  })

  test("deleting a pre-created client calls the delete route", async () => {
    let deleted = false
    server.use(
      http.post(apiUrl("/v1/id/me/mcp-setup/:service"), () =>
        HttpResponse.json({
          client: {
            client_id: CREATED_CLIENT,
            name: "ChatGPT",
            redirect_uris: [],
            server: "student",
            service: "chatgpt",
          },
          client_secret: mcpClientSecret,
          created: true,
        }),
      ),
      http.delete(apiUrl("/v1/id/me/mcp-clients/:clientId"), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await openService(/^ChatGPT/, YES)

    await clickButton("Delete this client")

    await waitFor(() => expect(deleted).toBe(true))
  })

  test("the static token path opens the connector form", async () => {
    await openService(/^Claude/, NO)

    await clickButton("Create token")

    expect(await screen.findByText("Study planner")).toBeInTheDocument()
  })
})
