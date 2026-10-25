import type { CertificateEntry, CertificateGroup, CertificateType, StaffCertificateEntry } from "@ihsp/api"
import { ids, uuid } from "./world"

const KIND = 90
const name = (en: string, ru = en, uz = en) => ({ en, ru, uz })

const levelField = (options: string[]) => ({
  key: "level",
  kind: "single" as const,
  label: name("Level", "Уровень", "Daraja"),
  required: true,
  options,
  allow_other: false,
})
const yearField = {
  key: "year",
  kind: "number" as const,
  label: name("Year", "Год", "Yil"),
  required: false,
  options: [],
  allow_other: false,
}
const percentField = {
  key: "percent",
  kind: "number" as const,
  label: name("Percent", "Процент", "Foiz"),
  required: false,
  options: [],
  allow_other: false,
}
const subjectField = {
  key: "subject",
  kind: "text" as const,
  label: name("Subject", "Предмет", "Fan"),
  required: false,
  options: [],
  allow_other: false,
}

const IELTS_LEVELS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"]
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
const NATIONAL_LEVELS = ["A+", "A", "B+", "B", "C+", "C"]

export const certificateTypes: CertificateType[] = [
  {
    id: uuid(KIND, 1),
    code: "ielts",
    name: name("IELTS"),
    custom_fields: [levelField(IELTS_LEVELS), yearField],
    builtin: false,
    position: 1,
  },
  {
    id: uuid(KIND, 2),
    code: "cefr",
    name: name("CEFR"),
    custom_fields: [levelField(CEFR_LEVELS)],
    builtin: true,
    position: 2,
  },
  {
    id: uuid(KIND, 3),
    code: "sat",
    name: name("SAT"),
    custom_fields: [{ ...yearField, key: "score", label: name("Score", "Балл", "Ball") }],
    builtin: false,
    position: 3,
  },
  {
    id: uuid(KIND, 4),
    code: "national",
    name: name("National Certificate", "Национальный сертификат", "Milliy sertifikat"),
    custom_fields: [levelField(NATIONAL_LEVELS), percentField, subjectField],
    builtin: true,
    position: 4,
  },
]

export const certificateEntries: CertificateEntry[] = [
  {
    id: uuid(KIND, 101),
    type_id: certificateTypes[0]!.id,
    source: "manual",
    issued_at: null,
    expires_at: null,
    files: [{ id: uuid(KIND, 201), name: "ielts.pdf", size: 120_000, content_type: "application/pdf" }],
    custom_values: { level: "7.0", year: 2026 },
    created_at: "2026-10-01T08:00:00Z",
  },
  {
    id: uuid(KIND, 102),
    type_id: certificateTypes[3]!.id,
    source: "emis",
    issued_at: null,
    expires_at: null,
    files: [],
    custom_values: { level: "A", percent: 82.5, subject: "Mathematics", year: 2025 },
    created_at: "2026-10-02T08:00:00Z",
  },
]

export const certificateGroups: CertificateGroup[] = [
  { id: ids.group2TN2, name: "2TN2", subgroups: ["1", "2"] },
  { id: uuid(KIND, 301), name: "2TN1", subgroups: [] },
]

export const staffCertificateEntries: StaffCertificateEntry[] = [
  {
    ...certificateEntries[0]!,
    student: { id: ids.student, name: "Brastilov Aleksey", group_id: ids.group2TN2, group_name: "2TN2", subgroup: "1" },
  },
  {
    ...certificateEntries[1]!,
    id: uuid(KIND, 103),
    student: { id: ids.student, name: "Brastilov Aleksey", group_id: ids.group2TN2, group_name: "2TN2", subgroup: "1" },
  },
  {
    ...certificateEntries[0]!,
    id: uuid(KIND, 104),
    custom_values: { level: "6.5", year: 2026 },
    files: [],
    student: {
      id: ids.student2,
      name: "Karimova Dilnoza",
      group_id: uuid(KIND, 301),
      group_name: "2TN1",
      subgroup: null,
    },
  },
]
