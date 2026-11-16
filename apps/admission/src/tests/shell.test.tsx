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
    expect(labels().slice(0, 6)).toEqual([
      "Home",
      "Profile",
      "Activities & honors",
      "Future plans",
      "Universities",
      "Documents & deadlines",
    ])
    expect(labels()).toContain("Courses")
    expect(labels()).not.toContain("Caseload")
  })

  it("shows a teacher the staff group", async () => {
    renderAdmissionApp(
      <AdmissionShell>
        <p>page body</p>
        <NavProbe />
      </AdmissionShell>,
      { session: { user: { ...userMe, roles: ["teacher"] } } },
    )
    await screen.findByText("page body")
    expect(labels()).toContain("Caseload")
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
