// Installable apps (`APP_MODE=pwa`), shared by every app that can be installed: the service worker side is in `./sw` (no
// React, importable from a worker bundle), the head script in `./utils/pwa-head` (importable from a server layout).
export { PwaRuntime } from "./components/pwa-runtime"
export { UpdateWatcher } from "./components/update-watcher"
export { ForcedUpdateScreen } from "./components/forced-update-screen"
export { useApplyUpdate, type ApplyUpdateOptions } from "./hooks/use-apply-update"
export { useInstallAppMenuItem } from "./hooks/use-install-app-menu-item"
export { useInstallMenuItem } from "./hooks/use-install-menu-item"
export {
  isInstallPromptEvent,
  useInstallPrompt,
  type InstallOutcome,
  type InstallPromptEvent,
} from "./hooks/use-install-prompt"
export { useServiceWorker, type ServiceWorkerOptions } from "./hooks/use-service-worker"
export { useVersionCheck, type VersionCheck } from "./hooks/use-version-check"
export { getAppVersion } from "./api/get-app-version"
export { installAppUrl, isPwaMode } from "./utils/app-mode"
export { pwaAppId } from "./utils/app-id"
export {
  APP_VERSION,
  compareVersions,
  decideUpdate,
  parseVersion,
  type AppVersionInfo,
  type UpdateDecision,
} from "./utils/app-version"
export {
  INSTALL_WAIT_MS,
  applyUpdate,
  purgeShellCaches,
  waitForWaitingWorker,
  type UpdateDeps,
} from "./utils/apply-update"
export { readPageEnvironment, type PageEnvironment } from "./utils/page-environment"
export {
  detectPlatform,
  isInAppBrowser,
  isStandaloneDisplay,
  type DisplayEnv,
  type NavigatorSnapshot,
  type Platform,
} from "./utils/platform"
export { postToWorker } from "./utils/post-to-worker"
export {
  APPLE_TOUCH_ICON_PATH,
  INSTALL_PROMPT_EVENT,
  INSTALL_PROMPT_GLOBAL,
  MANIFEST_PATH,
  PWA_HEAD_SCRIPT,
  PWA_THEME_COLOR_DARK,
  PWA_THEME_COLOR_LIGHT,
  createPwaHeadScript,
} from "./utils/pwa-head"
export {
  SERVICE_WORKER_PATH,
  registerServiceWorker,
  serviceWorkerUrl,
  type RegisterOptions,
} from "./utils/register-service-worker"
export {
  getServiceWorkerRegistration,
  resetServiceWorkerRegistration,
  trackServiceWorkerRegistration,
} from "./utils/service-worker-registration"
export {
  FORCE_RELOAD_COOLDOWN_MS,
  VERSION_CHECK_INTERVAL_MS,
  VERSION_CHECK_MIN_INTERVAL_MS,
  mayForceReload,
  readForcedReload,
  shouldCheckVersion,
  writeForcedReload,
  type ForcedReload,
} from "./utils/update-guard"
export * from "./sw"
export * from "./lock"
