import type {
  CheckpointBody,
  CourseCreateBody,
  CourseSettingsBody,
  CourseStaffBody,
  CourseStaffPatchBody,
  DraftMetaBody,
  OutlineOp,
  OutlineOpsBody,
  OutlineSection,
  PendingChanges,
  PublishBody,
  StepCreateBody,
  StepDraft,
  StepDraftBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  courseDraft,
  pendingChanges,
  revisionItems,
  stepDiff,
  stepDraftTest,
  stepDraftText,
  stepDrafts,
  versionCompare,
  versionItem2,
  versionItems,
  versionView,
} from "../fixtures/lms-authoring"
import { courseStaff, stepViewTest } from "../fixtures/lms-learning"
import { FIXTURE_NOW, persons } from "../fixtures/world"
import { apiUrl, nextId, noContent, notFound, param, problem, query, readJson } from "./utils"

/** Applies outline operations to a copy of the outline (sections and steps are matched by id). */
export function applyOutlineOps(outline: OutlineSection[], ops: OutlineOp[]): OutlineSection[] {
  let sections = outline.map((section) => ({ ...section, steps: [...section.steps] }))
  for (const op of ops) {
    if (op.op === "add_section") {
      const section: OutlineSection = { id: nextId(16), title: op.title, steps: [] }
      sections.splice(op.position ?? sections.length, 0, section)
    } else if (op.op === "rename_section") {
      sections = sections.map((section) => (section.id === op.section_id ? { ...section, title: op.title } : section))
    } else if (op.op === "move_section") {
      const index = sections.findIndex((section) => section.id === op.section_id)
      const [moved] = index >= 0 ? sections.splice(index, 1) : []
      if (moved) sections.splice(op.position, 0, moved)
    } else if (op.op === "remove_section") {
      sections = sections.filter((section) => section.id !== op.section_id)
    } else if (op.op === "move_step") {
      const source = sections.find((section) => section.steps.some((step) => step.step_id === op.step_id))
      const step = source?.steps.find((item) => item.step_id === op.step_id)
      const target = sections.find((section) => section.id === op.to_section_id)
      if (source && step && target) {
        source.steps = source.steps.filter((item) => item.step_id !== op.step_id)
        target.steps.splice(op.position, 0, step)
      }
    } else {
      for (const section of sections) {
        section.steps = section.steps.filter((step) => step.step_id !== op.step_id)
      }
    }
  }
  return sections
}

function stepDraftFor(id: string): StepDraft | undefined {
  return stepDrafts.find((draft) => draft.step_id === id)
}

export const lmsAuthoringHandlers = [
  http.post(apiUrl("/v1/lms/courses"), async ({ request }) => {
    const body = await readJson<CourseCreateBody>(request)
    return HttpResponse.json({
      ...courseDraft,
      id: nextId(14),
      title: body.title ?? "New course",
      slug: body.slug ?? "new-course",
      visibility: body.visibility ?? "invite",
      description: "",
      invite_code: null,
      lock_version: 1,
      draft_seq: 1,
      outline: [],
      pending_count: 0,
      live_version: null,
    })
  }),
  http.get(apiUrl("/v1/lms/courses/:id/draft"), () => HttpResponse.json(courseDraft)),
  http.put(apiUrl("/v1/lms/courses/:id/draft/meta"), async ({ request }) => {
    const body = await readJson<DraftMetaBody>(request)
    return HttpResponse.json({
      ...courseDraft,
      title: body.title ?? courseDraft.title,
      description: body.description ?? courseDraft.description,
      lock_version: (body.lock_version ?? courseDraft.lock_version) + 1,
    })
  }),
  http.post(apiUrl("/v1/lms/courses/:id/draft/outline"), async ({ request }) => {
    const body = await readJson<OutlineOpsBody>(request)
    return HttpResponse.json({
      ...courseDraft,
      outline: applyOutlineOps(courseDraft.outline, body.ops ?? []),
      lock_version: (body.lock_version ?? courseDraft.lock_version) + 1,
      draft_seq: courseDraft.draft_seq + 1,
    })
  }),
  http.post(apiUrl("/v1/lms/courses/:id/steps"), async ({ params, request }) => {
    const body = await readJson<StepCreateBody>(request)
    return HttpResponse.json({
      step_id: nextId(15),
      course_id: param(params, "id"),
      content: { title: body.title ?? "New step", blocks: [] },
      lock_version: 1,
      status: "new",
      updated_via: "ui",
      updated_by: persons.rakhimov,
      updated_at: FIXTURE_NOW,
    } satisfies StepDraft)
  }),

  // --- Step drafts. A save returns the draft with `lock_version + 1`; conflicts come from `errorHandlers.conflictStepDraft`. ---
  http.get(apiUrl("/v1/lms/steps/:id/draft"), ({ params }) => {
    const draft = stepDraftFor(param(params, "id"))
    return draft ? HttpResponse.json(draft) : notFound("Step")
  }),
  http.put(apiUrl("/v1/lms/steps/:id/draft"), async ({ params, request }) => {
    const draft = stepDraftFor(param(params, "id"))
    if (!draft) return notFound("Step")
    const body = await readJson<StepDraftBody>(request)
    return HttpResponse.json({
      ...draft,
      content: body.content ?? draft.content,
      lock_version: (body.lock_version ?? draft.lock_version) + 1,
      status: "changed",
      updated_via: "ui",
      updated_at: FIXTURE_NOW,
    })
  }),
  http.post(apiUrl("/v1/lms/steps/:id/discard"), ({ params }) => {
    const draft = stepDraftFor(param(params, "id"))
    return draft ? HttpResponse.json({ ...draft, status: "unchanged" }) : notFound("Step")
  }),
  http.post(apiUrl("/v1/lms/steps/:id/checkpoints"), async ({ request }) => {
    const body = await readJson<CheckpointBody>(request)
    return HttpResponse.json({
      id: nextId(15),
      kind: "checkpoint",
      label: body.label ?? null,
      created_by: persons.rakhimov,
      created_at: FIXTURE_NOW,
      published: false,
    })
  }),
  http.get(apiUrl("/v1/lms/steps/:id/history"), () => HttpResponse.json(revisionItems)),
  http.post(apiUrl("/v1/lms/steps/:id/restore"), ({ params }) => {
    const draft = stepDraftFor(param(params, "id")) ?? stepDraftTest
    return HttpResponse.json({ ...draft, lock_version: draft.lock_version + 1, status: "changed" })
  }),
  http.get(apiUrl("/v1/lms/steps/:id/diff"), () => HttpResponse.json(stepDiff)),

  // --- Course pending changes, publishing, versions ---
  http.get(apiUrl("/v1/lms/courses/:id/pending"), () => HttpResponse.json(pendingChanges satisfies PendingChanges)),
  http.post(apiUrl("/v1/lms/courses/:id/publish"), async ({ request }) => {
    const body = await readJson<PublishBody>(request)
    return HttpResponse.json({
      ...versionItem2,
      number: (versionItems[0]?.number ?? 2) + 1,
      published_at: FIXTURE_NOW,
      note: body.note ?? null,
      changes: { added: 1, changed: 1, removed: 0, outline_changed: true },
    })
  }),
  http.post(apiUrl("/v1/lms/courses/:id/discard"), () =>
    HttpResponse.json({ ...courseDraft, pending_count: 0, draft_seq: courseDraft.draft_seq + 1 }),
  ),
  http.get(apiUrl("/v1/lms/courses/:id/versions"), () => HttpResponse.json(versionItems)),
  http.get(apiUrl("/v1/lms/courses/:id/versions/:number"), ({ params }) => {
    const number = Number(param(params, "number"))
    const item = versionItems.find((version) => version.number === number)
    return item ? HttpResponse.json({ ...versionView, ...item }) : notFound("Version")
  }),
  http.get(apiUrl("/v1/lms/courses/:id/compare"), ({ request }) => {
    const search = query(request)
    const a = Number(search.get("a"))
    const b = Number(search.get("b"))
    if (!a || !b) return problem(422, "common/request-validation", "a and b are required")
    return HttpResponse.json({ ...versionCompare, a, b })
  }),
  http.post(apiUrl("/v1/lms/courses/:id/versions/:number/restore"), () =>
    HttpResponse.json({ ...courseDraft, pending_count: 3, draft_seq: courseDraft.draft_seq + 1 }),
  ),

  // --- Staff. The login `nobody` does not exist (`404 id/user-not-found`). ---
  http.get(apiUrl("/v1/lms/courses/:id/staff"), () => HttpResponse.json(courseStaff)),
  http.post(apiUrl("/v1/lms/courses/:id/staff"), async ({ request }) => {
    const body = await readJson<CourseStaffBody>(request)
    if (body.login === "nobody") return problem(404, "id/user-not-found", "No user with this login")
    const user = Object.values(persons).find(
      (person) => body.login === `${person.last_name}.${person.first_name}`.toLowerCase(),
    )
    return HttpResponse.json({
      user: user ?? { id: nextId(1), first_name: "New", last_name: body.login ?? "Staff" },
      role: body.role ?? "Assistant",
      permissions: body.permissions ?? [],
      show_on_page: body.show_on_page ?? true,
      position: body.position ?? courseStaff.length + 1,
    })
  }),
  http.patch(apiUrl("/v1/lms/courses/:id/staff/:userId"), async ({ params, request }) => {
    const item = courseStaff.find((staff) => staff.user.id === param(params, "userId"))
    if (!item) return notFound("Staff member")
    const body = await readJson<CourseStaffPatchBody>(request)
    return HttpResponse.json({ ...item, ...body })
  }),
  http.delete(apiUrl("/v1/lms/courses/:id/staff/:userId"), () => noContent()),
  http.patch(apiUrl("/v1/lms/courses/:id/settings"), async ({ request }) => {
    const body = await readJson<CourseSettingsBody>(request)
    return HttpResponse.json({
      ...courseDraft,
      visibility: body.visibility ?? courseDraft.visibility,
      status: body.status ?? courseDraft.status,
    })
  }),
  http.post(apiUrl("/v1/lms/courses/:id/invite-code"), () => HttpResponse.json({ invite_code: "NX4R8T" })),
  http.get(apiUrl("/v1/lms/courses/:id/preview/steps/:stepId"), ({ params }) => {
    const draft = stepDraftFor(param(params, "stepId")) ?? stepDraftText
    return HttpResponse.json({ ...stepViewTest, step_id: draft.step_id, title: draft.content.title, preview: true })
  }),
]
