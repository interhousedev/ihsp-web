import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { PageContainer } from "../components/layout/page-container"

function rootClass(node: React.ReactElement): string {
  const { container } = renderWithProviders(node)
  return (container.firstElementChild as HTMLElement).className
}

describe("PageContainer width variants", () => {
  it("is full width by default, with no maximum width", () => {
    const className = rootClass(<PageContainer title="Data">body</PageContainer>)
    expect(className).not.toContain("max-w-")
    expect(className).toContain("w-full")
    expect(className).not.toContain("mx-auto")
  })

  it("full width has no maximum width", () => {
    const className = rootClass(
      <PageContainer title="Data" width="full">
        body
      </PageContainer>,
    )
    expect(className).not.toContain("max-w-")
  })

  it("narrow width caps the reading column and centres it", () => {
    const className = rootClass(
      <PageContainer title="Form" width="narrow">
        body
      </PageContainer>,
    )
    expect(className).toContain("max-w-2xl")
    expect(className).toContain("mx-auto")
    expect(className).toContain("w-full")
  })

  it("keeps the caller's className alongside the width variant", () => {
    const className = rootClass(
      <PageContainer title="Form" width="narrow" className="gap-8">
        body
      </PageContainer>,
    )
    expect(className).toContain("gap-8")
    expect(className).toContain("max-w-2xl")
  })
})
