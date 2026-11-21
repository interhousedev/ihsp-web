/**
 * The service worker itself (`sw/sw.ts`) run against an in-memory Cache API and a scripted network: install, activate,
 * the four strategies, the messages from the page, push and notification clicks. The decisions it makes are tested one by
 * one in `sw-cache-keys.test.ts` and `sw-push.test.ts`; this checks that they are wired to the right events.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import { SW_EVENT, SW_MESSAGE } from "../utils/sw-messages"

const ORIGIN = "https://app.ihsu.test"
const API = "https://api.ihsu.test"
const PORTAL = "https://my.ihsu.test"

// - - - A Cache API in memory - - -

class FakeCache {
  readonly entries = new Map<string, Response>()

  private key(input: RequestInfo | URL, ignoreSearch = false): string {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, ORIGIN)
    url.hash = ""
    if (ignoreSearch) url.search = ""
    return url.href
  }

  async match(input: RequestInfo | URL, options?: { ignoreSearch?: boolean }): Promise<Response | undefined> {
    const wanted = this.key(input, options?.ignoreSearch)
    for (const [key, response] of this.entries) {
      if ((options?.ignoreSearch ? this.key(key, true) : key) === wanted) return response.clone()
    }
    return undefined
  }

  async put(input: RequestInfo | URL, response: Response): Promise<void> {
    this.entries.set(this.key(input), response.clone())
  }

  async keys(): Promise<Request[]> {
    return [...this.entries.keys()].map((url) => new Request(url))
  }

  async delete(input: RequestInfo | URL): Promise<boolean> {
    return this.entries.delete(this.key(input))
  }
}

class FakeCacheStorage {
  readonly stores = new Map<string, FakeCache>()

  async open(name: string): Promise<FakeCache> {
    const store = this.stores.get(name) ?? new FakeCache()
    this.stores.set(name, store)
    return store
  }

  async keys(): Promise<string[]> {
    return [...this.stores.keys()]
  }

  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name)
  }

  async has(name: string): Promise<boolean> {
    return this.stores.has(name)
  }
}

// - - - The worker's global scope and the network - - -

type Handler = (event: Record<string, unknown>) => void
const handlers = new Map<string, Handler[]>()
const posted: unknown[] = []
const shown: { title: string; options: Record<string, unknown> }[] = []
const opened: string[] = []
let windows: { url: string; focused: boolean; navigatedTo: string | null; navigable: boolean }[] = []
let skipped = 0
let claimed = 0
let storage = new FakeCacheStorage()
let network: (request: Request) => Response | Promise<Response> = () => new Response("not scripted", { status: 500 })
const networkCalls: string[] = []

const fakeSelf = {
  location: { origin: ORIGIN, search: `?api=${encodeURIComponent(API)}&sp=${encodeURIComponent(PORTAL)}` },
  registration: {
    showNotification: async (title: string, options: Record<string, unknown>) => {
      shown.push({ title, options })
    },
  },
  clients: {
    claim: async () => {
      claimed += 1
    },
    matchAll: async () =>
      windows.map((client) => ({
        url: client.url,
        postMessage: (message: unknown) => posted.push(message),
        focus: async () => {
          client.focused = true
        },
        navigate: async (url: string) => {
          if (!client.navigable) throw new TypeError("not controlled")
          client.navigatedTo = url
        },
      })),
    openWindow: async (url: string) => {
      opened.push(url)
    },
  },
  skipWaiting: async () => {
    skipped += 1
  },
  addEventListener: (type: string, listener: Handler) => handlers.set(type, [...(handlers.get(type) ?? []), listener]),
}

const globals = globalThis as unknown as Record<string, unknown>
const saved: Record<string, unknown> = {}

function install(): void {
  for (const name of ["self", "caches", "fetch"]) saved[name] = globals[name]
  globals.self = fakeSelf
  Object.defineProperty(globals, "caches", { value: undefined, writable: true, configurable: true })
  globals.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    networkCalls.push(`${request.method} ${request.url}`)
    return network(request)
  }
}

function restore(): void {
  globals.self = saved.self
  globals.fetch = saved.fetch
  if (saved.caches === undefined) delete globals.caches
  else globals.caches = saved.caches
}

/** Fires an event at the worker and waits for everything it handed to `waitUntil`. */
async function dispatch(
  type: string,
  extra: Record<string, unknown> = {},
): Promise<{ response: Response | undefined }> {
  const pending: Promise<unknown>[] = []
  let responded: Promise<Response> | Response | undefined
  const event = {
    ...extra,
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    respondWith: (response: Promise<Response> | Response) => {
      responded = response
    },
  }
  for (const listener of handlers.get(type) ?? []) listener(event)
  const response = responded === undefined ? undefined : await responded
  await Promise.all(pending)
  return { response }
}

function get(url: string, init: RequestInit & { mode?: RequestMode } = {}): Request {
  return new Request(url, init)
}

async function fetchEvent(request: Request) {
  return dispatch("fetch", { request })
}

async function message(data: unknown) {
  return dispatch("message", { data, origin: ORIGIN })
}

const html = (...assets: string[]) =>
  `<html>${assets.map((asset) => `<script src="${asset}"></script>`).join("")}</html>`
const text = (body: string, headers: Record<string, string> = {}) => new Response(body, { headers })

async function cache(name: string): Promise<FakeCache> {
  return storage.open(name)
}

beforeAll(async () => {
  install()
  // Importing the worker registers its listeners on the fake scope.
  Object.defineProperty(globals, "caches", { get: () => storage, configurable: true })
  await import("../sw/sw")
})

afterAll(restore)

beforeEach(() => {
  storage = new FakeCacheStorage()
  network = () => new Response("not scripted", { status: 500 })
  networkCalls.length = 0
  posted.length = 0
  shown.length = 0
  opened.length = 0
  windows = []
  skipped = 0
  claimed = 0
})

async function navigate(url: string) {
  const request = get(url)
  Object.defineProperty(request, "mode", { value: "navigate" })
  return fetchEvent(request)
}

async function signIn(userId: string) {
  await message({ type: SW_MESSAGE.setUser, userId })
}

function tap(url: unknown) {
  let closed = 0
  const result = dispatch("notificationclick", { notification: { close: () => (closed += 1), data: { url } } })
  return result.then(() => closed)
}

describe("install", () => {
  test("precaches the main pages, their scripts and styles, and the small files, so the app starts offline", async () => {
    network = (request) => {
      const { pathname } = new URL(request.url)
      if (pathname === "/") return text(html("/_next/static/chunks/main.js", "/_next/static/css/a.css"))
      if (pathname === "/timetable/")
        return text(html("/_next/static/chunks/main.js", "/_next/static/chunks/timetable.js"))
      return text(`file ${pathname}`)
    }

    await dispatch("install")

    const shell = await cache("ihsp-shell-v2")
    const assets = await cache("ihsp-static-v2")
    for (const path of ["/", "/timetable/", "/homework/", "/grades/", "/offline.html", "/env.js"]) {
      expect(await shell.match(`${ORIGIN}${path}`)).toBeDefined()
    }
    for (const path of [
      "/_next/static/chunks/main.js",
      "/_next/static/css/a.css",
      "/_next/static/chunks/timetable.js",
      "/manifest.webmanifest",
      "/icons/icon-192.png",
      "/offline.js",
    ]) {
      expect(await assets.match(`${ORIGIN}${path}`)).toBeDefined()
    }
    // main.js is on two pages and fetched once
    expect(networkCalls.filter((call) => call.endsWith("/_next/static/chunks/main.js")).length).toBe(1)
  })

  test("does not fail when the network is down (the worker installs and fills up later)", async () => {
    network = () => {
      throw new TypeError("offline")
    }

    await dispatch("install")

    expect([...(await cache("ihsp-shell-v2")).entries.keys()]).toEqual([])
  })

  test("does not take over by itself: an update waits for the page to say so", async () => {
    await dispatch("install")

    expect(skipped).toBe(0)
  })
})

describe("activate", () => {
  test("deletes the caches of older versions and other users, keeps the current ones, and takes control", async () => {
    await message({ type: SW_MESSAGE.setUser, userId: "u1" })
    for (const name of [
      "ihsp-shell-v0",
      "ihsp-static-v0",
      "ihsp-api-v2-u2",
      "ihsp-shell-v2",
      "ihsp-static-v2",
      "ihsp-api-v2-u1",
      "other-script",
    ]) {
      await storage.open(name)
    }

    await dispatch("activate")

    expect([...storage.stores.keys()].toSorted()).toEqual(
      ["ihsp-api-v2-u1", "ihsp-meta", "ihsp-shell-v2", "ihsp-static-v2", "other-script"].toSorted(),
    )
    expect(claimed).toBe(1)
  })
})

describe("static files: cache first", () => {
  test("the first request goes to the network and is stored; the next one never does", async () => {
    network = () => text("console.log(1)", { "content-type": "text/javascript" })
    const url = `${ORIGIN}/_next/static/chunks/abc.js`

    const first = await fetchEvent(get(url))
    const calls = networkCalls.length
    const second = await fetchEvent(get(url))

    expect(await first.response?.text()).toBe("console.log(1)")
    expect(await second.response?.text()).toBe("console.log(1)")
    expect(networkCalls.length).toBe(calls)
  })

  test("a failed request is not stored", async () => {
    network = () => new Response("nope", { status: 404 })

    await fetchEvent(get(`${ORIGIN}/_next/static/chunks/missing.js`))

    expect((await cache("ihsp-static-v2")).entries.size).toBe(0)
  })

  test("what is not ours is left to the browser", async () => {
    for (const url of [`${ORIGIN}/sw.js`, "https://fonts.example/a.css", `${API}/v1/id/me`]) {
      expect((await fetchEvent(get(url))).response).toBeUndefined()
    }
  })
})

describe("pages: network first", () => {
  test("a request that is not a page load (a script fetching a page) is left to the browser", async () => {
    network = () => text("<html>fresh</html>")

    const { response } = await fetchEvent(get(`${ORIGIN}/grades/`, { mode: "same-origin" }))

    expect(response).toBeUndefined()
  })

  test("a navigation shows the network answer and stores it for later", async () => {
    network = () => text("<html>fresh</html>")

    const { response } = await navigate(`${ORIGIN}/grades/?term=2`)

    expect(await response?.text()).toBe("<html>fresh</html>")
    expect(await (await cache("ihsp-shell-v2")).match(`${ORIGIN}/grades/`)).toBeDefined()
  })

  test("offline, a visited page comes from the cache (entity pages share one entry)", async () => {
    network = () => text("<html>lesson page</html>")
    await navigate(`${ORIGIN}/lessons/view/?id=1`)
    network = () => {
      throw new TypeError("offline")
    }

    const { response } = await navigate(`${ORIGIN}/lessons/view/?id=2`)

    expect(await response?.text()).toBe("<html>lesson page</html>")
  })

  test("offline, a page never visited shows the offline page", async () => {
    await (await cache("ihsp-shell-v2")).put(`${ORIGIN}/offline.html`, text("<html>you are offline</html>"))
    network = () => {
      throw new TypeError("offline")
    }

    const { response } = await navigate(`${ORIGIN}/subjects/`)

    expect(await response?.text()).toBe("<html>you are offline</html>")
  })

  test("a server error page is shown as it is, and not stored over a good page", async () => {
    network = () => new Response("<html>bad gateway</html>", { status: 502 })

    const { response } = await navigate(`${ORIGIN}/grades/`)

    expect(response?.status).toBe(502)
    expect((await cache("ihsp-shell-v2")).entries.size).toBe(0)
  })

  test("env.js is network first too: offline, the stored one starts the app", async () => {
    network = () => text("window.__ENV__={}")
    await fetchEvent(get(`${ORIGIN}/env.js`))
    network = () => {
      throw new TypeError("offline")
    }

    const { response } = await fetchEvent(get(`${ORIGIN}/env.js`))

    expect(await response?.text()).toBe("window.__ENV__={}")
  })
})

describe("API answers: stale while revalidate, per user", () => {
  const today = `${API}/v1/me/today`

  test("without a user nothing is stored or shown from the cache", async () => {
    network = () => text('{"lessons":[1]}')

    const { response } = await fetchEvent(get(today, { headers: { authorization: "Bearer t" } }))

    expect(await response?.text()).toBe('{"lessons":[1]}')
    expect([...storage.stores.keys()].filter((name) => name.startsWith("ihsp-api-"))).toEqual([])
  })

  test("the first answer comes from the network and is stored for this user", async () => {
    await signIn("u1")
    network = () => text('{"lessons":[1]}')

    await fetchEvent(get(today))

    expect(await (await cache("ihsp-api-v2-u1")).match(today)).toBeDefined()
  })

  test("the next request is answered from the cache at once and revalidated; a changed answer is announced to the page", async () => {
    await signIn("u1")
    network = () => text('{"lessons":[1]}')
    await fetchEvent(get(today))
    network = () => text('{"lessons":[1,2]}')
    windows = [{ url: `${ORIGIN}/`, focused: false, navigatedTo: null, navigable: true }]

    const { response } = await fetchEvent(get(today))

    expect(await response?.text()).toBe('{"lessons":[1]}')
    expect(posted).toEqual([{ type: SW_EVENT.apiUpdated, url: today }])
    expect(await (await (await cache("ihsp-api-v2-u1")).match(today))?.text()).toBe('{"lessons":[1,2]}')
  })

  test("an unchanged answer is not announced", async () => {
    await signIn("u1")
    network = () => text('{"lessons":[1]}')
    await fetchEvent(get(today))
    windows = [{ url: `${ORIGIN}/`, focused: false, navigatedTo: null, navigable: true }]

    await fetchEvent(get(today))

    expect(posted).toEqual([])
  })

  test("offline, the stored answer is shown", async () => {
    await signIn("u1")
    network = () => text('{"lessons":[1]}')
    await fetchEvent(get(today))
    network = () => {
      throw new TypeError("offline")
    }

    const { response } = await fetchEvent(get(today))

    expect(await response?.text()).toBe('{"lessons":[1]}')
  })

  test("offline with nothing stored is a network error, as without the worker", async () => {
    await signIn("u1")
    network = () => {
      throw new TypeError("offline")
    }

    await expect(fetchEvent(get(today))).rejects.toThrow(TypeError)
  })

  test("a failed answer (401, 500) is never stored", async () => {
    await signIn("u1")
    network = () => new Response("no", { status: 401 })

    await fetchEvent(get(today))

    expect((await cache("ihsp-api-v2-u1")).entries.size).toBe(0)
  })

  test("another user on the same phone never sees the first user's answers", async () => {
    await signIn("u1")
    network = () => text('{"owner":"u1"}')
    await fetchEvent(get(today))

    await signIn("u2")
    network = () => {
      throw new TypeError("offline")
    }

    await expect(fetchEvent(get(today))).rejects.toThrow(TypeError)
    expect(storage.stores.has("ihsp-api-v2-u1")).toBe(false)
  })

  test("only today, timetable, homework and grades are kept", async () => {
    await signIn("u1")
    network = () => text("{}")

    for (const path of [
      "/v1/me/timetable?from=2026-10-05",
      "/v1/me/homework",
      "/v1/me/grades/day?date=2026-10-07",
      "/v1/me/record-book",
    ]) {
      expect((await fetchEvent(get(`${API}${path}`))).response).toBeDefined()
    }
    for (const path of ["/v1/id/me", "/v1/me/files", "/v1/notifications", "/v1/app/version"]) {
      expect((await fetchEvent(get(`${API}${path}`))).response).toBeUndefined()
    }
    expect((await cache("ihsp-api-v2-u1")).entries.size).toBe(4)
  })

  test("a change that succeeded drops the stored answers, so the next read is fresh", async () => {
    await signIn("u1")
    network = () => text('{"done":false}')
    await fetchEvent(get(today))
    network = () => new Response(null, { status: 204 })

    await fetchEvent(get(`${API}/v1/me/lessons/7/homework/done`, { method: "PUT", body: "{}" }))

    expect(storage.stores.has("ihsp-api-v2-u1")).toBe(false)
  })

  test("a change that failed keeps them", async () => {
    await signIn("u1")
    network = () => text('{"done":false}')
    await fetchEvent(get(today))
    network = () => new Response("no", { status: 500 })

    await fetchEvent(get(`${API}/v1/me/lessons/7/homework/done`, { method: "PUT", body: "{}" }))

    expect((await cache("ihsp-api-v2-u1")).entries.size).toBe(1)
  })

  test("refreshing the token is not a change", async () => {
    await signIn("u1")
    network = () => text("{}")
    await fetchEvent(get(today))

    const { response } = await fetchEvent(get(`${API}/v1/oauth/refresh`, { method: "POST", body: "{}" }))

    expect(response).toBeUndefined()
    expect((await cache("ihsp-api-v2-u1")).entries.size).toBe(1)
  })
})

describe("messages from the page", () => {
  test("clear-user drops every stored answer and forgets the user", async () => {
    await message({ type: SW_MESSAGE.setUser, userId: "u1" })
    network = () => text("{}")
    await fetchEvent(get(`${API}/v1/me/today`))

    await message({ type: SW_MESSAGE.clearUser })

    expect([...storage.stores.keys()].filter((name) => name.startsWith("ihsp-api-") || name === "ihsp-meta")).toEqual(
      [],
    )
  })

  test("purge-shell drops the stored pages and keeps the assets", async () => {
    await (await cache("ihsp-shell-v2")).put(`${ORIGIN}/`, text("page"))
    await (await cache("ihsp-static-v2")).put(`${ORIGIN}/_next/static/a.js`, text("js"))

    await message({ type: SW_MESSAGE.purgeShell })

    expect(storage.stores.has("ihsp-shell-v2")).toBe(false)
    expect(storage.stores.has("ihsp-static-v2")).toBe(true)
  })

  test("skip-waiting lets a waiting worker take over", async () => {
    await message({ type: SW_MESSAGE.skipWaiting })

    expect(skipped).toBe(1)
  })

  test("messages that are not ours are ignored", async () => {
    await message({ type: "workbox:skip-waiting" })
    await message(null)

    expect(skipped).toBe(0)
  })
})

describe("push", () => {
  test("a push shows a notification with the title, text, tag, link, icon and badge", async () => {
    await dispatch("push", {
      data: {
        text: () =>
          JSON.stringify({
            title: "New mark",
            body: "Mathematics: 5",
            url: `${PORTAL}/grades/`,
            tag: "marks",
            notification_id: "n-1",
            type: "marks",
          }),
      },
    })

    expect(shown).toEqual([
      {
        title: "New mark",
        options: {
          body: "Mathematics: 5",
          tag: "marks",
          data: { url: `${PORTAL}/grades/`, notification_id: "n-1", type: "marks" },
          icon: "/icons/icon-192.png",
          badge: "/icons/badge-96.png",
        },
      },
    ])
  })

  test("a push without data still shows a notification (browsers require one)", async () => {
    await dispatch("push", { data: null })

    expect(shown.length).toBe(1)
    expect(shown[0]?.title).toBe("IHT")
  })
})

describe("a tap on a notification", () => {
  test("closes it, focuses the open app and opens the link there (a portal link becomes an app link)", async () => {
    windows = [{ url: `${ORIGIN}/timetable/`, focused: false, navigatedTo: null, navigable: true }]

    const closed = await tap(`${PORTAL}/grades/`)

    expect(closed).toBe(1)
    expect(windows[0]).toMatchObject({ focused: true, navigatedTo: `${ORIGIN}/grades/` })
    expect(opened).toEqual([])
  })

  test("opens the app in a new window when it is not open", async () => {
    await tap(`${PORTAL}/homework/`)

    expect(opened).toEqual([`${ORIGIN}/homework/`])
  })

  test("opens a new window when the open one cannot be navigated", async () => {
    windows = [{ url: `${ORIGIN}/`, focused: false, navigatedTo: null, navigable: false }]

    await tap("/grades/")

    expect(opened).toEqual([`${ORIGIN}/grades/`])
  })

  test("a link to another site opens in a new window, and never in the app window", async () => {
    windows = [{ url: `${ORIGIN}/`, focused: false, navigatedTo: null, navigable: true }]

    await tap("https://lms.ihsu.test/courses/")

    expect(opened).toEqual(["https://lms.ihsu.test/courses/"])
    expect(windows[0]?.navigatedTo).toBeNull()
  })

  test("a notification with no link goes to the home page", async () => {
    await tap(undefined)

    expect(opened).toEqual([`${ORIGIN}/`])
  })
})
