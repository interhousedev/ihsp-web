/** Every app's navigation: each destination is a real route, and one destination looks the same in every app. */
import { describe, expect, test } from "bun:test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const APPS_DIR = join(import.meta.dir, "../../../../apps")
const APPS = ["sp", "staff", "lms", "library", "admin", "id"] as const
const LOCALES = ["en", "ru", "uz"] as const

/** Route of every `page.tsx`, with `(group)` folders dropped: `/`, `/security/otp`. */
function routesOf(app: string): Set<string> {
  const routes = new Set<string>()
  const walk = (dir: string, route: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path, /^\(.*\)$/.test(name) ? route : `${route}/${name}`)
      else if (name === "page.tsx") routes.add(route === "" ? "/" : route)
    }
  }
  walk(join(APPS_DIR, app, "src/app"), "")
  return routes
}

function navSource(app: string): string {
  return readFileSync(join(APPS_DIR, app, "src/config/nav.ts"), "utf8")
}

function navUrls(source: string): string[] {
  return [...source.matchAll(/url: "(\/[^"]*)"/g)].map((match) => match[1]!)
}

/** `url → icon` as written in the config: a registry name or an imported component. */
function navIcons(source: string): Map<string, string> {
  const icons = new Map<string, string>()
  for (const match of source.matchAll(/url: "(\/[^"]*)", icon: "?(\w+)"?/g)) icons.set(match[1]!, match[2]!)
  return icons
}

function route(url: string): string {
  const path = url.split(/[?#]/)[0]!.replace(/\/+$/, "")
  return path === "" ? "/" : path
}

function navMessages(app: string, locale: string): Record<string, unknown> {
  const messages = JSON.parse(readFileSync(join(APPS_DIR, app, "messages", `${locale}.json`), "utf8"))
  return messages.nav as Record<string, unknown>
}

describe("navigation links", () => {
  for (const app of APPS) {
    test(`${app}: every nav url is a route of the app`, () => {
      const routes = routesOf(app)
      const urls = navUrls(navSource(app))
      expect(urls.length).toBeGreaterThan(0)
      expect(urls.filter((url) => !routes.has(route(url)))).toEqual([])
    })

    test(`${app}: no destination is listed under two different icons`, () => {
      const source = navSource(app)
      const seen = new Map<string, string>()
      for (const match of source.matchAll(/url: "(\/[^"]*)", icon: "?(\w+)"?/g)) {
        const previous = seen.get(match[1]!)
        if (previous) expect(match[2]!).toBe(previous)
        seen.set(match[1]!, match[2]!)
      }
    })

    test(`${app}: two different destinations do not share an icon`, () => {
      const owners = new Map<string, string[]>()
      for (const [url, icon] of navIcons(navSource(app))) owners.set(icon, [...(owners.get(icon) ?? []), url])
      expect([...owners.entries()].filter(([, urls]) => urls.length > 1)).toEqual([])
    })
  }

  test("the student bottom bar's choices are real routes", () => {
    const source = readFileSync(join(APPS_DIR, "sp/src/features/shell/utils/bottom-bar.ts"), "utf8")
    const block = source.slice(source.indexOf("DESTINATION_URLS"), source.indexOf("MAX_BOTTOM_TABS"))
    const urls = [...block.matchAll(/: "(\/[^"]*)"/g)].map((match) => match[1]!)
    const routes = routesOf("sp")
    expect(urls.length).toBeGreaterThan(0)
    expect(urls.filter((url) => !routes.has(route(url)))).toEqual([])
  })

  /** The paths in `iht-backend/app/interfaces/bot/urls.py`: a bot button must open an existing screen. */
  test("the screens the bot opens exist", () => {
    const targets: Record<string, string[]> = {
      id: ["/telegram", "/connectors", "/security"],
      sp: ["/", "/grades", "/homework", "/notifications", "/lessons/view"],
      staff: ["/", "/lessons/view"],
    }
    for (const [app, paths] of Object.entries(targets)) {
      const routes = routesOf(app)
      expect(paths.filter((path) => !routes.has(path))).toEqual([])
    }
  })

  test("the id app has a phone bottom bar and the admin app keeps its sheet", () => {
    expect(existsSync(join(APPS_DIR, "id/src/config/nav.ts"))).toBe(true)
    expect(navSource("id")).toContain("buildIdBottom")
    expect(navSource("admin")).not.toContain("bottom:")
  })
})

describe("the same destination reads the same everywhere", () => {
  /**
   * Message key in each app's `nav` block. `Calendar` (sp) is its own page with attendance, so it is not listed. Staff
   * keep "Контроли" / "Nazoratlar" because their page covers ПК and ИК, so only sp and admin share `exams`.
   */
  const SHARED: Record<string, Partial<Record<(typeof APPS)[number], string>>> = {
    notebooks: { sp: "notebooks", staff: "notebooks", lms: "notebooks" },
    exams: { sp: "exams", admin: "exams" },
    subjects: { sp: "subjects", staff: "subjects", admin: "subjects", library: "subjects" },
    settings: { sp: "settings", staff: "settings", admin: "settings" },
    notifications: { sp: "notifications", staff: "notifications" },
    mail: { sp: "mail", staff: "mail" },
    timetable: { staff: "timetable", admin: "timetable" },
    assistant: { sp: "assistant", admin: "assistant" },
  }

  for (const [name, keys] of Object.entries(SHARED)) {
    for (const locale of LOCALES) {
      test(`${name} (${locale})`, () => {
        const labels = Object.entries(keys).map(([app, key]) => navMessages(app, locale)[key])
        expect(new Set(labels).size).toBe(1)
      })
    }
  }

  test("the home, notebooks and exams icons match across apps", () => {
    const sp = navSource("sp")
    const staff = navSource("staff")
    const lms = navSource("lms")
    const admin = navSource("admin")
    for (const source of [sp, staff, lms]) expect(source).toMatch(/url: "\/notebooks\/", icon: "notebooks"/)
    expect(sp).toMatch(/url: "\/exams\/", icon: "exams"/)
    expect(staff).toMatch(/url: "\/group\/exams\/", icon: "exams"/)
    expect(admin).toMatch(/url: "\/exams\/", icon: "exams"/)
    expect(sp).toMatch(/url: "\/timetable\/", icon: "timetable"/)
    expect(admin).toMatch(/url: "\/certificates\/", icon: "certificates"/)
    expect(staff).toMatch(/url: "\/certificates\/", icon: "certificates"/)
  })

  test("the short bottom bar labels name the same page as the full ones", () => {
    const short = navMessages("sp", "en").short as Record<string, string>
    expect(short.homework).toBe("Homework")
    expect(navMessages("sp", "en").dashboard).toBe("Home")
    expect((navMessages("sp", "ru").short as Record<string, string>).assistant).toBe("Ассистент")
  })
})
