import { HttpResponse, http, type HttpHandler } from "msw"
import { attendanceSheet } from "../fixtures/classwork"
import { stepDraftTest } from "../fixtures/lms-authoring"
import { timetableConflicts } from "../fixtures/schedule"
import { apiUrl, problem } from "./utils"

/**
 * Error variants for one endpoint each. Install with `server.use(errorHandlers.rateLimited)`;
 * `server.resetHandlers()` (done after every test by the preload) removes them again.
 */
export const errorHandlers = {
  /** `GET /v1/me/today` answers `401 auth/unauthorized` every time. */
  unauthorized: http.get(apiUrl("/v1/me/today"), () => problem(401, "auth/unauthorized", "Authentication required")),

  /** `GET /v1/me/today` answers `401` once and then falls through to the default handler (token expired, refresh, retry). */
  unauthorizedOnce: http.get(apiUrl("/v1/me/today"), () => problem(401, "auth/unauthorized", "Access token expired"), {
    once: true,
  }),

  /** `GET /v1/me/today` fails at the network level (offline). */
  networkError: http.get(apiUrl("/v1/me/today"), () => HttpResponse.error()),

  /** `GET /v1/me/today` answers `500`. */
  serverError: http.get(apiUrl("/v1/me/today"), () =>
    problem(500, "common/internal", "Something went wrong", { params: { error_id: "e-123" } }),
  ),

  /** `POST /v1/id/login` answers `429 common/rate-limited` with `params.retry_after` seconds. */
  rateLimited: http.post(apiUrl("/v1/id/login"), () =>
    problem(429, "common/rate-limited", "Too many attempts", { params: { retry_after: 60 } }),
  ),

  /** `POST /v1/id/login` answers `423 auth/locked` with `params.retry_after` seconds. */
  accountLocked: http.post(apiUrl("/v1/id/login"), () =>
    problem(423, "auth/locked", "Account is locked", { params: { retry_after: 900 } }),
  ),

  /** `POST /v1/id/register/emis` answers `401 emis/auth-failed`. */
  emisAuthFailed: http.post(apiUrl("/v1/id/register/emis"), () =>
    problem(401, "emis/auth-failed", "EMIS rejected the credentials"),
  ),

  /** `POST /v1/id/register/emis` answers `409 id/emis-already-linked`. */
  emisAlreadyLinked: http.post(apiUrl("/v1/id/register/emis"), () =>
    problem(409, "id/emis-already-linked", "This EMIS account is already linked", {
      params: { login: "brastilov.aleksey" },
    }),
  ),

  /** `PUT /v1/staff/lessons/{id}/attendance` answers `409 common/conflict` with the current sheet in `params.theirs`. */
  conflictAttendance: http.put(apiUrl("/v1/staff/lessons/:id/attendance"), () =>
    problem(409, "common/conflict", "The attendance sheet was changed by someone else", {
      params: { theirs: { ...attendanceSheet, version: attendanceSheet.version + 1 } },
    }),
  ),

  /** `PUT /v1/staff/lessons/{id}/attendance` answers `403 attendance/window-closed`. */
  attendanceWindowClosed: http.put(apiUrl("/v1/staff/lessons/:id/attendance"), () =>
    problem(403, "attendance/window-closed", "The attendance window is closed"),
  ),

  /** `PUT /v1/lms/steps/{id}/draft` answers `409 common/conflict` with the other editor's draft in `params.theirs`. */
  conflictStepDraft: http.put(apiUrl("/v1/lms/steps/:id/draft"), () =>
    problem(409, "common/conflict", "The step was changed by someone else", {
      params: { theirs: { ...stepDraftTest, lock_version: stepDraftTest.lock_version + 1, updated_via: "mcp" } },
    }),
  ),

  /** `POST /v1/admin/timetable` answers `409 common/conflict` with `params.conflicts`. */
  conflictTimetable: http.post(apiUrl("/v1/admin/timetable"), () =>
    problem(409, "common/conflict", "The timetable entry conflicts with another one", {
      params: { conflicts: timetableConflicts },
    }),
  ),

  /** `POST /v1/lms/courses/{id}/publish` answers `409 lms/draft-changed`. */
  draftChanged: http.post(apiUrl("/v1/lms/courses/:id/publish"), () =>
    problem(409, "lms/draft-changed", "The draft changed since you opened the publish page"),
  ),

  /** `POST /v1/lms/courses/{id}/staff` answers `404 id/user-not-found`. */
  userNotFound: http.post(apiUrl("/v1/lms/courses/:id/staff"), () =>
    problem(404, "id/user-not-found", "No user with this login"),
  ),

  /** `POST /v1/ai/chats/{id}/messages` answers `429 ai/limit-reached` with the reset time. */
  aiLimitReached: http.post(apiUrl("/v1/ai/chats/:id/messages"), () =>
    problem(429, "ai/limit-reached", "The usage limit is reached", {
      params: { resets_at: "2026-10-07T08:00:00Z", scope: "session" },
    }),
  ),

  /** `POST /v1/files` answers `403 files/quota-exceeded`. */
  filesQuotaExceeded: http.post(apiUrl("/v1/files"), () =>
    problem(403, "files/quota-exceeded", "Your storage quota is exceeded", {
      params: { used_bytes: 52_428_800, quota_bytes: 52_428_800 },
    }),
  ),

  /** `POST /v1/files` answers `415 files/type-not-allowed`. */
  filesTypeNotAllowed: http.post(apiUrl("/v1/files"), () =>
    problem(415, "files/type-not-allowed", "This file type is not allowed"),
  ),

  /** `POST /v1/links` answers `422 links/blocked-url`. */
  linksBlockedUrl: http.post(apiUrl("/v1/links"), () => problem(422, "links/blocked-url", "This address is blocked")),

  /** `GET /v1/public/shares/{slug}` answers `404`. */
  shareNotFound: http.get(apiUrl("/v1/public/shares/:slug"), () => problem(404, "common/not-found", "Link not found")),

  /** `GET /v1/public/shares/{slug}` answers `410`. */
  shareGone: http.get(apiUrl("/v1/public/shares/:slug"), () => problem(410, "common/gone", "This link was removed")),

  /** `POST /v1/public/reports` answers `429 common/rate-limited`. */
  reportRateLimited: http.post(apiUrl("/v1/public/reports"), () =>
    problem(429, "common/rate-limited", "Too many reports", { params: { retry_after: 600 } }),
  ),
} satisfies Record<string, HttpHandler>
