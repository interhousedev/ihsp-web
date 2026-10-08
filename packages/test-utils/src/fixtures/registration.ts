import type {
  EmisProfile,
  EmisSubject,
  EmisSubjectRatings,
  ReclaimStart,
  RegisterCompleteResponse,
  RegistrationStart,
} from "@ihsp/api"

/** A fresh EMIS login with no imported student to confirm. */
export const registrationStart: RegistrationStart = {
  registration_token: "registration-token-1",
  profile: {
    first_name: "Aleksey",
    last_name: "Brastilov",
    middle_name: "Olegovich",
    group_name: "2TN2",
    login: "brastilov.aleksey",
  },
  imported_match: null,
}

/** The student was imported by Administration before: "Is this you?" must be confirmed (ID-16). */
export const registrationStartWithImport: RegistrationStart = {
  ...registrationStart,
  registration_token: "registration-token-2",
  imported_match: {
    first_name: "Aleksey",
    last_name: "Brastilov",
    group_name: "2TN2",
    needs_confirmation: true,
  },
}

export const registerCompleteResponse: RegisterCompleteResponse = {
  login: "brastilov.aleksey",
  redirect_to: null,
}

export const reclaimStart: ReclaimStart = {
  reclaim_token: "reclaim-token-1",
  login: "brastilov.aleksey",
}

export const emisProfile: EmisProfile = {
  emis_student_id: 120045,
  first_name: "Aleksey",
  last_name: "Brastilov",
  middle_name: "Olegovich",
  institution_id: 1,
  group_emis_id: 3292,
  group_name: "2TN2",
  current_semester: 4,
  curriculum_id: 77,
}

export const emisSubjects: EmisSubject[] = [
  { emis_subject_id: 101, name_uz: "Matematika", name_ru: "Математика", name_en: "Mathematics" },
  { emis_subject_id: 102, name_uz: "Fizika", name_ru: "Физика", name_en: "Physics" },
  { emis_subject_id: 103, name_uz: "Ingliz tili", name_ru: "Английский язык", name_en: "English" },
]

export const emisRatings: EmisSubjectRatings = {
  emis_subject_id: 102,
  semester: 4,
  semester_rating: 4,
  marks: [
    { type: "lesson", date: "2026-09-16", value: 4 },
    { type: "lesson", date: "2026-09-30", value: 5 },
    { type: "midterm", date: "2026-10-02", value: 4 },
  ],
  payload_hash: "0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0",
}
