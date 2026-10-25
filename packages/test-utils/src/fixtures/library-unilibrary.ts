// Library fixtures, part 4: UniLibrary (`kind: "external"`) records, search pages, taxonomies, settings, feeds, the
// field map, the status page and sanctions. Re-exported from `fixtures/library.ts`.
// UniLibrary is dormant by default in the handlers; these are what the handlers answer once it is enabled.

import type {
  Feed,
  FieldMapEntry,
  ItemCard,
  ItemDetail,
  Sanction,
  UniLibrarySearchResult,
  UniLibrarySettings,
  UniLibraryStatus,
  UniLibraryTaxonomy,
} from "@ihsp/api"
import { libIds, libSubjects, makeItemCard, makeItemDetail } from "./library-base"
import { FIXTURE_NOW, ids, uuid } from "./world"

type External = NonNullable<ItemCard["external"]>

const icon = (id: string) => `https://api.unilibrary.uz/storage/PublisherResourceImage/${id}/images/1691471316.png`

/** One UniLibrary record as a card; `id` stays `null` until the record is pinned (`POST .../{external_id}/item`). */
export function makeExternalCard(
  externalId: string,
  over: Partial<ItemCard> & { access?: External["access"]; typeName?: string; fieldName?: string; gone?: boolean },
): ItemCard {
  const { access = "open", typeName = "Darslik", fieldName = "Fizika", gone = false, ...card } = over
  return makeItemCard({
    id: null,
    slug: null,
    kind: "external",
    type: "textbook",
    has_text: false,
    cover_url: icon(externalId),
    tag: { source: "unilibrary", label: "UniLibrary" },
    external: {
      source: "unilibrary",
      external_id: externalId,
      category: 1,
      access,
      type_name: typeName,
      field_name: fieldName,
      view_url: `https://unilibrary.uz/literature/${externalId}`,
      gone,
    },
    ...card,
  })
}

/** Seven records: open, partial and closed access, one that is `gone`; the first one is pinned in the initial state. */
export const libExternalCards: ItemCard[] = [
  makeExternalCard("355186", {
    title: "Elektronika va sxemalar 1",
    author_label: "SH.K.Ismailov",
    year_published: 2021,
    description_excerpt: "Elektron sxemalar asoslari: diod, tranzistor, kuchaytirgichlar.",
    subjects: [libSubjects.physics],
    years_of_study: [2],
    page_count: 288,
    access: "open",
  }),
  makeExternalCard("410022", {
    title: "Kvant mexanikasi asoslari",
    author_label: "B. Yoʻldoshev",
    year_published: 2019,
    type: "manual",
    typeName: "Oʻquv qoʻllanma",
    description_excerpt: "Kvant mexanikasining boshlangʻich kursi.",
    subjects: [libSubjects.physics],
    page_count: 214,
    access: "partial",
  }),
  makeExternalCard("288114", {
    title: "Сборник задач по математическому анализу",
    author_label: "Б. Демидович",
    year_published: 2008,
    type: "manual",
    typeName: "Учебное пособие",
    fieldName: "Математика",
    language: "ru",
    description_excerpt: "Задачи по пределам, производным и интегралам.",
    subjects: [libSubjects.math],
    page_count: 496,
    access: "closed",
  }),
  makeExternalCard("120987", {
    title: "English Phonetics: A Practical Course",
    author_label: "J. Smith",
    year_published: 2015,
    typeName: "Textbook",
    fieldName: "Linguistics",
    language: "en",
    description_excerpt: "Sounds, stress and intonation with exercises.",
    subjects: [libSubjects.english],
    page_count: 180,
    access: "open",
  }),
  makeExternalCard("77001", {
    title: "Fizika (eski nashr)",
    author_label: "Kollektiv",
    year_published: 2001,
    page_count: 160,
    access: "closed",
    gone: true,
  }),
  makeExternalCard("501234", {
    title: "Pedagogik psixologiya",
    author_label: "N. Karimova",
    year_published: 2020,
    fieldName: "Pedagogika",
    description_excerpt: "Oʻquvchi shaxsi va oʻqitish psixologiyasi.",
    page_count: 232,
    access: "partial",
  }),
  makeExternalCard("330777", {
    title: "Adabiyot nazariyasi",
    author_label: "H. Umurov",
    year_published: 2012,
    fieldName: "Adabiyot",
    description_excerpt: "Badiiy adabiyot nazariyasi va tahlil usullari.",
    subjects: [libSubjects.literature],
    page_count: 312,
    access: "open",
  }),
]

export const libExternalPageSize = 5

/** Taxonomy ids of each record (`field_id`, `type_id`, `language_id`), for the search filters. */
export const libExternalMeta: Record<string, { field_id: number; type_id: number; language_id: number }> = {
  "355186": { field_id: 27, type_id: 9, language_id: 26 },
  "410022": { field_id: 27, type_id: 2, language_id: 2 },
  "288114": { field_id: 25, type_id: 2, language_id: 3 },
  "120987": { field_id: 17, type_id: 9, language_id: 7 },
  "77001": { field_id: 27, type_id: 9, language_id: 26 },
  "501234": { field_id: 15, type_id: 9, language_id: 26 },
  "330777": { field_id: 18, type_id: 9, language_id: 26 },
}

/** Records the search can return: `gone` ones are hidden from search. */
export const libExternalSearchable: ItemCard[] = libExternalCards.filter((c) => !c.external?.gone)

/** The pinned snapshot of record 355186 (stored in the initial state, visible once UniLibrary is enabled). */
export const libExternalPinnedDetail: ItemDetail = makeItemDetail({
  ...libExternalCards[0],
  id: libIds.extPinned,
  slug: "elektronika-va-sxemalar-1",
  visibility: "lyceum",
  description: "Elektron sxemalar asoslari: diod, tranzistor, kuchaytirgichlar.",
  publisher: "Toshkent",
  external_keywords: ["elektronika", "sxema", "tranzistor"],
  external_isbn: "978-9943-00-111-1",
  can: { read: false, download: false, add_to_notebook: false, report: true, edit: false },
})

/** First page of an unfiltered search. */
export const libUniSearchFresh: UniLibrarySearchResult = {
  items: libExternalSearchable.slice(0, libExternalPageSize),
  page: 1,
  total: libExternalSearchable.length,
  stale: false,
}

/** The same page when UniLibrary failed and the cache answered: the UI shows "Showing saved results". */
export const libUniSearchStale: UniLibrarySearchResult = { ...libUniSearchFresh, stale: true }

export const libUniSearchPage2: UniLibrarySearchResult = {
  items: libExternalSearchable.slice(libExternalPageSize),
  page: 2,
  total: libExternalSearchable.length,
  stale: false,
}

export const libUniTaxonomy: UniLibraryTaxonomy = {
  enabled: true,
  types: [
    { id: 9, name: "Darslik" },
    { id: 2, name: "Oʻquv qoʻllanma" },
    { id: 3, name: "Uslubiy qoʻllanma" },
    { id: 19, name: "Badiiy adabiyot" },
    { id: 20, name: "Lugʻatlar" },
    { id: 21, name: "Maʼlumotnomalar" },
    { id: 25, name: "Boshqa" },
  ],
  fields: [
    { id: 27, name: "Fizika" },
    { id: 25, name: "Matematika" },
    { id: 29, name: "Kimyo" },
    { id: 30, name: "Biologiya" },
    { id: 7, name: "Tarix" },
    { id: 18, name: "Adabiyot" },
    { id: 17, name: "Tilshunoslik" },
    { id: 21, name: "Informatika" },
    { id: 34, name: "Geografiya" },
    { id: 35, name: "Astronomiya" },
    { id: 10, name: "Iqtisodiyot" },
    { id: 15, name: "Pedagogika" },
  ],
  languages: [
    { id: 2, name: "Oʻzbek" },
    { id: 3, name: "Rus" },
    { id: 7, name: "Ingliz" },
    { id: 26, name: "Lotin" },
  ],
  access: [
    { id: "any", name: "Any access" },
    { id: "open", name: "Fully open" },
    { id: "partial", name: "Partly open" },
    { id: "closed", name: "By request" },
  ],
}

/** Settings in the initial state: the flag is off. */
export const libUniSettings: UniLibrarySettings = { enabled: false, anonymous_cards: false }

export const libFeeds: Feed[] = [
  {
    id: libIds.feedPhysics,
    name: "Physics textbooks (open and partial)",
    enabled: true,
    params: { category: 1, field_ids: [27], type_ids: [9, 2], language_ids: [2, 3, 26], access: ["open", "partial"] },
    max_items: 500,
    estimate: 411,
    last_run_at: "2026-10-04T02:00:00Z",
    last_status: "ok",
    last_count: 398,
  },
  {
    id: libIds.feedLiterature,
    name: "Literature (not run yet)",
    enabled: false,
    params: { category: 1, field_ids: [18], type_ids: [9, 19], language_ids: [2, 26], access: ["open"] },
    max_items: 300,
    estimate: null,
    last_run_at: null,
    last_status: null,
    last_count: null,
  },
]

/** Subject to UniLibrary field (seed of the design: physics 27, mathematics 25, ...). */
export const libFieldMap: FieldMapEntry[] = [
  { subject_id: libSubjects.physics.id, external_field_id: 27 },
  { subject_id: libSubjects.math.id, external_field_id: 25 },
  { subject_id: libSubjects.chemistry.id, external_field_id: 29 },
  { subject_id: libSubjects.history.id, external_field_id: 7 },
  { subject_id: libSubjects.literature.id, external_field_id: 18 },
  { subject_id: libSubjects.english.id, external_field_id: 17 },
  { subject_id: libSubjects.informatics.id, external_field_id: 21 },
]

export const libUniStatus: UniLibraryStatus = {
  breaker: "closed",
  last_calls: [
    { at: "2026-10-07T05:10:00Z", ok: true, ms: 2400, path: "/api/user/guest-publisher-resources-with-media" },
    { at: "2026-10-07T05:08:00Z", ok: true, ms: 820, path: "/api/user/guest-publisher-resources/355186" },
    { at: "2026-10-07T04:55:00Z", ok: false, ms: 8000, path: "/api/user/guest-publisher-resources-with-media" },
  ],
  cache: { hits: 120, misses: 14, stale_served: 2 },
  hidden_records: [libExternalCards[4]!],
}

export const libSanctions: Sanction[] = [
  {
    id: uuid(48, 1),
    user_id: ids.student2,
    kind: "warning",
    until: null,
    reason: "Exam paper uploaded before the control finished.",
    item_id: null,
    created_at: FIXTURE_NOW,
  },
]
