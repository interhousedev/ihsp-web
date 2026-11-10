import { describe, expect, it } from "bun:test"
import { artifactDetailOf, artifactSlides, nbIds } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { renderNotebook } from "../../test-support"
import { ArtifactPending } from "./artifact-pending"

function pending(extra: object) {
  const detail = { ...artifactDetailOf({ ...artifactSlides, status: "generating" }), ...extra }
  return renderNotebook(<ArtifactPending notebookId={nbIds.notebook} artifact={detail} onRetried={() => undefined} />)
}

describe("ArtifactPending stage", () => {
  it("shows the label of the generation stage", () => {
    pending({ stage: "researching" })
    expect(screen.getByRole("status")).toHaveTextContent("Researching the topic…")
  })

  it("falls back to the generic text without a stage or with an unknown one", () => {
    pending({ stage: "something_new" })
    expect(screen.getByRole("status")).toHaveTextContent("Generating…")
  })
})
