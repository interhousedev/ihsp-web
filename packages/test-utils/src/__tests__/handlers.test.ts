import { describe, expect, test } from "bun:test"
import {
  ApiError,
  api,
  deleteIdMeSession,
  getAdminAttendance,
  getAdminAttendanceCsv,
  getAdminDashboard,
  getAdminGroup,
  getAdminGroupsStats,
  getAdminLessons,
  getAdminStudent,
  getAdminStudents,
  getAdminTimetable,
  getAdminUsers,
  getAiChats,
  getIcal,
  getIdLogin,
  getIdMe,
  getLessonResources,
  getLmsCourses,
  getMeAlerts,
  getMeAttendance,
  getMeHomework,
  getMeSearch,
  getMeTimetable,
  getNotifications,
  getNotificationsUnreadCount,
  getPublicShare,
  getStaffJournalCsv,
  getStaffLesson,
  postAdminBroadcastSend,
  postAdminBroadcastsAudienceCount,
  postAdminTimetable,
  postAdminTimetableCheck,
  postAiChatMessages,
  postFileComplete,
  postFiles,
  postIdLogin,
  postIdMeConnectors,
  postIdRegisterEmis,
  postLmsJoin,
  postMeCalendarToken,
  postOauthTelegram,
  postOauthToken,
  putMeHomeworkDone,
  putStaffLessonAttendance,
} from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { HttpResponse, http } from "msw"
import { TEST_API_URL, TEST_STORAGE_URL } from "../fixtures/env"
import * as fx from "../fixtures"
import {
  applyOutlineOps,
  errorHandlers,
  paginate,
  problem,
  resetCreatedFiles,
  storedObjects,
  userForRequest,
} from "../handlers"
import { server } from "../server"
import { getTestRoute, setTestRoute, testRouter } from "../router"

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (cause: unknown) => cause,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

describe("handler utilities", () => {
  const request = (query: string) => new Request(`${TEST_API_URL}/x${query}`)

  test("paginate uses ?cursor as an offset and ?limit (default 20, at most 100)", () => {
    const items = Array.from({ length: 45 }, (_, index) => index)
    expect(paginate(items, request("")).items).toHaveLength(20)
    const second = paginate(items, request("?limit=20&cursor=20"))
    expect(second.items[0]).toBe(20)
    expect(second.next_cursor).toBe("40")
    const last = paginate(items, request("?limit=20&cursor=40"))
    expect(last.items).toEqual([40, 41, 42, 43, 44])
    expect(last.next_cursor).toBeNull()
    expect(paginate(items, request("?limit=500")).items).toHaveLength(45)
  })

  test("problem builds application/problem+json with a message key and params", async () => {
    const response = problem(429, "common/rate-limited", "Slow down", { params: { retry_after: 5 } })
    expect(response.status).toBe(429)
    expect(response.headers.get("Content-Type")).toBe("application/problem+json")
    expect(await response.json()).toEqual({
      type: "common/rate-limited",
      title: "Slow down",
      status: 429,
      message_key: "common-rate-limited",
      params: { retry_after: 5 },
    })
  })

  test("applyOutlineOps adds, renames, moves and removes without touching the input", () => {
    const outline = fx.courseDraft.outline
    const snapshot = JSON.stringify(outline)
    const first = outline[0]
    const second = outline[1]
    if (!first || !second) throw new Error("the course draft fixture needs two sections")
    const step = first.steps[0]
    if (!step) throw new Error("the first section needs a step")
    const result = applyOutlineOps(outline, [
      { op: "add_section", title: "Extras" },
      { op: "rename_section", section_id: first.id, title: "Renamed" },
      { op: "move_step", step_id: step.step_id, to_section_id: second.id, position: 0 },
      { op: "remove_section", section_id: second.id },
    ] as never)
    expect(JSON.stringify(outline)).toBe(snapshot)
    expect(result.map((section) => section.title)).toContain("Extras")
    expect(result.find((section) => section.id === first.id)?.title).toBe("Renamed")
    expect(result.find((section) => section.id === second.id)).toBeUndefined()
  })
})

describe("oauth", () => {
  test("token, telegram login and the invalid Telegram payload", async () => {
    expect((await postOauthToken({ code: "c", code_verifier: "v" } as never)).access_token).toBe(
      fx.tokenResponse.access_token,
    )
    expect((await postOauthTelegram({ init_data: "ok" } as never)).token_type).toBe("Bearer")
    expect((await failure(postOauthTelegram({ init_data: "invalid" } as never))).status).toBe(401)
  })
})

describe("id", () => {
  test("the bearer token picks the user: teacher, admin, otherwise student", async () => {
    const asToken = (token: string) =>
      userForRequest(new Request(TEST_API_URL, { headers: { Authorization: `Bearer ${token}` } }))
    expect(asToken("x").roles).toEqual(fx.userMe.roles)
    expect(asToken("teacher-token").roles).toEqual(fx.teacherMe.roles)
    expect(asToken("admin-token").roles).toEqual(fx.adminMe.roles)
    expect(await getIdMe()).toEqual(fx.userMe)
  })

  test("login challenge variants", async () => {
    await failure(getIdLogin(""))
    expect((await getIdLogin("skip")).skip).toBe(true)
    expect((await getIdLogin("second-factor")).requires_second_factor).toBe(true)
    expect((await getIdLogin("plain")).skip).toBe(false)
  })

  test("login magic values", async () => {
    expect(await postIdLogin({ login: "a.b", password: "x", login_challenge: "c" } as never)).toEqual(
      fx.loginResultRedirect,
    )
    expect(await postIdLogin({ login: "second.factor", password: "x", login_challenge: "c" } as never)).toEqual(
      fx.loginResultSecondFactor,
    )
    const locked = await failure(postIdLogin({ login: "locked.user", password: "x", login_challenge: "c" } as never))
    expect([locked.status, locked.type, locked.params.retry_after]).toEqual([423, "auth/locked", 300])
    const wrong = await failure(
      postIdLogin({ login: "a.b", password: "wrong-password", login_challenge: "c" } as never),
    )
    expect(wrong.type).toBe("auth/unauthorized")
    expect((await failure(postIdLogin({ login: "no.role", password: "x", login_challenge: "c" } as never))).type).toBe(
      "auth/role-missing",
    )
  })

  test("a created connector shows its token once and expires after the requested days", async () => {
    const created = await postIdMeConnectors({
      name: "Claude",
      server: "student",
      scopes: ["student.read"],
      expires_in_days: 7,
    } as never)
    expect(created.token).toBe(fx.connectorToken)
    expect(created.connector.token_prefix).toBe(fx.connectorToken.slice(0, 9))
    expect(created.connector.expires_at).toBe("2026-10-14T05:12:00Z")
  })

  test("revoking a session answers 204 (undefined body)", async () => {
    expect(await deleteIdMeSession("any")).toBeUndefined()
  })
})

describe("registration", () => {
  test("EMIS magic logins and passwords", async () => {
    const body = (emis_login: string, emis_password = "ok") => ({ emis_login, emis_password }) as never
    expect(await postIdRegisterEmis(body("fresh"))).toEqual(fx.registrationStart)
    expect(await postIdRegisterEmis(body("imported"))).toEqual(fx.registrationStartWithImport)
    expect((await failure(postIdRegisterEmis(body("fresh", "bad-password")))).type).toBe("emis/auth-failed")
    expect((await failure(postIdRegisterEmis(body("linked")))).type).toBe("id/emis-already-linked")
    expect((await failure(postIdRegisterEmis(body("wrong-institution")))).type).toBe("id/wrong-institution")
    expect((await failure(postIdRegisterEmis(body("emis-down")))).status).toBe(503)
  })
})

describe("admin users", () => {
  test("filters by query, role and status", async () => {
    const all = await getAdminUsers()
    expect(all.items).toHaveLength(fx.adminUsers.length)
    expect((await getAdminUsers({ role: "admin" } as never)).items.every((user) => user.roles.includes("admin"))).toBe(
      true,
    )
    const blocked = await getAdminUsers({ status: "blocked" } as never)
    expect(blocked.items.map((user) => user.status)).toEqual(["blocked"])
    expect((await getAdminUsers({ query: "zzzz-no-match" } as never)).items).toEqual([])
  })
})

describe("schedule", () => {
  test("GET /v1/admin/groups/stats is not taken for a group id", async () => {
    expect(await getAdminGroupsStats()).toEqual(fx.groupStats)
    expect((await getAdminGroup(fx.ids.group2TN2)).name).toBe("2TN2")
    expect((await failure(getAdminGroup("00000000-0000-4000-8000-000000000000"))).status).toBe(404)
  })

  test("the timetable reports a teacher conflict for Rakhimov on Monday period 1", async () => {
    const entry = {
      term_id: fx.ids.term,
      weekday: 1,
      period: 1,
      week_parity: "every",
      subject_id: fx.ids.math,
      teacher_id: fx.ids.teacherRakhimov,
      room_name: "101",
      audience: [{ group_id: fx.ids.group2TN2, subgroup: null }],
      valid_from: "2026-09-02",
      valid_to: null,
    } as never
    expect((await postAdminTimetableCheck(entry)).conflicts.length).toBeGreaterThan(0)
    const refused = await failure(postAdminTimetable(entry))
    expect([refused.status, refused.type]).toEqual([409, "common/conflict"])
    expect(Array.isArray(refused.params.conflicts)).toBe(true)
    const free = await postAdminTimetable({ ...(entry as object), weekday: 6, period: 6 } as never)
    expect([free.weekday, free.period, free.teacher?.id]).toEqual([6, 6, fx.ids.teacherRakhimov])
    expect(
      (await getAdminTimetable({ teacher_id: fx.ids.teacherRakhimov } as never)).every(
        (item) => item.teacher?.id === fx.ids.teacherRakhimov,
      ),
    ).toBe(true)
  })

  test("admin lessons list the cancelled lesson and the lesson that needs a teacher", async () => {
    const needed = await getAdminLessons({ teacher_needed: true } as never)
    expect(needed.items.map((lesson) => lesson.id)).toContain(fx.teacherNeededLesson.id)
    expect(needed.items.every((lesson) => lesson.teacher === null)).toBe(true)
    const cancelled = await getAdminLessons({ status: "cancelled" } as never)
    expect(cancelled.items.map((lesson) => lesson.id)).toContain(fx.cancelledLesson.id)
    const monday = await getAdminLessons({ from: "2026-10-05", to: "2026-10-05" } as never)
    expect(monday.items.every((lesson) => lesson.date === "2026-10-05")).toBe(true)
  })

  test("the student timetable hides lessons of the other subgroup and lessons without a teacher", async () => {
    const mine = await getMeTimetable({ from: "2026-10-05", to: "2026-10-10" } as never)
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.some((lesson) => lesson.id === fx.teacherNeededLesson.id)).toBe(false)
    expect(mine.every((lesson) => lesson.audience.every((item) => item.subgroup !== 2))).toBe(true)
  })

  test("students are searched by name and filtered by registration", async () => {
    const page = await getAdminStudents({ query: "Brastilov" } as never)
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((student) => `${student.first_name} ${student.last_name}`.includes("Brastilov"))).toBe(true)
  })
})

describe("classwork", () => {
  test("homework filters by status and can be marked done", async () => {
    const all = await getMeHomework()
    expect(all.length).toBeGreaterThan(0)
    expect((await getMeHomework({ status: "done" } as never)).every((item) => item.done_at !== null)).toBe(true)
    const item = all[0]
    if (!item) throw new Error("no homework fixture")
    const done = await putMeHomeworkDone(item.lesson_id, { done: true } as never)
    expect(done.done_at).toBe(fx.FIXTURE_NOW)
    expect((await putMeHomeworkDone(item.lesson_id, { done: false } as never)).done_at).toBeNull()
  })

  test("attendance echoes the submitted sheet with version + 1", async () => {
    const lesson = await getStaffLesson(fx.ids.lessonPhysicsToday)
    const first = lesson.attendance.roster[0]
    if (!first) throw new Error("no roster fixture")
    const sheet = await putStaffLessonAttendance(lesson.lesson.id, {
      base_version: lesson.attendance.version,
      absent: [first.user_id],
    } as never)
    expect(sheet.version).toBe(lesson.attendance.version + 1)
    expect(sheet.submitted).toBe(true)
    expect(sheet.roster.filter((item) => item.absent).map((item) => item.user_id)).toEqual([first.user_id])
  })

  test("the attendance conflict variant carries the current sheet", async () => {
    server.use(errorHandlers.conflictAttendance)
    const conflict = await failure(
      putStaffLessonAttendance(fx.ids.lessonPhysicsToday, { base_version: 1, absent: [] } as never),
    )
    expect([conflict.status, conflict.type]).toEqual([409, "common/conflict"])
    expect(conflict.params.theirs).toBeDefined()
  })

  test("the date range of the own attendance report is echoed", async () => {
    const report = await getMeAttendance({ from: "2026-09-01", to: "2026-09-30" } as never)
    expect([report.from, report.to]).toEqual(["2026-09-01", "2026-09-30"])
  })

  test("CSV exports come back as blobs", async () => {
    const journal = await getStaffJournalCsv({
      subject_id: fx.ids.physics,
      audience_key: fx.journal.audience_key,
    } as never)
    expect(journal.type).toContain("text/csv")
    expect((await journal.text()).split("\n")[0]).toContain("Student")
    const attendance = await getAdminAttendanceCsv({ view: "group" } as never)
    expect(await attendance.text()).toContain("Absences")
    expect((await getAdminAttendance({ view: "group" } as never)).view).toBe("group")
  })
})

describe("files", () => {
  test("upload flow: create, PUT with the signed headers, complete, then list", async () => {
    const sha = "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ="
    const { file, upload } = await postFiles({
      name: "hello.txt",
      size: 5,
      content_type: "text/plain",
      sha256_b64: sha,
      purpose: "link",
    })
    expect(file.status).toBe("pending")
    expect(upload).toEqual({
      url: `${TEST_STORAGE_URL}/uploads/${file.id}`,
      method: "PUT",
      headers: { "Content-Type": "text/plain", "x-amz-checksum-sha256": sha },
    })
    const put = (headers: Record<string, string>, body = "hello") => fetch(upload.url, { method: "PUT", headers, body })
    // The signature covers both headers, so leaving one out or changing it is refused.
    expect((await put({ "Content-Type": "text/plain" })).status).toBe(403)
    expect((await put({ "Content-Type": "application/pdf", "x-amz-checksum-sha256": sha })).status).toBe(403)
    expect((await put({ "Content-Type": "text/plain", "x-amz-checksum-sha256": "bm9wZQ==" })).status).toBe(403)
    // A hex digest is not the base64 digest.
    const hex = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    expect((await put({ "Content-Type": "text/plain", "x-amz-checksum-sha256": hex })).status).toBe(403)
    // The right headers with a body that does not hash to the declared checksum.
    const tampered = await put(upload.headers, "HELLO")
    expect(tampered.status).toBe(403)
    expect(await tampered.text()).toContain("BadDigest")
    expect(storedObjects.has(file.id)).toBe(false)
    // The right headers and body.
    expect((await put(upload.headers)).status).toBe(200)
    expect(storedObjects.get(file.id)).toBe(5)
    const ready = await postFileComplete(file.id)
    expect([ready.status, ready.name, ready.assistant_ready]).toEqual(["ready", "hello.txt", true])
    const listed = await api.get<{ items: { id: string }[] }>("/v1/me/files", { query: { purpose: "link" } })
    expect(listed.items.map((item) => item.id)).toContain(file.id)
  })

  test("the object store refuses an upload it never signed", async () => {
    const response = await fetch(`${TEST_STORAGE_URL}/uploads/unknown`, { method: "PUT", body: "x" })
    expect(response.status).toBe(403)
  })

  test("executables and files over 50 MB are refused by POST /v1/files", async () => {
    const base = { content_type: "application/octet-stream", sha256_b64: "", purpose: "link" } as const
    expect((await failure(postFiles({ ...base, name: "setup.EXE", size: 10 }))).type).toBe("files/type-not-allowed")
    const big = await failure(postFiles({ ...base, name: "big.bin", size: 60 * 1024 * 1024 }))
    expect([big.status, big.type]).toEqual([413, "files/too-large"])
  })

  test("resetCreatedFiles forgets created files and stored objects", async () => {
    const { file } = await postFiles({
      name: "a.txt",
      size: 1,
      content_type: "text/plain",
      sha256_b64: "",
      purpose: "link",
    })
    expect((await api.get<{ id: string }>(`/v1/files/${file.id}`)).id).toBe(file.id)
    resetCreatedFiles()
    expect((await failure(api.get(`/v1/files/${file.id}`))).status).toBe(404)
  })
})

describe("public and links", () => {
  test("shares by slug: chat, flash card set, gone and unknown", async () => {
    expect((await getPublicShare("kq7x2m9a")).kind).toBe("chat")
    expect((await getPublicShare("zr5t8w1c")).kind).toBe("flashcard_set")
    expect((await failure(getPublicShare("gone0000"))).status).toBe(410)
    expect((await failure(getPublicShare("nothing"))).status).toBe(404)
  })

  test("lesson resources are filtered by lesson", async () => {
    const lesson = fx.resourceItems[0]?.lesson_id
    if (!lesson) throw new Error("no resource fixture")
    const resources = await getLessonResources(lesson)
    expect(resources.length).toBeGreaterThan(0)
    expect(resources.every((item) => item.lesson_id === lesson)).toBe(true)
    expect(await getLessonResources(fx.uuid(5, 9999))).toEqual([])
  })
})

describe("notifications, broadcasts, ai", () => {
  test("notifications are filtered and counted", async () => {
    const all = await getNotifications()
    const announcements = await getNotifications({ filter: "announcements" } as never)
    const activity = await getNotifications({ filter: "activity" } as never)
    expect(announcements.items.length + activity.items.length).toBe(all.items.length)
    const unread = fx.notificationItems.filter((item) => item.read_at === null).length
    expect((await getNotificationsUnreadCount()).count).toBe(unread)
  })

  test("scheduling a broadcast keeps the time, sending now starts sending", async () => {
    const id = fx.broadcastDraft.id
    const scheduled = await postAdminBroadcastSend(id, { scheduled_at: "2026-10-09T09:00:00Z" } as never)
    expect([scheduled.status, scheduled.scheduled_at]).toEqual(["scheduled", "2026-10-09T09:00:00Z"])
    expect((await postAdminBroadcastSend(id, {} as never)).status).toBe("sending")
    const count = await postAdminBroadcastsAudienceCount({ audience: fx.audienceEveryone } as never)
    expect(count.count).toBe(fx.audienceCountFor(fx.audienceEveryone))
  })

  test("an AI message answers with the turn result, the limit variant is 429", async () => {
    const chats = await getAiChats()
    const chat = chats.items[0]
    if (!chat) throw new Error("no chat fixture")
    const turn = await postAiChatMessages(chat.id, { text: "Explain kinematics" } as never)
    expect(JSON.stringify(turn)).toContain("Explain kinematics")
    server.use(errorHandlers.aiLimitReached)
    const limit = await failure(postAiChatMessages(chat.id, { text: "again" } as never))
    expect([limit.status, limit.type]).toEqual([429, "ai/limit-reached"])
    expect(limit.params.resets_at).toBe("2026-10-07T08:00:00Z")
  })
})

describe("lms", () => {
  test("the catalog can be searched and an unknown invite code is a 404", async () => {
    expect((await getLmsCourses()).length).toBeGreaterThan(0)
    expect(await getLmsCourses({ query: "zzzz-no-match" } as never)).toEqual([])
    expect((await postLmsJoin({ code: "NX4R8T" } as never)).enrolled).toBe(true)
    expect((await failure(postLmsJoin({ code: "BADCODE" } as never))).status).toBe(404)
  })
})

describe("composition", () => {
  test("alerts, search, calendar", async () => {
    expect(await getMeAlerts()).toEqual(fx.alerts)
    expect((await getMeSearch({ q: "physics" } as never)).subjects.length).toBeGreaterThan(0)
    const nothing = await getMeSearch({ q: "nothing" } as never)
    expect(Object.values(nothing).every((list) => Array.isArray(list) && list.length === 0)).toBe(true)
    const { url } = await postMeCalendarToken()
    expect(url).toBe(fx.calendarTokenResponse.url)
    expect(await getIcal("cal-token-1")).toContain("BEGIN:VCALENDAR")
  })

  test("dashboard and 360 views", async () => {
    expect(await getAdminDashboard()).toEqual(fx.adminDashboard)
    expect((await getAdminStudent(fx.student360.profile.user_id)).profile.user_id).toBe(fx.student360.profile.user_id)
    expect((await failure(getAdminStudent("00000000-0000-4000-8000-000000000000"))).status).toBe(404)
  })
})

describe("error variants and per-test isolation", () => {
  const today = () => api.get("/v1/me/today")

  test("an override installed with server.use applies to this test only (1/2)", async () => {
    server.use(errorHandlers.serverError)
    const error = await failure(today())
    expect([error.status, error.params.error_id]).toEqual([500, "e-123"])
  })

  test("an override installed with server.use applies to this test only (2/2)", async () => {
    expect(await today()).toEqual(fx.studentToday)
  })

  test("unauthorizedOnce fails the first request only", async () => {
    server.use(errorHandlers.unauthorizedOnce)
    expect((await failure(today())).status).toBe(401)
    expect(await today()).toEqual(fx.studentToday)
  })

  test("networkError looks like an unreachable server", async () => {
    server.use(errorHandlers.networkError)
    expect((await failure(today())).type).toBe("network/unreachable")
  })

  test("every error variant is a ready handler", () => {
    for (const handler of Object.values(errorHandlers)) {
      expect(typeof (handler.info as { path: unknown }).path).toBe("string")
    }
  })

  test("custom handlers can still be added next to the defaults", async () => {
    server.use(http.get(`${TEST_API_URL}/v1/me/today`, () => HttpResponse.json({ custom: true })))
    expect(await today()).toEqual({ custom: true })
  })
})

describe("preload", () => {
  test("window.__ENV__ is the test environment and the route starts at /", () => {
    expect(getConfig().API_URL).toBe(TEST_API_URL)
    expect(getTestRoute()).toEqual({ pathname: "/", search: "" })
  })

  test("setTestRoute updates window.history and the router mocks are cleared after each test (1/2)", () => {
    setTestRoute("/lessons/view/?id=l-1")
    expect(window.location.pathname).toBe("/lessons/view/")
    expect(window.location.search).toBe("?id=l-1")
    testRouter.push("/somewhere")
    expect(testRouter.push).toHaveBeenCalledTimes(1)
    window.localStorage.setItem("leak", "1")
  })

  test("the router, route and storage are reset between tests (2/2)", () => {
    expect(getTestRoute().pathname).toBe("/")
    expect(testRouter.push).not.toHaveBeenCalled()
    expect(window.localStorage.getItem("leak")).toBeNull()
  })
})
