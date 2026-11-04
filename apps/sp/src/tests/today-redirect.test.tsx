/** WEB-3: the old Today address replaces itself with the Home page. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { setTestRoute, testRouter } from "@ihsp/test-utils"
import { render, waitFor } from "@testing-library/react"
import { TodayRedirect } from "../features/today/components/today-redirect"
import { configureTests } from "./helpers"

configureTests()

beforeEach(() => setTestRoute("/"))
afterEach(() => setTestRoute("/"))

describe("the old Today address", () => {
  test("replaces itself with the Home page", async () => {
    setTestRoute("/today/")
    render(<TodayRedirect />)

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/"))
    expect(testRouter.push).not.toHaveBeenCalled()
  })
})
