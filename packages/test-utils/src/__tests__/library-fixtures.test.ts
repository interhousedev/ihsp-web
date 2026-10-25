import { describe, expect, test } from "bun:test"
import type { ItemStatus } from "@ihsp/api"
import {
  CAN_NONE,
  detailAs,
  libActors,
  libAnnotations,
  libCardWithSnippet,
  libCards,
  libDetails,
  libExternalCards,
  libIds,
  libListPhysics,
  libMeLibrary,
  libPdfBytes,
  libQueue,
  libShelfEntries,
  libStats,
  libTopicTree,
  libUniTaxonomy,
  libUploads,
  makeAnnotation,
  makeItemCard,
  makeItemDetail,
  makeTinyPdf,
  rightsMissing,
  topicTree,
  libManageTopics,
} from "../fixtures/library"
import { getAnnotations, getLibraryItem, getLibraryItems, getManageQueue, getMeLibrary, getMyUploads } from "@ihsp/api"
import { setLibraryActor } from "../handlers/library"

const details = Object.values(libDetails)

describe("library fixtures", () => {
  test("ids are unique and every card matches its detail", () => {
    const ids = details.map((d) => d.id)

    expect(new Set(ids).size).toBe(ids.length)
    for (const [key, detail] of Object.entries(libDetails)) {
      expect(libCards[key as keyof typeof libCards]).toMatchObject({
        id: detail.id,
        title: detail.title,
        kind: detail.kind,
      })
    }
  })

  test("books cover the rights matrix with the visibility each class allows", () => {
    const books = details.filter((d) => d.kind === "book" && d.book && d.status === "published")
    const byRights = (rights: string) => books.filter((d) => d.book?.rights === rights)

    expect(byRights("public_domain").every((d) => d.visibility === "public" && d.book?.download_allowed)).toBe(true)
    expect(byRights("open_license").every((d) => d.visibility === "public" && d.rights_box?.attribution)).toBe(true)
    expect(byRights("permission").every((d) => d.visibility === "lyceum")).toBe(true)
    expect(byRights("official").every((d) => d.visibility === "lyceum")).toBe(true)
    expect(libDetails.bookOpenPhysics.book?.licence).toBe("CC BY-SA 4.0")
  })

  test("there is a scan without text, an EPUB and a Markdown poem", () => {
    expect(libDetails.bookGeometryScan.files[0]).toMatchObject({ text_status: "no_text" })
    expect(libDetails.bookGeometryScan.has_text).toBe(false)
    expect(libDetails.bookOtkanKunlar.files[0]?.format).toBe("epub")
    expect(libDetails.bookGhazals.files[0]?.format).toBe("md")
    expect(libDetails.bookGhazals.type).toBe("poetry")
    expect(libDetails.bookPhysics10.files[0]?.toc.length).toBeGreaterThan(2)
  })

  test("materials exist in every status, by a student and by a teacher", () => {
    const materials = details.filter((d) => d.kind === "material")
    const statuses = new Set<ItemStatus>(materials.map((d) => d.status))

    for (const status of [
      "draft",
      "pending_review",
      "changes_requested",
      "published",
      "held",
      "rejected",
      "unpublished",
    ] as const) {
      expect(statuses.has(status)).toBe(true)
    }
    expect(
      materials
        .filter((d) => d.material?.uploader_role === "student")
        .every((d) => d.author_label === "Aziza K., 2025"),
    ).toBe(true)
    expect(materials.some((d) => d.material?.uploader_role === "teacher")).toBe(true)
    expect(libDetails.matChanges.status_note).toBeTruthy()
  })

  test("UniLibrary records have open, partial and closed access and one gone record, with covers and links", () => {
    const external = libExternalCards.map((c) => c.external)

    expect(new Set(external.map((e) => e?.access))).toEqual(new Set(["open", "partial", "closed"]))
    expect(external.filter((e) => e?.gone)).toHaveLength(1)
    expect(libExternalCards.every((c) => c.id === null && c.kind === "external" && c.tag.source === "unilibrary")).toBe(
      true,
    )
    expect(libExternalCards.every((c) => c.cover_url?.startsWith("https://api.unilibrary.uz/"))).toBe(true)
    expect(external.every((e) => e?.view_url === `https://unilibrary.uz/literature/${e?.external_id}`)).toBe(true)
  })

  test("annotations use all four colours, all three kinds, PDF and EPUB locators", () => {
    expect(new Set(libAnnotations.map((a) => a.color))).toEqual(new Set(["yellow", "green", "blue", "pink"]))
    expect(new Set(libAnnotations.map((a) => a.kind))).toEqual(new Set(["highlight", "note", "bookmark"]))
    expect(libAnnotations.some((a) => "page" in a.locator)).toBe(true)
    expect(libAnnotations.some((a) => "cfi" in a.locator)).toBe(true)
    expect(new Set(libAnnotations.map((a) => a.client_id)).size).toBe(libAnnotations.length)
  })

  test("the list has essential, recommended, further entries and a plain link", () => {
    const importance = new Set(libListPhysics.entries.map((e) => e.importance))

    expect(importance).toEqual(new Set(["essential", "recommended", "further"]))
    expect(libListPhysics.entries.some((e) => e.item === null && e.url !== null)).toBe(true)
  })

  test("the queue has a row on every tab, an own-item row and the cards carry the uploader", () => {
    for (const tab of ["review", "reports", "held", "rights", "suggestions"] as const) {
      expect(libQueue[tab].length).toBeGreaterThan(0)
    }
    expect(libQueue.review.some((r) => r.uploader?.role === "librarian")).toBe(true)
    expect(libQueue.suggestions[0]?.suggestion?.title).toBeTruthy()
    expect(libStats.top_items.length).toBeGreaterThan(0)
    expect(libUniTaxonomy.access.map((a) => a.id)).toEqual(["any", "open", "partial", "closed"])
  })

  test("the snippet card is a full-text hit", () => {
    expect(libCardWithSnippet.snippet).toContain("<mark>")
    expect(libCardWithSnippet.snippet_page).toBe(8)
  })

  test("the `can` rules differ by role and status", () => {
    const published = libDetails.bookOpenPhysics
    const draft = libDetails.matDraft

    expect(detailAs(published, "anonymous").can).toMatchObject({ read: true, add_to_notebook: false, report: false })
    expect(detailAs(published, "student").can).toMatchObject({
      read: true,
      add_to_notebook: true,
      report: true,
      edit: false,
    })
    expect(detailAs(published, "librarian").can.edit).toBe(true)
    expect(detailAs(draft, "student", libActors.student.id).can).toMatchObject({ edit: true, report: false })
    expect(detailAs(libDetails.bookGeometryScan, "student").can.add_to_notebook).toBe(false)
    expect(detailAs(draft, "teacher").can).toEqual(CAN_NONE)
  })

  test("rights basis fields per class", () => {
    expect(rightsMissing("public_domain", { author_death_year: 1900, rule: "life+70" })).toEqual([])
    expect(rightsMissing("open_license", {}, { licence: null })).toEqual([
      "licence",
      "rights_basis.source_url",
      "rights_basis.attribution",
    ])
    expect(rightsMissing("permission", { permission_scope: "x" })).toEqual([
      "rights_proof_file_id",
      "rights_basis.permission_expires_on",
    ])
    expect(rightsMissing("official", {})).toEqual(["rights_basis.reference"])
  })

  test("topic trees nest by parent and respect the subject", () => {
    const physics = libManageTopics.find((t) => t.id === libIds.topicMechanics)?.subject_id

    expect(topicTree(libManageTopics, physics).map((t) => t.name)).toEqual(["Mechanics", "Thermodynamics"])
    expect(libTopicTree.flatMap((t) => t.children).length).toBeGreaterThan(3)
  })

  test("builders apply overrides", () => {
    expect(makeItemCard({ kind: "external" }).tag.source).toBe("unilibrary")
    expect(makeItemDetail({ status: "held" }).status).toBe("held")
    expect(makeAnnotation({ color: "blue" }).color).toBe("blue")
  })

  test("the PDF is a one-page file with a correct cross-reference table", () => {
    const text = new TextDecoder().decode(libPdfBytes)
    const startxref = Number(/startxref\n(\d+)\n%%EOF/.exec(text)?.[1])

    expect(text.startsWith("%PDF-1.4")).toBe(true)
    expect(text.endsWith("%%EOF\n")).toBe(true)
    expect(text.slice(startxref, startxref + 4)).toBe("xref")
    const offsets = [...text.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]))
    expect(offsets).toHaveLength(5)
    offsets.forEach((offset, i) => expect(text.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true))
    expect(text).toContain("/Count 1")
    expect(makeTinyPdf("A (B)").length).toBeGreaterThan(100)
  })
})

describe("library fixtures match the initial handler state", () => {
  test("shelf counts, continue-reading and uploads", async () => {
    const me = await getMeLibrary()
    const uploads = await getMyUploads({ limit: 100 })

    expect(me.shelf_counts).toEqual(libMeLibrary.shelf_counts)
    expect(me.continue.map((c) => c.id)).toEqual(libMeLibrary.continue.map((c) => c.id))
    expect(libShelfEntries.filter((e) => !e.removed).length).toBe(5)
    expect(uploads.items.map((r) => r.status).toSorted()).toEqual(libUploads.map((r) => r.status).toSorted())
  })

  test("every fixture detail is served to the librarian with the same title", async () => {
    setLibraryActor("librarian")

    for (const detail of details) {
      expect((await getLibraryItem(detail.id ?? "")).title).toBe(detail.title)
    }
  })

  test("the catalogue serves the cards of the published items", async () => {
    const page = await getLibraryItems({ limit: 100, sort: "title" })
    const published = details.filter((d) => d.status === "published")

    expect(page.items.map((c) => c.id).toSorted()).toEqual(published.map((d) => d.id).toSorted())
  })

  test("the queue tabs equal the fixture queue", async () => {
    setLibraryActor("librarian")

    for (const tab of ["review", "reports", "held", "rights", "suggestions"] as const) {
      const rows = await getManageQueue({ tab })
      expect(rows.items.map((r) => [r.item.id, r.kind])).toEqual(libQueue[tab].map((r) => [r.item.id, r.kind]))
    }
  })

  test("annotations of the student equal the fixtures", async () => {
    const page = await getAnnotations({ limit: 100 })

    expect(page.items.map((a) => a.id).toSorted()).toEqual(libAnnotations.map((a) => a.id).toSorted())
  })
})
