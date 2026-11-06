import { describe, expect, mock, test } from "bun:test"
import { testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { renderNotebook } from "../test-support"
import { JoinSharePage } from "./join-page"

/** Rendering resets the test route and with it the hash, so the fragment is set during the render itself. */
function AtFragment({ fragment, join }: { fragment: string; join: (token: string) => Promise<string> }) {
  window.location.hash = fragment
  return <JoinSharePage join={join} />
}

describe("JoinSharePage", () => {
  test("without a token it fails and asks the backend nothing", async () => {
    const join = mock((_token: string) => Promise.resolve("/next"))
    renderNotebook(<AtFragment fragment="" join={join} />)

    expect(await screen.findByText(/does not work any more/)).toBeTruthy()
    expect(join).not.toHaveBeenCalled()
  })

  test("sends the fragment once, clears it and goes where the backend says", async () => {
    const join = mock((_token: string) => Promise.resolve("/next"))
    renderNotebook(<AtFragment fragment="#abc" join={join} />)

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/next"))
    expect(join).toHaveBeenCalledTimes(1)
    expect(join.mock.calls[0]?.[0]).toBe("abc")
  })

  test("a refused token says the link does not work", async () => {
    const join = mock((_token: string) => Promise.reject(new Error("gone")))
    renderNotebook(<AtFragment fragment="#bad" join={join} />)

    expect(await screen.findByText(/does not work any more/)).toBeTruthy()
    expect(join.mock.calls[0]?.[0]).toBe("bad")
  })
})
