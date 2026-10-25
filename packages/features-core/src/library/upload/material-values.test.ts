import { describe, expect, it } from "bun:test"
import { libDetails } from "@ihsp/test-utils"
import {
  effectiveLicence,
  emptyValues,
  kindOfItem,
  stepProblems,
  stepsFor,
  toInput,
  valuesFromItem,
  type MaterialValues,
} from "./material-values"
import { defaultLanguage, limitsFor } from "./upload-config"

const filled = (patch: Partial<MaterialValues> = {}): MaterialValues => ({
  ...emptyValues("uz_latn"),
  kind: "markdown",
  title: "Kinematics",
  subjectIds: ["s1"],
  years: [1],
  body: "# Notes",
  attested: true,
  ...patch,
})

describe("steps", () => {
  it("a new material has five steps, a saved draft leaves out the attestation step", () => {
    expect(stepsFor(false, false)).toEqual(["kind", "details", "files", "licence", "review"])
    expect(stepsFor(true, false)).toEqual(["details", "files", "review"])
    expect(stepsFor(true, true)).toEqual(["kind", "details", "files", "review"])
  })
})

describe("stepProblems", () => {
  it("asks for a kind of file first", () => {
    expect(stepProblems("kind", emptyValues("ru"))).toEqual(["kindRequired"])
    expect(stepProblems("kind", filled())).toEqual([])
  })

  it("asks for a title, a subject and a year of study", () => {
    expect(stepProblems("details", emptyValues("ru"))).toEqual(["titleRequired", "subjectRequired", "yearRequired"])
    expect(stepProblems("details", filled({ title: "   " }))).toEqual(["titleRequired"])
    expect(stepProblems("details", filled())).toEqual([])
  })

  it("needs the content that fits the kind of file", () => {
    expect(stepProblems("files", filled({ body: " " }))).toEqual(["bodyRequired"])
    expect(stepProblems("files", filled({ kind: "pdf" }))).toEqual(["pdfRequired"])
    expect(stepProblems("files", filled({ kind: "pdf" }), true)).toEqual([])
    expect(stepProblems("files", filled({ kind: "photos" }))).toEqual(["photosRequired"])
    expect(stepProblems("files", filled({ kind: null }))).toEqual(["kindRequired"])
  })

  it("requires the attestation, and a licence when the material is public", () => {
    expect(stepProblems("licence", filled({ attested: false }))).toEqual(["attestRequired"])
    expect(stepProblems("licence", filled({ makePublic: true }))).toEqual(["licenceRequired"])
    expect(stepProblems("licence", filled({ makePublic: true, licence: "cc_by" }))).toEqual([])
  })
})

describe("toInput", () => {
  it("builds the draft body, with the Markdown text in body_md", () => {
    const input = toInput(filled({ title: "  Kinematics ", years: [2, 1], topicIds: ["t1"] }), false)

    expect(input).toEqual({
      title: "Kinematics",
      description: "",
      subject_ids: ["s1"],
      topic_ids: ["t1"],
      years_of_study: [1, 2],
      type: "notes",
      language: "uz_latn",
      licence: "all_rights_reserved",
      body_md: "# Notes",
      attested: true,
    })
  })

  it("sends no body_md for a file upload", () => {
    expect("body_md" in toInput(filled({ kind: "pdf" }), false)).toBe(false)
  })

  it("keeps all rights reserved unless a teacher made the material public with a licence", () => {
    const open = filled({ makePublic: true, licence: "cc_by_sa" })

    expect(effectiveLicence(open, true)).toBe("cc_by_sa")
    expect(effectiveLicence(open, false)).toBe("all_rights_reserved")
    expect(effectiveLicence(filled({ licence: "cc_by" }), true)).toBe("all_rights_reserved")
  })
})

describe("valuesFromItem", () => {
  it("fills the form from a saved draft, which has to be attested again before it is sent", () => {
    const values = valuesFromItem(libDetails.matDraft)

    expect(values.title).toBe("Kinematics formula sheet")
    expect(values.subjectIds).toEqual(libDetails.matDraft.subjects.map((subject) => subject.id))
    expect(values.type).toBe("formula_sheet")
    expect(values.attested).toBe(false)
    expect(valuesFromItem(libDetails.matChanges).attested).toBe(true)
    expect(values.kind).toBeNull()
  })

  it("tells a Markdown note from a file by the format of its files", () => {
    expect(kindOfItem(libDetails.matChanges)).toBe("pdf")
    expect(kindOfItem(libDetails.matDraft)).toBeNull()
    expect(kindOfItem({ ...libDetails.matDraft, files: [{ ...libDetails.matChanges.files[0]!, format: "md" }] })).toBe(
      "markdown",
    )
  })
})

describe("limits and language", () => {
  it("students have 20 MB and 60 pages, teachers 100 MB", () => {
    expect(limitsFor(false)).toEqual({ bytes: 20 * 1024 * 1024, pages: 60 })
    expect(limitsFor(true)).toEqual({ bytes: 100 * 1024 * 1024, pages: null })
  })

  it("starts with the language of the page", () => {
    expect(defaultLanguage("ru")).toBe("ru")
    expect(defaultLanguage("en")).toBe("en")
    expect(defaultLanguage("uz")).toBe("uz_latn")
  })
})
