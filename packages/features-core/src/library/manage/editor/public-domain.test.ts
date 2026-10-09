import { describe, expect, it } from "bun:test"
import { checkPublicDomain, publicDomainSince } from "./public-domain"

const on = (year: number, month = 0, day = 1) => new Date(year, month, day)

describe("publicDomainSince", () => {
  it("counts 71 years from the death year, so the work is free from 1 January after 70 full years", () => {
    expect(publicDomainSince({ author_death_year: 1938 })).toEqual({ year: 2009, rule: "death" })
  })

  it("counts 51 years from the first publication of an anonymous work", () => {
    expect(publicDomainSince({ first_published_year: 1970 })).toEqual({ year: 2021, rule: "anonymous" })
  })

  it("prefers the death year when both years are given", () => {
    expect(publicDomainSince({ author_death_year: 1950, first_published_year: 1900 })).toEqual({
      year: 2021,
      rule: "death",
    })
  })

  it("is empty without a usable year", () => {
    expect(publicDomainSince({})).toBeNull()
    expect(publicDomainSince({ author_death_year: null, first_published_year: null })).toBeNull()
    expect(publicDomainSince({ author_death_year: 0 })).toBeNull()
    expect(publicDomainSince({ author_death_year: 1950.5 })).toBeNull()
  })
})

describe("checkPublicDomain", () => {
  it("accepts a death year long ago", () => {
    expect(checkPublicDomain({ author_death_year: 1938 }, on(2026, 9, 8))).toEqual({
      status: "reached",
      since: 2009,
      rule: "death",
    })
  })

  it("accepts the work on 1 January of the year it becomes free", () => {
    expect(checkPublicDomain({ author_death_year: 1955 }, on(2026, 0, 1)).status).toBe("reached")
  })

  it("refuses the work on the last day of the year before", () => {
    expect(checkPublicDomain({ author_death_year: 1955 }, on(2025, 11, 31))).toEqual({
      status: "not_yet",
      since: 2026,
      rule: "death",
    })
  })

  it("refuses an author who died 70 years ago this year (free only from the next 1 January)", () => {
    expect(checkPublicDomain({ author_death_year: 1956 }, on(2026, 5, 1))).toEqual({
      status: "not_yet",
      since: 2027,
      rule: "death",
    })
  })

  it("applies the 51-year rule to anonymous works", () => {
    expect(checkPublicDomain({ first_published_year: 1975 }, on(2026, 0, 1)).status).toBe("reached")
    expect(checkPublicDomain({ first_published_year: 1976 }, on(2026, 9, 8)).status).toBe("not_yet")
  })

  it("refuses a death year in the future", () => {
    expect(checkPublicDomain({ author_death_year: 2030 }, on(2026, 9, 8)).status).toBe("not_yet")
  })

  it("reports a missing basis without a year", () => {
    expect(checkPublicDomain({}, on(2026, 9, 8))).toEqual({ status: "missing" })
  })
})
