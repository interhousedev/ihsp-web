import type { CurriculumSyncResult } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { curriculumView } from "../fixtures/curriculum"
import { ids } from "../fixtures/world"
import { apiUrl, notFound, param } from "./utils"

/**
 * Group 2TN2 has a stored curriculum and a student to fetch it with; group 1TN1 has neither (`null`, and a sync that
 * answers `no_student`); any other group does not exist.
 */
export const curriculumHandlers = [
  http.get(apiUrl("/v1/me/curriculum"), () => HttpResponse.json(curriculumView)),
  http.get(apiUrl("/v1/admin/groups/:groupId/curriculum"), ({ params }) => {
    const groupId = param(params, "groupId")
    if (groupId === ids.group2TN2) return HttpResponse.json(curriculumView)
    return groupId === ids.group1TN1 ? HttpResponse.json(null) : notFound("Group")
  }),
  http.post(apiUrl("/v1/admin/groups/:groupId/curriculum/sync"), ({ params }) => {
    const groupId = param(params, "groupId")
    if (groupId === ids.group2TN2) {
      return HttpResponse.json({ status: "synced", curriculum: curriculumView } satisfies CurriculumSyncResult)
    }
    return groupId === ids.group1TN1
      ? HttpResponse.json({ status: "no_student", curriculum: null } satisfies CurriculumSyncResult)
      : notFound("Group")
  }),
]
