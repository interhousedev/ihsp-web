import { mock } from "bun:test"
import * as realTelegram from "@ihsp/telegram"

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
