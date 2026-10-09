/** "Continue in browser" is remembered for a week. */
import { describe, expect, test } from "bun:test"
import {
  CONTINUE_IN_BROWSER_MS,
  isContinueActive,
  readContinueInBrowser,
  rememberContinueInBrowser,
} from "../utils/continue-in-browser"

describe("isContinueActive", () => {
  test("nothing stored, nothing remembered", () => {
    expect(isContinueActive(null, 1000)).toBe(false)
  })

  test("a recent choice counts, an old one does not", () => {
    expect(isContinueActive("1000", 1000 + CONTINUE_IN_BROWSER_MS - 1)).toBe(true)
    expect(isContinueActive("1000", 1000 + CONTINUE_IN_BROWSER_MS)).toBe(false)
  })

  test("garbage and times in the future do not count", () => {
    expect(isContinueActive("soon", 1000)).toBe(false)
    expect(isContinueActive("5000", 1000)).toBe(false)
  })
})

describe("the stored choice", () => {
  test("is read back", () => {
    expect(readContinueInBrowser()).toBe(false)

    rememberContinueInBrowser()

    expect(readContinueInBrowser()).toBe(true)
  })
})
