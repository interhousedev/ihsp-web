import { describe, expect, it } from "bun:test"
import { webResults } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { PlatformBadge } from "./platform-badge"
import { WebCitationCard } from "./web-citation-card"

allowSlowRenders()

describe("PlatformBadge", () => {
  it("shows the badge for a source from the database", () => {
    renderNotebook(<PlatformBadge origin="db" />)

    expect(screen.getByText("From IHT")).toBeInTheDocument()
  })

  it("shows nothing for a web page", () => {
    const { container } = renderNotebook(<PlatformBadge origin="web" />)

    expect(container).toBeEmptyDOMElement()
  })

  it("marks a database source in the chip card but not a web one", () => {
    renderNotebook(<WebCitationCard results={[{ ...webResults[0]!, origin: "db" }, webResults[1]!]} />)

    expect(screen.getAllByText("From IHT")).toHaveLength(1)
  })
})
