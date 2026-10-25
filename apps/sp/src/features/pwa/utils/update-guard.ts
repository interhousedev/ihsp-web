// Moved to `@ihsp/features-core/pwa` (every installable app shares it); the student app's imports keep working.
export {
  FORCE_RELOAD_COOLDOWN_MS,
  VERSION_CHECK_INTERVAL_MS,
  VERSION_CHECK_MIN_INTERVAL_MS,
  mayForceReload,
  readForcedReload,
  shouldCheckVersion,
  writeForcedReload,
  type ForcedReload,
} from "@ihsp/features-core/pwa"
