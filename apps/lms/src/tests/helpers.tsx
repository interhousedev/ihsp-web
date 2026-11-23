import type { Messages } from "@ihsp/i18n"
import { ids, renderWithProviders, teacherMe, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure, screen } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import type { ReactElement } from "react"
import en from "../../messages/en.json"
import { SkinProvider } from "../features/skin/skin-provider"

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
  return renderWithProviders(<SkinProvider>{ui}</SkinProvider>, { messages: en as Messages, ...options })
}

export async function readBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

/** Opens the section menu of the course (the button with the course or section title). */
export async function openSectionMenu(user: UserEvent) {
  const trigger = await screen.findByRole("button", {
    expanded: false,
    name: (_, el) => el.hasAttribute("data-section-menu"),
  })
  await user.click(trigger)
}

/** Opens the section menu and picks a section by its name. */
export async function pickSection(user: UserEvent, name: string) {
  await openSectionMenu(user)
  await user.click(await screen.findByRole("menuitem", { name }))
}
