// Library fixtures, part 3: collections, reading lists, the student's shelf, progress and annotations, uploads, the
// librarian queue and statistics. Re-exported from `fixtures/library.ts`.

import type {
  Annotation,
  Collection,
  CollectionDetail,
  ItemCard,
  ItemDetail,
  LibraryStats,
  LibrarySubject,
  ManageCollection,
  ManageQueueRow,
  MeLibrary,
  ProgressBody,
  QueueRow,
  QueueTab,
  ReadingListDetail,
  ShelfEntry,
  UploadRow,
} from "@ihsp/api"
import { libItemMeta } from "./library-item-data"
import { libCards, libDetails } from "./library-items"
import { libActors, libIds, libSubjects, makeAnnotation, makeShelfEntry, pickCard } from "./library-base"
import { FIXTURE_NOW, ids, uuid } from "./world"

// - - - Collections - - -

const name3 = (uz: string, ru: string, en: string) => ({ uz, ru, en })

/** Collections of the librarian area; the last one is not published. */
export const libManageCollections: ManageCollection[] = [
  {
    id: libIds.collectionClassics,
    slug: "uzbek-classics",
    title: name3("Oʻzbek klassikasi", "Узбекская классика", "Uzbek classics"),
    description: name3("Mumtoz asarlar", "Классические произведения", "Classic works to read in the lyceum"),
    cover_url: null,
    published: true,
    position: 1,
    item_ids: [libIds.bookOtkanKunlar, libIds.bookGhazals],
  },
  {
    id: libIds.collectionOlympiad,
    slug: "olympiad-problems",
    title: name3("Olimpiada masalalari", "Олимпиадные задачи", "Olympiad problems"),
    description: null,
    cover_url: null,
    published: true,
    position: 2,
    item_ids: [libIds.bookOlympiad, libIds.bookOpenPhysics],
  },
  {
    id: libIds.collectionSummer,
    slug: "summer-reading",
    title: name3("Yozgi oʻqish", "Летнее чтение", "Summer reading"),
    description: null,
    cover_url: null,
    published: false,
    position: 3,
    item_ids: [libIds.bookGhazals],
  },
]

/** Public collections (published ones only), English titles, with the item count. */
export const libCollections: Collection[] = libManageCollections
  .filter((c) => c.published)
  .map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title.en,
    description: c.description?.en ?? null,
    cover_url: c.cover_url,
    item_count: c.item_ids.length,
  }))

export const libCollectionClassics: CollectionDetail = {
  ...libCollections[0]!,
  items: [libCards.bookOtkanKunlar, libCards.bookGhazals],
}

// - - - The shelf, progress and annotations of the default student - - -

export const libProgress: (ProgressBody & { item_id: string })[] = [
  {
    item_id: libIds.bookOtkanKunlar,
    file_id: libIds.fileOtkanKunlar,
    locator: { cfi: "epubcfi(/6/8!/4/2/14)", progress: 0.42 },
    percent: 42,
    client_ts: "2026-10-06T18:00:00Z",
    seconds_read: 1800,
  },
  {
    item_id: libIds.bookPhysics10,
    file_id: libIds.filePhysics10,
    locator: { page: 44 },
    percent: 18,
    client_ts: "2026-10-07T04:30:00Z",
    seconds_read: 900,
  },
  {
    item_id: libIds.matTeacher,
    file_id: libIds.fileTeacher,
    locator: { page: 2 },
    percent: 100,
    client_ts: "2026-10-03T10:00:00Z",
    seconds_read: 300,
  },
]

const progressOf = (itemId: string) => libProgress.find((p) => p.item_id === itemId)?.percent ?? null

function shelved(key: keyof typeof libCards, state: ShelfEntry["state"]): ShelfEntry {
  const card = libCards[key]
  return makeShelfEntry({ ...card, progress_percent: card.id ? progressOf(card.id) : null }, state)
}

/** Newest first, as `GET /me/library/shelf` answers. The last row is a taken-down book (`removed`). */
export const libShelfEntries: ShelfEntry[] = [
  shelved("bookPhysics10", "reading"),
  shelved("bookOtkanKunlar", "reading"),
  shelved("matTeacher", "done"),
  shelved("bookOpenPhysics", "want"),
  shelved("bookGhazals", "want"),
  { ...shelved("bookTakenDown", "want"), removed: true },
]

export const libMeLibrary: MeLibrary = {
  continue: [shelved("bookPhysics10", "reading").item, shelved("bookOtkanKunlar", "reading").item],
  shelf_counts: { want: 2, reading: 2, done: 1 },
  offline: { max_items: 5, max_bytes: 400 * 1024 * 1024 },
}

/** Every colour, kind and locator type: PDF pages and EPUB CFIs. */
export const libAnnotations: Annotation[] = [
  makeAnnotation({
    id: uuid(46, 1),
    client_id: uuid(46, 101),
    kind: "highlight",
    color: "yellow",
    locator: { page: 8 },
    quote: "The velocity of a body is the rate of change of its position.",
    updated_at: "2026-10-07T04:20:00Z",
  }),
  makeAnnotation({
    id: uuid(46, 2),
    client_id: uuid(46, 102),
    kind: "note",
    color: "blue",
    locator: { page: 16 },
    quote: "Acceleration is the rate of change of velocity.",
    note: "Compare with the derivative from the maths lesson.",
    updated_at: "2026-10-07T04:10:00Z",
  }),
  makeAnnotation({
    id: uuid(46, 3),
    client_id: uuid(46, 103),
    kind: "bookmark",
    color: "green",
    locator: { page: 44 },
    quote: null,
    updated_at: "2026-10-07T04:30:00Z",
  }),
  makeAnnotation({
    id: uuid(46, 4),
    client_id: uuid(46, 104),
    kind: "highlight",
    color: "pink",
    locator: { page: 31 },
    quote: "A net force produces acceleration.",
    updated_at: "2026-10-05T09:00:00Z",
  }),
  makeAnnotation({
    id: uuid(46, 5),
    client_id: uuid(46, 105),
    item_id: libIds.bookOtkanKunlar,
    file_id: libIds.fileOtkanKunlar,
    kind: "highlight",
    color: "green",
    locator: { cfi: "epubcfi(/6/8!/4/2/10)", progress: 0.35 },
    quote: "Отабек Тошкентдан келди.",
    updated_at: "2026-10-06T17:40:00Z",
  }),
  makeAnnotation({
    id: uuid(46, 6),
    client_id: uuid(46, 106),
    item_id: libIds.bookOtkanKunlar,
    file_id: libIds.fileOtkanKunlar,
    kind: "note",
    color: "yellow",
    locator: { cfi: "epubcfi(/6/8!/4/2/14)", progress: 0.42 },
    quote: "Муқаддима",
    note: "Эссе учун: давр тасвири.",
    updated_at: "2026-10-06T18:00:00Z",
  }),
  makeAnnotation({
    id: uuid(46, 7),
    client_id: uuid(46, 107),
    item_id: libIds.bookOtkanKunlar,
    file_id: libIds.fileOtkanKunlar,
    kind: "bookmark",
    color: "pink",
    locator: { cfi: "epubcfi(/6/10!/4/2/2)", progress: 0.6 },
    quote: null,
    updated_at: "2026-10-04T12:00:00Z",
  }),
]

// - - - Reading lists - - -

const owner = { id: libActors.teacher.id, name: libActors.teacher.name }

/** Published, with essential, recommended and further entries and one plain link. */
export const libListPhysics: ReadingListDetail = {
  id: libIds.listPhysics,
  title: "Physics 10: required reading",
  description: "Read the essential entries before each lab; the rest is optional.",
  scope: "subject",
  status: "published",
  subject: libSubjects.physics,
  year_of_study: 1,
  academic_year: "2026-2027",
  term_half: 1,
  owner,
  entry_count: 5,
  essential_count: 2,
  essential_done: 1,
  updated_at: "2026-09-25T09:00:00Z",
  group_ids: [ids.group2TN2],
  can_edit: false,
  entries: [
    {
      position: 1,
      item: shelved("bookPhysics10", "reading").item,
      url: null,
      title: null,
      importance: "essential",
      page_from: 5,
      page_to: 30,
      week_label: "Week 1",
      due_on: "2026-10-14",
      topic_id: libIds.topicKinematics,
      note: "Read before the lab.",
      read_state: "reading",
    },
    {
      position: 2,
      item: shelved("matTeacher", "done").item,
      url: null,
      title: null,
      importance: "essential",
      page_from: null,
      page_to: null,
      week_label: "Week 1",
      due_on: null,
      topic_id: null,
      note: null,
      read_state: "done",
    },
    {
      position: 3,
      item: shelved("bookOpenPhysics", "want").item,
      url: null,
      title: null,
      importance: "recommended",
      page_from: 1,
      page_to: 20,
      week_label: "Week 2",
      due_on: null,
      topic_id: libIds.topicMechanics,
      note: null,
      read_state: "want",
    },
    {
      position: 4,
      item: null,
      url: "https://example.org/kinematics-video",
      title: "Kinematics: worked examples (video)",
      importance: "further",
      page_from: null,
      page_to: null,
      week_label: null,
      due_on: null,
      topic_id: null,
      note: "A plain link, not a library item.",
      read_state: null,
    },
    {
      position: 5,
      item: libCards.matPublished,
      url: null,
      title: null,
      importance: "further",
      page_from: null,
      page_to: null,
      week_label: null,
      due_on: null,
      topic_id: libIds.topicKinematics,
      note: null,
      read_state: null,
    },
  ],
}

/** A draft of the same teacher: students do not see it. */
export const libListSummerDraft: ReadingListDetail = {
  id: libIds.listSummerDraft,
  title: "Summer reading",
  description: null,
  scope: "school",
  status: "draft",
  subject: libSubjects.literature,
  year_of_study: null,
  academic_year: "2026-2027",
  term_half: null,
  owner,
  entry_count: 2,
  essential_count: 0,
  essential_done: 0,
  updated_at: "2026-10-01T09:00:00Z",
  group_ids: [],
  can_edit: true,
  entries: [
    {
      position: 1,
      item: libCards.bookOtkanKunlar,
      url: null,
      title: null,
      importance: "recommended",
      page_from: null,
      page_to: null,
      week_label: null,
      due_on: null,
      topic_id: null,
      note: null,
      read_state: null,
    },
    {
      position: 2,
      item: libCards.bookGhazals,
      url: null,
      title: null,
      importance: "recommended",
      page_from: null,
      page_to: null,
      week_label: null,
      due_on: null,
      topic_id: null,
      note: null,
      read_state: null,
    },
  ],
}

export const libReadingLists: ReadingListDetail[] = [libListPhysics, libListSummerDraft]

// - - - Uploads and the librarian queue - - -

const queuePositions: Record<string, number> = { [libIds.matPending]: 2 }

/** The upload row of a material (status, reason, review message and queue position). */
export function makeUploadRow(detail: ItemDetail, queuePosition: number | null = null): UploadRow {
  return {
    item: pickCard(detail),
    status: detail.status,
    reason: detail.status_reason,
    review_message: detail.status_note,
    queue_position: detail.status === "pending_review" ? queuePosition : null,
  }
}

const studentUploads = [
  libDetails.matDraft,
  libDetails.matPending,
  libDetails.matChanges,
  libDetails.matPublished,
  libDetails.matHeld,
  libDetails.matRejected,
  libDetails.matUnpublished,
]

/** The uploads of the default student: one in each status. */
export const libUploads: UploadRow[] = studentUploads.map((d) =>
  makeUploadRow(d, d.id ? (queuePositions[d.id] ?? 1) : 1),
)

/** A queue row for a stored item; the uploader comes from the `material` block, the scan from the item meta. */
export function makeQueueRow(
  detail: ItemDetail,
  kind: QueueRow["kind"],
  over: Partial<ManageQueueRow> = {},
): ManageQueueRow {
  const meta = detail.id ? libItemMeta[detail.id] : undefined
  return {
    item: pickCard(detail),
    kind,
    ...(detail.material
      ? {
          uploader: {
            name: detail.material.uploader_name,
            cohort: detail.material.uploader_cohort,
            role: detail.material.uploader_role,
          },
        }
      : {}),
    scan: { findings: meta?.scan ?? [] },
    reports: [],
    submitted_at: meta?.submittedAt ?? meta?.addedAt ?? FIXTURE_NOW,
    ...over,
  }
}

/** The initial queue of each tab; the last `review` row is an upload of the librarian `libActors.librarian` (own item). */
export const libQueue: Record<QueueTab, ManageQueueRow[]> = {
  review: [
    makeQueueRow(libDetails.matPending, "student_material"),
    makeQueueRow(libDetails.matLibrarianPending, "student_material"),
  ],
  reports: [
    makeQueueRow(libDetails.matPublished, "report", {
      reports: [{ reason: "wrong_content", count: 1 }],
      report_ids: [libIds.reportWrongContent],
    }),
  ],
  held: [
    makeQueueRow(libDetails.matHeld, "report", {
      reports: [{ reason: "copyright", count: 2 }],
      report_ids: [libIds.reportHeldA, libIds.reportHeldB],
    }),
  ],
  rights: [makeQueueRow(libDetails.bookOlympiad, "rights"), makeQueueRow(libDetails.bookDraft, "rights")],
  suggestions: [
    makeQueueRow(
      { ...libDetails.bookDraft, id: null, slug: null, title: "Atom physics workbook", status: "pending_review" },
      "suggestion",
      {
        submitted_at: "2026-10-05T10:00:00Z",
        suggestion: {
          id: libIds.suggestion,
          title: "Atom physics workbook",
          url: "https://example.org/atom-workbook",
          note: "Good for the olympiad group.",
          user_name: "Jasur I., 2025",
        },
      },
    ),
  ],
}

/** Statistics of the first week of October 2026. */
export const libStats: LibraryStats = {
  opens: 1284,
  readers: 212,
  queue: { length: 2, oldest_age_hours: 52, average_hours: 18.5 },
  uploads_by_day: [
    { day: "2026-10-01", count: 3 },
    { day: "2026-10-02", count: 1 },
    { day: "2026-10-05", count: 4 },
    { day: "2026-10-06", count: 2 },
  ],
  searches_without_results: [
    { q: "organik kimyo", count: 7 },
    { q: "astronomy atlas", count: 3 },
  ],
  top_items: [
    { item: libCards.bookPhysics10, opens: 310 },
    { item: libCards.bookOtkanKunlar, opens: 201 },
    { item: libCards.matPublished, opens: 94 },
  ],
  items_by_status: {
    published: 11,
    pending_review: 2,
    changes_requested: 1,
    held: 1,
    rejected: 1,
    unpublished: 2,
    draft: 3,
  },
  reports_by_reason: { wrong_content: 1, copyright: 2 },
  subjects_without_materials: [libSubjects.history, libSubjects.english],
}

// - - - Subjects with counts - - -

/** `GET /library/subjects`: subjects that have items, with the number of items in `cards`. */
export function subjectCounts(cards: readonly Pick<ItemCard, "subjects">[]): LibrarySubject[] {
  const counts = new Map<string, LibrarySubject>()
  for (const card of cards) {
    for (const subject of card.subjects) {
      const row = counts.get(subject.id) ?? { id: subject.id, name: subject.name, item_count: 0 }
      row.item_count += 1
      counts.set(subject.id, row)
    }
  }
  return [...counts.values()].toSorted((a, b) => a.name.localeCompare(b.name))
}

/** Subjects of the published, non-hidden fixture items (what a signed-in student sees). */
export const libSubjectList: LibrarySubject[] = subjectCounts(
  Object.values(libDetails).filter((d) => d.status === "published" && d.visibility !== "hidden"),
)
