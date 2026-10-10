// Academic — the curriculum of a group, stored from EMIS (backend: GET /v1/me/curriculum,
// GET /v1/admin/groups/{id}/curriculum and POST /v1/admin/groups/{id}/curriculum/sync).
// Derived from the generated OpenAPI schemas, so the backend contract cannot drift.

import type { components } from "../generated/openapi"

type Schemas = components["schemas"]

/** A name in every interface language; any of them can be an empty string. */
export type LocalizedText = Schemas["CurriculumNameResponse"]

export type CurriculumDirection = Schemas["CurriculumDirectionResponse"]

/** `1` general, `2` in-depth (advanced), `3` vocational, `4` unified; other ids are not labelled. */
export type CurriculumSubjectTypeId = number

export type CurriculumSubject = Schemas["CurriculumSubjectResponse"]

export type CurriculumSemester = Schemas["CurriculumSemesterResponse"]

/** An exam or a vocational subject: a name and its hours. */
export type CurriculumHoursItem = Schemas["CurriculumExtraResponse"]

export type CurriculumView = Schemas["CurriculumResponse"]

/**
 * Only `synced` comes back from the sync: a group without a student who has an EMIS login answers
 * `409 academic/curriculum-no-emis-student` instead (`no_student` is left over in the generated schema).
 */
export type CurriculumSyncStatus = Schemas["CurriculumSyncResponse"]["status"]

export type CurriculumSyncResult = Schemas["CurriculumSyncResponse"]
