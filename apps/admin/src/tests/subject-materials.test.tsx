/** Default materials of a subject: the dialog on the subjects page, the entry by a raw EMIS id, add and remove. */
import { describe, expect, test } from "bun:test"
import type { SubjectMaterial, SubjectMaterialCreateBody } from "@ihsp/api"
import {
  apiUrl,
  libIds,
  problem,
  server,
  subjectMaterialGroups,
  subjectMaterialIds,
  subjectMaterials,
  subjects,
} from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

const RAW_ID = 9001
const RAW_MATERIAL = subjectMaterials.find((item) => item.id === subjectMaterialIds.rawLink) as SubjectMaterial

/** Types an EMIS id into "Materials by EMIS ID" and opens the dialog. */
async function openByEmisId(user: ReturnType<typeof renderAdmin>["user"], id: number) {
  setValue(await screen.findByLabelText("EMIS subject ID"), String(id))
  await user.click(screen.getByRole("button", { name: "Open materials" }))
  return screen.findByRole("dialog")
}

/** A backend of one EMIS id that remembers what was added and removed, and what the requests carried. */
function serveMaterials(initial: SubjectMaterial[]) {
  const state = { rows: initial, posted: [] as SubjectMaterialCreateBody[], deleted: [] as string[] }
  server.use(
    http.get(apiUrl("/v1/admin/subject-materials"), () => HttpResponse.json(subjectMaterialGroups(state.rows))),
    http.get(apiUrl(`/v1/admin/subject-materials/${RAW_ID}`), () => HttpResponse.json(state.rows)),
    http.post(apiUrl(`/v1/admin/subject-materials/${RAW_ID}`), async ({ request }) => {
      const body = (await request.json()) as SubjectMaterialCreateBody
      state.posted.push(body)
      const created: SubjectMaterial = {
        id: `00000046-0000-4000-8000-${String(state.rows.length + 1).padStart(12, "0")}`,
        edu_subject_id: RAW_ID,
        kind: body.kind,
        title: body.title,
        url: body.url ?? null,
        file_id: body.file_id ?? null,
        library_item_id: body.library_item_id ?? null,
        position: state.rows.length + 1,
        created_at: "2026-10-07T05:12:00Z",
      }
      state.rows = [...state.rows, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete(apiUrl(`/v1/admin/subject-materials/${RAW_ID}/:materialId`), ({ params }) => {
      state.deleted.push(String(params.materialId))
      state.rows = state.rows.filter((item) => item.id !== params.materialId)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return state
}

describe("default materials of a subject", () => {
  test("the dialog lists the materials of an EMIS id typed in the entry by id", async () => {
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")

    const dialog = await openByEmisId(user, RAW_ID)

    expect(within(dialog).getByText("Default materials: EMIS ID 9001")).toBeInTheDocument()
    const list = await within(dialog).findByRole("list", { name: "Default materials" })
    expect(within(list).getByText(RAW_MATERIAL.title)).toBeInTheDocument()
    expect(within(list).getByText(RAW_MATERIAL.url as string)).toBeInTheDocument()
    expect(within(list).getByText("Link")).toBeInTheDocument()
  })

  test("a typed name titles the dialog, and an id of a subject without materials shows the empty text", async () => {
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")

    setValue(await screen.findByLabelText("Name (optional)"), "Astronomy")
    const dialog = await openByEmisId(user, 4242)

    expect(within(dialog).getByText("Default materials: Astronomy")).toBeInTheDocument()
    expect(await within(dialog).findByText("No default materials yet.")).toBeInTheDocument()
  })

  test("a subject's materials count is on its row and the button opens its dialog", async () => {
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })

    const button = await screen.findByRole("button", { name: "Default materials of Mathematics: 2" })
    expect(button).toHaveTextContent("2")
    await user.click(button)

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Default materials: Mathematics")).toBeInTheDocument()
    expect(await within(dialog).findByText("Algebra reference tables")).toBeInTheDocument()
    expect(within(dialog).getByText("Mathematics handbook.pdf")).toBeInTheDocument()
  })

  test("adding a link posts it with the url and the list shows it afterwards", async () => {
    const state = serveMaterials([RAW_MATERIAL])
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)
    await within(dialog).findByText(RAW_MATERIAL.title)

    await user.click(within(dialog).getByRole("button", { name: "Link" }))
    setValue(within(dialog).getByLabelText(/^Link/), "https://example.org/reading")
    setValue(within(dialog).getByLabelText(/^Title/), "Reading list")
    await user.click(within(dialog).getByRole("button", { name: "Add material" }))

    await waitUntil(() => state.posted.length > 0, "no request")
    expect(state.posted).toEqual([{ kind: "link", title: "Reading list", url: "https://example.org/reading" }])
    const list = await within(dialog).findByRole("list", { name: "Default materials" })
    expect(await within(list).findByText("Reading list")).toBeInTheDocument()
    expect(within(list).getAllByRole("listitem")).toHaveLength(2)
    expect(within(dialog).getByLabelText(/^Title/)).toHaveValue("")
  })

  test("a link needs a title and an address before it can be added", async () => {
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)
    await within(dialog).findByText(RAW_MATERIAL.title)

    await user.click(within(dialog).getByRole("button", { name: "Link" }))
    const submit = within(dialog).getByRole("button", { name: "Add material" })
    expect(submit).toBeDisabled()
    setValue(within(dialog).getByLabelText(/^Link/), "https://example.org/reading")
    expect(submit).toBeDisabled()
    setValue(within(dialog).getByLabelText(/^Title/), "Reading list")
    await waitUntil(() => !(submit as HTMLButtonElement).disabled, "submit still disabled")
  })

  test("an uploaded file is added with its id and named after the file", async () => {
    const state = serveMaterials([])
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)
    await within(dialog).findByText("No default materials yet.")

    fireEvent.change(within(dialog).getByTestId("file-upload-input"), {
      target: { files: [new File(["syllabus"], "syllabus.pdf", { type: "application/pdf" })] },
    })
    expect(await within(dialog).findByText("File: syllabus.pdf")).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^Title/)).toHaveValue("syllabus.pdf")
    await user.click(within(dialog).getByRole("button", { name: "Add material" }))

    await waitUntil(() => state.posted.length > 0, "no request")
    expect(state.posted[0]).toMatchObject({ kind: "file", title: "syllabus.pdf" })
    expect(typeof state.posted[0]?.file_id).toBe("string")
    expect(await within(dialog).findByRole("list", { name: "Default materials" })).toBeInTheDocument()
  })

  test("a library book found by search is added with its item id and title", async () => {
    const state = serveMaterials([])
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)
    await within(dialog).findByText("No default materials yet.")

    await user.click(within(dialog).getByRole("button", { name: "Library book" }))
    setValue(within(dialog).getByLabelText("Search the library"), "Physics 10")
    await user.click(await within(dialog).findByRole("button", { name: "Select Physics 10: Mechanics" }))
    expect(within(dialog).getByText("Book: Physics 10: Mechanics")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Add material" }))

    await waitUntil(() => state.posted.length > 0, "no request")
    expect(state.posted).toEqual([
      { kind: "library_item", title: "Physics 10: Mechanics", library_item_id: libIds.bookPhysics10 },
    ])
  })

  test("removing a material asks first and then calls DELETE", async () => {
    const state = serveMaterials([RAW_MATERIAL])
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)

    await user.click(await within(dialog).findByRole("button", { name: `Remove ${RAW_MATERIAL.title}` }))
    expect(state.deleted).toEqual([])
    await user.click(within(dialog).getByRole("button", { name: `Confirm removal of ${RAW_MATERIAL.title}` }))

    await waitUntil(() => state.deleted.length > 0, "no request")
    expect(state.deleted).toEqual([RAW_MATERIAL.id])
    expect(await within(dialog).findByText("No default materials yet.")).toBeInTheDocument()
  })

  test("keeping a material closes the question without a request", async () => {
    const state = serveMaterials([RAW_MATERIAL])
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)

    await user.click(await within(dialog).findByRole("button", { name: `Remove ${RAW_MATERIAL.title}` }))
    await user.click(within(dialog).getByRole("button", { name: "Keep" }))

    expect(within(dialog).getByRole("button", { name: `Remove ${RAW_MATERIAL.title}` })).toBeInTheDocument()
    expect(state.deleted).toEqual([])
  })

  test("the error of the backend is shown in the dialog", async () => {
    server.use(
      http.post(apiUrl(`/v1/admin/subject-materials/${RAW_ID}`), () =>
        problem(409, "notebooks/default-material-exists", "The material is already there"),
      ),
    )
    const { user } = renderAdmin(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("Ingliz tili")
    const dialog = await openByEmisId(user, RAW_ID)
    await within(dialog).findByText(RAW_MATERIAL.title)

    await user.click(within(dialog).getByRole("button", { name: "Link" }))
    setValue(within(dialog).getByLabelText(/^Link/), RAW_MATERIAL.url as string)
    setValue(within(dialog).getByLabelText(/^Title/), "Same again")
    await user.click(within(dialog).getByRole("button", { name: "Add material" }))

    const alert = await within(dialog).findByRole("alert")
    expect(alert).toHaveTextContent("This material is already a default material of the subject.")
  })

  test("a subject without an EMIS id has its materials button disabled", async () => {
    const [first] = subjects
    if (!first) throw new Error("no subject fixture")
    server.use(
      http.get(apiUrl("/v1/admin/subjects"), () =>
        HttpResponse.json([{ ...first, emis_subject_id: null, name: { ...first.name, en: "Biology" } }]),
      ),
    )
    renderAdmin(<SubjectsPage />, { route: "/subjects/" })

    const button = await screen.findByRole("button", { name: "Default materials of Biology: EMIS ID needed" })
    expect(button).toBeDisabled()
    expect(screen.getByText("EMIS ID needed")).toBeInTheDocument()
  })

  test("the entry by id stays closed for an id that is not a positive number", async () => {
    renderAdmin(<SubjectsPage />, { route: "/subjects/" })

    const open = await screen.findByRole("button", { name: "Open materials" })
    expect(open).toBeDisabled()
    setValue(screen.getByLabelText("EMIS subject ID"), "0")
    expect(open).toBeDisabled()
    setValue(screen.getByLabelText("EMIS subject ID"), "12")
    await waitUntil(() => !(open as HTMLButtonElement).disabled, "button still disabled")
  })
})
