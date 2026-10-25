/** Query parameter that prefills the EMIS login on `/register/` and shows the "this looks like an EMIS login" notice. */
export const EMIS_LOGIN_PARAM = "emis_login"

/**
 * EMIS logins are digits only, so an all-digit identifier typed into the IHT ID login form is an EMIS login and is sent
 * as `emis_id`. Email and IHT logins are never sent that way.
 */
export function isEmisLogin(login: string): boolean {
  return /^\d+$/.test(login.trim())
}
