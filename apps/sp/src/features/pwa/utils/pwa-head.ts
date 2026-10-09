// Moved to `@ihsp/features-core/pwa/head` (every installable app shares it, and a server layout can import it without the
// React side of the package); the student app's imports keep working.
export {
  APPLE_TOUCH_ICON_PATH,
  INSTALL_PROMPT_EVENT,
  INSTALL_PROMPT_GLOBAL,
  MANIFEST_PATH,
  PWA_HEAD_SCRIPT,
  PWA_THEME_COLOR_DARK,
  PWA_THEME_COLOR_LIGHT,
} from "@ihsp/features-core/pwa/head"
