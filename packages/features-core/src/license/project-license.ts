import { BRAND } from "@ihsp/config/brand"

/** The license of the IHSP source code (see LICENSE in each repository). */
export const PROJECT_LICENSE = "AGPL-3.0-only"

/** The public repositories of the web apps and the backend: the AGPL-3.0 section 13 source offer. */
export const SOURCE_CODE_WEB_URL = BRAND.repositories.web
export const SOURCE_CODE_BACKEND_URL = BRAND.repositories.backend

/** The page with the open source packages, served by every app that shows the license (its `app/licenses` route). */
export const LICENSE_PACKAGES_PATH = "/licenses/"
