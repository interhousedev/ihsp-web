// Library fixtures, part 2: books and materials in every status, as details (`libDetails`), cards (`libCards`),
// Re-exported from `fixtures/library.ts`; owners, extracted text and book inputs are in `library-item-data.ts`.

import type { ItemDetail, TocEntry } from "@ihsp/api"
import { TEST_STORAGE_URL } from "./env"
import {
  libActors,
  libIds,
  libSubjects,
  makeItemCard,
  makeItemDetail,
  makeItemFile,
  pickCard,
  type LibraryActor,
} from "./library-base"
import { uuid } from "./world"

const COVERS = `${TEST_STORAGE_URL}/library/covers`

function material(actor: LibraryActor, role: "student" | "teacher" | "librarian") {
  return { uploader_name: actor.name, uploader_cohort: actor.cohort ?? "", uploader_role: role }
}
const byStudent = material(libActors.student, "student")
const byTeacher = material(libActors.teacher, "teacher")
const byLibrarian = material(libActors.librarian, "librarian")

function toc(...rows: [title: string, level: number, where: number | string][]): TocEntry[] {
  return rows.map(([title, level, where]) =>
    typeof where === "number" ? { title, level, page: where } : { title, level, href: where },
  )
}

// - - - Books - - -

const bookOtkanKunlar = makeItemDetail({
  id: libIds.bookOtkanKunlar,
  slug: "otkan-kunlar",
  kind: "book",
  type: "fiction",
  title: "Ўткан кунлар",
  author_label: "Абдулла Қодирий",
  language: "uz_cyrl",
  year_published: 1925,
  cover_url: `${COVERS}/otkan-kunlar.jpg`,
  description_excerpt: "Ўзбек романчилигининг биринчи йирик асари.",
  description: "Ўзбек романчилигининг биринчи йирик асари: Отабек ва Кумушнинг севгиси ва XIX аср Туркистони.",
  subjects: [libSubjects.literature],
  years_of_study: [1, 2],
  page_count: 320,
  visibility: "public",
  book: { rights: "public_domain", licence: null, download_allowed: true },
  rights_box: {
    text: "Public domain: the author died in 1938, so the work has been free to use since 2009.",
    attribution: null,
    download_allowed: true,
  },
  files: [
    makeItemFile({
      id: libIds.fileOtkanKunlar,
      format: "epub",
      pages: null,
      byte_size: 1_204_000,
      toc: toc(["Муқаддима", 1, "ch1.xhtml"], ["Биринчи боб", 1, "ch2.xhtml"], ["Иккинчи боб", 1, "ch3.xhtml#b2"]),
    }),
  ],
  topics: [{ id: libIds.topicNovels, name: "Novels", page_from: null, page_to: null }],
  tag: { source: "book", label: "Library book" },
})

const bookGhazals = makeItemDetail({
  id: libIds.bookGhazals,
  slug: "gazallar",
  kind: "book",
  type: "poetry",
  title: "Gʻazallar",
  author_label: "Alisher Navoiy",
  language: "uz_latn",
  year_published: 1498,
  cover_url: `${COVERS}/gazallar.jpg`,
  description_excerpt: "Navoiy gʻazallaridan tanlama (Markdown matn).",
  description: "Navoiy gʻazallaridan tanlama, telefonda oʻqishga qulay Markdown matn sifatida.",
  subjects: [libSubjects.literature],
  years_of_study: [1],
  page_count: null,
  visibility: "public",
  book: { rights: "public_domain", licence: null, download_allowed: true },
  rights_box: { text: "Public domain: the author died in 1501.", attribution: null, download_allowed: true },
  files: [
    makeItemFile({
      id: libIds.fileGhazals,
      format: "md",
      pages: null,
      byte_size: 18_400,
      toc: toc(["Birinchi gʻazal", 1, "#g1"], ["Ikkinchi gʻazal", 1, "#g2"]),
    }),
  ],
  topics: [{ id: libIds.topicClassics, name: "Uzbek classics", page_from: null, page_to: null }],
})

const bookPhysics10 = makeItemDetail({
  id: libIds.bookPhysics10,
  slug: "physics-10-mechanics",
  kind: "book",
  type: "textbook",
  title: "Physics 10: Mechanics",
  author_label: "N. Turdiyev, K. Suyarov",
  language: "en",
  year_published: 2022,
  cover_url: `${COVERS}/physics-10.jpg`,
  description_excerpt: "Official textbook: kinematics, dynamics and conservation laws.",
  description: "Official textbook: kinematics, dynamics and conservation laws, with solved problems.",
  publisher: "Tashkent: Sharq",
  isbn: "978-9943-00-000-1",
  subjects: [libSubjects.physics],
  years_of_study: [1],
  page_count: 240,
  book: { rights: "official", licence: null, download_allowed: false },
  rights_box: {
    text: "Official textbook of the Ministry of Public Education. Available to lyceum members only.",
    attribution: null,
    download_allowed: false,
  },
  files: [
    makeItemFile({
      id: libIds.filePhysics10,
      pages: 240,
      byte_size: 8_420_113,
      toc: toc(
        ["1. Kinematics", 1, 5],
        ["1.1 Velocity", 2, 8],
        ["1.2 Acceleration", 2, 16],
        ["2. Dynamics", 1, 31],
        ["3. Conservation laws", 1, 72],
      ),
    }),
  ],
  topics: [
    { id: libIds.topicKinematics, name: "Kinematics", page_from: 5, page_to: 30 },
    { id: libIds.topicDynamics, name: "Dynamics", page_from: 31, page_to: 71 },
  ],
  can: { read: true, download: false, add_to_notebook: true, report: true, edit: false },
})

const bookOpenPhysics = makeItemDetail({
  id: libIds.bookOpenPhysics,
  slug: "open-physics-mechanics",
  kind: "book",
  type: "textbook",
  title: "Open Physics: Mechanics",
  author_label: "A. Karimov (ed.)",
  language: "en",
  year_published: 2020,
  cover_url: `${COVERS}/open-physics.jpg`,
  description_excerpt: "A free, openly licensed introduction to mechanics.",
  description: "A free, openly licensed introduction to mechanics with exercises.",
  subjects: [libSubjects.physics],
  years_of_study: [1],
  page_count: 96,
  visibility: "public",
  book: { rights: "open_license", licence: "CC BY-SA 4.0", download_allowed: true },
  rights_box: {
    text: "Licensed under CC BY-SA 4.0. You may share and adapt it with attribution, under the same licence.",
    attribution: "Open Physics: Mechanics by A. Karimov (ed.), CC BY-SA 4.0, https://example.org/open-physics",
    download_allowed: true,
  },
  files: [
    makeItemFile({
      id: libIds.fileOpenPhysics,
      pages: 96,
      byte_size: 3_100_000,
      toc: toc(["Forces", 1, 3], ["Energy", 1, 40]),
    }),
  ],
  topics: [{ id: libIds.topicMechanics, name: "Mechanics", page_from: 1, page_to: 96 }],
})

const bookOlympiad = makeItemDetail({
  id: libIds.bookOlympiad,
  slug: "matematika-olimpiadalari-2019",
  kind: "book",
  type: "problem_book",
  title: "Matematika olimpiadalari 2019",
  author_label: "Toshkent olimpiada qoʻmitasi",
  language: "uz_latn",
  year_published: 2019,
  cover_url: `${COVERS}/olympiad-2019.jpg`,
  description_excerpt: "Shahar olimpiadasi masalalari yechimlari bilan.",
  subjects: [libSubjects.math],
  years_of_study: [1, 2],
  page_count: 64,
  book: { rights: "permission", licence: null, download_allowed: false },
  rights_box: {
    text: "Hosted with the written permission of the committee, for lyceum members only.",
    attribution: null,
    download_allowed: false,
  },
  files: [makeItemFile({ id: libIds.fileOlympiad, pages: 64, byte_size: 2_050_000 })],
  topics: [{ id: libIds.topicAlgebra, name: "Algebra", page_from: null, page_to: null }],
  can: { read: true, download: false, add_to_notebook: true, report: true, edit: false },
})

/** A scan without a text layer: no search, no notebook. */
const bookGeometryScan = makeItemDetail({
  id: libIds.bookGeometryScan,
  slug: "geometriya-1987-skan",
  kind: "book",
  type: "textbook",
  title: "Геометрия 7–9 (скан 1987)",
  author_label: "А. Погорелов",
  language: "ru",
  year_published: 1987,
  cover_url: `${COVERS}/geometry-1987.jpg`,
  description_excerpt: "Скан учебника без текстового слоя.",
  subjects: [libSubjects.math],
  years_of_study: [1],
  has_text: false,
  page_count: 180,
  book: { rights: "permission", licence: null, download_allowed: false },
  rights_box: { text: "Hosted with permission, for lyceum members only.", attribution: null, download_allowed: false },
  files: [makeItemFile({ id: libIds.fileGeometryScan, pages: 180, byte_size: 41_000_000, text_status: "no_text" })],
  topics: [{ id: libIds.topicGeometry, name: "Geometry", page_from: null, page_to: null }],
  can: { read: true, download: false, add_to_notebook: false, report: true, edit: false },
})

/** An unfinished draft: no cover, no file, incomplete rights basis (publishing answers `library/rights-incomplete`). */
const bookDraft = makeItemDetail({
  id: libIds.bookDraft,
  slug: "kimyo-masalalari",
  kind: "book",
  type: "problem_book",
  title: "Kimyo masalalari",
  author_label: "D. Rahimova",
  language: "uz_latn",
  year_published: 2018,
  cover_url: null,
  has_text: false,
  subjects: [libSubjects.chemistry],
  years_of_study: [1],
  status: "draft",
  book: { rights: "open_license", licence: null, download_allowed: true },
  rights_box: { text: "", attribution: null, download_allowed: true },
  can: { read: false, download: false, add_to_notebook: false, report: false, edit: true },
})

const bookTakenDown = makeItemDetail({
  id: libIds.bookTakenDown,
  slug: "eski-kimyo-darsligi",
  kind: "book",
  type: "textbook",
  title: "Eski kimyo darsligi",
  author_label: "Kollektiv",
  language: "uz_latn",
  year_published: 2005,
  subjects: [libSubjects.chemistry],
  years_of_study: [1],
  status: "unpublished",
  status_reason: "copyright",
  status_note: "The rights holder asked us to remove the book.",
  book: { rights: "permission", licence: null, download_allowed: false },
  files: [makeItemFile({ id: libIds.fileHeld, pages: 120 })],
  can: { read: false, download: false, add_to_notebook: false, report: false, edit: false },
})

// - - - Materials - - -

const matBase: Partial<ItemDetail> = {
  kind: "material",
  years_of_study: [1],
  language: "en",
  tag: { source: "material", label: "Material" },
}
const pdf = (id: string, pages: number) => makeItemFile({ id, pages, byte_size: 120_000 * pages })

const matDraft = makeItemDetail({
  ...matBase,
  id: libIds.matDraft,
  slug: "kinematics-formula-sheet",
  type: "formula_sheet",
  title: "Kinematics formula sheet",
  author_label: "Aziza K., 2025",
  subjects: [libSubjects.physics],
  status: "draft",
  material: byStudent,
  has_text: false,
  can: { read: false, download: false, add_to_notebook: false, report: false, edit: true },
})
const matPending = makeItemDetail({
  ...matBase,
  id: libIds.matPending,
  slug: "kvadrat-tenglamalar-konspekt",
  type: "notes",
  language: "uz_latn",
  title: "Kvadrat tenglamalar: qisqacha konspekt",
  author_label: "Aziza K., 2025",
  subjects: [libSubjects.math],
  status: "pending_review",
  material: byStudent,
  files: [pdf(uuidFile(121), 4)],
  topics: [{ id: libIds.topicQuadratic, name: "Quadratic equations", page_from: null, page_to: null }],
  page_count: 4,
})
const matChanges = makeItemDetail({
  ...matBase,
  id: libIds.matChanges,
  slug: "kimyoviy-bogulanish-konspekt",
  type: "notes",
  language: "uz_latn",
  title: "Kimyoviy bogʻlanish: konspekt",
  author_label: "Aziza K., 2025",
  subjects: [libSubjects.chemistry],
  status: "changes_requested",
  status_reason: "personal_data",
  status_note: "Please remove the phone number on page 2 and upload the file again.",
  material: byStudent,
  files: [pdf(uuidFile(122), 3)],
  page_count: 3,
})
const matPublished = makeItemDetail({
  ...matBase,
  id: libIds.matPublished,
  slug: "fizika-kinematika-konspekt",
  type: "lecture_notes",
  language: "uz_latn",
  title: "Fizika: kinematika boʻyicha konspekt",
  author_label: "Aziza K., 2025",
  description_excerpt: "Tezlik, tezlanish va tekis harakat formulalari.",
  description: "Tezlik, tezlanish va tekis harakat formulalari, bir nechta yechilgan masala bilan.",
  subjects: [libSubjects.physics],
  material: byStudent,
  files: [pdf(libIds.filePublished, 8)],
  topics: [{ id: libIds.topicKinematics, name: "Kinematics", page_from: null, page_to: null }],
  page_count: 8,
  can: { read: true, download: true, add_to_notebook: true, report: false, edit: true },
})
const matHeld = makeItemDetail({
  ...matBase,
  id: libIds.matHeld,
  slug: "newtons-laws-practice-set",
  type: "practice_set",
  title: "Newton's laws: practice set",
  author_label: "Aziza K., 2025",
  subjects: [libSubjects.physics],
  status: "held",
  status_reason: "reported",
  material: byStudent,
  files: [pdf(libIds.fileHeld, 5)],
  topics: [{ id: libIds.topicDynamics, name: "Dynamics", page_from: null, page_to: null }],
  page_count: 5,
  can: { read: true, download: true, add_to_notebook: true, report: false, edit: true },
})
const matRejected = makeItemDetail({
  ...matBase,
  id: libIds.matRejected,
  slug: "homework-5-answers",
  type: "worksheet",
  title: "Homework 5: answers",
  author_label: "Aziza K., 2025",
  subjects: [libSubjects.math],
  status: "rejected",
  status_reason: "current_homework",
  status_note: "Answers to current homework are not allowed.",
  material: byStudent,
  files: [pdf(uuidFile(125), 2)],
  page_count: 2,
  can: { read: true, download: true, add_to_notebook: true, report: false, edit: false },
})
const matUnpublished = makeItemDetail({
  ...matBase,
  id: libIds.matUnpublished,
  slug: "informatics-cheat-sheet",
  type: "notes",
  title: "Informatics cheat sheet",
  author_label: "Aziza K., 2025",
  subjects: [libSubjects.informatics],
  status: "unpublished",
  status_reason: "withdrawn_by_owner",
  material: byStudent,
  files: [pdf(uuidFile(126), 2)],
  page_count: 2,
  can: { read: true, download: true, add_to_notebook: true, report: false, edit: false },
})
const matTeacher = makeItemDetail({
  ...matBase,
  id: libIds.matTeacher,
  slug: "physics-lab-report-template",
  type: "teaching_material",
  title: "Physics lab report template",
  author_label: "Gavxar Kalandarova",
  description_excerpt: "A one-page template for lab reports with a grading rubric.",
  description: "A one-page template for lab reports with a grading rubric. Licence CC BY.",
  subjects: [libSubjects.physics],
  visibility: "public",
  material: byTeacher,
  files: [pdf(libIds.fileTeacher, 2)],
  topics: [{ id: libIds.topicMechanics, name: "Mechanics", page_from: null, page_to: null }],
  page_count: 2,
})
const matTeacherSlides = makeItemDetail({
  ...matBase,
  id: libIds.matTeacherSlides,
  slug: "termodinamika-slaydlar",
  type: "presentation",
  language: "ru",
  title: "Термодинамика: слайды к лекции",
  author_label: "Gavxar Kalandarova",
  subjects: [libSubjects.physics],
  material: byTeacher,
  has_text: false,
  files: [
    makeItemFile({
      id: libIds.fileTeacherSlides,
      format: "pptx",
      pages: 24,
      byte_size: 3_400_000,
      readable: false,
      text_status: "none",
    }),
  ],
  topics: [{ id: libIds.topicThermodynamics, name: "Thermodynamics", page_from: null, page_to: null }],
  page_count: 24,
  can: { read: false, download: true, add_to_notebook: false, report: true, edit: false },
})
const matTeacherDraft = makeItemDetail({
  ...matBase,
  id: libIds.matTeacherDraft,
  slug: "worksheet-ohms-law",
  type: "worksheet",
  title: "Worksheet: Ohm's law",
  author_label: "Gavxar Kalandarova",
  subjects: [libSubjects.physics],
  status: "draft",
  material: byTeacher,
  files: [pdf(uuidFile(223), 2)],
  page_count: 2,
  can: { read: true, download: true, add_to_notebook: true, report: false, edit: true },
})
/** An upload of a student librarian that still waits for another librarian (the "own item" row of the queue). */
const matLibrarianPending = makeItemDetail({
  ...matBase,
  id: libIds.matLibrarianPending,
  slug: "informatics-sorting-algorithms",
  type: "lecture_notes",
  title: "Informatics: sorting algorithms",
  author_label: "Dilshod R., 2025",
  subjects: [libSubjects.informatics],
  status: "pending_review",
  material: byLibrarian,
  files: [pdf(uuidFile(124), 6)],
  topics: [{ id: libIds.topicSorting, name: "Sorting", page_from: null, page_to: null }],
  page_count: 6,
})

function uuidFile(n: number): string {
  return uuid(42, n)
}

/** Every stored book and material, by name. */
export const libDetails = {
  bookOtkanKunlar,
  bookGhazals,
  bookPhysics10,
  bookOpenPhysics,
  bookOlympiad,
  bookGeometryScan,
  bookDraft,
  bookTakenDown,
  matDraft,
  matPending,
  matChanges,
  matPublished,
  matHeld,
  matRejected,
  matUnpublished,
  matTeacher,
  matTeacherSlides,
  matTeacherDraft,
  matLibrarianPending,
} satisfies Record<string, ItemDetail>

/** The cards of `libDetails` (no shelf state, no progress). */
export const libCards = Object.fromEntries(Object.entries(libDetails).map(([key, d]) => [key, pickCard(d)])) as {
  [K in keyof typeof libDetails]: ReturnType<typeof pickCard>
}

/** A published card with a full-text hit (`snippet` and `snippet_page`), as `?q=velocity` returns it. */
export const libCardWithSnippet = makeItemCard({
  ...libCards.bookPhysics10,
  snippet: "…the <mark>velocity</mark> of a body is the rate of change of its position…",
  snippet_page: 8,
})
