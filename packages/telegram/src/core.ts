// `@ihsp/telegram/core`: the pieces that do not import `@tma.js` eagerly. Packages that run on every page (`@ihsp/auth`,
// `@ihsp/features-core`) import from here, so the Telegram SDK chunk is only loaded inside Telegram (by the apps'
// lazy `TelegramBridge`, or by `useBackButton` on demand).
export { getInitDataRaw, isMiniApp, launchParamsQuery } from "./launch-params"
export { themeParamsToCssVars, type TelegramThemeColors } from "./theme-vars"
export { useBackButton } from "./use-back-button"
