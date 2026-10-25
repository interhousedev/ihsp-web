import type { CurriculumSyncResult } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { curriculumView } from "../fixtures/curriculum"
import { ids } from "../fixtures/world"
import { apiUrl, notFound, param, problem } from "./utils"

/**
 * Group 2TN2 has a stored curriculum and a student to fetch it with; group 1TN1 has neither (`null`, and a sync that
 * answers `409 academic/curriculum-no-emis-student`); any other group does not exist.
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
      ? problem(409, "academic/curriculum-no-emis-student", "No student of this group has a working EMIS login yet")
      : notFound("Group")
  }),
]
