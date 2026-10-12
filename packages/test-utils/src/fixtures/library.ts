// Library fixtures (contract in packages/api/src/types/library.ts).
// Import from `@ihsp/test-utils`. The data is small and realistic (Uzbek, Russian and English). Ids are stable UUIDs
// (`libIds`). The default acting user is the student "Aziza K., 2025" (`libActors.student`).
//
// ACTORS AND IDS (library-base.ts)
//   libIds                     all stable ids: books, materials, files, topics, collections, lists, reports, feeds
//   libActors                  { student, teacher, librarian, librarian2, admin }: id, name, cohort, roles
//   libSubjects                physics, math, chemistry, informatics, english, history, literature as { id, name }
//   libManageTopics, libTopicTree   flat topics (uz/ru/en names) and the English public trees; topicTree(flat, subjectId?)
//   makeItemCard / makeItemDetail / makeItemFile / makeAnnotation / makeShelfEntry   builders with overrides
//   pickCard(detail)           the card part of a detail
//   libraryCan(actor, detail, ownerId) / detailAs(detail, "student" | "teacher" | "librarian" | "admin" | "anonymous")
//                              the `can` flags the mock computes (read, download, add_to_notebook, report, edit)
//   rightsMissing(rights, basis, extra)   missing fields of a rights basis (the publish checklist)
//   makeTinyPdf(text) / libPdfBytes       a valid one-page PDF (served by the mocked storage host)
//   uploaderRoleOf, isLibraryStaff, CAN_NONE
//
// BOOKS AND MATERIALS (library-items.ts)
//   libDetails                 ItemDetail by name:
//     books      bookOtkanKunlar (EPUB, Cyrillic Uzbek, public_domain, public), bookGhazals (Markdown poem, public),
//                bookPhysics10 (official, lyceum, PDF with toc, no download), bookOpenPhysics (open_license CC BY-SA 4.0,
//                public), bookOlympiad (permission, lyceum, expires 2026-11-20), bookGeometryScan (permission, no_text
//                scan), bookDraft (incomplete rights, no cover: publish gives library/rights-incomplete),
//                bookTakenDown (unpublished)
//     materials  by the student: matDraft (no files), matPending, matChanges, matPublished, matHeld, matRejected,
//                matUnpublished; by the teacher: matTeacher (public), matTeacherSlides (PPTX, download only),
//                matTeacherDraft; by the librarian: matLibrarianPending (the "own item" row)
//   libCards                   the same by name as ItemCard; libCardWithSnippet (full-text hit: snippet + snippet_page)
//   libItemMeta, libItemText   owner, dates, scan findings; extracted text by page (library-item-data.ts)
//   libBookInputs              BookInput of each book (the editor's data)
//
// LISTS, SHELF, ANNOTATIONS, QUEUE (library-lists.ts)
//   libManageCollections, libCollections, libCollectionClassics
//   libListPhysics (published; essential, recommended, further and a plain link), libListSummerDraft (draft), libReadingLists
//   libShelfEntries (want, reading, done and a taken-down `removed` row), libProgress, libMeLibrary
//   libAnnotations (highlight, note, bookmark; yellow, green, blue, pink; PDF page and EPUB cfi locators)
//   libUploads / makeUploadRow (one row per status), libQueue / makeQueueRow (tabs review, reports, held, rights,
//   suggestions), libStats,
//   libSubjectList / subjectCounts(cards) (GET /library/subjects)
//
// UNILIBRARY (library-unilibrary.ts) (dormant by default in the handlers)
//   libExternalCards (7 records: open, partial, closed, one `gone`), makeExternalCard, libExternalPinnedDetail
//   libExternalMeta (taxonomy ids), libExternalSearchable (without `gone`)
//   libUniSearchFresh, libUniSearchStale, libUniSearchPage2, libUniTaxonomy, libUniSettings, libFeeds, libFieldMap,
//   libUniStatus, libSanctions

export * from "./library-base"
export * from "./library-items"
export * from "./library-item-data"
export * from "./library-lists"
export * from "./library-unilibrary"
