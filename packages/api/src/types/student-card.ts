import type { components } from "../generated/openapi"

/** The signed-in student's card: name, group, course, lyceum, direction and speciality. */
export type StudentCard = components["schemas"]["StudentCardResponse"]
/** A short-lived token for the card's QR code; `refresh_in` is the seconds until a new one should be requested. */
export type StudentCardToken = components["schemas"]["StudentCardTokenResponse"]
