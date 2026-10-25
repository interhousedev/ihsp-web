import { describe, expect, test } from "bun:test"
import {
  api,
  deleteAnnotation,
  deleteShelfEntry,
  getAnnotations,
  getAnnotationsExport,
  getLibraryCollection,
  getLibraryCollections,
  getLibraryFileUrl,
  getLibraryItem,
  getLibraryItemText,
  getLibraryItems,
  getLibrarySubjects,
  getLibraryTopics,
  getMeLibrary,
  getReadingList,
  getReadingLists,
  getShelf,
  getUniLibrarySearch,
  getUniLibrarySettings,
  getUniLibraryTaxonomies,
  getUniLibraryRecord,
  patchAnnotation,
  postAnnotation,
  postAnnotationsSync,
  postUniLibraryPin,
  putLibraryProgress,
  putReadingListItems,
  putShelfEntry,
  putUniLibrarySettings,
  postReadingList,
} from "@ihsp/api"
import { TEST_STORAGE_URL } from "../fixtures/env"
import { libActors, libDetails, libIds, libPdfBytes } from "../fixtures/library"
import { getLibraryActor, getUniLibrary, setLibraryActor, setUniLibrary } from "../handlers/library"

async function statusWithToken(token: string): Promise<number> {
  const response = await fetch(api.url(`/v1/library/items/${libIds.matLibrarianPending}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.status
}

const problem = (type: string, status?: number) => ({ type, ...(status ? { status } : {}) })

describe("library catalogue: anonymous visitors", () => {
  test("see published public items only", async () => {
    setLibraryActor(null)

    const page = await getLibraryItems({ limit: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    const visible = new Set(page.items.map((card) => card.id))
    expect(visible.has(libIds.bookOtkanKunlar)).toBe(true)
    expect(visible.has(libIds.bookPhysics10)).toBe(false) // lyceum only
    expect(visible.has(libIds.matPending)).toBe(false) // not published
    expect(page.items.every((card) => card.kind !== "external")).toBe(true)
  })

  test("get 404 library/not-found for lyceum, hidden and unpublished items", async () => {
    setLibraryActor(null)

    await expect(getLibraryItem(libIds.bookPhysics10)).rejects.toMatchObject(problem("library/not-found", 404))
    await expect(getLibraryItem(libIds.matHeld)).rejects.toMatchObject(problem("library/not-found", 404))
    await expect(getLibraryItem(libIds.bookTakenDown)).rejects.toMatchObject(problem("library/not-found", 404))
    expect((await getLibraryItem("otkan-kunlar")).id).toBe(libIds.bookOtkanKunlar) // by slug
  })

  test("open a public book and its file, but have no notes or notebook", async () => {
    setLibraryActor(null)

    const detail = await getLibraryItem(libIds.bookOtkanKunlar)
    const file = detail.files[0]
    const link = await getLibraryFileUrl(libIds.bookOtkanKunlar, file?.id ?? "", { inline: true })

    expect(detail.can).toMatchObject({ read: true, download: true, add_to_notebook: false, report: false, edit: false })
    expect(link.content_type).toBe("application/epub+zip")
  })

  test("get 401 on routes that need a user", async () => {
    setLibraryActor(null)

    await expect(getMeLibrary()).rejects.toMatchObject(problem("auth/unauthorized", 401))
    await expect(getLibraryTopics()).rejects.toMatchObject({ status: 401 })
    await expect(getReadingLists()).rejects.toMatchObject({ status: 401 })
    await expect(getLibraryItemText(libIds.bookOtkanKunlar)).rejects.toMatchObject({ status: 401 })
  })

  test("browse collections and subjects", async () => {
    setLibraryActor(null)

    const collections = await getLibraryCollections()
    const classics = await getLibraryCollection("uzbek-classics")
    const subjects = await getLibrarySubjects()

    expect(collections.map((c) => c.slug)).not.toContain("summer-reading") // not published
    expect(classics.items.map((i) => i.id)).toEqual([libIds.bookOtkanKunlar, libIds.bookGhazals])
    expect(subjects.every((s) => s.item_count > 0)).toBe(true)
  })

  test("token mode: no Authorization header is anonymous, a token acts as its role", async () => {
    setLibraryActor("token")
    expect(getLibraryActor()).toBeNull()
    await expect(getMeLibrary()).rejects.toMatchObject({ status: 401 })

    const response = await fetch(`${api.url("/v1/me/library")}`, { headers: { Authorization: "Bearer teacher-token" } })
    expect(response.status).toBe(200)
  })
})

describe("library catalogue: signed-in users", () => {
  test("the default actor is the student and sees lyceum items", async () => {
    expect(getLibraryActor()).toEqual(libActors.student)

    const detail = await getLibraryItem(libIds.bookPhysics10)

    expect(detail.can).toMatchObject({ read: true, download: false, add_to_notebook: true, report: true, edit: false })
    expect(detail.shelf_state).toBe("reading")
    expect(detail.progress_percent).toBe(18)
    expect(detail.lists.map((l) => l.importance)).toEqual(["essential"])
  })

  test("a bearer token containing the role name acts as that user", async () => {
    expect(await statusWithToken("student-token")).toBe(404) // someone else's pending upload
    expect(await statusWithToken("librarian2-token")).toBe(200)
  })

  test("owners see their drafts, other students do not", async () => {
    expect((await getLibraryItem(libIds.matDraft)).status).toBe("draft")

    setLibraryActor({ id: "00000000-0000-4000-8000-0000000000ff", roles: ["student"] })
    await expect(getLibraryItem(libIds.matDraft)).rejects.toMatchObject(problem("library/not-found"))
  })

  test("search q matches title and author; Cyrillic Uzbek equals Latin", async () => {
    const byTitle = await getLibraryItems({ q: "physics" })
    const latin = await getLibraryItems({ q: "o'tkan kunlar" })
    const modifier = await getLibraryItems({ q: "oʻtkan" })
    const cyrillic = await getLibraryItems({ q: "ўткан" })
    const author = await getLibraryItems({ q: "qodiriy" })

    expect(byTitle.items.map((c) => c.id)).toContain(libIds.bookPhysics10)
    for (const page of [latin, modifier, cyrillic, author]) {
      expect(page.items.map((c) => c.id)).toEqual([libIds.bookOtkanKunlar])
    }
  })

  test("full-text hits carry a snippet and its page", async () => {
    const page = await getLibraryItems({ q: "velocity" })
    const hit = page.items.find((c) => c.id === libIds.bookPhysics10)

    expect(hit?.snippet).toContain("<mark>velocity</mark>")
    expect(hit?.snippet_page).toBe(2)
  })

  test("filters narrow the catalogue", async () => {
    const books = await getLibraryItems({ source: "book", limit: 100 })
    const teacher = await getLibraryItems({ uploader_role: "teacher", limit: 100 })
    const subject = await getLibraryItems({ subject_id: libDetails.bookOpenPhysics.subjects[0]?.id, type: "textbook" })
    const shelf = await getLibraryItems({ shelf: "reading", limit: 100 })
    const scans = await getLibraryItems({ has_text: false, limit: 100 })

    expect(books.items.every((c) => c.kind === "book")).toBe(true)
    expect(teacher.items.map((c) => c.id).toSorted()).toEqual([libIds.matTeacher, libIds.matTeacherSlides].toSorted())
    expect(subject.items.map((c) => c.id).toSorted()).toEqual([libIds.bookOpenPhysics, libIds.bookPhysics10].toSorted())
    expect(shelf.items.map((c) => c.id).toSorted()).toEqual([libIds.bookOtkanKunlar, libIds.bookPhysics10].toSorted())
    expect(scans.items.map((c) => c.id)).toContain(libIds.bookGeometryScan)
  })

  test("cursor pagination walks every item exactly once", async () => {
    const all = await getLibraryItems({ limit: 100 })
    const seen: (string | null)[] = []
    let cursor: string | undefined
    let pages = 0
    do {
      const page = await getLibraryItems({ limit: 3, cursor, sort: "title" })
      seen.push(...page.items.map((c) => c.id))
      cursor = page.next_cursor ?? undefined
      pages += 1
    } while (cursor)

    expect(pages).toBeGreaterThan(1)
    expect(seen.length).toBe(all.items.length)
    expect(new Set(seen).size).toBe(seen.length)
  })

  test("a file link points at a tiny valid PDF on the storage host", async () => {
    const detail = await getLibraryItem(libIds.bookOpenPhysics)
    const link = await getLibraryFileUrl(libIds.bookOpenPhysics, detail.files[0]?.id ?? "")
    const response = await fetch(link.url)
    const bytes = new Uint8Array(await response.arrayBuffer())

    expect(link.url.startsWith(TEST_STORAGE_URL)).toBe(true)
    expect(link.content_type).toBe("application/pdf")
    expect(link.byte_size).toBe(libPdfBytes.length)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
    expect(bytes.length).toBe(link.byte_size)
  })

  test("the storage host supports Range requests", async () => {
    const response = await fetch(`${TEST_STORAGE_URL}/library/files/${libIds.filePhysics10}`, {
      headers: { Range: "bytes=0-9" },
    })

    expect(response.status).toBe(206)
    expect((await response.arrayBuffer()).byteLength).toBe(10)
  })

  test("no download for a book that forbids it, no inline reading for a PPTX", async () => {
    const book = await getLibraryItem(libIds.bookPhysics10)
    const slides = await getLibraryItem(libIds.matTeacherSlides)

    await expect(getLibraryFileUrl(libIds.bookPhysics10, book.files[0]?.id ?? "")).rejects.toMatchObject({
      status: 403,
    })
    expect((await getLibraryFileUrl(libIds.bookPhysics10, book.files[0]?.id ?? "", { inline: true })).url).toBeTruthy()
    await expect(
      getLibraryFileUrl(libIds.matTeacherSlides, slides.files[0]?.id ?? "", { inline: true }),
    ).rejects.toMatchObject({ status: 403 })
    expect((await getLibraryFileUrl(libIds.matTeacherSlides, slides.files[0]?.id ?? "")).content_type).toContain(
      "presentationml",
    )
  })

  test("text comes page by page; a scan has none", async () => {
    const pages = await getLibraryItemText(libIds.bookPhysics10, { page_from: 2, page_to: 3 })

    expect(pages.pages.map((p) => p.page)).toEqual([2, 3])
    await expect(getLibraryItemText(libIds.bookGeometryScan)).rejects.toMatchObject(
      problem("library/text-unavailable", 409),
    )
  })

  test("topics come as a tree per subject", async () => {
    const subjects = await getLibrarySubjects({ all: true })
    const physics = subjects.find((s) => s.name === "Physics")
    const tree = await getLibraryTopics({ subject_id: physics?.id })

    expect(subjects.some((s) => s.item_count === 0)).toBe(true)
    expect(tree.map((t) => t.name)).toEqual(["Mechanics", "Thermodynamics"])
    expect(tree[0]?.children.map((t) => t.name)).toEqual(["Kinematics", "Dynamics"])
  })
})

describe("UniLibrary is dormant by default", () => {
  test("starts disabled", () => {
    expect(getUniLibrary()).toEqual({ enabled: false, stale: false, down: false })
  })

  test("every UniLibrary route answers 404 library/external-disabled", async () => {
    const disabled = problem("library/external-disabled", 404)

    await expect(getUniLibrarySearch({ q: "fizika" })).rejects.toMatchObject(disabled)
    await expect(getUniLibraryRecord("355186")).rejects.toMatchObject(disabled)
    await expect(postUniLibraryPin("355186", { category: 1 })).rejects.toMatchObject(disabled)
    // The taxonomies are the web's on/off probe: 200 with empty lists, not a 404 in the console.
    await expect(getUniLibraryTaxonomies()).resolves.toMatchObject({ enabled: false, types: [], access: [] })
  })

  test("the catalogue never returns external cards, even for source=external", async () => {
    const all = await getLibraryItems({ limit: 100 })
    const external = await getLibraryItems({ source: "external" })

    expect(all.items.some((c) => c.kind === "external")).toBe(false)
    expect(external).toEqual({ items: [], next_cursor: null })
    await expect(getLibraryItem(libIds.extPinned)).rejects.toMatchObject(problem("library/not-found"))
  })

  test("an administrator reads and writes the flag", async () => {
    setLibraryActor("admin")
    expect(await getUniLibrarySettings()).toEqual({ enabled: false, anonymous_cards: false })

    await putUniLibrarySettings({ enabled: true, anonymous_cards: false })

    expect((await getUniLibrarySettings()).enabled).toBe(true)
    expect(getUniLibrary().enabled).toBe(true)
    setLibraryActor("student")
    expect((await getUniLibrarySearch()).items.length).toBeGreaterThan(0)
  })

  test("other users cannot read the admin settings", async () => {
    await expect(getUniLibrarySettings()).rejects.toMatchObject(problem("common/forbidden", 403))
    setLibraryActor(null)
    await expect(getUniLibrarySettings()).rejects.toMatchObject({ status: 401 })
  })
})

describe("UniLibrary enabled", () => {
  test("search returns a fresh page, filters and pages", async () => {
    setUniLibrary({ enabled: true })

    const first = await getUniLibrarySearch()
    const second = await getUniLibrarySearch({ page: 2 })
    const open = await getUniLibrarySearch({ access: "open" })
    const found = await getUniLibrarySearch({ q: "kvant" })

    expect(first).toMatchObject({ page: 1, total: 6, stale: false })
    expect(first.items).toHaveLength(5)
    expect(second.items).toHaveLength(1)
    expect(open.items.every((c) => c.external?.access === "open")).toBe(true)
    expect(found.items.map((c) => c.external?.external_id)).toEqual(["410022"])
    expect(first.items.some((c) => c.external?.gone)).toBe(false)
  })

  test("a stale search says so", async () => {
    setUniLibrary({ enabled: true, stale: true })

    expect((await getUniLibrarySearch()).stale).toBe(true)
  })

  test("when UniLibrary is down search answers 503 with retry_after, taxonomies stay cached", async () => {
    setUniLibrary({ enabled: true, down: true })

    await expect(getUniLibrarySearch()).rejects.toMatchObject({
      ...problem("library/external-unavailable", 503),
      params: { retry_after: 60 },
    })
    expect((await getUniLibraryTaxonomies()).fields.length).toBeGreaterThan(5)
  })

  test("a record can be read, a gone one is flagged", async () => {
    setUniLibrary({ enabled: true })

    expect((await getUniLibraryRecord("77001")).external?.gone).toBe(true)
    await expect(getUniLibraryRecord("999")).rejects.toMatchObject(problem("library/not-found", 404))
  })

  test("pinning is idempotent, gives the card an id and lets it go on the shelf and in a list", async () => {
    setUniLibrary({ enabled: true })

    const pinned = await postUniLibraryPin("410022", { category: 1 })
    const again = await postUniLibraryPin("410022", { category: 1 })
    const shelved = await putShelfEntry(pinned.id ?? "", { state: "want" })
    setLibraryActor("teacher")
    const list = await postReadingList({ title: "UniLibrary picks", scope: "school" })
    const withExternal = await putReadingListItems(list.id, {
      items: [{ item_id: pinned.id, importance: "further" }],
    })

    expect(pinned.id).toBeTruthy()
    expect(again.id).toBe(pinned.id)
    expect(shelved.item.kind).toBe("external")
    expect(withExternal.entries[0]?.item?.external?.external_id).toBe("410022")
    setLibraryActor("student")
    expect((await getUniLibrarySearch({ q: "kvant" })).items[0]?.shelf_state).toBe("want")
  })

  test("the catalogue lists pinned records while it is on, and file, progress and notes answer 409", async () => {
    setUniLibrary({ enabled: true })

    const all = await getLibraryItems({ source: "external" })
    const detail = await getLibraryItem(libIds.extPinned)

    expect(all.items.map((c) => c.id)).toEqual([libIds.extPinned])
    expect(detail.files).toEqual([])
    expect(detail.can.read).toBe(false)
    const notSupported = problem("library/not-supported", 409)
    await expect(getLibraryFileUrl(libIds.extPinned, "any")).rejects.toMatchObject(notSupported)
    await expect(
      putLibraryProgress(libIds.extPinned, {
        file_id: "x",
        locator: { page: 1 },
        percent: 1,
        client_ts: "2026-10-07T05:00:00Z",
      }),
    ).rejects.toMatchObject(notSupported)
    await expect(
      postAnnotation({
        client_id: "c-ext",
        item_id: libIds.extPinned,
        file_id: "x",
        kind: "bookmark",
        locator: { page: 1 },
        color: "yellow",
      }),
    ).rejects.toMatchObject(notSupported)
  })

  test("switching it off hides pinned records again", async () => {
    setUniLibrary({ enabled: true })
    await putShelfEntry(libIds.extPinned, { state: "reading" })
    expect((await getShelf()).items.some((e) => e.item.kind === "external")).toBe(true)

    setUniLibrary({ enabled: false })

    expect((await getShelf()).items.some((e) => e.item.kind === "external")).toBe(false)
    expect((await getMeLibrary()).shelf_counts.reading).toBe(2)
  })

  test("anonymous visitors see UniLibrary cards only when the setting allows it", async () => {
    setUniLibrary({ enabled: true })
    setLibraryActor(null)
    expect((await getLibraryItems({ source: "external" })).items).toEqual([])

    setLibraryActor("admin")
    await putUniLibrarySettings({ enabled: true, anonymous_cards: true })
    setLibraryActor(null)

    expect((await getLibraryItems({ source: "external" })).items).toHaveLength(1)
    await expect(getUniLibrarySearch()).rejects.toMatchObject({ status: 401 })
  })
})

describe("shelf, progress and annotations", () => {
  test("the shelf keeps taken-down books as removed rows and counts the rest", async () => {
    const shelf = await getShelf({ limit: 100 })
    const me = await getMeLibrary()

    expect(shelf.items.find((e) => e.item.id === libIds.bookTakenDown)?.removed).toBe(true)
    expect(me.shelf_counts).toEqual({ want: 2, reading: 2, done: 1 })
    expect(me.continue.map((c) => c.id)).toEqual([libIds.bookPhysics10, libIds.bookOtkanKunlar])
  })

  test("putting an item on the shelf moves it to the top and updates the counts", async () => {
    const entry = await putShelfEntry(libIds.bookOlympiad, { state: "done" })
    const shelf = await getShelf()

    expect(entry.finished_at).not.toBeNull()
    expect(shelf.items[0]?.item.id).toBe(libIds.bookOlympiad)
    expect((await getMeLibrary()).shelf_counts.done).toBe(2)

    await deleteShelfEntry(libIds.bookOlympiad)
    expect((await getMeLibrary()).shelf_counts.done).toBe(1)
    expect((await getShelf({ state: "done" })).items.map((e) => e.item.id)).toEqual([libIds.matTeacher])
  })

  test("progress is last write wins by client_ts", async () => {
    const file_id = libDetails.bookOpenPhysics.files[0]?.id ?? ""
    const body = { file_id, locator: { page: 10 }, percent: 10 }

    await putLibraryProgress(libIds.bookOpenPhysics, { ...body, client_ts: "2026-10-07T06:00:00Z" })
    await putLibraryProgress(libIds.bookOpenPhysics, { ...body, percent: 5, client_ts: "2026-10-07T05:00:00Z" })

    expect((await getLibraryItem(libIds.bookOpenPhysics)).progress_percent).toBe(10)
  })

  test("a new annotation is idempotent by client_id", async () => {
    const input = {
      client_id: "c-1",
      item_id: libIds.bookOpenPhysics,
      file_id: libDetails.bookOpenPhysics.files[0]?.id ?? "",
      kind: "highlight" as const,
      locator: { page: 3 },
      quote: "Forces change the motion of bodies.",
      color: "pink" as const,
    }

    const first = await postAnnotation(input)
    const second = await postAnnotation(input)
    const list = await getAnnotations({ item_id: libIds.bookOpenPhysics })

    expect(second.id).toBe(first.id)
    expect(list.items).toHaveLength(1)
  })

  test("sync de-duplicates by client_id, updates offline edits and deletes by id or client_id", async () => {
    const base = {
      item_id: libIds.bookOpenPhysics,
      file_id: libDetails.bookOpenPhysics.files[0]?.id ?? "",
      kind: "note" as const,
      locator: { page: 4 },
      quote: "q",
      color: "green" as const,
    }
    const a = await postAnnotation({ ...base, client_id: "c-a", note: "one" })

    const result = await postAnnotationsSync({
      upserts: [
        { ...base, client_id: "c-a", note: "edited offline" },
        { ...base, client_id: "c-b", note: "new" },
        { ...base, client_id: "c-b", note: "new" },
      ],
      deletes: [],
    })
    const after = await getAnnotations({ item_id: libIds.bookOpenPhysics })
    await postAnnotationsSync({ upserts: [], deletes: [a.id, "c-b"] })

    expect(result.items.map((x) => x.client_id)).toEqual(["c-a", "c-b", "c-b"])
    expect(after.items.map((x) => x.note).toSorted()).toEqual(["edited offline", "new"])
    expect((await getAnnotations({ item_id: libIds.bookOpenPhysics })).items).toEqual([])
  })

  test("sync refuses more than 200 changes", async () => {
    const upserts = Array.from({ length: 201 }, (_, i) => ({
      client_id: `c-${i}`,
      item_id: libIds.bookOpenPhysics,
      file_id: libDetails.bookOpenPhysics.files[0]?.id ?? "",
      kind: "bookmark" as const,
      locator: { page: 1 },
      color: "yellow" as const,
    }))

    await expect(postAnnotationsSync({ upserts, deletes: [] })).rejects.toMatchObject({ status: 422 })
  })

  test("annotations are private per user, filtered, patched, deleted and exported", async () => {
    const all = await getAnnotations({ limit: 100 })
    const pink = await getAnnotations({ color: "pink" })
    const notes = await getAnnotations({ kind: "note" })
    const search = await getAnnotations({ q: "derivative" })

    expect(all.items.length).toBe(7)
    expect(pink.items.every((a) => a.color === "pink")).toBe(true)
    expect(notes.items).toHaveLength(2)
    expect(search.items).toHaveLength(1)

    const patched = await patchAnnotation(search.items[0]?.id ?? "", { color: "yellow", note: "Edited" })
    expect(patched).toMatchObject({ color: "yellow", note: "Edited" })
    await deleteAnnotation(patched.id)
    expect((await getAnnotations({ limit: 100 })).items).toHaveLength(6)
    expect(await getAnnotationsExport({ item_id: libIds.bookOtkanKunlar })).toContain("# Ўткан кунлар")

    setLibraryActor("teacher")
    expect((await getAnnotations()).items).toEqual([])
  })
})

describe("reading lists", () => {
  test("a student sees the published list with read state and no drafts", async () => {
    const cards = await getReadingLists()
    const detail = await getReadingList(libIds.listPhysics)

    expect(cards.map((c) => c.id)).toEqual([libIds.listPhysics])
    expect(detail.essential_count).toBe(2)
    expect(detail.essential_done).toBe(1)
    expect(detail.entries.map((e) => e.importance)).toEqual([
      "essential",
      "essential",
      "recommended",
      "further",
      "further",
    ])
    expect(detail.entries[3]).toMatchObject({ item: null, url: "https://example.org/kinematics-video" })
    expect(detail.entries[0]?.read_state).toBe("reading")
    expect(detail.can_edit).toBe(false)
    await expect(getReadingList(libIds.listSummerDraft)).rejects.toMatchObject(problem("library/not-found", 404))
  })

  test("only teachers and librarians create lists", async () => {
    await expect(postReadingList({ title: "Mine", scope: "school" })).rejects.toMatchObject({ status: 403 })

    setLibraryActor("teacher")
    const created = await postReadingList({
      title: "Mine",
      scope: "subject",
      subject_id: libDetails.matTeacher.subjects[0]?.id,
    })

    expect(created).toMatchObject({ status: "draft", entry_count: 0, can_edit: true, subject: { name: "Physics" } })
    expect((await getReadingLists({ mine: true })).map((l) => l.id)).toContain(created.id)
  })

  test("a list takes at most 100 entries", async () => {
    setLibraryActor("teacher")
    const entry = { item_id: libIds.bookOtkanKunlar, importance: "recommended" as const }

    const ok = await putReadingListItems(libIds.listSummerDraft, { items: Array.from({ length: 100 }, () => entry) })
    expect(ok.entry_count).toBe(100)

    await expect(
      putReadingListItems(libIds.listSummerDraft, { items: Array.from({ length: 101 }, () => entry) }),
    ).rejects.toMatchObject(problem("library/list-too-long", 422))
    expect((await getReadingList(libIds.listSummerDraft)).entry_count).toBe(100)
  })

  test("an entry that is not visible or has no item and no link is refused", async () => {
    setLibraryActor("teacher")

    await expect(
      putReadingListItems(libIds.listSummerDraft, { items: [{ item_id: libIds.matPending, importance: "essential" }] }),
    ).rejects.toMatchObject(problem("library/not-found", 404))
    await expect(
      putReadingListItems(libIds.listSummerDraft, { items: [{ importance: "essential" }] }),
    ).rejects.toMatchObject({ status: 422 })
  })
})
