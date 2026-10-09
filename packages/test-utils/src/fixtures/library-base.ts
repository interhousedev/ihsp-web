// Library fixtures, part 1: ids, actors, subjects, topics, builders (`makeItemCard`, `makeItemDetail`, ...), the
// `can` rules and a tiny valid PDF. Everything is re-exported from `fixtures/library.ts`.

import type {
  Annotation,
  ItemCard,
  ItemDetail,
  ItemFile,
  ManageTopic,
  Rights,
  ShelfEntry,
  ShelfState,
  Topic,
  UploaderRole,
} from "@ihsp/api"
import { FIXTURE_NOW, ids, uuid } from "./world"

// - - - Ids - - -

/** Library ids: items `41`, files `42`, topics `43`, collections `44`, lists `45`, annotations `46`, reports `47`. */
export const libIds = {
  bookOtkanKunlar: uuid(41, 1),
  bookGhazals: uuid(41, 2),
  bookPhysics10: uuid(41, 3),
  bookOpenPhysics: uuid(41, 4),
  bookOlympiad: uuid(41, 5),
  bookGeometryScan: uuid(41, 6),
  bookDraft: uuid(41, 7),
  bookTakenDown: uuid(41, 8),
  matDraft: uuid(41, 11),
  matPending: uuid(41, 12),
  matChanges: uuid(41, 13),
  matPublished: uuid(41, 14),
  matHeld: uuid(41, 15),
  matRejected: uuid(41, 16),
  matUnpublished: uuid(41, 17),
  matTeacher: uuid(41, 21),
  matTeacherSlides: uuid(41, 22),
  matTeacherDraft: uuid(41, 23),
  matLibrarianPending: uuid(41, 24),
  extPinned: uuid(41, 41),
  fileOtkanKunlar: uuid(42, 1),
  fileGhazals: uuid(42, 2),
  filePhysics10: uuid(42, 3),
  fileOpenPhysics: uuid(42, 4),
  fileOlympiad: uuid(42, 5),
  fileGeometryScan: uuid(42, 6),
  filePublished: uuid(42, 14),
  fileTeacher: uuid(42, 21),
  fileTeacherSlides: uuid(42, 22),
  fileHeld: uuid(42, 15),
  topicMechanics: uuid(43, 1),
  topicKinematics: uuid(43, 2),
  topicDynamics: uuid(43, 3),
  topicThermodynamics: uuid(43, 4),
  topicAlgebra: uuid(43, 5),
  topicQuadratic: uuid(43, 6),
  topicGeometry: uuid(43, 7),
  topicClassics: uuid(43, 8),
  topicNovels: uuid(43, 9),
  topicBonds: uuid(43, 10),
  topicAlgorithms: uuid(43, 11),
  topicSorting: uuid(43, 12),
  collectionClassics: uuid(44, 1),
  collectionOlympiad: uuid(44, 2),
  collectionSummer: uuid(44, 3),
  listPhysics: uuid(45, 1),
  listSummerDraft: uuid(45, 2),
  reportWrongContent: uuid(47, 1),
  reportHeldA: uuid(47, 2),
  reportHeldB: uuid(47, 3),
  suggestion: uuid(47, 4),
  feedPhysics: uuid(49, 1),
  feedLiterature: uuid(49, 2),
} as const

// - - - Actors - - -

export type LibraryRole = "student" | "teacher" | "librarian" | "admin"
export type LibraryActor = { id: string; name: string; cohort: string | null; roles: LibraryRole[] }
export type LibraryActorKey = "student" | "teacher" | "librarian" | "librarian2" | "admin"

/** Who can call the mocked library API. The default actor is `student` ("Aziza K., 2025"). */
export const libActors: Record<LibraryActorKey, LibraryActor> = {
  student: { id: uuid(40, 1), name: "Aziza K.", cohort: "2025", roles: ["student"] },
  teacher: { id: ids.teacherKalandarova, name: "Gavxar Kalandarova", cohort: null, roles: ["teacher"] },
  librarian: { id: uuid(40, 3), name: "Dilshod R.", cohort: "2025", roles: ["student", "librarian"] },
  librarian2: { id: uuid(40, 4), name: "Madina S.", cohort: "2024", roles: ["student", "librarian"] },
  admin: { id: ids.admin, name: "Admin Ihsp", cohort: null, roles: ["admin"] },
}

/** The role shown on a material: the strongest role of the uploader. */
export function uploaderRoleOf(actor: LibraryActor): UploaderRole {
  if (actor.roles.includes("admin")) return "admin"
  if (actor.roles.includes("librarian")) return "librarian"
  if (actor.roles.includes("teacher")) return "teacher"
  return "student"
}

export function isLibraryStaff(actor: LibraryActor | null): boolean {
  return actor !== null && (actor.roles.includes("librarian") || actor.roles.includes("admin"))
}

// - - - Subjects and topics - - -

export const libSubjects = {
  physics: { id: ids.physics, name: "Physics" },
  math: { id: ids.math, name: "Mathematics" },
  chemistry: { id: ids.chemistry, name: "Chemistry" },
  informatics: { id: ids.informatics, name: "Informatics" },
  english: { id: ids.english, name: "English" },
  history: { id: ids.history, name: "History" },
  literature: { id: uuid(3, 7), name: "Literature" },
}

type TopicSeed = [
  id: string,
  subject: keyof typeof libSubjects,
  parent: string | null,
  uz: string,
  ru: string,
  en: string,
]
const topicSeeds: TopicSeed[] = [
  [libIds.topicMechanics, "physics", null, "Mexanika", "Механика", "Mechanics"],
  [libIds.topicKinematics, "physics", libIds.topicMechanics, "Kinematika", "Кинематика", "Kinematics"],
  [libIds.topicDynamics, "physics", libIds.topicMechanics, "Dinamika", "Динамика", "Dynamics"],
  [libIds.topicThermodynamics, "physics", null, "Termodinamika", "Термодинамика", "Thermodynamics"],
  [libIds.topicAlgebra, "math", null, "Algebra", "Алгебра", "Algebra"],
  [
    libIds.topicQuadratic,
    "math",
    libIds.topicAlgebra,
    "Kvadrat tenglamalar",
    "Квадратные уравнения",
    "Quadratic equations",
  ],
  [libIds.topicGeometry, "math", null, "Geometriya", "Геометрия", "Geometry"],
  [libIds.topicClassics, "literature", null, "Oʻzbek mumtoz adabiyoti", "Узбекская классика", "Uzbek classics"],
  [libIds.topicNovels, "literature", libIds.topicClassics, "Romanlar", "Романы", "Novels"],
  [libIds.topicBonds, "chemistry", null, "Kimyoviy bogʻlanish", "Химическая связь", "Chemical bonds"],
  [libIds.topicAlgorithms, "informatics", null, "Algoritmlar", "Алгоритмы", "Algorithms"],
  [libIds.topicSorting, "informatics", libIds.topicAlgorithms, "Saralash", "Сортировка", "Sorting"],
]

/** Flat topics of the librarian area (`GET /manage/library/topics`). */
export const libManageTopics: ManageTopic[] = topicSeeds.map(([id, subject, parent, uz, ru, en], index) => ({
  id,
  subject_id: libSubjects[subject].id,
  parent_id: parent,
  name: { uz, ru, en },
  slug: en.toLowerCase().replaceAll(" ", "-"),
  position: index + 1,
  year_of_study: parent === null ? null : 1,
}))

/** Builds the topic trees (English names) for the public `GET /library/topics`. */
export function topicTree(flat: readonly ManageTopic[], subjectId?: string | null): Topic[] {
  const scoped = subjectId ? flat.filter((t) => t.subject_id === subjectId) : flat
  const build = (parentId: string | null): Topic[] =>
    scoped
      .filter((t) => t.parent_id === parentId)
      .toSorted((a, b) => a.position - b.position)
      .map((t) => ({
        id: t.id,
        subject_id: t.subject_id,
        name: t.name.en,
        slug: t.slug,
        year_of_study: t.year_of_study,
        children: build(t.id),
      }))
  return build(null)
}

/** The public topic tree of every subject. */
export const libTopicTree: Topic[] = topicTree(libManageTopics)

// - - - Builders - - -

const TAGS = {
  book: { source: "book", label: "Library book" },
  material: { source: "material", label: "Material" },
  external: { source: "unilibrary", label: "UniLibrary" },
} as const

/** A card; defaults describe a published Uzbek Latin textbook. Pass `kind` to get the matching tag. */
export function makeItemCard(overrides: Partial<ItemCard> = {}): ItemCard {
  const kind = overrides.kind ?? "book"
  return {
    id: uuid(41, 99),
    slug: "item",
    kind,
    type: "textbook",
    title: "Item",
    author_label: "Author",
    language: "uz_latn",
    year_published: null,
    cover_url: null,
    description_excerpt: null,
    subjects: [],
    years_of_study: [],
    has_text: true,
    page_count: null,
    shelf_state: null,
    progress_percent: null,
    tag: TAGS[kind],
    ...overrides,
  }
}

export const CAN_NONE: ItemDetail["can"] = {
  read: false,
  download: false,
  add_to_notebook: false,
  report: false,
  edit: false,
}

export function makeItemFile(overrides: Partial<ItemFile> = {}): ItemFile {
  return {
    id: uuid(42, 99),
    format: "pdf",
    is_primary: true,
    pages: 12,
    byte_size: 482_113,
    readable: true,
    text_status: "ready",
    toc: [],
    ...overrides,
  }
}

/** A detail; defaults describe a published, lyceum-visible item without files, with the `can` flags of a student. */
export function makeItemDetail(overrides: Partial<ItemDetail> = {}): ItemDetail {
  return {
    ...makeItemCard(overrides),
    status: "published",
    status_reason: null,
    status_note: null,
    visibility: "lyceum",
    subtitle: null,
    description: null,
    publisher: null,
    isbn: null,
    files: [],
    topics: [],
    lists: [],
    can: { read: true, download: true, add_to_notebook: true, report: true, edit: false },
    ...overrides,
  }
}

/** The card part of a detail (drops status, files, topics, `can`, ...). */
export function pickCard(d: ItemCard): ItemCard {
  return {
    id: d.id,
    slug: d.slug,
    kind: d.kind,
    type: d.type,
    title: d.title,
    author_label: d.author_label,
    language: d.language,
    year_published: d.year_published,
    cover_url: d.cover_url,
    description_excerpt: d.description_excerpt,
    subjects: d.subjects,
    years_of_study: d.years_of_study,
    has_text: d.has_text,
    page_count: d.page_count,
    shelf_state: d.shelf_state,
    progress_percent: d.progress_percent,
    tag: d.tag,
    ...(d.snippet === undefined ? {} : { snippet: d.snippet, snippet_page: d.snippet_page ?? null }),
    ...(d.material ? { material: d.material } : {}),
    ...(d.book ? { book: d.book } : {}),
    ...(d.external ? { external: d.external } : {}),
  }
}

export function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: uuid(46, 99),
    item_id: libIds.bookPhysics10,
    file_id: libIds.filePhysics10,
    kind: "highlight",
    locator: { page: 1 },
    quote: "Quoted text",
    note: null,
    color: "yellow",
    client_id: uuid(46, 999),
    updated_at: FIXTURE_NOW,
    ...overrides,
  }
}

export function makeShelfEntry(item: ItemCard, state: ShelfState, overrides: Partial<ShelfEntry> = {}): ShelfEntry {
  return {
    item: { ...item, shelf_state: state },
    state,
    finished_at: state === "done" ? FIXTURE_NOW : null,
    updated_at: FIXTURE_NOW,
    removed: false,
    ...overrides,
  }
}

// - - - Rules: who may do what to an item - - -

/**
 * The `can` flags of `detail` for `actor` (`null` is an anonymous visitor); `ownerId` is the uploader of a material.
 * Reading needs a readable file and a published item (owners and librarians also read drafts).
 */
export function libraryCan(actor: LibraryActor | null, detail: ItemDetail, ownerId: string | null): ItemDetail["can"] {
  const external = detail.kind === "external"
  const published = detail.status === "published"
  const owner = actor !== null && ownerId !== null && ownerId === actor.id
  const staff = isLibraryStaff(actor)
  const accessible = published || owner || staff
  const read = !external && accessible && detail.files.some((f) => f.readable)
  const editableStatus = ["draft", "pending_review", "changes_requested", "published", "held"].includes(detail.status)
  return {
    read,
    // DOCX and PPTX are offered as downloads only (not readable in the reader).
    download: !external && accessible && detail.files.length > 0 && (detail.book ? detail.book.download_allowed : true),
    add_to_notebook: actor !== null && read && detail.files.some((f) => f.text_status === "ready"),
    report: actor !== null && published && !owner,
    edit: (owner && editableStatus && !external) || (staff && detail.kind === "book"),
  }
}

/** Same as `libraryCan`, written into a copy of the detail (e.g. `detailAs(libDetails.physics10, "teacher")`). */
export function detailAs(
  detail: ItemDetail,
  who: LibraryActorKey | "anonymous",
  ownerId: string | null = null,
): ItemDetail {
  const actor = who === "anonymous" ? null : libActors[who]
  return { ...detail, can: libraryCan(actor, detail, ownerId) }
}

/** Which rights fields are missing for a rights class (§ 3.4); an empty list means the basis is complete. */
export function rightsMissing(
  rights: Rights,
  basis: Record<string, unknown>,
  extra: { proofFileId?: string | null; licence?: string | null } = {},
): string[] {
  const has = (key: string) => basis[key] !== undefined && basis[key] !== null && basis[key] !== ""
  const missing: string[] = []
  if (rights === "public_domain") {
    if (!has("author_death_year") && !has("first_published_year")) missing.push("rights_basis.author_death_year")
    if (!has("rule")) missing.push("rights_basis.rule")
  } else if (rights === "open_license") {
    if (!extra.licence) missing.push("licence")
    if (!has("source_url")) missing.push("rights_basis.source_url")
    if (!has("attribution")) missing.push("rights_basis.attribution")
  } else if (rights === "permission") {
    if (!extra.proofFileId) missing.push("rights_proof_file_id")
    if (!has("permission_scope")) missing.push("rights_basis.permission_scope")
    if (!has("permission_expires_on")) missing.push("rights_basis.permission_expires_on")
  } else if (!has("reference")) {
    missing.push("rights_basis.reference")
  }
  return missing
}

// - - - A tiny valid PDF - - -

/** A one-page PDF (200 x 200 pt, one line of text) with a correct cross-reference table; plain ASCII. */
export function makeTinyPdf(text = "IHSP library test page"): Uint8Array {
  const stream = `BT /F1 12 Tf 20 100 Td (${text.replace(/[()\\]/g, "")}) Tj ET`
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ]
  let out = "%PDF-1.4\n"
  const offsets: number[] = []
  objects.forEach((body, index) => {
    offsets.push(out.length)
    out += `${index + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) out += `${String(offset).padStart(10, "0")} 00000 n \n`
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new TextEncoder().encode(out)
}

/** Bytes served for every PDF of the mocked storage host. */
export const libPdfBytes: Uint8Array = makeTinyPdf()
