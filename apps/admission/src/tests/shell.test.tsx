/** The admission shell: step entries, the staff group by role, and the app header on API requests. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { getApiClient } from "@ihsp/api"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { useNav } from "../config/nav"
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

function labels(): string[] {
  return within(screen.getByRole("list", { name: "nav probe" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "")
}

describe("AdmissionShell", () => {
  it("shows a student the steps in order and no staff entries", async () => {
    window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "admission" }
    resetConfig()
    renderAdmissionApp(
      <AdmissionShell>
        <p>page body</p>
        <NavProbe />
      </AdmissionShell>,
    )
    expect(await screen.findByText("page body")).toBeInTheDocument()
    expect(labels()).toEqual([
      "Today",
      "Profile",
      "Universities & budget",
      "Essays",
      "Documents & applying",
      "Countries",
      "Trajectories",
      "Knowledge base",
      "Consultations",
      "Settings",
    ])
    expect(labels()).not.toContain("Home")
    expect(labels()).not.toContain("Caseload")
  })

  it("shows a teacher no staff entries: admission staff is a separate role", async () => {
    renderAdmissionApp(
      <AdmissionShell anyone>
        <p>page body</p>
        <NavProbe />
      </AdmissionShell>,
      { session: { user: { ...userMe, roles: ["teacher"] } } },
    )
    await screen.findByText("page body")
    expect(labels()).not.toContain("Caseload")
    expect(labels()).not.toContain("Knowledge base editor")
  })

  it("shows a user without an admission role one no-access page and no applicant nav", async () => {
    renderAdmissionApp(
      <AdmissionShell>
        <p>page body</p>
        <NavProbe />
      </AdmissionShell>,
      { session: { user: { ...userMe, roles: ["teacher"] } } },
    )
    await screen.findByText(/Your account has no access to it/)
    expect(screen.queryByText("page body")).toBeNull()
    expect(screen.queryByText("Career & study")).toBeNull()
  })
})

describe("staff nav by role", () => {
  async function navFor(role: "mentor" | "counselor" | "admin" | "transcript_officer") {
    renderAdmissionApp(
      <AdmissionShell anyone>
        <p>page body</p>
        <NavProbe />
      </AdmissionShell>,
      { session: { user: { ...userMe, roles: [role] } } },
    )
    await screen.findByText("page body")
    return labels()
  }

  it("hides the settings from a mentor", async () => {
    const items = await navFor("mentor")
    expect(items).toContain("Caseload")
    expect(items).not.toContain("Admission management")
  })

  it("offers a mentor the knowledge base editor and the deadlines timeline but not the catalog", async () => {
    const items = await navFor("mentor")
    expect(items).toContain("Knowledge base editor")
    expect(items).toContain("Deadlines")
    expect(items).not.toContain("Catalog review")
  })

  it("shows counselors and admins the settings", async () => {
    expect(await navFor("counselor")).toContain("Admission management")
  })

  it("shows the comment reports to administrators only, as the backend does", async () => {
    expect(await navFor("counselor")).not.toContain("Reports")
  })

  it("shows an officer only documents and transcripts", async () => {
    const items = await navFor("transcript_officer")
    expect(items).toContain("Transcripts")
    expect(items).not.toContain("Caseload")
    expect(items).not.toContain("Admission management")
  })
})

describe("API client", () => {
  it("sends X-IHSP-App from APP_NAME", async () => {
    window.__ENV__ = { ...(window.__ENV__ as object), APP_NAME: "admission" }
    resetConfig()
    let seen: string | null = null
    server.use(
      http.get(apiUrl("/v1/admission/config"), ({ request }) => {
        seen = request.headers.get("X-IHSP-App")
        return HttpResponse.json({})
      }),
    )
    await getApiClient().get("/v1/admission/config")
    await waitFor(() => expect(seen).toBe("admission"))
  })
})
