import type { Dashboard, DashboardSaveBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { dashboardLayout } from "../fixtures/dashboard"
import { apiUrl, problem, readJson } from "./utils"

/** Text colour the server computes for a tile colour (black on light, white on dark). */
function textFor(color: string | null): string | null {
  if (!color) return null
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16))
  return (r ?? 0) * 0.299 + (g ?? 0) * 0.587 + (b ?? 0) * 0.114 > 150 ? "#000000" : "#FFFFFF"
}

export const dashboardHandlers = [
  http.get(apiUrl("/v1/me/dashboard"), () => HttpResponse.json(dashboardLayout)),
  http.put(apiUrl("/v1/me/dashboard"), async ({ request }) => {
    const body = await readJson<DashboardSaveBody>(request)
    if (body.version !== dashboardLayout.version) {
      return problem(409, "dashboard/version-conflict", "The dashboard was changed elsewhere.")
    }
    const saved: Dashboard = {
      version: dashboardLayout.version + 1,
      widgets: (body.widgets ?? []).map((widget) => ({
        ...widget,
        text_color: textFor(widget.color),
      })),
    }
    return HttpResponse.json(saved)
  }),
]
