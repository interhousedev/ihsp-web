import { describe, expect, test } from "bun:test"
import { JOURNEY } from "./config"
import { deriveJourney, type JourneyData } from "./derive"

const empty: JourneyData = { scores: {}, preferencesCompleted: false }

describe("deriveJourney", () => {
  test("the first milestone is current and the rest are locked when nothing is done", () => {
    const j = deriveJourney(empty)
    const states = j.acts.flatMap((a) => a.milestones.map((m) => m.state))
    expect(states[0]).toBe("current")
    expect(states.slice(1).every((s) => s === "locked")).toBe(true)
    expect(j.done).toBe(0)
    expect(j.total).toBe(JOURNEY.flatMap((a) => a.milestones).length)
    expect(j.currentAct.key).toBe("decide")
    expect(j.current?.href).toBe("/colleges/algorithm")
  })

  test("preferences completion and 100% readiness components mark milestones done, in order", () => {
    const j = deriveJourney({ preferencesCompleted: true, scores: { major: 100, countries: 40 } })
    expect(j.done).toBe(2)
    expect(j.current?.key).toBe("countries")
    expect(j.current?.percent).toBe(40)
    expect(j.acts[0].doneCount).toBe(2)
    expect(j.upNext.map((m) => m.key)).toEqual(["countries", "list", "activities"])
  })

  test("a later finished component stays done while the earlier gap is current", () => {
    const j = deriveJourney({ preferencesCompleted: true, scores: { essays: 100 } })
    const essays = j.acts[2].milestones.find((m) => m.key === "essays")
    expect(essays?.state).toBe("done")
    expect(j.current?.key).toBe("major")
  })

  test("the current act moves on and everything done leaves no current milestone", () => {
    const keys = JOURNEY.flatMap((a) => a.milestones)
    const scores = Object.fromEntries(
      keys.flatMap((m) => (m.source.kind === "readiness" ? [[m.source.component, 100]] : [])),
    )
    const act2 = deriveJourney({ preferencesCompleted: true, scores: { ...scores, activities: 0 } })
    expect(act2.currentAct.key).toBe("profile")
    const all = deriveJourney({ preferencesCompleted: true, scores })
    expect(all.current).toBeNull()
    expect(all.done).toBe(all.total)
    expect(all.currentAct.key).toBe("apply")
    expect(all.upNext).toEqual([])
  })

  test("scores are clamped to 0..100", () => {
    const j = deriveJourney({ preferencesCompleted: true, scores: { major: 250, countries: -5 } })
    expect(j.acts[0].milestones[1].percent).toBe(100)
    expect(j.acts[0].milestones[2].percent).toBe(0)
  })
})
