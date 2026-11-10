/** LC-ADM-03: pasted lines `login;full name` parse per line; bad lines are reported, not dropped silently. */
import { describe, expect, test } from "bun:test"
import { fileTextToBulkLines, parseBulkLines } from "../features/login-cues/utils/parse-bulk"

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

describe("fileTextToBulkLines", () => {
  test("LC-ADM-04: drops a BOM and header row, accepts comma, tab and semicolon files, unquotes cells", () => {
    const csv = '\uFEFFlogin,full name\r\n20240123,"Aliyev, Ali"\r\n20240124\tKarimova Lola\n20240125;Ok;;\n'
    expect(parseBulkLines(fileTextToBulkLines(csv))).toEqual({
      items: [
        { emis_login: "20240123", full_name: "Aliyev, Ali" },
        { emis_login: "20240124", full_name: "Karimova Lola" },
        { emis_login: "20240125", full_name: "Ok" },
      ],
      errors: [],
    })
  })

  test("keeps a bad data row so the preview reports it", () => {
    expect(parseBulkLines(fileTextToBulkLines("20240123,Ali\nab,Name")).errors).toEqual([{ line: 2, reason: "login" }])
  })
})
