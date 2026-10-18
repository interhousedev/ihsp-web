import { describe, expect, it } from "bun:test"
import { getStaffMeContacts, putStaffMeContacts, type TeacherContacts } from "@ihsp/api"
import { apiUrl, renderWithProviders, server, setDropdownValue } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TeacherContactsForm } from "./teacher-contacts-form"

const STORED: TeacherContacts = {
  telegram: "gulnora_a",
  phone: null,
  email: "g@example.uz",
  office: "12",
  office_hours: null,
  note: null,
}

function renderForm() {
  return renderWithProviders(
    <TeacherContactsForm
      queryKey={["staff", "contacts"]}
      load={(signal) => getStaffMeContacts({ signal })}
      save={putStaffMeContacts}
    />,
  )
}

describe("TeacherContactsForm", () => {
  it("loads the contacts, saves the changes and sends empty fields as null", async () => {
    let sent: TeacherContacts | null = null
    server.use(
      http.get(apiUrl("/v1/staff/me/contacts"), () => HttpResponse.json(STORED)),
      http.put(apiUrl("/v1/staff/me/contacts"), async ({ request }) => {
        sent = (await request.json()) as TeacherContacts
        return HttpResponse.json(sent)
      }),
    )
    renderForm()

    const phone = await screen.findByLabelText("Phone")
    expect(screen.getByLabelText("Telegram")).toHaveValue("gulnora_a")
    setDropdownValue(phone, " +998 90 123-45-67 ")
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(sent).toEqual({ ...STORED, phone: "+998 90 123-45-67" }))
  })

  it("says what to check when the server rejects a value", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/me/contacts"), () => HttpResponse.json(STORED)),
      http.put(apiUrl("/v1/staff/me/contacts"), () =>
        HttpResponse.json(
          { type: "common/validation-failed", title: "Validation failed", status: 422 },
          { status: 422, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderForm()
    await screen.findByLabelText("Phone")

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Check the Telegram name, phone and email")).toBeInTheDocument()
  })
})
