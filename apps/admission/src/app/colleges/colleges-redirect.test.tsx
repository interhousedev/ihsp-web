import { testRouter } from "@ihsp/test-utils"
import { render, waitFor } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import Page from "./page"

describe("/colleges/", () => {
  test("redirects to the chooser", async () => {
    render(<Page />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/"))
  })
})
