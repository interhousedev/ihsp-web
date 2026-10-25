import { describe, expect, it } from "bun:test"
import { sourceDetailOf, sourceFile, sourceGuide } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourceGuide } from "./source-guide"

allowSlowRenders()

const detail = sourceDetailOf(sourceFile)

describe("SourceGuide", () => {
  it("lists the three questions under the key topics", () => {
    renderNotebook(<SourceGuide source={detail} />)

    expect(screen.getByRole("heading", { level: 3, name: "Key topics" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Questions about this source" })).toBeInTheDocument()
    for (const question of sourceGuide.questions) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument()
    }
    expect(sourceGuide.questions).toHaveLength(3)
  })

  it("asks a question with only this source selected", async () => {
    const { user, actions } = renderNotebook(<SourceGuide source={detail} />)

    await user.click(screen.getByRole("button", { name: sourceGuide.questions[1] as string }))

    expect(actions.ask).toHaveBeenCalledWith({ text: sourceGuide.questions[1], sourceIds: [sourceFile.id] })
  })

  it("is keyboard operable", async () => {
    const { user, actions } = renderNotebook(<SourceGuide source={detail} />)

    screen.getByRole("button", { name: sourceGuide.questions[0] as string }).focus()
    await user.keyboard("{Enter}")

    expect(actions.ask).toHaveBeenCalledWith({ text: sourceGuide.questions[0], sourceIds: [sourceFile.id] })
  })

  it("hides the heading when the guide has no questions", () => {
    renderNotebook(<SourceGuide source={{ ...detail, guide: { ...sourceGuide, questions: [] } }} />)

    expect(screen.getByRole("heading", { level: 3, name: "Key topics" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Questions about this source" })).not.toBeInTheDocument()
  })

  it("shows the questions even when the guide has no key topics", () => {
    renderNotebook(<SourceGuide source={{ ...detail, guide: { ...sourceGuide, key_topics: [] } }} />)

    expect(screen.queryByRole("heading", { name: "Key topics" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Questions about this source" })).toBeInTheDocument()
  })
})
