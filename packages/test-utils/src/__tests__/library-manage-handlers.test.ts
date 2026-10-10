import { describe, expect, test } from "bun:test"
import {
  deleteManageCollection,
  deleteManageTopic,
  deleteMaterial,
  getLibraryItem,
  getLibraryItems,
  getLibrarySanctions,
  getLibraryTopics,
  getManageBook,
  getManageBooks,
  getManageCollections,
  getManageQueue,
  getManageStats,
  getManageTopics,
  getMyUploads,
  getUniLibraryFeeds,
  patchManageBook,
  patchManageCollection,
  patchManageTopic,
  patchMaterial,
  postItemReport,
  postLibrarySanction,
  postManageBook,
  postManageBookAction,
  postManageBookFile,
  postManageCollection,
  postManageImport,
  postManageTopic,
  postMaterial,
  postMaterialFiles,
  postMaterialSubmit,
  postMaterialVersion,
  postModeration,
  postReportResolve,
  postSuggestion,
  postUniLibraryFeed,
  postUniLibraryFeedAction,
  type BookInput,
  type MaterialInput,
} from "@ihsp/api"
import { libActors, libBookInputs, libIds, libSubjects } from "../fixtures/library"
import { setLibraryActor } from "../handlers/library"

const problem = (type: string, status?: number) => ({ type, ...(status ? { status } : {}) })

const materialInput: MaterialInput = {
  title: "Optics summary",
  description: "Lenses and mirrors in two pages.",
  subject_ids: [libSubjects.physics.id],
  topic_ids: [libIds.topicMechanics],
  years_of_study: [1],
  type: "notes",
  language: "en",
  licence: "cc_by",
  attested: true,
}

async function newMaterial(input: Partial<MaterialInput> = {}) {
  const draft = await postMaterial({ ...materialInput, ...input })
  await postMaterialFiles(draft.id ?? "", { file_ids: ["0000000a-0000-4000-8000-0000000000aa"] })
  return draft.id ?? ""
}

describe("uploading materials", () => {
  test("a student's material is a draft, then pending_review with a queue position", async () => {
    const draft = await postMaterial(materialInput)
    const withFile = await postMaterialFiles(draft.id ?? "", { file_ids: ["0000000a-0000-4000-8000-0000000000aa"] })
    const submitted = await postMaterialSubmit(draft.id ?? "")
    const uploads = await getMyUploads({ status: "pending_review" })

    expect(draft).toMatchObject({ status: "draft", kind: "material", author_label: "Aziza K., 2025" })
    expect(withFile.files).toHaveLength(1)
    expect(submitted.status).toBe("pending_review")
    expect(uploads.items.map((r) => [r.item.id, r.queue_position])).toEqual([
      [draft.id, 2], // newest first
      [libIds.matPending, 1],
    ])
  })

  test("a teacher's material is published at once", async () => {
    setLibraryActor("teacher")
    const id = await newMaterial()

    const submitted = await postMaterialSubmit(id)

    expect(submitted.status).toBe("published")
    expect(submitted.visibility).toBe("public") // a teacher with a Creative Commons licence
    setLibraryActor(null)
    expect((await getLibraryItem(id)).title).toBe("Optics summary")
  })

  test("submitting needs a file, and the attestation is required", async () => {
    const draft = await postMaterial(materialInput)

    await expect(postMaterialSubmit(draft.id ?? "")).rejects.toMatchObject({ status: 422 })
    // `attested: false` saves a draft (MaterialInput: "may be false until submit"); submitting it is the 422
    const unattested = await postMaterial({ ...materialInput, attested: false })
    expect(unattested.status).toBe("draft")
    await expect(postMaterialSubmit(unattested.id ?? "")).rejects.toMatchObject({ status: 422 })
    await expect(postMaterial({ ...materialInput, title: " " })).rejects.toMatchObject({ status: 422 })
  })

  test("a markdown text counts as the content", async () => {
    const draft = await postMaterial({ ...materialInput, body_md: "# Optics\n\nA lens bends light." })

    expect(draft.files.map((f) => f.format)).toEqual(["md"])
    expect((await postMaterialSubmit(draft.id ?? "")).status).toBe("pending_review")
  })

  test("the owner edits, other users get 404, a rejected material is not editable", async () => {
    const patched = await patchMaterial(libIds.matPublished, {
      title: "Kinematika: yangi konspekt",
      topic_ids: [libIds.topicDynamics],
    })

    expect(patched.title).toBe("Kinematika: yangi konspekt")
    expect(patched.topics.map((t) => t.name)).toEqual(["Dynamics"])
    await expect(patchMaterial(libIds.matRejected, { title: "x" })).rejects.toMatchObject(
      problem("library/not-editable", 409),
    )
    setLibraryActor("teacher")
    await expect(patchMaterial(libIds.matPublished, { title: "x" })).rejects.toMatchObject(
      problem("library/not-found", 404),
    )
  })

  test("a file can be replaced only while the material is a draft or needs changes", async () => {
    await expect(postMaterialFiles(libIds.matPublished, { file_ids: ["f"] })).rejects.toMatchObject(
      problem("library/not-editable"),
    )
    expect((await postMaterialFiles(libIds.matChanges, { file_ids: ["f"] })).files).toHaveLength(1)
    expect((await postMaterialSubmit(libIds.matChanges)).status).toBe("pending_review")
  })

  test("a new version supersedes the old one once it is approved", async () => {
    const version = await postMaterialVersion(libIds.matPublished, { ...materialInput, title: "Kinematika v2" })
    await postMaterialFiles(version.id ?? "", { file_ids: ["f"] })
    await postMaterialSubmit(version.id ?? "")
    expect((await getLibraryItem(libIds.matPublished)).status).toBe("published") // until approved

    setLibraryActor("librarian2")
    await postModeration(version.id ?? "", "approve")

    expect((await getLibraryItem(libIds.matPublished)).status).toBe("unpublished")
    expect((await getLibraryItem(version.id ?? "")).status).toBe("published")
  })

  test("withdrawing makes the item unpublished, a draft disappears", async () => {
    await deleteMaterial(libIds.matPublished)
    await deleteMaterial(libIds.matDraft)

    expect((await getLibraryItem(libIds.matPublished)).status).toBe("unpublished")
    await expect(getLibraryItem(libIds.matDraft)).rejects.toMatchObject({ status: 404 })
  })

  test("my uploads list one row per status with reason and message", async () => {
    const uploads = await getMyUploads({ limit: 100 })

    expect(uploads.items.map((r) => r.status).toSorted()).toEqual(
      (
        ["changes_requested", "draft", "held", "pending_review", "published", "rejected", "unpublished"] as const
      ).toSorted(),
    )
    expect(uploads.items.find((r) => r.status === "changes_requested")).toMatchObject({
      reason: "personal_data",
      review_message: expect.stringContaining("phone number"),
    })
    expect(uploads.items.find((r) => r.status === "pending_review")?.queue_position).toBe(1)
  })

  test("a user with an upload ban cannot upload", async () => {
    setLibraryActor("admin")
    await postLibrarySanction({
      user_id: libActors.student.id,
      kind: "upload_ban",
      until: "2027-01-01T00:00:00Z",
      reason: "Repeated copyright reports",
    })
    setLibraryActor("student")

    await expect(postMaterial(materialInput)).rejects.toMatchObject({
      ...problem("library/banned", 403),
      params: { until: "2027-01-01T00:00:00Z" },
    })
  })

  test("a suggestion lands in the suggestions tab", async () => {
    await postSuggestion({
      title: "Optics workbook",
      url: "https://example.org/optics",
      note: "For the olympiad group",
    })
    setLibraryActor("librarian")

    const tab = await getManageQueue({ tab: "suggestions" })

    expect(tab.items.map((r) => r.suggestion?.title)).toEqual(["Atom physics workbook", "Optics workbook"])
    expect(tab.items[1]?.suggestion?.user_name).toBe("Aziza K., 2025")
  })
})

describe("reports", () => {
  test("two different users reporting exam_leak hold the item, one report does not", async () => {
    await postItemReport(libIds.matTeacher, { reason: "exam_leak" })
    await postItemReport(libIds.matTeacher, { reason: "exam_leak" }) // the same user counts once
    expect((await getLibraryItem(libIds.matTeacher)).status).toBe("published")

    setLibraryActor({ id: "00000000-0000-4000-8000-0000000000e2", roles: ["student"] })
    await postItemReport(libIds.matTeacher, { reason: "exam_leak" })

    setLibraryActor("librarian")
    expect((await getLibraryItem(libIds.matTeacher)).status).toBe("held")
  })

  test("a report from a teacher or a librarian holds the item at once", async () => {
    setLibraryActor("teacher")
    await postItemReport(libIds.matPublished, { reason: "copyright" })

    setLibraryActor("librarian")
    expect((await getLibraryItem(libIds.matPublished)).status).toBe("held")
    await postItemReport(libIds.matTeacher, { reason: "personal_data" })
    expect((await getLibraryItem(libIds.matTeacher)).status).toBe("held")
  })

  test("a report that is not a hold reason keeps the item published", async () => {
    await postItemReport(libIds.matTeacher, { reason: "spam" })
    setLibraryActor({ id: "00000000-0000-4000-8000-0000000000e3", roles: ["student"] })
    await postItemReport(libIds.matTeacher, { reason: "spam" })

    expect((await getLibraryItem(libIds.matTeacher)).status).toBe("published")
  })

  test("reporting needs a user, you cannot report your own item, and the reason is checked", async () => {
    await expect(postItemReport(libIds.matPublished, { reason: "spam" })).rejects.toMatchObject({ status: 403 })
    await expect(postItemReport(libIds.matTeacher, { reason: "bogus" as "spam" })).rejects.toMatchObject({
      status: 422,
    })
    await expect(postItemReport(libIds.matTeacher, { reason: "other", text: "x".repeat(501) })).rejects.toMatchObject({
      status: 422,
    })
    setLibraryActor(null)
    await expect(postItemReport(libIds.matTeacher, { reason: "spam" })).rejects.toMatchObject({ status: 401 })
  })

  test("the 11th report of the day is rate limited", async () => {
    const ids = [
      libIds.matTeacher,
      libIds.bookPhysics10,
      libIds.bookOpenPhysics,
      libIds.bookOlympiad,
      libIds.bookGeometryScan,
      libIds.matTeacherSlides,
      libIds.bookOtkanKunlar,
      libIds.bookGhazals,
    ]
    const reasons = ["spam", "other"] as const
    let sent = 0
    for (const reason of reasons) {
      for (const id of ids) {
        if (sent === 10) break
        await postItemReport(id, { reason })
        sent += 1
      }
    }

    await expect(postItemReport(libIds.matTeacher, { reason: "wrong_content" })).rejects.toMatchObject(
      problem("library/rate-limited", 429),
    )
  })
})

describe("the librarian queue and moderation", () => {
  test("students cannot open the manage area", async () => {
    await expect(getManageQueue({ tab: "review" })).rejects.toMatchObject(problem("common/forbidden", 403))
    setLibraryActor(null)
    await expect(getManageQueue({ tab: "review" })).rejects.toMatchObject({ status: 401 })
  })

  test("every tab has rows; review holds the librarian's own upload", async () => {
    setLibraryActor("librarian")

    const review = await getManageQueue({ tab: "review" })
    const reports = await getManageQueue({ tab: "reports" })
    const held = await getManageQueue({ tab: "held" })
    const rights = await getManageQueue({ tab: "rights" })

    expect(review.items.map((r) => [r.item.id, r.kind, r.uploader?.role])).toEqual([
      [libIds.matPending, "student_material", "student"],
      [libIds.matLibrarianPending, "student_material", "librarian"],
    ])
    expect(reports.items[0]).toMatchObject({
      item: { id: libIds.matPublished },
      reports: [{ reason: "wrong_content", count: 1 }],
    })
    expect(reports.items[0]?.report_ids).toHaveLength(1)
    expect(held.items[0]?.reports).toEqual([{ reason: "copyright", count: 2 }])
    expect(rights.items.map((r) => r.item.id)).toEqual([libIds.bookOlympiad, libIds.bookDraft])
    expect(review.items[0]?.scan.findings).toEqual([])
    await expect(getManageQueue({ tab: "bogus" as "review" })).rejects.toMatchObject({ status: 422 })
  })

  test("approving one's own upload is 403 library/own-item, another librarian may approve", async () => {
    setLibraryActor("librarian")
    await expect(postModeration(libIds.matLibrarianPending, "approve")).rejects.toMatchObject(
      problem("library/own-item", 403),
    )

    setLibraryActor("librarian2")
    const approved = await postModeration(libIds.matLibrarianPending, "approve")

    expect(approved.status).toBe("published")
    expect((await getManageQueue({ tab: "review" })).items.map((r) => r.item.id)).toEqual([libIds.matPending])
  })

  test("a reason is required for everything except approve", async () => {
    setLibraryActor("librarian")

    for (const action of ["request-changes", "reject"] as const) {
      await expect(postModeration(libIds.matPending, action, {})).rejects.toMatchObject(
        problem("common/request-validation", 422),
      )
    }
    expect((await postModeration(libIds.matPending, "approve")).status).toBe("published")
  })

  test("request-changes keeps the message for the student, who resubmits", async () => {
    setLibraryActor("librarian")
    const changed = await postModeration(libIds.matPending, "request-changes", {
      reason: "formatting",
      note: "Add the title page.",
    })

    expect(changed).toMatchObject({
      status: "changes_requested",
      status_reason: "formatting",
      status_note: "Add the title page.",
    })
    setLibraryActor("student")
    const row = (await getMyUploads({ status: "changes_requested" })).items.find((r) => r.item.id === libIds.matPending)
    expect(row).toMatchObject({ reason: "formatting", review_message: "Add the title page.", queue_position: null })
    expect((await postMaterialSubmit(libIds.matPending)).status).toBe("pending_review")
  })

  test("reject, hold, restore and unpublish follow the state machine of the design", async () => {
    setLibraryActor("librarian")
    expect((await postModeration(libIds.matPending, "reject", { reason: "off-topic" })).status).toBe("rejected")
    expect((await postModeration(libIds.matPublished, "hold", { reason: "checking" })).status).toBe("held")
    expect((await postModeration(libIds.matPublished, "restore", { reason: "fine" })).status).toBe("published")
    expect((await postModeration(libIds.matPublished, "unpublish", { reason: "copyright" })).status).toBe("unpublished")
    expect((await postModeration(libIds.matPublished, "restore", { reason: "cleared" })).status).toBe("published")
    expect((await postModeration(libIds.matHeld, "unpublish", { reason: "upheld" })).status).toBe("unpublished")
  })

  test("a move the machine does not allow is 409 library/not-editable", async () => {
    setLibraryActor("librarian")

    await expect(postModeration(libIds.matPublished, "approve")).rejects.toMatchObject(
      problem("library/not-editable", 409),
    )
    await expect(postModeration(libIds.matPending, "hold", { reason: "x" })).rejects.toMatchObject({ status: 409 })
    await expect(postModeration(libIds.matRejected, "restore", { reason: "x" })).rejects.toMatchObject({ status: 409 })
    await expect(postModeration("00000000-0000-4000-8000-00000000dead", "approve")).rejects.toMatchObject(
      problem("library/not-found", 404),
    )
  })

  test("a held item can be dismissed back to published, or unpublished with a warning", async () => {
    setLibraryActor("librarian")
    const held = (await getManageQueue({ tab: "held" })).items[0]
    const reportId = held?.report_ids?.[0] ?? ""

    await postReportResolve(reportId, { action: "dismiss" })

    expect((await getLibraryItem(libIds.matHeld)).status).toBe("published")
    expect((await getManageQueue({ tab: "held" })).items).toEqual([])

    const open = (await getManageQueue({ tab: "reports" })).items.find((r) => r.item.id === libIds.matPublished)
    await postReportResolve(open?.report_ids?.[0] ?? "", { action: "unpublish_and_warn" })
    expect((await getLibraryItem(libIds.matPublished)).status).toBe("unpublished")
    setLibraryActor("admin")
    expect((await getLibrarySanctions({ user_id: libActors.student.id })).map((s) => s.kind)).toEqual(["warning"])
  })

  test("a report can be turned into a hold from the reports tab", async () => {
    setLibraryActor("librarian")
    const open = (await getManageQueue({ tab: "reports" })).items[0]

    await postReportResolve(open?.report_ids?.[0] ?? "", { action: "hold" })

    expect((await getManageQueue({ tab: "held" })).items.map((r) => r.item.id)).toContain(libIds.matPublished)
  })

  test("statistics follow the state", async () => {
    setLibraryActor("librarian")
    const before = await getManageStats()
    await postModeration(libIds.matPending, "approve")
    const after = await getManageStats()

    expect(before.queue.length).toBe(2)
    expect(after.queue.length).toBe(1)
    expect((after.items_by_status.published ?? 0) - (before.items_by_status.published ?? 0)).toBe(1)
    expect(before.reports_by_reason).toEqual({ wrong_content: 1, copyright: 2 })
  })
})

const input = (over: Partial<BookInput> = {}): BookInput => ({
  ...(libBookInputs[libIds.bookDraft] as BookInput),
  title: "Biologiya masalalari",
  authors: ["S. Aliyev"],
  ...over,
})

describe("books", () => {
  test("the table lists books and filters by status and text", async () => {
    setLibraryActor("librarian")

    const all = await getManageBooks({ limit: 100 })
    const drafts = await getManageBooks({ status: "draft" })
    const found = await getManageBooks({ q: "qodiriy" })

    expect(all.items).toHaveLength(8)
    expect(drafts.items.map((r) => r.item.id)).toEqual([libIds.bookDraft])
    expect(found.items.map((r) => r.item.id)).toEqual([libIds.bookOtkanKunlar])
    expect(all.items.find((r) => r.item.id === libIds.bookGeometryScan)?.text_status).toBe("no_text")
  })

  test("the editor gets the input, the detail and the checklist", async () => {
    setLibraryActor("librarian")

    const ready = await getManageBook(libIds.bookOpenPhysics)
    const draft = await getManageBook(libIds.bookDraft)

    expect(ready.checklist.every((c) => c.ok)).toBe(true)
    expect(draft.checklist).toEqual([
      { key: "text_status", ok: false },
      { key: "cover", ok: false },
      { key: "subjects", ok: true },
    ])
    expect(draft.input.rights).toBe("open_license")
  })

  test("publishing an incomplete book is 422 library/rights-incomplete (no rights fields) with params.missing", async () => {
    setLibraryActor("librarian")

    await expect(postManageBookAction(libIds.bookDraft, "publish")).rejects.toMatchObject({
      ...problem("library/rights-incomplete", 422),
      params: { missing: ["text_status", "cover"] },
    })
  })

  test("a complete draft publishes, can be unpublished and taken down with a reason", async () => {
    setLibraryActor("librarian")
    const draft = await postManageBook(
      input({
        rights: "public_domain",
        rights_basis: { author_death_year: 1950, rule: "life+70" },
        cover_file_id: "cover-1",
      }),
    )
    const id = draft.id ?? ""
    expect(draft.status).toBe("draft")
    await expect(postManageBookAction(id, "publish")).rejects.toMatchObject({ params: { missing: ["text_status"] } })

    await postManageBookFile(id, { file_id: "0000002b-0000-4000-8000-000000000001", format: "pdf", is_primary: true })
    const published = await postManageBookAction(id, "publish")
    expect(published.status).toBe("published")
    await expect(postManageBookAction(id, "publish")).rejects.toMatchObject({ status: 409 })

    expect((await postManageBookAction(id, "unpublish")).status).toBe("unpublished")
    await postManageBookAction(id, "publish")
    await expect(postManageBookAction(id, "takedown")).rejects.toMatchObject({ status: 422 })
    expect((await postManageBookAction(id, "takedown", { reason: "copyright" })).status_reason).toBe("copyright")
    expect((await getLibraryItems({ q: "biologiya" })).items).toEqual([])
  })

  test("patching a book rebuilds its detail", async () => {
    setLibraryActor("librarian")

    const patched = await patchManageBook(libIds.bookGhazals, {
      title: "Gʻazallar (tanlama)",
      authors: ["Alisher Navoiy", "tuz. A. Hayitmetov"],
    })

    expect(patched).toMatchObject({
      title: "Gʻazallar (tanlama)",
      author_label: "Alisher Navoiy, tuz. A. Hayitmetov",
      slug: "gazallar",
    })
  })

  test("only librarians manage books", async () => {
    await expect(getManageBooks()).rejects.toMatchObject({ status: 403 })
    await expect(postManageBook(input())).rejects.toMatchObject({ status: 403 })
  })

  test("a CSV import creates draft books and lists the bad rows", async () => {
    setLibraryActor("librarian")

    const result = await postManageImport({ csv_file_id: "0000000a-0000-4000-8000-0000000000cc" })

    expect(result).toEqual({ created: 2, errors: [{ row: 4, message: "Missing rights class" }] })
    expect((await getManageBooks({ status: "draft" })).items).toHaveLength(3)
  })
})

describe("topics, collections and administration", () => {
  const names = { uz: "Optika", ru: "Оптика", en: "Optics" }

  test("topics: create under a parent, rename, delete with children", async () => {
    setLibraryActor("librarian")

    const topic = await postManageTopic({
      subject_id: libSubjects.physics.id,
      parent_id: libIds.topicThermodynamics,
      name: names,
    })
    expect(topic).toMatchObject({ slug: "optics", parent_id: libIds.topicThermodynamics })
    const renamed = await patchManageTopic(topic.id, { name: { ...names, en: "Geometric optics" } })
    expect(renamed.name.en).toBe("Geometric optics")
    expect((await getLibraryTopics({ subject_id: libSubjects.physics.id }))[1]?.children[0]?.name).toBe(
      "Geometric optics",
    )

    await deleteManageTopic(libIds.topicThermodynamics)
    expect((await getManageTopics({ subject_id: libSubjects.physics.id })).map((t) => t.id)).toEqual([
      libIds.topicMechanics,
      libIds.topicKinematics,
      libIds.topicDynamics,
    ])
    await expect(
      postManageTopic({ subject_id: libSubjects.physics.id, name: { ...names, ru: "" } }),
    ).rejects.toMatchObject({ status: 422 })
    await expect(deleteManageTopic(libIds.topicThermodynamics)).rejects.toMatchObject({ status: 404 })
  })

  test("collections: create, publish and delete", async () => {
    setLibraryActor("librarian")

    const created = await postManageCollection({
      title: { uz: "Fizika", ru: "Физика", en: "Physics picks" },
      published: false,
      item_ids: [libIds.bookPhysics10],
    })
    expect(created.published).toBe(false)
    const published = await patchManageCollection(created.id, {
      published: true,
      item_ids: [libIds.bookPhysics10, libIds.bookOpenPhysics],
    })
    expect(published.item_ids).toHaveLength(2)
    expect((await getManageCollections()).map((c) => c.slug)).toContain("physics-picks")

    await deleteManageCollection(created.id)
    expect((await getManageCollections()).map((c) => c.slug)).not.toContain("physics-picks")
    await expect(
      postManageCollection({ title: { uz: "", ru: "", en: "Bad" }, published: true, item_ids: ["nope"] }),
    ).rejects.toMatchObject({ status: 404 })
  })

  test("sanctions and feeds are for administrators", async () => {
    setLibraryActor("librarian")
    await expect(getLibrarySanctions()).rejects.toMatchObject({ status: 403 })
    await expect(getUniLibraryFeeds()).rejects.toMatchObject({ status: 403 })

    setLibraryActor("admin")
    const feed = await postUniLibraryFeed({
      name: "History",
      params: { category: 1, field_ids: [7], type_ids: [9], language_ids: [2], access: ["open"] },
      max_items: 200,
    })
    const dry = await postUniLibraryFeedAction(feed.id, "dry-run")
    const run = await postUniLibraryFeedAction(feed.id, "run")
    const enabled = await postUniLibraryFeedAction(feed.id, "enable")

    expect(feed).toMatchObject({ enabled: false, estimate: null })
    expect(dry.estimate).toBe(120)
    expect(run).toMatchObject({ last_status: "ok", last_count: 120 })
    expect(enabled.enabled).toBe(true)
    expect((await getUniLibraryFeeds()).map((f) => f.name)).toContain("History")
  })
})
