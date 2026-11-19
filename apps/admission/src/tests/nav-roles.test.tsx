/** Roles drive the admission layout: student sections need `student` (or an alumni entitlement), staff areas need staff. */
import { describe, expect, it } from "bun:test"
import { getApiClient } from "@ihsp/api"
import { tokenRoles } from "@ihsp/auth"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { useQuery } from "@tanstack/react-query"
import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { hasNoAdmissionAccess, isStaffOnly, landingFor, useNav } from "../config/nav"
import { AdmissionShell } from "../features/shell/components/admission-shell"
import { renderAdmissionApp } from "./helpers"

function NavProbe() {
  const { groups } = useNav()
  return (
    <ul aria-label="nav probe">
      {groups
        .flatMap((group) => group.items)
        .filter((item) => item.visible !== false)
        .map((item) => (
          <li key={item.url}>{item.title}</li>
        ))}
    </ul>
  )
}

const labels = () =>
  within(screen.getByRole("list", { name: "nav probe" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "")

function render(roles: string[], body?: React.ReactNode) {
  renderAdmissionApp(
    <AdmissionShell>
      <p>page body</p>
      {body}
      <NavProbe />
    </AdmissionShell>,
    { session: { user: { ...userMe, roles: roles as typeof userMe.roles } } },
  )
}

describe("role predicates", () => {
  it("treats an alumnus without the student role as student-capable", () => {
    expect(isStaffOnly(["counselor"])).toBe(true)
    expect(isStaffOnly(["counselor"], true)).toBe(false)
    expect(hasNoAdmissionAccess(["teacher"])).toBe(true)
    expect(hasNoAdmissionAccess(["teacher"], true)).toBe(false)
    expect(landingFor(["counselor"])).toBe("/staff/")
    expect(landingFor(["counselor", "student"])).toBe("/")
  })
})

describe("tokenRoles", () => {
  const token = (payload: object) => `h.${btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_")}.s`
  it("reads the roles claim and ignores bad tokens", () => {
    expect(tokenRoles(token({ roles: ["student", "counselor"] }))).toEqual(["student", "counselor"])
    expect(tokenRoles(token({ roles: "student" }))).toBeNull()
    expect(tokenRoles("not-a-jwt")).toBeNull()
  })
})

describe("admission layout by role", () => {
  it("shows a student sections and no staff entries", async () => {
    render(["student"])
    await screen.findByText("page body")
    expect(labels()).toContain("Essays")
    expect(labels()).not.toContain("Caseload")
  })

  it("shows a counselor who is also a student both areas", async () => {
    render(["student", "counselor"])
    await screen.findByText("page body")
    expect(labels()).toContain("Essays")
    expect(labels()).toContain("Caseload")
  })

  it("hides student sections from a counselor and offers the staff area", async () => {
    render(["counselor"])
    await screen.findByText(/This page is for applicants/)
    expect(screen.queryByText("page body")).toBeNull()
    expect(screen.getByRole("link", { name: "Open staff area" })).toBeInTheDocument()
  })

  it("lets an alumnus without the student role into the applicant pages", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/me"), () =>
        HttpResponse.json({ kind: "applicant", may_enter: true, entitlement_kind: "alumni" }),
      ),
    )
    render(["teacher"])
    await screen.findByText("page body")
    expect(labels()).toContain("Essays")
  })

  it("shows a friendly state when the API answers 403 admission/not_applicant", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/me/profile"), () =>
        HttpResponse.json({ type: "admission/not_applicant", title: "Not an applicant", status: 403 }, { status: 403 }),
      ),
    )
    function Probe() {
      useQuery({
        queryKey: ["probe"],
        queryFn: () => getApiClient().get("/v1/admission/me/profile"),
        retry: false,
      })
      return null
    }
    render(["student"], <Probe />)
    expect(await screen.findByText("Applicants only")).toBeInTheDocument()
    expect(screen.queryByText("page body")).toBeNull()
  })
})
