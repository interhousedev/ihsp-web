import { describe, expect, it } from "bun:test"
import { institution, listEntry } from "../../tests/chooser-handlers"
import { budgetGap, familyBudgetUsd, isHome, netCost, rowLabel, totals } from "./list-model"

describe("list model", () => {
  it("reads the family budget answer", () => {
    expect(familyBudgetUsd("under_30k")).toBe(30_000)
    expect(familyBudgetUsd("any")).toBeNull()
    expect(familyBudgetUsd(null)).toBeNull()
  })

  it("takes the aid estimate off the yearly cost, else the average aid, else shows the sticker price", () => {
    const entry = listEntry({ institution: institution({ coa_total: "60000", cost_after_aid: null }) })
    const row = (attend: object, aid?: object) => ({ cost_to_attend: attend, aid_profile: aid }) as never
    expect(netCost(entry, row({ annual_cost: "60000", aid_estimate: "20000", currency: "USD", gap: null }))).toEqual({
      amount: 40000,
      currency: "USD",
      kind: "net",
    })
    expect(
      netCost(
        entry,
        row({ annual_cost: "60000", aid_estimate: null, currency: "USD", gap: null }, { avg_aid: "50000" }),
      )?.amount,
    ).toBe(10000)
    expect(netCost(entry, undefined)).toEqual({ amount: 60000, currency: "USD", kind: "sticker" })
    expect(netCost(listEntry({ institution: institution({ coa_total: null }) }), undefined)).toBeNull()
  })

  it("gaps only count in USD", () => {
    expect(budgetGap({ amount: 25000, currency: "USD", kind: "net" }, 10000)).toBe(15000)
    expect(budgetGap({ amount: 25000, currency: "EUR", kind: "net" }, 10000)).toBeNull()
    expect(budgetGap(null, 10000)).toBeNull()
    expect(budgetGap({ amount: 1, currency: "USD", kind: "net" }, null)).toBeNull()
  })

  it("sums the gaps for the totals row", () => {
    const result = totals([-2000, 5000, 7000, null], [null, null, null, null])
    expect(result).toMatchObject({ within: 1, over: 2, avgOver: 6000, unknown: 4 })
  })

  it("makes a home university 'home' and keeps the other labels", () => {
    expect(isHome("Uzbekistan")).toBe(true)
    expect(rowLabel("reach", "Uzbekistan")).toBe("home")
    expect(rowLabel("reach", "Japan")).toBe("reach")
    expect(rowLabel(null, "Japan")).toBeNull()
  })
})
