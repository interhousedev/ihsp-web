import { afterAll, mock } from "bun:test"
import * as realTelegram from "@ihsp/telegram"

// `mock.module` patches the live module for the whole `bun test` process; keep the real exports to put back.
const real = { ...realTelegram }

/** Raw `initData` the page sees: a string inside Telegram, `undefined` outside. */
export const initDataMock = mock((): string | undefined => undefined)
export const closeMiniAppMock = mock(() => undefined)
export const expandMock = mock(() => undefined)
mock.module("@ihsp/telegram", () => ({
  ...realTelegram,
  getInitDataRaw: initDataMock,
  closeMiniApp: closeMiniAppMock,
  expand: expandMock,
}))

// Restore the real exports after this file, or later files (packages/telegram tests) see the mocked `getInitDataRaw`.
afterAll(() => {
  mock.module("@ihsp/telegram", () => real)
})
