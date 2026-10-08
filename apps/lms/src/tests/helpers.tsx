import type { Messages } from "@ihsp/i18n"
import { ids, renderWithProviders, teacherMe, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { ReactElement } from "react"
import en from "../../messages/en.json"

// The first render of a page in a cold test run takes several seconds (test files also raise bun's timeout).
configure({ asyncUtilTimeout: 15_000 })

/** The course author of the fixtures: a staff member with every permission. */
export const authorSession: RenderWithProvidersOptions["session"] = {
  user: { ...teacherMe, id: ids.teacherRakhimov, roles: ["teacher"] },
}

/** A staff member who can only preview drafts (the fixture "Tester"). */
export const testerSession: RenderWithProvidersOptions["session"] = {
  user: { ...teacherMe, id: ids.admin, roles: ["teacher"] },
}

/** Renders with the app's own English messages merged over the shared ones. */
export function renderLms(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  return renderWithProviders(ui, { messages: en as Messages, ...options })
}

export async function readBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}
