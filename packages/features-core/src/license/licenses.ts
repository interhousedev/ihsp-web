/** One open source package the web apps or the backend use (see `scripts/generate-licenses.ts`). */
export type LicensedPackage = {
  name: string
  version: string
  license: string
  url: string
  ecosystem: "npm" | "PyPI"
}

/**
 * The generated list, loaded when someone opens it: it is a separate chunk, so the first load of a settings page
 * does not pay for it. The promise is kept, so a second open does not fetch it again.
 */
let loaded: Promise<readonly LicensedPackage[]> | undefined

export function loadLicensedPackages(): Promise<readonly LicensedPackage[]> {
  loaded ??= import("./generated/licenses.json").then(
    (module) => module.default.packages as LicensedPackage[],
    (error: unknown) => {
      loaded = undefined
      throw error
    },
  )
  return loaded
}
