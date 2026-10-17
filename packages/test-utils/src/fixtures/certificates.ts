import type {
  CertificateEntry,
  CertificateGroup,
  CertificateType,
  CertificateTypeInput,
  StaffCertificateEntry,
} from "@ihsp/api"
import { ids, uuid } from "./world"

const KIND = 90
const name = (en: string, ru = en, uz = en) => ({ en, ru, uz })

const base: Omit<CertificateTypeInput, "code" | "name" | "position"> = {
  levels: [],
  asks_level: false,
  asks_score: false,
  score_min: null,
  score_max: null,
  asks_percent: false,
  asks_subject: false,
  asks_year: true,
}

export const certificateTypes: CertificateType[] = [
  {
    ...base,
    id: uuid(KIND, 1),
    code: "ielts",
    name: name("IELTS"),
    levels: ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"],
    asks_level: true,
    builtin: false,
    position: 1,
  },
  {
    ...base,
    id: uuid(KIND, 2),
    code: "cefr",
    name: name("CEFR"),
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    asks_level: true,
    builtin: true,
    position: 2,
  },
  {
    ...base,
    id: uuid(KIND, 3),
    code: "sat",
    name: name("SAT"),
    asks_score: true,
    score_min: 400,
    score_max: 1600,
    builtin: false,
    position: 3,
  },
  {
    ...base,
    id: uuid(KIND, 4),
    code: "national",
    name: name("National Certificate", "Национальный сертификат", "Milliy sertifikat"),
    levels: ["A+", "A", "B+", "B", "C+", "C"],
    asks_level: true,
    asks_percent: true,
    asks_subject: true,
    builtin: true,
    position: 4,
  },
]

export const certificateEntries: CertificateEntry[] = [
  {
    id: uuid(KIND, 101),
    type_id: certificateTypes[0]!.id,
    level: "7.0",
    score: null,
    percent: null,
    subject: null,
    year: 2026,
    serial: null,
    source: "manual",
    issued_at: null,
    expires_at: null,
    files: [{ id: uuid(KIND, 201), name: "ielts.pdf", size: 120_000, content_type: "application/pdf" }],
    created_at: "2026-10-01T08:00:00Z",
  },
  {
    id: uuid(KIND, 102),
    type_id: certificateTypes[3]!.id,
    level: "A",
    score: null,
    percent: 82.5,
    subject: "Mathematics",
    year: 2025,
    serial: "N-1",
    source: "emis",
    issued_at: null,
    expires_at: null,
    files: [],
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
    level: "6.5",
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
