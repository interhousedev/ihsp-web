/** ADM-3, ADM-17, UF-ADM-03, UF-ADM-14: students list, Student 360, CSV import preview and confirm. */
import { describe, expect, test } from "bun:test"
import { apiUrl, ids, server, student360 } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ImportPage } from "../features/students/components/import-page"
import { Student360Page } from "../features/students/components/student-360-page"
import { StudentsPage } from "../features/students/components/students-page"
import { configureTests, hrefOf, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("students list", () => {
  test("lists students with group, status and a link to the profile", async () => {
    renderAdmin(<StudentsPage />, { route: "/students/" })

    const link = await screen.findByRole("link", { name: "Brastilov Aleksey" })
    expect(hrefOf(link)).toBe(`/students/view/?id=${ids.student}`)
    expect(screen.getByText("Ismoilov Jasur")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Import from CSV" })).toBeInTheDocument()
  })

  test("a search in the URL filters the list on the server", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/students"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("query"))
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    renderAdmin(<StudentsPage />, { route: "/students/?query=Nazarova" })

    expect(await screen.findByText("No students match these filters.")).toBeInTheDocument()
    expect(seen).toContain("Nazarova")
  })

  test("typing in the search box asks the server again", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/students"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("query"))
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    renderAdmin(<StudentsPage />, { route: "/students/" })
    await screen.findByText("No students match these filters.")

    setValue(screen.getByRole("searchbox", { name: "Search" }), "Karimov")

    await waitUntil(() => seen.includes("Karimov"), "no request with the search text")
  })
})

describe("Student 360", () => {
  test("shows the overview and switches to the other tabs", async () => {
    const { user } = renderAdmin(<Student360Page />, { route: `/students/view/?id=${ids.student}` })

    expect(await screen.findByRole("heading", { name: "Brastilov Aleksey" })).toBeInTheDocument()
    expect(screen.getByText(student360.profile.mailbox ?? "")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Grades" }))
    expect(await screen.findByText(/GPA 4\.10/)).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Account" }))
    expect(await screen.findByRole("button", { name: "Revoke sessions" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Block" })).toBeInTheDocument()
  })
})

describe("student import", () => {
  test("the preview shows new students, changes and conflicts; confirming reports the result", async () => {
    const { user } = renderAdmin(<ImportPage />, { route: "/students/import/" })

    const file = new File(["last_name,first_name\nAliyev,Bekzod\n"], "students.csv", { type: "text/csv" })
    await user.upload(screen.getByLabelText("CSV file"), file)
    await user.click(screen.getByRole("button", { name: "Show preview" }))

    const added = await screen.findByTestId("import-new")
    expect(within(added).getByText("Aliyev Bekzod")).toBeInTheDocument()
    expect(within(added).getByText("Hasanova Zilola Akmalovna")).toBeInTheDocument()
    expect(within(screen.getByTestId("import-changed")).getByText(/Group changed from 2TN1/)).toBeInTheDocument()
    expect(within(screen.getByTestId("import-conflicts")).getByText("Brastilov Aleksey")).toBeInTheDocument()
    expect(screen.getByText("Unchanged rows: 21")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Import 3 rows" }))

    expect(await screen.findByText("Created 2, updated 1, skipped 1.")).toBeInTheDocument()
  })

  test("a rejected file shows the error and no preview", async () => {
    server.use(
      http.post(apiUrl("/v1/admin/students/import"), () =>
        HttpResponse.json(
          { type: "common/validation", title: "Invalid", status: 422, params: {} },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderAdmin(<ImportPage />, { route: "/students/import/" })

    await user.upload(screen.getByLabelText("CSV file"), new File(["x"], "bad.csv", { type: "text/csv" }))
    await user.click(screen.getByRole("button", { name: "Show preview" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Some of the entered data is not valid.")
    expect(screen.queryByTestId("import-new")).not.toBeInTheDocument()
  })
})
