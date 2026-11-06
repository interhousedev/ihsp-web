/** MCP activity (admin, B1): the per-tool summary and the calls with their person. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { McpActivityPage } from "../features/mcp-activity/components/mcp-activity-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("mcp activity", () => {
  test("shows calls and errors per tool and the call with its user", async () => {
    renderAdmin(<McpActivityPage />)

    expect(await screen.findByText("12 calls, 2 errors")).toBeInTheDocument()
    expect(await screen.findByText("00000001-0000-4000-8000-000000000001")).toBeInTheDocument()
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument()
  })
})
