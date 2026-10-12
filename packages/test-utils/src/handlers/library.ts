// Stateful MSW handlers for every endpoint of packages/api/src/endpoints/library.ts (paths under `/v1`, matched against
// `TEST_API_URL`), plus the mocked object store (`TEST_STORAGE_URL/library/files/{fid}` serves a tiny valid PDF).
// Import everything from `@ihsp/test-utils`. Fixtures: `fixtures/library.ts` (read its header for the data).
//
// EXPORTS
//   libraryHandlers               all handlers (already part of `allHandlers` and of the shared MSW `server`)
//   resetLibraryState()           back to the fixtures; called after every test by `preload.ts`
//   setLibraryActor(who)          who calls the API: "student" (default, Aziza K.), "teacher", "librarian" (a student
//                                 librarian, Dilshod R.), "librarian2" (Madina S., may approve the first one's uploads),
//                                 "admin", a custom `{ id, roles, name?, cohort? }`, `null` / "anonymous" (no user:
//                                 anon routes serve public published items only, every other route answers 401), or
//                                 "token" (strict: no Authorization header is anonymous; a bearer token containing
//                                 admin / librarian / librarian2 / teacher acts as that user, else the student).
//                                 Without a call, a bearer token containing those words also picks the user.
//   getLibraryActor()             the current actor (`null` when anonymous)
//   setUniLibrary({ enabled?, stale?, down? })   UniLibrary controls; DORMANT by default (see below)
//   getUniLibrary()               the current controls
//   seedLibraryItem(detail, opts) adds or replaces a stored item: `{ ownerId?, text?, input?, addedAt? }`
//
// BEHAVIOUR
//   Visibility: anonymous visitors get published `visibility: "public"` items only, signed-in users also `lyceum` items,
//     owners their own uploads in any status, librarians (role librarian or admin) everything; anything else is
//     `404 library/not-found`. `GET /library/items` lists published, non-hidden items only; full-text hits carry
//     `snippet` (with `<mark>`) and `snippet_page`; `q` matches title, author, description and the text, and for Uzbek
//     items Cyrillic equals Latin and every apostrophe variant is equal ("ўткан" finds "o'tkan").
//     Cursor pagination: `cursor` is an offset, `limit` defaults to 20.
//   Needs sign-in (401 when anonymous): topics, text, reading lists, `/me/*`, uploads, reports, `/manage/*`, `/admin/*`.
//     Anon routes: items, item, file url, subjects, collections. `403 common/forbidden` for the wrong role.
//   Files: `GET /library/items/{id}/files/{fid}/url` returns a URL on the mocked storage host; `409
//     library/not-supported` for UniLibrary records; `?inline=1` needs `can.read`, without it `can.download`.
//   Uploads: create (needs `attested`) -> files -> submit. Submit: student and librarian -> `pending_review`, teacher and
//     admin -> `published`. Owner edits; a rejected or withdrawn item is `409 library/not-editable`.
//   Reports: two different users reporting `copyright`, `personal_data`, `inappropriate` or `exam_leak` hold a published
//     item; one report from a teacher, librarian or admin holds it at once. Same user and reason twice counts once.
//   Moderation (`POST /manage/library/items/{id}/{action}`): approve | request-changes | reject need `pending_review`;
//     hold needs `published`; restore needs `held` or `unpublished`; unpublish needs `published` or `held`; other states
//     are `409 library/not-editable`. A reason is required except for approve (`422 common/request-validation`).
//     Approving one's own upload is `403 library/own-item` (admins excepted).
//   Books: draft -> publish checklist (`rights`, `text_status`, `cover`, `subjects`); `422 library/rights-incomplete`
//     with `params.missing`; `public` with permission or official rights is `422 library/visibility-conflict`.
//   Reading lists: teacher, librarian, admin create and edit their own; students see published lists only; more than
//     100 entries is `422 library/list-too-long`; `read_state` comes from the caller's shelf.
//   Annotations: private per user; `POST` and `sync` are idempotent by `client_id`; sync accepts at most 200 changes and
//     deletes by id or `client_id`.
//
// UNILIBRARY IS DORMANT BY DEFAULT: `setUniLibrary({ enabled: true })` (or an admin's `PUT
//   /admin/library/unilibrary/settings { enabled: true }`) switches it on. While off, EVERY `/library/external/unilibrary/*`
//   route answers `404 library/external-disabled`, `GET /library/items` never returns `kind: "external"`, `source=external`
//   is an empty page, and external items vanish from the shelf and lists. When on: search returns 5 records per page
//   (`stale` follows the control), `down` answers `503 library/external-unavailable` with `params.retry_after`, pin is
//   idempotent (`201` then `200`) and returns the card with an `id`; pinned records can go on the shelf and in lists.
//   Record `355186` is pinned from the start. Admin routes work in every state.

import type { ItemDetail } from "@ihsp/api"
import { libActors, libraryCan, type LibraryActor, type LibraryActorKey, type LibraryRole } from "../fixtures/library"
import { FIXTURE_NOW } from "../fixtures/world"
import { libraryAdminHandlers } from "./library-admin"
import { libraryCatalogueHandlers } from "./library-catalogue"
import { libraryExternalHandlers } from "./library-external"
import { libraryManageHandlers } from "./library-manage"
import { libraryMaterialHandlers } from "./library-materials"
import { libraryMeHandlers } from "./library-me"
import { state, type StoredItem, type UniLibraryControls } from "./library-state"

export { resetLibraryState } from "./library-state"

/** Anyone who can be named in `setLibraryActor`. */
export type LibraryActorSpec =
  | LibraryActorKey
  | "anonymous"
  | "token"
  | null
  | { id: string; roles: LibraryRole[]; name?: string; cohort?: string | null }

/** Sets who calls the library API in this test (see the header; reset after every test). */
export function setLibraryActor(who: LibraryActorSpec): void {
  if (who === null || who === "anonymous") {
    state.control = { kind: "anonymous" }
  } else if (who === "token") {
    state.control = { kind: "token" }
  } else if (typeof who === "string") {
    state.control = { kind: "actor", actor: libActors[who] }
  } else {
    const actor: LibraryActor = { name: "Test user", cohort: "2025", ...who }
    state.control = { kind: "actor", actor: { ...actor, cohort: actor.cohort ?? null } }
  }
}

/** The current actor, `null` when anonymous. */
export function getLibraryActor(): LibraryActor | null {
  const control = state.control
  if (control.kind === "actor") return control.actor
  return control.kind === "anonymous" || control.kind === "token" ? null : libActors.student
}

/** Switches UniLibrary on or off and makes it stale or unavailable. The default is `{ enabled: false, stale: false, down: false }`. */
export function setUniLibrary(patch: Partial<UniLibraryControls>): void {
  state.unilibrary = { ...state.unilibrary, ...patch }
  state.settings = { ...state.settings, enabled: state.unilibrary.enabled }
}

export function getUniLibrary(): UniLibraryControls {
  return { ...state.unilibrary }
}

/** Adds (or replaces) an item in the mocked backend. `can` is recomputed on every read. */
export function seedLibraryItem(
  detail: ItemDetail,
  options: { ownerId?: string | null; text?: string[]; input?: StoredItem["input"]; addedAt?: string } = {},
): void {
  if (!detail.id) throw new Error("seedLibraryItem needs an item with an id")
  state.items.set(detail.id, {
    detail: { ...detail, can: libraryCan(null, detail, null) },
    ownerId: options.ownerId ?? null,
    addedAt: options.addedAt ?? FIXTURE_NOW,
    submittedAt: detail.status === "draft" ? null : (options.addedAt ?? FIXTURE_NOW),
    scan: [],
    text: options.text ?? [],
    bodyMd: null,
    input: options.input ?? null,
    supersedesId: null,
  })
}

/** Inside each part the more specific routes (`/search`, `/taxonomies`, `/books/{id}/files`, `/annotations/export`) come first. */
export const libraryHandlers = [
  ...libraryCatalogueHandlers,
  ...libraryExternalHandlers,
  ...libraryMeHandlers,
  ...libraryMaterialHandlers,
  ...libraryManageHandlers,
  ...libraryAdminHandlers,
]
