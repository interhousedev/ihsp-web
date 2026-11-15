import { describe, expect, test } from "bun:test"
import { buildIdFromHtml, buildIdFromSources, reloadIfBuildIsStale } from "../stale-build"

function env(running: string, deployed: string | null, store: Record<string, string> = {}) {
  let reloads = 0
  return {
    reloads: () => reloads,
    store,
    value: {
      running,
      fetchDeployed: async () => deployed,
      storage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value
        },
      },
      reload: () => {
        reloads += 1
      },
    },
  }
}

describe("build identity", () => {
  test("html and document scripts give the same identity, ignoring order, query and host", () => {
    const html = `<html><script src="/_next/static/chunks/b.js" async></script><script src='/_next/static/chunks/a.js?x=1'></script><script src="/env.js"></script></html>`
    expect(buildIdFromHtml(html)).toBe("/_next/static/chunks/a.js|/_next/static/chunks/b.js")
    expect(
      buildIdFromSources(["https://my.example/_next/static/chunks/a.js", "/_next/static/chunks/b.js", "/env.js"]),
    ).toBe(buildIdFromHtml(html))
  })
})

describe("reloadIfBuildIsStale", () => {
  test("same build: only logs, never reloads", async () => {
    const e = env("a", "a")
    expect(await reloadIfBuildIsStale(e.value)).toBe("same-build")
    expect(e.reloads()).toBe(0)
  })

  test("different build: reloads once per deployed build, again after a newer deployment", async () => {
    const store: Record<string, string> = {}
    const first = env("a", "b", store)
    expect(await reloadIfBuildIsStale(first.value)).toBe("reloaded")
    expect(first.reloads()).toBe(1)
    const again = env("a", "b", store)
    expect(await reloadIfBuildIsStale(again.value)).toBe("already-tried")
    expect(again.reloads()).toBe(0)
    const newer = env("a", "c", store)
    expect(await reloadIfBuildIsStale(newer.value)).toBe("reloaded")
    expect(newer.reloads()).toBe(1)
  })

  test("deployed build unknown (offline): nothing happens", async () => {
    const e = env("a", null)
    expect(await reloadIfBuildIsStale(e.value)).toBe("unknown")
    expect(e.reloads()).toBe(0)
  })
})
