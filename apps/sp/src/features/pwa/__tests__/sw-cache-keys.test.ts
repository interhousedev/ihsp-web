/** The service worker's decisions as pure functions: which strategy, which cache, which entries go. */
import { describe, expect, test } from "bun:test"
import {
  API_MAX_STALE_MS,
  STATIC_MAX_ENTRIES,
  SW_CACHE_VERSION,
  answerChanged,
  apiCacheName,
  apiCaches,
  apiOriginFromSearch,
  cachesToDelete,
  classifyRequest,
  entriesToEvict,
  extractAssetUrls,
  isCacheableApiPath,
  isCachedAnswerUsable,
  pageCacheKey,
  shellCacheName,
  staticCacheName,
  type RequestFacts,
} from "../sw/cache-keys"

const ORIGIN = "https://app.ihsu.uz"
const API = "https://api.ihsu.uz"

function request(url: string, overrides: Partial<RequestFacts> = {}): RequestFacts {
  return { url, method: "GET", mode: "cors", hasRange: false, origin: ORIGIN, apiOrigin: API, ...overrides }
}

describe("classifyRequest: the app host", () => {
  test("hashed assets, icons and the manifest are cache first", () => {
    expect(classifyRequest(request(`${ORIGIN}/_next/static/chunks/abc123.js`))).toBe("static")
    expect(classifyRequest(request(`${ORIGIN}/_next/static/media/inter.woff2`))).toBe("static")
    expect(classifyRequest(request(`${ORIGIN}/icons/icon-192.png`))).toBe("static")
    expect(classifyRequest(request(`${ORIGIN}/manifest.webmanifest`))).toBe("static")
  })

  test("page loads are network first", () => {
    expect(classifyRequest(request(`${ORIGIN}/timetable/`, { mode: "navigate" }))).toBe("page")
    expect(classifyRequest(request(`${ORIGIN}/lessons/view/?id=7`, { mode: "navigate" }))).toBe("page")
  })

  test("the runtime config is network first too, so the app can start offline", () => {
    expect(classifyRequest(request(`${ORIGIN}/env.js`))).toBe("config")
  })

  test("page data of client-side navigation is stale-while-revalidate", () => {
    expect(classifyRequest(request(`${ORIGIN}/timetable/__next.timetable.txt`))).toBe("page-data")
    expect(classifyRequest(request(`${ORIGIN}/timetable/?_rsc=1ab`))).toBe("page-data")
  })

  test("the worker itself and the health check are never cached", () => {
    expect(classifyRequest(request(`${ORIGIN}/sw.js`))).toBe("bypass")
    expect(classifyRequest(request(`${ORIGIN}/health`))).toBe("bypass")
  })

  test("other origins, other methods and range requests are left to the browser", () => {
    expect(classifyRequest(request("https://fonts.example/x.css"))).toBe("bypass")
    expect(classifyRequest(request(`${ORIGIN}/_next/static/a.js`, { method: "POST" }))).toBe("bypass")
    expect(classifyRequest(request(`${ORIGIN}/_next/static/video.mp4`, { hasRange: true }))).toBe("bypass")
  })
})

describe("classifyRequest: the API", () => {
  test("today, timetable, homework and grades are stale-while-revalidate", () => {
    for (const path of [
      "/v1/me/today",
      "/v1/me/timetable",
      "/v1/me/homework",
      "/v1/me/grades",
      "/v1/me/grades/day",
      "/v1/me/record-book",
    ]) {
      expect(classifyRequest(request(`${API}${path}?x=1`))).toBe("api-swr")
    }
  })

  test("every other read is the browser's business", () => {
    for (const path of [
      "/v1/id/me",
      "/v1/me/files",
      "/v1/notifications",
      "/v1/ai/chats",
      "/v1/app/version",
      "/v1/me/todays",
    ]) {
      expect(classifyRequest(request(`${API}${path}`))).toBe("bypass")
    }
  })

  test("a change request passes through but drops the cached answers", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(classifyRequest(request(`${API}/v1/me/lessons/1/homework/done`, { method }))).toBe("api-mutation")
    }
  })

  test("signing in, refreshing the token and signing out are not changes to the cached lists", () => {
    for (const path of ["/v1/oauth/refresh", "/v1/oauth/token", "/v1/oauth/logout"]) {
      expect(classifyRequest(request(`${API}${path}`, { method: "POST" }))).toBe("bypass")
    }
  })

  test("without a known API origin nothing of it is touched", () => {
    expect(classifyRequest(request(`${API}/v1/me/today`, { apiOrigin: null }))).toBe("bypass")
  })
})

describe("isCacheableApiPath", () => {
  test("matches the paths and their sub-paths, not look-alikes", () => {
    expect(isCacheableApiPath("/v1/me/grades/day")).toBe(true)
    expect(isCacheableApiPath("/v1/me/gradesheet")).toBe(false)
  })
})

describe("cache names", () => {
  test("are versioned, so a new version starts clean", () => {
    expect(shellCacheName()).toBe(`ihsp-shell-${SW_CACHE_VERSION}`)
    expect(staticCacheName("v7")).toBe("ihsp-static-v7")
  })

  test("the API cache belongs to one user", () => {
    expect(apiCacheName("0190-aa")).not.toBe(apiCacheName("0190-bb"))
    expect(apiCacheName("0190-aa", "v2")).toBe("ihsp-api-v2-0190-aa")
  })

  test("the user id cannot break out of the name", () => {
    expect(apiCacheName("../x y")).toBe(`ihsp-api-${SW_CACHE_VERSION}-xy`)
  })
})

describe("cachesToDelete", () => {
  const current = [shellCacheName(), staticCacheName(), "ihsp-meta", apiCacheName("me")]

  test("removes old versions and other users' answers of this app", () => {
    const existing = [...current, "ihsp-shell-v0", "ihsp-static-v0", apiCacheName("someone-else"), "ihsp-api-v0-me"]

    expect(cachesToDelete(existing, current)).toEqual([
      "ihsp-shell-v0",
      "ihsp-static-v0",
      apiCacheName("someone-else"),
      "ihsp-api-v0-me",
    ])
  })

  test("never touches caches of other scripts on the origin", () => {
    expect(cachesToDelete([...current, "workbox-precache", "firebase-messaging"], current)).toEqual([])
  })
})

describe("apiCaches", () => {
  test("lists only the answers caches (what logout wipes)", () => {
    expect(apiCaches([shellCacheName(), apiCacheName("a"), apiCacheName("b"), "ihsp-meta"])).toEqual([
      apiCacheName("a"),
      apiCacheName("b"),
    ])
  })
})

describe("entriesToEvict", () => {
  test("the oldest entries beyond the limit go", () => {
    expect(entriesToEvict(STATIC_MAX_ENTRIES + 3)).toBe(3)
    expect(entriesToEvict(10, 20)).toBe(0)
  })
})

describe("pageCacheKey", () => {
  test("entity pages share one entry: the query and hash are dropped", () => {
    expect(pageCacheKey(`${ORIGIN}/lessons/view/?id=1#top`)).toBe(`${ORIGIN}/lessons/view/`)
    expect(pageCacheKey(`${ORIGIN}/lessons/view/?id=2`)).toBe(pageCacheKey(`${ORIGIN}/lessons/view/?id=1`))
  })
})

describe("apiOriginFromSearch", () => {
  test("reads the API origin the page registered the worker with", () => {
    expect(apiOriginFromSearch("?api=https%3A%2F%2Fapi.ihsu.uz%2Fv1")).toBe("https://api.ihsu.uz")
  })

  test("is null when missing or not a URL", () => {
    expect(apiOriginFromSearch("")).toBeNull()
    expect(apiOriginFromSearch("?api=nope")).toBeNull()
  })
})

describe("extractAssetUrls", () => {
  test("finds scripts, styles and fonts in markup and in the inline page payload", () => {
    const html = `<link rel="stylesheet" href="/_next/static/css/a1.css"/><script src="/_next/static/chunks/main-b2.js" async></script>
      <script>self.__next_f.push([1,"{\\"chunks\\":[\\"/_next/static/chunks/page-c3.js\\"]}"])</script><link rel="preload" href="/_next/static/media/inter.woff2" as="font"/>
      <script src="/_next/static/chunks/main-b2.js"></script><img src="/icons/icon-192.png">`

    expect(extractAssetUrls(html)).toEqual([
      "/_next/static/css/a1.css",
      "/_next/static/chunks/main-b2.js",
      "/_next/static/chunks/page-c3.js",
      "/_next/static/media/inter.woff2",
    ])
  })

  test("no assets, no urls", () => {
    expect(extractAssetUrls("<html></html>")).toEqual([])
  })
})

describe("isCachedAnswerUsable", () => {
  const now = Date.parse("2026-10-08T10:00:00Z")

  test("a recent answer is shown", () => {
    expect(isCachedAnswerUsable("Wed, 07 Oct 2026 10:00:00 GMT", now)).toBe(true)
  })

  test("an answer older than a week is not", () => {
    expect(isCachedAnswerUsable(new Date(now - API_MAX_STALE_MS - 1000).toUTCString(), now)).toBe(false)
  })

  test("without a usable date header it is shown (the stored copy is better than nothing)", () => {
    expect(isCachedAnswerUsable(null, now)).toBe(true)
    expect(isCachedAnswerUsable("yesterday-ish", now)).toBe(true)
  })
})

describe("answerChanged", () => {
  test("tells the page to ask again only when the fresh answer differs", () => {
    expect(answerChanged('{"a":1}', '{"a":1}')).toBe(false)
    expect(answerChanged('{"a":1}', '{"a":2}')).toBe(true)
  })
})
