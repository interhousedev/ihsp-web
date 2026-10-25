/** The parts of the installable apps that every app shares: per-app cache names, the worker's decisions, the registration. */
import { describe, expect, mock, test } from "bun:test"
import { appIdFromSearch, classifyRequest, createCacheKeys, type RequestFacts } from "./sw"
import { PWA_APP_IDS, cacheNames, isOwnCache } from "./sw/cache-names"
import { createPwaHeadScript } from "./utils/pwa-head"
import { registerServiceWorker, serviceWorkerUrl } from "./utils/register-service-worker"

const ORIGIN = "https://lms.ihsu.uz"
const API = "https://api.ihsu.uz"

function request(url: string, overrides: Partial<RequestFacts> = {}): RequestFacts {
  return { url, method: "GET", mode: "cors", hasRange: false, origin: ORIGIN, apiOrigin: API, ...overrides }
}

describe("cache names", () => {
  test("the student app keeps its names, every other app puts its id in", () => {
    expect(createCacheKeys("sp").shellCacheName()).toBe("ihsp-shell-v2")
    expect(createCacheKeys("lms").shellCacheName()).toBe("ihsp-lms-shell-v2")
    expect(createCacheKeys("library").staticCacheName()).toBe("ihsp-library-static-v2")
    expect(createCacheKeys("staff").apiCacheName("u-1")).toBe("ihsp-staff-api-v2-u-1")
    expect(createCacheKeys("admin").metaCache).toBe("ihsp-admin-meta")
  })

  test("no two apps share a cache name", () => {
    const all = PWA_APP_IDS.flatMap((id) => {
      const keys = createCacheKeys(id)
      return [keys.shellCacheName(), keys.staticCacheName(), keys.apiCacheName("u"), keys.metaCache]
    })
    expect(new Set(all).size).toBe(all.length)
  })

  test("an app cleans up its own caches and never another app's", () => {
    const existing = ["ihsp-shell-v0", "ihsp-lms-shell-v0", "ihsp-lms-shell-v1", "ihsp-staff-meta", "other-cache"]
    expect(createCacheKeys("sp").cachesToDelete(existing, [])).toEqual(["ihsp-shell-v0"])
    expect(createCacheKeys("lms").cachesToDelete(existing, ["ihsp-lms-shell-v1"])).toEqual(["ihsp-lms-shell-v0"])
    expect(isOwnCache("sp", "ihsp-lms-shell-v1")).toBe(false)
    expect(isOwnCache("staff", "ihsp-staff-meta")).toBe(true)
    expect(cacheNames("admin").api).toBe("ihsp-admin-api-")
  })

  test("the app id travels in the registration address; the student app leaves it out", () => {
    expect(appIdFromSearch("?api=x&sp=y&app=staff")).toBe("staff")
    expect(appIdFromSearch("?api=x&sp=y")).toBe("sp")
    expect(appIdFromSearch("?app=kiosk")).toBe("sp")
  })
})

describe("classifyRequest without API answers to keep (every app but the student one)", () => {
  test("pages, files and the config are handled, the API is left to the network", () => {
    expect(classifyRequest(request(`${ORIGIN}/my/`, { mode: "navigate" }))).toBe("page")
    expect(classifyRequest(request(`${ORIGIN}/_next/static/chunks/a.js`))).toBe("static")
    expect(classifyRequest(request(`${ORIGIN}/env.js`))).toBe("config")
    expect(classifyRequest(request(`${API}/v1/me/today`))).toBe("bypass")
    expect(classifyRequest(request(`${API}/v1/courses`, { method: "POST" }))).toBe("bypass")
  })

  test("the listed API paths are cached per user", () => {
    expect(classifyRequest(request(`${API}/v1/me/today`), ["/v1/me/today"])).toBe("api-swr")
  })
})

describe("registerServiceWorker", () => {
  test("names the app in the address", async () => {
    expect(serviceWorkerUrl("https://api.ihsu.uz", "https://my.ihsu.uz", "lms")).toBe(
      "/sw.js?api=https%3A%2F%2Fapi.ihsu.uz&sp=https%3A%2F%2Fmy.ihsu.uz&app=lms",
    )
    const register = mock(async () => ({}) as ServiceWorkerRegistration)
    await registerServiceWorker({
      apiUrl: "https://api.ihsu.uz",
      portalUrl: "https://my.ihsu.uz",
      appId: "staff",
      container: { register },
      production: true,
    })
    expect(register).toHaveBeenCalledWith(expect.stringContaining("&app=staff"), { scope: "/", updateViaCache: "none" })
  })
})

function runHeadScript(mode: string): void {
  document.head.innerHTML = ""
  window.__ENV__ = { APP_MODE: mode }
  new Function(createPwaHeadScript("IHT Courses"))()
}

describe("createPwaHeadScript", () => {
  test("adds the manifest and the app's own name in pwa mode only", () => {
    const run = runHeadScript
    run("web")
    expect(document.head.querySelector("link[rel=manifest]")).toBeNull()
    run("pwa")
    expect(document.head.querySelector("link[rel=manifest]")?.getAttribute("href")).toBe("/manifest.webmanifest")
    expect(document.head.querySelector("meta[name=apple-mobile-web-app-title]")?.getAttribute("content")).toBe(
      "IHT Courses",
    )
  })
})
