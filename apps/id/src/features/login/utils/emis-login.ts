import { withChallenge } from "../../shared/utils/challenge"

/** Query parameter that prefills the EMIS login on `/register/` and shows the "this looks like an EMIS login" notice. */
export const EMIS_LOGIN_PARAM = "emis_login"

/**
 * EMIS logins are digits only (the backend has no stricter rule), so an all-digit login typed into the IHT ID login
 * form is probably an EMIS login of someone who has no IHT ID yet.
 */
export function isEmisLogin(login: string): boolean {
  return /^\d+$/.test(login.trim())
}

/**
 * `/register/` with the Hydra challenge (so the flow returns to the app) and the entered EMIS login. The password is
 * never put in the address: the registration form asks for it again.
 */
export function emisRegisterHref(challenge: string, login: string): string {
  const base = withChallenge("/register/", "login_challenge", challenge)
  return `${base}${base.includes("?") ? "&" : "?"}${EMIS_LOGIN_PARAM}=${encodeURIComponent(login.trim())}`
}
