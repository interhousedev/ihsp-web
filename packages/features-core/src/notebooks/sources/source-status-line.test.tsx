import { describe, expect, it } from "bun:test"
import { sourceFile } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { renderNotebook } from "../test-support"
import { SourceStatusLine } from "./source-status-line"

describe("SourceStatusLine: unsupported input", () => {
  it("warns that the AI does not use a ready source of an unsupported format", () => {
    renderNotebook(<SourceStatusLine source={{ ...sourceFile, ai_unsupported: true }} />)

    expect(screen.getByTestId("ai-unsupported")).toHaveTextContent("Not used by the AI: unsupported format")
  })

  it("shows nothing for a supported ready source", () => {
    renderNotebook(<SourceStatusLine source={{ ...sourceFile, ai_unsupported: false }} />)

    expect(screen.queryByTestId("ai-unsupported")).toBeNull()
  })
})
