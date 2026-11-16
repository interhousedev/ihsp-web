/** Shapes of the `/v1/admission/catalog/*` and `/v1/admission/list*` responses (generated from the OpenAPI document). */
import type {
  AdmissionAffordability,
  AdmissionEstimate,
  AdmissionFact,
  AdmissionInstitution,
  AdmissionInstitutionPage,
  AdmissionListAddIn,
  AdmissionListEntry,
  AdmissionListPatchIn,
  AdmissionScholarship,
  AdmissionSummary,
} from "@ihsp/api"

export type Fact = AdmissionFact
export type Institution = AdmissionInstitution
export type InstitutionPage = AdmissionInstitutionPage
export type Summary = AdmissionSummary
export type Scholarship = AdmissionScholarship
export type Estimate = AdmissionEstimate
export type Affordability = AdmissionAffordability
export type ListEntry = AdmissionListEntry
export type ListAddBody = AdmissionListAddIn
export type ListPatchBody = AdmissionListPatchIn

export type Bucket = NonNullable<ListAddBody["bucket"]>
export type Round = NonNullable<ListAddBody["round"]>
