import type { CurriculumSubject, CurriculumView } from "@ihsp/api"
import { ids } from "./world"

const SUBJECT_TYPE = { general: 1, inDepth: 2, vocational: 3, unified: 4 } as const

function subject(
  emisSubjectId: number,
  subjectId: string | null,
  name: CurriculumSubject["name"],
  typeId: number | null,
  hours: [study: number, classHours: number, independent: number] | null,
  isSeparated = false,
): CurriculumSubject {
  return {
    subject_id: subjectId,
    emis_subject_id: emisSubjectId,
    name,
    subject_type_id: typeId,
    study_hours: hours?.[0] ?? null,
    class_hours: hours?.[1] ?? null,
    independent_hours: hours?.[2] ?? null,
    is_separated: isSeparated,
  }
}

/**
 * The stored EMIS curriculum of group 2TN2: semesters 3 and 4 (4 is current), subjects of every type, some names
 * missing in a language, a subject without a platform counterpart and one without hours.
 */
export const curriculumView: CurriculumView = {
  emis_curriculum_id: 5021,
  name: "ТН, МТН, БТН 2025-2027",
  speciality: { uz: "Texnik yo'nalish", ru: "Техническое направление", en: "" },
  direction: { emis_id: 77, name: "Информационные технологии", code: "60610100" },
  edu_form: "Очная",
  language_code: "RU",
  rating_scale: { min: 2, max: 5 },
  current_semester: 4,
  fetched_at: "2026-10-06T21:00:00Z",
  semesters: [
    {
      number: 3,
      starts_on: "2026-01-12",
      ends_on: "2026-06-20",
      is_current: false,
      subjects: [
        subject(
          1001,
          ids.math,
          { uz: "Matematika", ru: "Математика", en: "Mathematics" },
          SUBJECT_TYPE.inDepth,
          [120, 90, 30],
        ),
        subject(
          1002,
          ids.physics,
          { uz: "Fizika", ru: "Физика", en: "Physics" },
          SUBJECT_TYPE.inDepth,
          [85, 68, 17],
          true,
        ),
        subject(
          1003,
          ids.english,
          { uz: "Ingliz tili", ru: "Английский язык", en: "English" },
          SUBJECT_TYPE.general,
          [60, 45, 15],
          true,
        ),
      ],
    },
    {
      number: 4,
      starts_on: "2026-09-01",
      ends_on: "2027-01-16",
      is_current: true,
      subjects: [
        subject(
          1001,
          ids.math,
          { uz: "Matematika", ru: "Математика", en: "Mathematics" },
          SUBJECT_TYPE.inDepth,
          [136, 102, 34],
        ),
        subject(1002, ids.physics, { uz: "Fizika", ru: "Физика", en: "" }, SUBJECT_TYPE.inDepth, [102, 68, 34], true),
        subject(
          1003,
          ids.english,
          { uz: "Ingliz tili", ru: "Английский язык", en: "English" },
          SUBJECT_TYPE.general,
          [68, 51, 17],
          true,
        ),
        subject(1005, ids.chemistry, { uz: "Kimyo", ru: "", en: "" }, SUBJECT_TYPE.general, [51, 34, 17]),
        subject(
          1006,
          ids.informatics,
          { uz: "Informatika", ru: "Информатика", en: "Informatics" },
          SUBJECT_TYPE.unified,
          [68, 51, 17],
        ),
        subject(
          1099,
          null,
          { uz: "Kasb asoslari", ru: "Основы профессии", en: "" },
          SUBJECT_TYPE.vocational,
          [34, 34, 0],
        ),
        subject(1100, null, { uz: "", ru: "Кураторский час", en: "" }, null, null),
      ],
    },
  ],
  exams: [
    {
      name: {
        uz: "Matematikadan yakuniy imtihon",
        ru: "Итоговый экзамен по математике",
        en: "Final exam: mathematics",
      },
      study_hours: 2,
    },
    { name: { uz: "", ru: "Экзамен по физике", en: "" }, study_hours: null },
  ],
  vocational_subjects: [
    {
      name: { uz: "Dasturlash amaliyoti", ru: "Практика программирования", en: "Programming practice" },
      study_hours: 72,
    },
  ],
}
