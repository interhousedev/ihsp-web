// Library handlers, part 4: uploading materials (create, files, submit, edit, new version, withdraw).
// A student's submitted material waits for review (`pending_review`); a teacher's or administrator's is `published`
// at once; a librarian's waits for another librarian.

import type { ItemDetail, MaterialFilesBody, MaterialInput, MaterialPatchBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { FIXTURE_NOW, uuid } from "../fixtures/world"
import { makeItemDetail, makeItemFile, uploaderRoleOf, type LibraryActor } from "../fixtures/library"
import {
  detailFor,
  invalid,
  itemNotFound,
  newId,
  notEditable,
  signedIn,
  stamp,
  state,
  subjectRef,
  type StoredItem,
} from "./library-state"
import { apiUrl, noContent, param, problem, readJson } from "./utils"

const MAX_IMAGES = 20

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function authorLabel(actor: LibraryActor): string {
  return actor.cohort ? `${actor.name}, ${actor.cohort}` : actor.name
}

/** The caller's own material, or `null` (other people's materials are `404`). */
function ownMaterial(actor: LibraryActor, id: string): StoredItem | null {
  const stored = state.items.get(id)
  return stored && stored.detail.kind === "material" && stored.ownerId === actor.id ? stored : null
}

function topicRefs(topicIds: string[] | undefined): ItemDetail["topics"] | null {
  const refs: ItemDetail["topics"] = []
  for (const id of topicIds ?? []) {
    const topic = state.topics.find((t) => t.id === id)
    if (!topic) return null
    refs.push({ id: topic.id, name: topic.name.en, page_from: null, page_to: null })
  }
  return refs
}

/** Findings of the scan job: phone numbers and exam-paper markers (shown to the librarian, never enforced). */
function scanFindings(stored: StoredItem): string[] {
  const text = `${stored.detail.title} ${stored.detail.description ?? ""} ${stored.bodyMd ?? ""}`
  const findings: string[] = []
  if (/\+?\d[\d\s-]{8,}\d/.test(text)) findings.push("phone number found")
  if (/(oraliq nazorat|yakuniy nazorat|рубежный контроль|midterm|final exam)/i.test(text)) {
    findings.push("exam paper marker found")
  }
  return findings
}

function activeBan(actor: LibraryActor): { until: string | null } | undefined {
  return state.sanctions.find(
    (s) => s.user_id === actor.id && s.kind === "upload_ban" && (!s.until || s.until > FIXTURE_NOW),
  )
}

/** Drafts saved without the attestation (`attested: false`); submitting them is `422 library/attestation-required`. */
const unattested = new WeakSet<StoredItem>()

/** Creates a draft material of `actor`; the failure is a response. */
function createMaterial(
  actor: LibraryActor,
  body: Partial<MaterialInput>,
  supersedesId: string | null,
): StoredItem | Response {
  const ban = activeBan(actor)
  if (ban) return problem(403, "library/banned", "You cannot upload materials", { params: { until: ban.until } })
  if (!body.title?.trim()) return invalid("title", "A title is required")
  if (typeof body.attested !== "boolean") return invalid("attested", "attested is required (false saves a draft)")
  const topics = topicRefs(body.topic_ids)
  if (!topics) return invalid("topic_ids", "Unknown topic")
  const id = newId()
  const markdown = body.body_md?.trim() ? body.body_md : null
  const role = uploaderRoleOf(actor)
  const detail = makeItemDetail({
    id,
    slug: `${slugify(body.title)}-${id.slice(-4)}`,
    kind: "material",
    type: body.type ?? "notes",
    title: body.title,
    author_label: authorLabel(actor),
    language: body.language ?? "uz_latn",
    description: body.description ?? null,
    description_excerpt: body.description ? body.description.slice(0, 140) : null,
    subjects: (body.subject_ids ?? []).map(subjectRef).filter((s) => s !== null),
    years_of_study: body.years_of_study ?? [],
    has_text: markdown !== null,
    tag: { source: "material", label: "Material" },
    status: "draft",
    // Public only for a teacher who picks a Creative Commons licence.
    visibility: role === "teacher" && body.licence?.startsWith("cc_") ? "public" : "lyceum",
    material: { uploader_name: actor.name, uploader_cohort: actor.cohort ?? "", uploader_role: role },
    topics,
    files: markdown
      ? [makeItemFile({ id: newId(), format: "md", pages: null, byte_size: markdown.length, toc: [] })]
      : [],
  })
  const stored: StoredItem = {
    detail,
    ownerId: actor.id,
    addedAt: stamp(),
    submittedAt: null,
    scan: [],
    text: markdown ? [markdown] : [],
    bodyMd: markdown,
    input: null,
    supersedesId,
  }
  if (!body.attested) unattested.add(stored)
  state.items.set(id, stored)
  return stored
}

/** What submitting does for the uploader's role (§ 3.5): teachers and administrators publish, others wait for review. */
function statusAfterSubmit(actor: LibraryActor): "published" | "pending_review" {
  return actor.roles.includes("admin") || actor.roles.includes("teacher") ? "published" : "pending_review"
}

/** Groups a teacher teaches or curates; librarians and Administration get all of them. */
export const libGroups = [
  { id: uuid(48, 1), name: "1-Litsey A" },
  { id: uuid(48, 2), name: "1-Litsey B" },
  { id: uuid(48, 3), name: "2-Litsey A" },
]

export const libraryMaterialHandlers = [
  http.get(apiUrl("/v1/library/my-groups"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const staff = actor.roles.some((role) => role === "teacher" || role === "librarian" || role === "admin")
    if (!staff) return problem(403, "common/forbidden", "Only staff have groups")
    return HttpResponse.json(actor.roles.includes("teacher") ? libGroups.slice(0, 2) : libGroups)
  }),

  http.post(apiUrl("/v1/library/materials"), async ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const created = createMaterial(actor, await readJson<MaterialInput>(request), null)
    return created instanceof Response ? created : HttpResponse.json(detailFor(actor, created), { status: 201 })
  }),

  /** One PDF, or up to 20 images that the server combines into one PDF. Only drafts and changes-requested items. */
  http.post(apiUrl("/v1/library/materials/:id/files"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = ownMaterial(actor, param(params, "id"))
    if (!stored) return itemNotFound()
    if (!["draft", "changes_requested"].includes(stored.detail.status)) {
      return notEditable({ status: stored.detail.status })
    }
    const ids = (await readJson<MaterialFilesBody>(request)).file_ids ?? []
    if (ids.length === 0) return invalid("file_ids", "Upload a file first")
    if (ids.length > MAX_IMAGES)
      return problem(422, "library/too-many-pages", "At most 20 images", { params: { limit: MAX_IMAGES } })
    const pages = Math.max(ids.length, 4)
    const file = makeItemFile({
      id: ids.length === 1 ? (ids[0] ?? newId()) : newId(),
      pages,
      byte_size: 120_000 * pages,
    })
    stored.detail = { ...stored.detail, files: [file], has_text: true, page_count: pages }
    stored.text = ["Extracted text of the uploaded file."]
    return HttpResponse.json(detailFor(actor, stored))
  }),

  http.post(apiUrl("/v1/library/materials/:id/submit"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = ownMaterial(actor, param(params, "id"))
    if (!stored) return itemNotFound()
    if (!["draft", "changes_requested"].includes(stored.detail.status)) {
      return notEditable({ status: stored.detail.status })
    }
    if (unattested.has(stored)) {
      return problem(422, "library/attestation-required", "Confirm that you made the material or may share it")
    }
    if (stored.detail.files.length === 0) return invalid("files", "Add a file or write the text before submitting")
    const status = statusAfterSubmit(actor)
    stored.detail = { ...stored.detail, status, status_reason: null, status_note: null }
    stored.submittedAt = stamp()
    stored.scan = scanFindings(stored)
    const older = stored.supersedesId ? state.items.get(stored.supersedesId) : undefined
    if (status === "published" && older)
      older.detail = { ...older.detail, status: "unpublished", status_reason: "superseded" }
    return HttpResponse.json(detailFor(actor, stored), { status: 202 })
  }),

  /** Title, description and topics can be edited at any time by the owner (not when rejected or withdrawn). */
  http.patch(apiUrl("/v1/library/materials/:id"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = ownMaterial(actor, param(params, "id"))
    if (!stored) return itemNotFound()
    if (["rejected", "unpublished"].includes(stored.detail.status)) return notEditable({ status: stored.detail.status })
    const body = await readJson<MaterialPatchBody>(request)
    if (body.attested !== undefined && body.attested !== null) {
      if (!["draft", "changes_requested"].includes(stored.detail.status)) {
        return notEditable({ status: stored.detail.status })
      }
      if (body.attested) unattested.delete(stored)
      else unattested.add(stored)
    }
    if (body.title !== undefined && !body.title.trim()) return invalid("title", "A title is required")
    const topics = body.topic_ids === undefined ? stored.detail.topics : topicRefs(body.topic_ids)
    if (!topics) return invalid("topic_ids", "Unknown topic")
    const d = stored.detail
    stored.detail = {
      ...d,
      title: body.title ?? d.title,
      description: body.description ?? d.description,
      description_excerpt: body.description ? body.description.slice(0, 140) : d.description_excerpt,
      topics,
    }
    if (body.body_md !== undefined) {
      stored.bodyMd = body.body_md
      stored.text = [body.body_md]
      const md = makeItemFile({
        id: d.files.find((f) => f.format === "md")?.id ?? newId(),
        format: "md",
        pages: null,
        byte_size: body.body_md.length,
      })
      stored.detail = { ...stored.detail, has_text: true, files: [md, ...d.files.filter((f) => f.format !== "md")] }
    }
    return HttpResponse.json(detailFor(actor, stored))
  }),

  /** A new version is a new draft that supersedes the old one once it is approved (the old one stays published meanwhile). */
  http.post(apiUrl("/v1/library/materials/:id/versions"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const older = ownMaterial(actor, param(params, "id"))
    if (!older) return itemNotFound()
    if (older.detail.status !== "published") return notEditable({ status: older.detail.status })
    const created = createMaterial(actor, await readJson<MaterialInput>(request), older.detail.id)
    return created instanceof Response ? created : HttpResponse.json(detailFor(actor, created), { status: 201 })
  }),

  /** The owner withdraws the item: a draft disappears, anything else becomes `unpublished`. */
  http.delete(apiUrl("/v1/library/materials/:id"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = ownMaterial(actor, param(params, "id"))
    if (!stored?.detail.id) return itemNotFound()
    if (stored.detail.status === "draft") {
      state.items.delete(stored.detail.id)
    } else {
      stored.detail = {
        ...stored.detail,
        status: "unpublished",
        status_reason: "withdrawn_by_owner",
        status_note: null,
      }
    }
    return noContent()
  }),
]
