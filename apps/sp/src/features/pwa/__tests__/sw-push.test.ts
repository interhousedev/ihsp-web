/** Web push in the worker: the payload, the notification it becomes, and where a tap goes. */
import { describe, expect, test } from "bun:test"
import { portalOriginFromSearch } from "../sw/cache-keys"
import {
  DEFAULT_TITLE,
  NOTIFICATION_BADGE,
  NOTIFICATION_ICON,
  clickTarget,
  notificationOptions,
  parsePushPayload,
} from "../sw/push"

const APP = "https://app.ihsu.uz"
const PORTAL = "https://sp.ihsu.uz"

describe("parsePushPayload", () => {
  test("reads the fields the backend sends", () => {
    const raw = JSON.stringify({
      title: "New mark",
      body: "Mathematics: 5",
      url: "https://sp.ihsu.uz/grades/",
      tag: "marks",
      notification_id: "n-1",
      type: "marks",
    })

    expect(parsePushPayload(raw)).toEqual({
      title: "New mark",
      body: "Mathematics: 5",
      url: "https://sp.ihsu.uz/grades/",
      tag: "marks",
      notificationId: "n-1",
      type: "marks",
    })
  })

  test("missing fields get defaults: the app name, no body, the home page, no tag", () => {
    expect(parsePushPayload("{}")).toEqual({
      title: DEFAULT_TITLE,
      body: "",
      url: "/",
      tag: null,
      notificationId: null,
      type: null,
    })
  })

  test("a push without data, or with text that is not JSON, still has something to show", () => {
    expect(parsePushPayload(null).title).toBe(DEFAULT_TITLE)
    expect(parsePushPayload("hello").body).toBe("hello")
    expect(parsePushPayload('"just text"').body).toBe('"just text"')
  })

  test("fields of the wrong type are ignored", () => {
    const payload = parsePushPayload(JSON.stringify({ title: 5, body: ["x"], url: {}, tag: "" }))

    expect(payload).toMatchObject({ title: DEFAULT_TITLE, body: "", url: "/", tag: null })
  })
})

describe("notificationOptions", () => {
  test("carries the link, and the tag so that a newer notification replaces an older one", () => {
    const options = notificationOptions(
      parsePushPayload(
        JSON.stringify({ body: "b", url: "/grades/", tag: "marks", notification_id: "n-1", type: "marks" }),
      ),
    )

    expect(options).toEqual({
      body: "b",
      tag: "marks",
      data: { url: "/grades/", notification_id: "n-1", type: "marks" },
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
    })
  })

  test("without a tag the notifications stack", () => {
    expect("tag" in notificationOptions(parsePushPayload("{}"))).toBe(false)
  })
})

describe("clickTarget", () => {
  test("a portal link opens on the app host, in the app", () => {
    expect(clickTarget("https://sp.ihsu.uz/grades/?term=2#top", APP, PORTAL)).toEqual({
      kind: "app",
      url: `${APP}/grades/?term=2#top`,
    })
  })

  test("a relative link and a link on the app host stay in the app", () => {
    expect(clickTarget("/homework/", APP, PORTAL)).toEqual({ kind: "app", url: `${APP}/homework/` })
    expect(clickTarget(`${APP}/timetable/`, APP, PORTAL)).toEqual({ kind: "app", url: `${APP}/timetable/` })
  })

  test("another site opens in a new window", () => {
    expect(clickTarget("https://lms.ihsu.uz/courses/", APP, PORTAL)).toEqual({
      kind: "external",
      url: "https://lms.ihsu.uz/courses/",
    })
  })

  test("anything that is not a web address, or nothing, goes home", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x", "", undefined, 5, null]) {
      expect(clickTarget(url, APP, PORTAL)).toEqual({ kind: "app", url: `${APP}/` })
    }
  })

  test("without a known portal, a portal link is another site", () => {
    expect(clickTarget("https://sp.ihsu.uz/grades/", APP, null).kind).toBe("external")
  })
})

describe("portalOriginFromSearch", () => {
  test("reads the portal origin from the registration address", () => {
    expect(portalOriginFromSearch("?api=x&sp=https%3A%2F%2Fsp.ihsu.uz%2F")).toBe(PORTAL)
    expect(portalOriginFromSearch("?api=x")).toBeNull()
    expect(portalOriginFromSearch("?sp=nope")).toBeNull()
  })
})
