/**
 * The single source of every brand name of the web apps. A rebrand edits this file, the logo files under
 * `apps/<app>/public/icons/` and the colour block in `packages/ui/src/styles/brand.css`; nothing else.
 *
 * - Messages use the placeholders of `BRAND_MESSAGE_VALUES` (`{brand}`, `{appMy}` ...); `@ihsp/i18n` fills them when it loads messages.
 * - Layouts and the service worker import `BRAND` directly (this module has no React, so it is safe everywhere).
 * - `packages/config/scripts/generate-brand-assets.ts` writes the web manifests and offline pages at build.
 * - `src/__tests__/brand-literals.test.ts` fails on brand strings anywhere else.
 */

const name = "IHT"
const orgName = "International House Tashkent"
/** The splash screen and title bar of the student, course and library apps: the navy of the logo. */
const manifestBrandColor = "#273D88"
/** The same for the teacher and admin apps. */
const manifestPlainColor = "#ffffff"

export const BRAND = {
  /** Short platform name in running text ("your IHT account"). */
  name,
  /** The school's full name. */
  orgName,
  /** The familiar name of the school. */
  orgAlias: "Interhouse",
  /** Address of the library printed in the sign-up text. */
  libraryHost: "lib.ihsu.uz",
  apps: {
    id: { name: `${name} ID` },
    sp: {
      name: "my.iht",
      pwaName: `My ${name}`,
      manifestDescription: `Calendar, grades, homework and study tools of ${orgName}.`,
      manifestColor: manifestBrandColor,
    },
    staff: {
      name: `${name} Учителям`,
      pwaName: `${name} Учителям`,
      manifestDescription: `Lessons, attendance and journal for teachers of ${orgName}.`,
      manifestColor: manifestPlainColor,
    },
    admin: {
      name: "admin.iht",
      pwaName: "admin.iht",
      manifestDescription: `Administration of people, timetable and communication of ${orgName}.`,
      manifestColor: manifestPlainColor,
    },
    lms: {
      name: "lms.iht",
      pwaName: `${name} Courses`,
      manifestDescription: `Courses, tests and the course editor of ${orgName}.`,
      manifestColor: manifestBrandColor,
    },
    library: {
      name: "library.iht",
      pwaName: `${name} Books`,
      manifestDescription: `Books, textbooks and study materials of ${orgName}.`,
      manifestColor: manifestBrandColor,
    },
    share: { name: `${name} shares` },
  },
  /** Paths under each app's `public/` (the files themselves are per app). */
  logos: { svg: "/icons/logo.svg", png64: "/icons/logo-64.png" },
  /** The campus photo of the split sign-in layout (`/campus.webp` of the id app) and its attribution. */
  campusPhoto: {
    credit: "© RASH.IHT, CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:International_House-Tashkent_academic_lyceum_Under_TIIAME_National_Research_University.jpg",
  },
  repositories: {
    web: "https://github.com/interhousedev/ihsp-web",
    backend: "https://github.com/interhousedev/ihsp-backend",
  },
  /** Colours that cannot be CSS variables: browser bars and manifests. Page colours live in `brand.css`. */
  colors: {
    /** Browser bar around the installed app (the light and dark `--background` of the theme). */
    pwaLight: "#ffffff",
    pwaDark: "#0a0a0a",
    landingBarLight: "#ffffff",
    landingBarDark: "#0d1430",
  },
} as const

/** The apps with an installable manifest. */
export const BRAND_PWA_APPS = ["sp", "staff", "admin", "lms", "library"] as const

/** Every placeholder a message may use for a brand name. */
export const BRAND_MESSAGE_VALUES = {
  brand: BRAND.name,
  orgName: BRAND.orgName,
  orgAlias: BRAND.orgAlias,
  libraryHost: BRAND.libraryHost,
  appId: BRAND.apps.id.name,
  appMy: BRAND.apps.sp.name,
  appMyPwa: BRAND.apps.sp.pwaName,
  appStaff: BRAND.apps.staff.name,
  appAdmin: BRAND.apps.admin.name,
  appLms: BRAND.apps.lms.name,
  appLibrary: BRAND.apps.library.name,
  appShare: BRAND.apps.share.name,
} as const

const PLACEHOLDER = new RegExp(`\\{(${Object.keys(BRAND_MESSAGE_VALUES).join("|")})\\}`, "g")

/** Fills the brand placeholders of one message; other ICU arguments stay. A brand's `'` is escaped for ICU. */
export function fillBrand(message: string): string {
  return message.replace(PLACEHOLDER, (_, key: keyof typeof BRAND_MESSAGE_VALUES) =>
    BRAND_MESSAGE_VALUES[key].replace(/'/g, "''"),
  )
}
