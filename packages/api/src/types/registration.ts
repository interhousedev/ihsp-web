// Identity — registration, reclaim and the internal EMIS gateway
// (backend § API contract → "Identity — registration and EMIS (B2)", `contracts/emis.py` as JSON).

export type RegistrationStart = {
  registration_token: string
  profile: {
    first_name: string
    last_name: string
    middle_name: string | null
    group_name: string
    login: string
  }
  imported_match: {
    first_name: string
    last_name: string
    group_name: string
    needs_confirmation: boolean
  } | null
}

export type RegisterEmisBody = { emis_login: string; emis_password: string }
export type RegisterEmailBody = { registration_token: string; email: string }
export type RegisterCompleteBody = {
  registration_token: string
  password: string
  email_code: string
  confirm_import_match?: boolean
  login_challenge?: string
}
/** `login_ticket` (TODO(contract)): set without a login challenge; IHT ID redeems it on its own login. */
export type RegisterCompleteResponse = { login: string; redirect_to: string | null; login_ticket?: string | null }

export type ReclaimEmisBody = { emis_login: string; emis_password: string }
export type ReclaimStart = { reclaim_token: string; login: string }
export type ReclaimEmailBody = { reclaim_token: string; email: string }
export type ReclaimCompleteBody = { reclaim_token: string; new_password: string; email_code: string }

// Internal endpoints (`service` auth); never called from the browser.

export type EmisProfile = {
  emis_student_id: number
  first_name: string
  last_name: string
  middle_name: string | null
  institution_id: number
  group_emis_id: number
  /** Normalised, e.g. "2TN2". */
  group_name: string
  current_semester: number | null
  curriculum_id: number | null
}

export type EmisSubject = {
  emis_subject_id: number
  name_uz: string
  name_ru: string
  name_en: string
}

export type EmisMark = { type: "lesson" | "midterm" | "final"; date: string; value: number }

export type EmisSubjectRatings = {
  emis_subject_id: number
  semester: number
  semester_rating: number | null
  marks: EmisMark[]
  payload_hash: string
}

export type EmisRatingsParams = { subject: number; semester: number }
