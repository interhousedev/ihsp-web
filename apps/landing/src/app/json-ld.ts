import { BRAND } from "@ihsp/config/brand"

/** schema.org description of the school, rendered once in the landing's head. */
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: BRAND.orgName,
  alternateName: BRAND.orgAlias,
  url: `https://${BRAND.landingHost}/`,
  logo: `https://${BRAND.landingHost}${BRAND.logos.png64}`,
  sameAs: ["https://t.me/ihspbot"],
}
