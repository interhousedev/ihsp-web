import { apiUrl, renderWithProviders, server, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { MotionGlobalConfig } from "motion/react"
import { http, HttpResponse } from "msw"
import { configure } from "@testing-library/react"
import type { ReactElement } from "react"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import en from "../../messages/en.json"

// The first render of a page in a cold test run takes several seconds.
configure({ asyncUtilTimeout: 10_000 })
// Motion animations cancelled at unmount reject in happy-dom and fail the run between tests.
MotionGlobalConfig.skipAnimations = true

const notFound = () => HttpResponse.json({ type: "not-found", title: "Not found", status: 404 }, { status: 404 })
const A = "/v1/admission"

/**
 * Lowest-precedence answers for the calls every page makes in the background. A test that cares about one of them
 * registers its own handler with `server.use`, which wins over these; none of them hides a test's intent.
 * They replace the initial handlers, so `resetHandlers()` after each test restores them.
 */
server.resetHandlers(
  ...server.listHandlers(),
  http.get(apiUrl(`${A}/catalog/study-fields`), () => HttpResponse.json([])),
  http.get(apiUrl(`${A}/catalog/facets`), () => HttpResponse.json([])),
  http.get(apiUrl(`${A}/catalog/institutions`), () => HttpResponse.json({ items: [], next_cursor: null })),
  http.get(apiUrl(`${A}/career/majors`), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl(`${A}/list`), () => HttpResponse.json([])),
  http.get(apiUrl(`${A}/list/insights`), () =>
    HttpResponse.json({ entries: [], balance: { reach: 0, target: 0, safety: 0, unlabelled: 0, status: "empty" } }),
  ),
  http.get(apiUrl(`${A}/outcomes`), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl(`${A}/orgs`), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl(`${A}/matches`), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl(`${A}/staff/catalog/fact-spec`), () => HttpResponse.json({ groups: [] })),
  http.get(apiUrl(`${A}/config`), notFound),
  http.get(apiUrl(`${A}/consent`), notFound),
  http.post(apiUrl(`${A}/uni-chats/:id`), notFound),
  http.get(apiUrl(`${A}/uni-chats/:id/suggestions`), notFound),
)

/** Renders with the app's own English messages merged over the shared ones. */
export function renderAdmissionApp(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  return renderWithProviders(ui, { ...options, messages: mergeMessages(en as Messages, options.messages ?? {}) })
}
