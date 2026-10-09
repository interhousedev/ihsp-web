import { describe, expect, it } from "bun:test"
import { libCards, libExternalCards, setUniLibrary } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { useUniLibraryAvailability, useVisibleCards } from "./use-uni-library"

allowSlowRenders()

function Availability() {
  return <p>state: {useUniLibraryAvailability()}</p>
}

function Visible() {
  const cards = useVisibleCards([libCards.bookOtkanKunlar, libExternalCards[0]!])
  return <p>kinds: {cards.map((card) => card.kind).join(",")}</p>
}

describe("useUniLibraryAvailability", () => {
  it("is loading first and disabled when the API says UniLibrary is off (the default)", async () => {
    renderLibrary(<Availability />)

    expect(screen.getByText("state: loading")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("state: disabled")).toBeInTheDocument())
  })

  it("is enabled once the API confirms it", async () => {
    setUniLibrary({ enabled: true })
    renderLibrary(<Availability />)

    await waitFor(() => expect(screen.getByText("state: enabled")).toBeInTheDocument())
  })

  it("stays enabled when the service is down (the blocks show their own error state)", async () => {
    setUniLibrary({ enabled: true, down: true })
    renderLibrary(<Availability />)

    await waitFor(() => expect(screen.getByText("state: enabled")).toBeInTheDocument())
  })

  it("is disabled for a visitor when anonymous cards are off", async () => {
    setUniLibrary({ enabled: true })
    renderLibraryAnonymous(<Availability />)

    await waitFor(() => expect(screen.getByText("state: disabled")).toBeInTheDocument())
  })
})

describe("useVisibleCards", () => {
  it("drops UniLibrary cards while UniLibrary is not enabled", async () => {
    renderLibrary(<Visible />)

    await waitFor(() => expect(screen.getByText("kinds: book")).toBeInTheDocument())
  })

  it("keeps them when it is enabled", async () => {
    setUniLibrary({ enabled: true })
    renderLibrary(<Visible />)

    await waitFor(() => expect(screen.getByText("kinds: book,external")).toBeInTheDocument())
  })
})
