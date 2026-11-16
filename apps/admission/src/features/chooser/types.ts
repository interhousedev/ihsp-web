/** Shapes of the `/v1/admission/catalog/*` and `/v1/admission/list*` responses (see packages/api/openapi.json). */

export type Fact = {
  value: unknown
  source_url: string | null
  year: number | null
  note: string | null
  verified: boolean
}

export type Institution = {
  id: string
  slug: string
  name: string
  country: string
  city: string | null
  verified: boolean
  facts: Record<string, Fact>
  coa_total: string | null
  coa_currency: string | null
  aid_basis: string | null
  merit_available: boolean | null
  scholarship_count: number
}

export type InstitutionPage = { items: Institution[]; next_cursor: number | null }

export type Summary = { summary: string; points: Record<string, unknown>[]; missing: string[] }

export type Scholarship = {
  id: string
  name: string
  provider: string | null
  institution_id: string | null
  country: string | null
  basis: string | null
  coverage_min: number | null
  coverage_max: number | null
  covers: string[]
  url: string | null
  status: string | null
  cycle: string | null
}

export type Bucket = "reach" | "target" | "safety"
export type Round = "ED" | "ED2" | "EA" | "REA" | "RD" | "ROLLING"

export type Estimate = {
  label: string | null
  low: number | null
  high: number | null
  range_visible: boolean
  calibrated: boolean
  label_overridden: boolean
  verified: boolean
  caveats: string[]
  missing: string[]
  method_version: string | null
  sources: unknown[]
  basis: string | null
}

export type Affordability = {
  list_entry_id: string
  status: string
  coa_total: string | null
  confirmed_aid: string | null
  estimated_aid: string | null
  gap: string | null
  requested_sign_off_at: string | null
  signed_off_at: string | null
  sign_off_note: string | null
}

export type ListEntry = {
  id: string
  student_id: string
  institution: Institution
  round: Round
  status: string
  bucket: Bucket | null
  notes: string | null
  label_override: string | null
  override_note: string | null
  affordability_status: string | null
  affordability: Affordability | null
  estimate: Estimate
  lock_version: number
}

export type ListAddBody = { institution_id: string; bucket?: Bucket; notes?: string; round?: Round }
export type ListPatchBody = {
  lock_version: number
  bucket?: Bucket
  notes?: string
  round?: Round
  status?: string
}
