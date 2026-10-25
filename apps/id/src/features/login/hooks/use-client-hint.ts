import type { LoginInfo } from "@ihsp/api"
import { useQueryParam } from "../../shared/hooks/use-query-param"

/**
 * The backend redirect to the login form (`/v1/oauth/flow/login`) already knows which client asks and puts it in the
 * address (`client_id`, `client_name`), so the form is drawn at once, before the login request answers. The address
 * is attacker-chosen (`?client_name=Microsoft%20365` on the genuine origin), so the name from it is never shown: the
 * hint carries an empty `client_name` and the title names the client only once the server confirmed it.
 */
export function useClientHint(): LoginInfo | null {
  const clientId = useQueryParam("client_id")
  const clientName = useQueryParam("client_name")
  if (!clientId || !clientName) return null
  return {
    client_id: clientId,
    client_name: "",
    skip: false,
    requires_second_factor: false,
    redirect_to: null,
  }
}
