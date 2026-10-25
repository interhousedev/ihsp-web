/** LC-ADM-03: pasted lines `login;full name` parse per line; bad lines are reported, not dropped silently. */
import { describe, expect, test } from "bun:test"
import { parseBulkLines } from "../features/login-cues/utils/parse-bulk"

describe("parseBulkLines", () => {
  test("splits on the first semicolon and trims both sides", () => {
    expect(parseBulkLines("  20240123 ; Aliyev Ali; jr \n")).toEqual({
      items: [{ emis_login: "20240123", full_name: "Aliyev Ali; jr" }],
      errors: [],
    })
  })

  test("skips blank lines and reports a non-digit login or a missing name by line number", () => {
    expect(parseBulkLines("\nab12;Name\n20240124;\n20240125;Ok\n")).toEqual({
      items: [{ emis_login: "20240125", full_name: "Ok" }],
      errors: [
        { line: 2, reason: "login" },
        { line: 3, reason: "format" },
      ],
    })
  })

  test("reports a line without a semicolon as a format error", () => {
    expect(parseBulkLines("20240123 Aliyev")).toEqual({ items: [], errors: [{ line: 1, reason: "format" }] })
  })
})
