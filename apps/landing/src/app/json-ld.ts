import { BRAND } from "@ihsp/config/brand"
import { DESCRIPTION } from "./site-meta"

/** schema.org description of the school, rendered once in the landing's head. */
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: BRAND.orgName,
  alternateName: BRAND.orgAlias,
  description: DESCRIPTION,
  knowsLanguage: ["uz", "ru", "en"],
  url: `https://${BRAND.landingHost}/`,
  logo: `https://${BRAND.landingHost}${BRAND.logos.png64}`,
  sameAs: ["https://t.me/ihspbot"],
}
