import { mock } from "bun:test"

/**
 * Replaces the app's `redirectTo` (the one place that calls `window.location.assign`) with a mock.
 * Import this file before any component, so the components see the mock.
 */
export const redirectToMock = mock((_url: string) => undefined)

mock.module("../features/shared/utils/redirect", () => ({ redirectTo: redirectToMock }))
