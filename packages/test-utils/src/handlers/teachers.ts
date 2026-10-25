import type { TeacherContacts } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { adminUsers } from "../fixtures/id-admin"
import { addDaysIso, myTeacherOf, teacherTimetable } from "../fixtures/teachers"
import { FIXTURE_WEEK_START } from "../fixtures/world"
import { apiUrl, notFound, param, problem, query } from "./utils"

const NO_CONTACTS: TeacherContacts = {
  telegram: null,
  email: null,
  phone: null,
  office_hours: null,
  office: null,
  note: null,
}

/** Contacts by teacher id; `"me"` is the signed-in teacher. */
const contacts = new Map<string, TeacherContacts>()

export function resetTeacherContacts(): void {
  contacts.clear()
}

const PHOTO_TYPES = ["image/jpeg", "image/png"]
const PHOTO_MAX_BYTES = 5 * 1024 * 1024

let photoSequence = 0

/** One photo upload as the server received it (after the multipart body was read). */
export type TeacherPhotoUpload = { owner: string; name: string; type: string; size: number }
const photoUploads: TeacherPhotoUpload[] = []

/** The uploads received since the last reset, in order. */
export function teacherPhotoUploads(): TeacherPhotoUpload[] {
  return [...photoUploads]
}

export function resetTeacherPhotos(): void {
  photoUploads.length = 0
  photoSequence = 0
}

/** Reads the `file` part and applies the server rules: JPEG or PNG, at most 5 MB, not empty. */
async function receivePhoto(owner: string, request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!file || typeof file === "string") return problem(422, "id/photo-empty", "The photo is empty")
  if (file.size === 0) return problem(422, "id/photo-empty", "The photo is empty")
  if (file.size > PHOTO_MAX_BYTES) return problem(413, "id/photo-too-large", "The photo is too large")
  if (!PHOTO_TYPES.includes(file.type)) {
    return problem(422, "id/photo-type-not-allowed", "The photo is neither a JPEG nor a PNG image")
  }
  photoUploads.push({ owner, name: file.name, type: file.type, size: file.size })
  photoSequence += 1
  return HttpResponse.json({
    photo_url: `https://files.example.test/photos/${encodeURIComponent(owner)}-${photoSequence}.jpg`,
  })
}

function removePhoto(): Response {
  return HttpResponse.json({ photo_url: null })
}

export const teachersHandlers = [
  http.get(apiUrl("/v1/me/teachers"), () => HttpResponse.json([])),
  http.get(apiUrl("/v1/me/teachers/:teacherId"), ({ params }) => {
    const teacher = myTeacherOf(param(params, "teacherId"))
    return teacher ? HttpResponse.json(teacher) : notFound("Teacher")
  }),
  http.get(apiUrl("/v1/me/teachers/:teacherId/timetable"), ({ params, request }) => {
    const teacherId = param(params, "teacherId")
    if (!myTeacherOf(teacherId)) return notFound("Teacher")
    const range = query(request)
    const from = range.get("from") ?? FIXTURE_WEEK_START
    const to = range.get("to") ?? addDaysIso(FIXTURE_WEEK_START, 6)
    return HttpResponse.json(teacherTimetable(teacherId, from, to))
  }),
  http.get(apiUrl("/v1/staff/me/contacts"), () => HttpResponse.json(contacts.get("me") ?? NO_CONTACTS)),
  http.put(apiUrl("/v1/staff/me/contacts"), async ({ request }) => {
    const body = (await request.json()) as TeacherContacts
    contacts.set("me", body)
    return HttpResponse.json(body)
  }),
  http.put(apiUrl("/v1/staff/me/photo"), ({ request }) => receivePhoto("me", request)),
  http.delete(apiUrl("/v1/staff/me/photo"), () => removePhoto()),
  http.get(apiUrl("/v1/admin/teacher-contacts/:id"), ({ params }) =>
    HttpResponse.json(contacts.get(param(params, "id")) ?? NO_CONTACTS),
  ),
  http.put(apiUrl("/v1/admin/teacher-contacts/:id"), async ({ params, request }) => {
    const body = (await request.json()) as TeacherContacts
    contacts.set(param(params, "id"), body)
    return HttpResponse.json(body)
  }),
  http.put(apiUrl("/v1/admin/users/:id/photo"), ({ params, request }) => {
    const id = param(params, "id")
    if (!adminUsers.some((user) => user.id === id)) return notFound("User")
    return receivePhoto(id, request)
  }),
  http.delete(apiUrl("/v1/admin/users/:id/photo"), ({ params }) => {
    const id = param(params, "id")
    if (!adminUsers.some((user) => user.id === id)) return notFound("User")
    return removePhoto()
  }),
]
