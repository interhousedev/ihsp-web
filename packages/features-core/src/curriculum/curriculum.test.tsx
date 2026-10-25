import { describe, expect, it } from "bun:test"
import type { CurriculumView } from "@ihsp/api"
import { formatDate, type Locale, type Messages } from "@ihsp/i18n"
import en from "@ihsp/i18n/messages/en.json"
import ru from "@ihsp/i18n/messages/ru.json"
import uz from "@ihsp/i18n/messages/uz.json"
import { curriculumView, ids, renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { CurriculumPanel } from "./curriculum-panel"
import {
  curriculumSemester,
  findCurriculumSubject,
  languageName,
  localizedText,
  subjectTypeKey,
} from "./curriculum-utils"
import { SubjectTypeBadge } from "./subject-type-badge"

const TYPE_LABELS: Record<Locale, string[]> = {
  ru: ["Общеобразовательный", "Углублённый", "Профессиональный", "Унифицированный"],
  uz: ["Umumiy taʼlim", "Chuqurlashtirilgan", "Kasbiy", "Unifikatsiyalangan"],
  en: ["General education", "In-depth", "Vocational", "Unified"],
}

/** The argument names of a message (`{count, number}` -> `count`). */
const names = (text: string) => [...text.matchAll(/\{\s*(\w+)/g)].map((match) => match[1]).toSorted()

function flatten(tree: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") result.set(path, value)
    else for (const [inner, text] of flatten(value, path)) result.set(inner, text)
  }
  return result
}

describe("subject type", () => {
  it("maps the four EMIS ids and nothing else", () => {
    expect([1, 2, 3, 4].map(subjectTypeKey)).toEqual(["general", "inDepth", "vocational", "unified"])
    for (const unknown of [0, 5, 99, -1, null, undefined]) expect(subjectTypeKey(unknown)).toBeNull()
  })

  for (const locale of ["ru", "uz", "en"] as const) {
    it(`the badge shows the ${locale} label of every type`, () => {
      for (const [index, label] of TYPE_LABELS[locale].entries()) {
        const { unmount } = renderWithProviders(<SubjectTypeBadge typeId={index + 1} />, { locale })
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      }
    })
  }

  it("has no badge for an unknown or missing type", () => {
    for (const typeId of [0, 5, null, undefined]) {
      const { container, unmount } = renderWithProviders(<SubjectTypeBadge typeId={typeId} />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
})

describe("curriculum helpers", () => {
  it("falls back to the other languages when a text is empty", () => {
    const text = { uz: "Kimyo", ru: "", en: "" }
    expect(localizedText(text, "en")).toBe("Kimyo")
    expect(localizedText({ uz: "", ru: "Физика", en: "" }, "uz")).toBe("Физика")
    expect(localizedText({ uz: "Fizika", ru: "Физика", en: "Physics" }, "ru")).toBe("Физика")
    expect(localizedText({ uz: " ", ru: "", en: "" }, "en")).toBe("")
    expect(localizedText(null, "en")).toBe("")
  })

  it("takes the viewed semester, else the current one of the curriculum", () => {
    expect(curriculumSemester(curriculumView, 3)).toBe(3)
    expect(curriculumSemester(curriculumView)).toBe(4)
    const noCurrent: CurriculumView = {
      ...curriculumView,
      current_semester: null,
      semesters: curriculumView.semesters.map((item) => ({ ...item, is_current: item.number === 3 })),
    }
    expect(curriculumSemester(noCurrent)).toBe(3)
  })

  it("finds the subject of a card by subject_id, else by the EMIS id", () => {
    const physics = findCurriculumSubject(curriculumView, 4, { subjectId: ids.physics })
    expect(physics?.emis_subject_id).toBe(1002)
    expect(physics?.study_hours).toBe(102)
    expect(findCurriculumSubject(curriculumView, 3, { subjectId: ids.physics })?.study_hours).toBe(85)

    const other = "00000000-0000-4000-8000-0000000000ff"
    expect(findCurriculumSubject(curriculumView, 4, { subjectId: other })).toBeNull()
    expect(findCurriculumSubject(curriculumView, 4, { subjectId: other, emisSubjectId: 1099 })?.study_hours).toBe(34)
    // a linked subject wins over the EMIS id
    expect(
      findCurriculumSubject(curriculumView, 4, { subjectId: ids.math, emisSubjectId: 1099 })?.emis_subject_id,
    ).toBe(1001)
    expect(findCurriculumSubject(curriculumView, 9, { subjectId: ids.math })).toBeNull()
    expect(findCurriculumSubject(null, 4, { subjectId: ids.math })).toBeNull()
  })

  it("names the language in the interface language and keeps an unknown code", () => {
    expect(languageName("RU", "en")).toBe("Russian")
    expect(languageName("RU", "ru")).toBe("Русский")
    expect(languageName("??", "en")).toBe("??")
  })
})

describe("messages", () => {
  it("curriculum texts exist in uz, ru and en with the same arguments", () => {
    const keys = (tree: Messages) => [...flatten((tree as Messages).curriculum as Messages).keys()].toSorted()
    expect(keys(ru as Messages)).toEqual(keys(en as Messages))
    expect(keys(uz as Messages)).toEqual(keys(en as Messages))
    const base = flatten((en as Messages).curriculum as Messages)
    for (const messages of [ru, uz] as Messages[]) {
      const other = flatten(messages.curriculum as Messages)
      for (const [key, text] of base) expect(names(other.get(key) ?? ""), key).toEqual(names(text))
    }
  })
})

describe("CurriculumPanel", () => {
  it("says there is no curriculum yet, with the default or the given text", () => {
    renderWithProviders(<CurriculumPanel curriculum={null} />)
    expect(screen.getByRole("heading", { name: "Curriculum" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("The curriculum of your group has not been loaded yet.")
  })

  it("shows the given empty text", () => {
    renderWithProviders(<CurriculumPanel curriculum={null} emptyText="Nothing stored." />)
    expect(screen.getByRole("status")).toHaveTextContent("Nothing stored.")
  })

  it("compact view: profile fields, semesters with dates and the current one marked, exams, vocational subjects", () => {
    renderWithProviders(<CurriculumPanel curriculum={curriculumView} />)

    expect(screen.getByRole("heading", { name: "Curriculum" })).toBeInTheDocument()
    expect(screen.getByText(/ТН, МТН, БТН 2025-2027/)).toBeInTheDocument()
    // speciality has no English text: the Uzbek one is used
    expect(screen.getByText("Speciality").nextElementSibling).toHaveTextContent("Texnik yo'nalish")
    expect(screen.getByText("Direction").nextElementSibling).toHaveTextContent("Информационные технологии (60610100)")
    expect(screen.getByText("Form of study").nextElementSibling).toHaveTextContent("Очная")
    expect(screen.getByText("Language of instruction").nextElementSibling).toHaveTextContent("Russian")
    expect(screen.getByText("Rating scale").nextElementSibling).toHaveTextContent("2–5")

    const semesters = within(screen.getByRole("heading", { name: "Semesters" }).closest("section") as HTMLElement)
    const [third, fourth] = semesters.getAllByRole("listitem")
    expect(third).toHaveTextContent("Semester 3")
    expect(third).toHaveTextContent(`${formatDate("2026-01-12", "en")} – ${formatDate("2026-06-20", "en")}`)
    expect(within(third as HTMLElement).queryByText("Current")).not.toBeInTheDocument()
    expect(fourth).toHaveTextContent("Semester 4")
    expect(fourth).toHaveTextContent(`${formatDate("2026-09-01", "en")} – ${formatDate("2027-01-16", "en")}`)
    expect(within(fourth as HTMLElement).getByText("Current")).toBeInTheDocument()

    const exams = within(screen.getByRole("heading", { name: "Exams" }).closest("section") as HTMLElement)
    const [mathExam, physicsExam] = exams.getAllByRole("listitem")
    expect(mathExam).toHaveTextContent("Final exam: mathematics")
    expect(mathExam).toHaveTextContent("2 h")
    expect(physicsExam).toHaveTextContent("Экзамен по физике")
    expect(physicsExam).not.toHaveTextContent(/\d+ h/)
    expect(screen.getByText("Programming practice")).toBeInTheDocument()
    expect(screen.getByText("72 h")).toBeInTheDocument()

    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.queryByText("Updated", { exact: false })).toBeInTheDocument()
  })

  it("is translated: Russian labels, hours and names", () => {
    renderWithProviders(<CurriculumPanel curriculum={curriculumView} />, { locale: "ru" })

    expect(screen.getByRole("heading", { name: "Учебный план" })).toBeInTheDocument()
    expect(screen.getByText("Специальность").nextElementSibling).toHaveTextContent("Техническое направление")
    expect(screen.getByText("Язык обучения").nextElementSibling).toHaveTextContent("Русский")
    expect(screen.getByText("Итоговый экзамен по математике")).toBeInTheDocument()
    expect(screen.getByText("72 ч")).toBeInTheDocument()
    expect(screen.getByText("Текущий")).toBeInTheDocument()
  })

  it("skips the fields and lists the curriculum does not have", () => {
    const bare: CurriculumView = {
      ...curriculumView,
      speciality: { uz: "", ru: "", en: "" },
      direction: null,
      edu_form: null,
      language_code: null,
      rating_scale: { min: null, max: 5 },
      exams: [],
      vocational_subjects: [],
      semesters: [],
    }
    renderWithProviders(<CurriculumPanel curriculum={bare} />)

    expect(screen.queryByText("Speciality")).not.toBeInTheDocument()
    expect(screen.queryByText("Direction")).not.toBeInTheDocument()
    expect(screen.queryByText("Form of study")).not.toBeInTheDocument()
    expect(screen.getByText("Rating scale").nextElementSibling).toHaveTextContent("up to 5")
    expect(screen.queryByRole("heading", { name: "Semesters" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Exams" })).not.toBeInTheDocument()
  })

  it("admin view: a table of subjects per semester with type, hours and the separated flag", () => {
    renderWithProviders(<CurriculumPanel curriculum={curriculumView} showSubjects />)

    expect(screen.getByText(/EMIS 5021/)).toBeInTheDocument()
    const tables = screen.getAllByRole("table")
    expect(tables).toHaveLength(2)
    const current = within(tables[1] as HTMLElement)
    expect(current.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Subject",
      "Type",
      "Total hours",
      "Class hours",
      "Independent hours",
      "Separated",
    ])
    const rowOf = (name: RegExp) => within(current.getByRole("row", { name }))
    const math = rowOf(/^Mathematics/)
    expect(math.getByText("In-depth")).toBeInTheDocument()
    expect(math.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "Mathematics",
      "In-depth",
      "136",
      "102",
      "34",
      "No",
    ])
    const physics = rowOf(/^Fizika/)
    expect(physics.getAllByRole("cell").at(-1)).toHaveTextContent("Yes")
    expect(rowOf(/^Kimyo/).getByText("General education")).toBeInTheDocument()
    expect(rowOf(/^Informatics/).getByText("Unified")).toBeInTheDocument()
    expect(rowOf(/^Kasb asoslari/).getByText("Vocational")).toBeInTheDocument()
    const unnamedType = rowOf(/^Кураторский час/)
    expect(unnamedType.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "Кураторский час",
      "",
      "–",
      "–",
      "–",
      "No",
    ])
    // the other semester is a table too
    expect(within(tables[0] as HTMLElement).getByRole("row", { name: /^Physics/ })).toHaveTextContent("85")
  })

  it("admin view: a semester without subjects says so", () => {
    const empty: CurriculumView = {
      ...curriculumView,
      semesters: [{ number: 1, starts_on: null, ends_on: null, is_current: true, subjects: [] }],
    }
    renderWithProviders(<CurriculumPanel curriculum={empty} showSubjects />)

    expect(screen.getByText("No subjects in this semester.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
