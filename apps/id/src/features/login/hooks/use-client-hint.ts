import type { LoginInfo } from "@ihsp/api"
import { useQueryParam } from "../../shared/hooks/use-query-param"

/**
 * The backend redirect to the login form (`/v1/oauth/flow/login`) already knows which client asks and puts it in the
 * address (`client_id`, `client_name`), so the form is drawn at once. The address only changes a title; the login
 * itself still goes through the challenge. Without both parameters (an old link) the page asks the server as before.
 */
export function useClientHint(): LoginInfo | null {
  const clientId = useQueryParam("client_id")
  const clientName = useQueryParam("client_name")
  if (!clientId || !clientName) return null
  return {
    client_id: clientId,
    client_name: clientName,
    skip: false,
    requires_second_factor: clientId === "admin",
    redirect_to: null,
  }
}
