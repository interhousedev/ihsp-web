// Library fixtures, part 2b: owners and dates of the stored items, their extracted text and the editor data of each book.
// Re-exported from `fixtures/library.ts`.

import type { BookInput } from "@ihsp/api"
import { libActors, libIds, libSubjects } from "./library-base"

// - - - Owners, dates, scan results - - -

type ItemMeta = { ownerId: string | null; addedAt: string; submittedAt: string | null; scan: string[] }
const day = (d: number) => `2026-09-${String(d).padStart(2, "0")}T08:00:00Z`

/** Uploader, date added, date submitted and scan findings of each stored item. */
export const libItemMeta: Record<string, ItemMeta> = {
  [libIds.bookOtkanKunlar]: { ownerId: null, addedAt: day(1), submittedAt: null, scan: [] },
  [libIds.bookGhazals]: { ownerId: null, addedAt: day(2), submittedAt: null, scan: [] },
  [libIds.bookPhysics10]: { ownerId: null, addedAt: day(3), submittedAt: null, scan: [] },
  [libIds.bookOpenPhysics]: { ownerId: null, addedAt: day(4), submittedAt: null, scan: [] },
  [libIds.bookOlympiad]: { ownerId: null, addedAt: day(5), submittedAt: null, scan: [] },
  [libIds.bookGeometryScan]: { ownerId: null, addedAt: day(6), submittedAt: null, scan: [] },
  [libIds.bookDraft]: { ownerId: null, addedAt: day(7), submittedAt: null, scan: [] },
  [libIds.bookTakenDown]: { ownerId: null, addedAt: day(8), submittedAt: null, scan: [] },
  [libIds.matDraft]: { ownerId: libActors.student.id, addedAt: day(20), submittedAt: null, scan: [] },
  [libIds.matPending]: { ownerId: libActors.student.id, addedAt: day(21), submittedAt: day(21), scan: [] },
  [libIds.matChanges]: {
    ownerId: libActors.student.id,
    addedAt: day(15),
    submittedAt: day(15),
    scan: ["phone number on page 2"],
  },
  [libIds.matPublished]: { ownerId: libActors.student.id, addedAt: day(10), submittedAt: day(10), scan: [] },
  [libIds.matHeld]: { ownerId: libActors.student.id, addedAt: day(12), submittedAt: day(12), scan: [] },
  [libIds.matRejected]: {
    ownerId: libActors.student.id,
    addedAt: day(14),
    submittedAt: day(14),
    scan: ["exam paper marker: variant 2"],
  },
  [libIds.matUnpublished]: { ownerId: libActors.student.id, addedAt: day(11), submittedAt: day(11), scan: [] },
  [libIds.matTeacher]: { ownerId: libActors.teacher.id, addedAt: day(9), submittedAt: null, scan: [] },
  [libIds.matTeacherSlides]: { ownerId: libActors.teacher.id, addedAt: day(13), submittedAt: null, scan: [] },
  [libIds.matTeacherDraft]: { ownerId: libActors.teacher.id, addedAt: day(22), submittedAt: null, scan: [] },
  [libIds.matLibrarianPending]: {
    ownerId: libActors.librarian.id,
    addedAt: day(23),
    submittedAt: day(23),
    scan: ["possible duplicate of an existing material"],
  },
}

// - - - Extracted text (page by page) - - -

/** Short extracted text; PDFs have more pages than text pages here. */
export const libItemText: Record<string, string[]> = {
  [libIds.bookPhysics10]: [
    "Chapter 1. Kinematics describes motion without asking what causes it.",
    "The velocity of a body is the rate of change of its position: v = dx / dt.",
    "Acceleration is the rate of change of velocity: a = dv / dt.",
    "For uniform motion the position grows linearly with time: x = x0 + vt.",
  ],
  [libIds.bookOpenPhysics]: [
    "Forces change the motion of bodies. A net force produces acceleration.",
    "Energy is conserved in a closed system: kinetic energy turns into potential energy and back.",
  ],
  [libIds.bookOlympiad]: [
    "1-masala. x^2 - 5x + 6 = 0 tenglamani yeching.",
    "2-masala. Toʻgʻri burchakli uchburchakning yuzini toping.",
  ],
  [libIds.bookOtkanKunlar]: ["Ўткан кунлар. Муқаддима.", "Биринчи боб. Отабек Тошкентдан келди."],
  [libIds.bookGhazals]: [
    "# Birinchi gʻazal\n\nKo‘ngil ul mahvashni topgach, tilar elga ravo bo‘lmoq.",
    "# Ikkinchi gʻazal",
  ],
  [libIds.matPublished]: [
    "Tezlik — bosib oʻtilgan yoʻlning vaqtga nisbati.",
    "Tezlanish tezlikning oʻzgarish sur'ati: a = dv / dt.",
  ],
  [libIds.matTeacher]: [
    "Lab report: title, aim, equipment, method, results, conclusion.",
    "Rubric: 5 points per section.",
  ],
}

// - - - Books as the editor sees them - - -

const baseInput: BookInput = {
  title: "",
  subtitle: null,
  authors: [],
  translators: [],
  language: "uz_latn",
  year_published: null,
  publisher: null,
  isbn: null,
  type: "textbook",
  description: null,
  years_of_study: [1],
  subjects: [],
  topics: [],
  rights: "public_domain",
  licence: null,
  rights_basis: {},
  rights_proof_file_id: null,
  cover_file_id: null,
  visibility: "lyceum",
  download_allowed: true,
}
const bookInput = (over: Partial<BookInput>): BookInput => ({ ...baseInput, ...over })
const subjectInput = (subjectId: string) => ({ subject_id: subjectId, role: "core" as const, year_of_study: 1 })

/** The `BookInput` of every seeded book (the data behind `GET /manage/library/books/{id}`). */
export const libBookInputs: Record<string, BookInput> = {
  [libIds.bookOtkanKunlar]: bookInput({
    title: "Ўткан кунлар",
    authors: ["Абдулла Қодирий"],
    language: "uz_cyrl",
    year_published: 1925,
    type: "fiction",
    years_of_study: [1, 2],
    subjects: [subjectInput(libSubjects.literature.id)],
    topics: [{ topic_id: libIds.topicNovels }],
    rights_basis: { author_death_year: 1938, rule: "life+70" },
    cover_file_id: "cover-otkan",
    visibility: "public",
  }),
  [libIds.bookGhazals]: bookInput({
    title: "Gʻazallar",
    authors: ["Alisher Navoiy"],
    year_published: 1498,
    type: "poetry",
    subjects: [subjectInput(libSubjects.literature.id)],
    topics: [{ topic_id: libIds.topicClassics }],
    rights_basis: { author_death_year: 1501, rule: "life+70" },
    cover_file_id: "cover-gazallar",
    visibility: "public",
  }),
  [libIds.bookPhysics10]: bookInput({
    title: "Physics 10: Mechanics",
    authors: ["N. Turdiyev", "K. Suyarov"],
    language: "en",
    year_published: 2022,
    publisher: "Tashkent: Sharq",
    isbn: "978-9943-00-000-1",
    subjects: [subjectInput(libSubjects.physics.id)],
    topics: [
      { topic_id: libIds.topicKinematics, page_from: 5, page_to: 30 },
      { topic_id: libIds.topicDynamics, page_from: 31, page_to: 71 },
    ],
    rights: "official",
    rights_basis: { reference: "Order 123 of the Ministry, 2022" },
    cover_file_id: "cover-physics10",
    download_allowed: false,
  }),
  [libIds.bookOpenPhysics]: bookInput({
    title: "Open Physics: Mechanics",
    authors: ["A. Karimov (ed.)"],
    language: "en",
    year_published: 2020,
    subjects: [subjectInput(libSubjects.physics.id)],
    topics: [{ topic_id: libIds.topicMechanics }],
    rights: "open_license",
    licence: "CC BY-SA 4.0",
    rights_basis: {
      source_url: "https://example.org/open-physics",
      attribution: "Open Physics: Mechanics by A. Karimov (ed.), CC BY-SA 4.0",
    },
    cover_file_id: "cover-open-physics",
    visibility: "public",
  }),
  [libIds.bookOlympiad]: bookInput({
    title: "Matematika olimpiadalari 2019",
    authors: ["Toshkent olimpiada qoʻmitasi"],
    year_published: 2019,
    type: "problem_book",
    years_of_study: [1, 2],
    subjects: [subjectInput(libSubjects.math.id)],
    topics: [{ topic_id: libIds.topicAlgebra }],
    rights: "permission",
    rights_basis: { permission_scope: "Hosting for lyceum members", permission_expires_on: "2026-11-20" },
    rights_proof_file_id: "permission-scan-2019",
    cover_file_id: "cover-olympiad",
    download_allowed: false,
  }),
  [libIds.bookGeometryScan]: bookInput({
    title: "Геометрия 7–9 (скан 1987)",
    authors: ["А. Погорелов"],
    language: "ru",
    year_published: 1987,
    subjects: [subjectInput(libSubjects.math.id)],
    topics: [{ topic_id: libIds.topicGeometry }],
    rights: "permission",
    rights_basis: { permission_scope: "Hosting for lyceum members", permission_expires_on: "2028-01-01" },
    rights_proof_file_id: "permission-scan-1987",
    cover_file_id: "cover-geometry",
    download_allowed: false,
  }),
  [libIds.bookDraft]: bookInput({
    title: "Kimyo masalalari",
    authors: ["D. Rahimova"],
    year_published: 2018,
    type: "problem_book",
    subjects: [subjectInput(libSubjects.chemistry.id)],
    rights: "open_license",
  }),
  [libIds.bookTakenDown]: bookInput({
    title: "Eski kimyo darsligi",
    authors: ["Kollektiv"],
    year_published: 2005,
    subjects: [subjectInput(libSubjects.chemistry.id)],
    rights: "permission",
    rights_basis: { permission_scope: "Hosting", permission_expires_on: "2026-01-01" },
    rights_proof_file_id: "permission-scan-2005",
    cover_file_id: "cover-old-chem",
    download_allowed: false,
  }),
}
