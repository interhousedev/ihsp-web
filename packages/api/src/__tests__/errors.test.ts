import { describe, expect, test } from "bun:test"
import { ApiError, errorMessageKey, getFieldIssues, isEmisProblem } from "../errors"

describe("EMIS problems", () => {
  const has = (key: string) => key === "errors.emis.unavailable"
  const problem = (type: string, status = 503) => new ApiError({ type, status, title: "x" })

  test("isEmisProblem recognises the emis/ prefix only", () => {
    expect(isEmisProblem(problem("emis/unavailable"))).toBe(true)
    expect(isEmisProblem(problem("emis/anything-new"))).toBe(true)
    expect(isEmisProblem(problem("common/unavailable"))).toBe(false)
    expect(isEmisProblem(new Error("x"))).toBe(false)
  })

  test("keeps specific keys, falls back to upstream for other emis types, generic otherwise", () => {
    expect(errorMessageKey(problem("emis/unavailable"), has)).toBe("errors.emis.unavailable")
    expect(errorMessageKey(problem("emis/timeout"), has)).toBe("errors.emis.upstream")
    expect(errorMessageKey(problem("common/unavailable"), has)).toBe("errors.generic")
  })
})

describe("getFieldIssues", () => {
  test("reads params.field of a domain problem", () => {
    const error = new ApiError({
      type: "academic.excuse_invalid",
      status: 422,
      title: "x",
      message_key: "excuse-invalid",
      params: { field: "reason" },
    })
    expect(getFieldIssues(error)).toEqual([{ field: "reason", detail: null }])
  })

  test("reads params.fields as a list and as an object", () => {
    const list = new ApiError({ type: "a", status: 422, title: "x", params: { fields: ["a", "b"] } })
    expect(getFieldIssues(list).map((i) => i.field)).toEqual(["a", "b"])
    const map = new ApiError({ type: "a", status: 422, title: "x", params: { fields: { c: "required" } } })
    expect(getFieldIssues(map).map((i) => i.field)).toEqual(["c"])
  })

  test("reads FastAPI loc, dropping the body prefix and keeping nested paths", () => {
    const error = new ApiError({
      type: "common/request-validation",
      status: 422,
      title: "x",
      errors: [
        { loc: ["body", "reason"], msg: "too long", type: "string_too_long" },
        { loc: ["body", "items", 0, "name"], msg: "missing", type: "missing" },
        { loc: ["body"], msg: "root", type: "x" },
      ],
    })
    expect(getFieldIssues(error)).toEqual([
      { field: "reason", detail: "too long" },
      { field: "items.0.name", detail: "missing" },
    ])
  })

  test("returns nothing for other errors", () => {
    expect(getFieldIssues(new Error("x"))).toEqual([])
    expect(getFieldIssues(new ApiError({ type: "a", status: 500, title: "x" }))).toEqual([])
  })
})
