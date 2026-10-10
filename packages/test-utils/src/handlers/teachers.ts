import type { TeacherContacts } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, param } from "./utils"

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

export const teachersHandlers = [
  http.get(apiUrl("/v1/me/teachers"), () => HttpResponse.json([])),
  http.get(apiUrl("/v1/staff/me/contacts"), () => HttpResponse.json(contacts.get("me") ?? NO_CONTACTS)),
  http.put(apiUrl("/v1/staff/me/contacts"), async ({ request }) => {
    const body = (await request.json()) as TeacherContacts
    contacts.set("me", body)
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/admin/teacher-contacts/:id"), ({ params }) =>
    HttpResponse.json(contacts.get(param(params, "id")) ?? NO_CONTACTS),
  ),
  http.put(apiUrl("/v1/admin/teacher-contacts/:id"), async ({ params, request }) => {
    const body = (await request.json()) as TeacherContacts
    contacts.set(param(params, "id"), body)
    return HttpResponse.json(body)
  }),
]
