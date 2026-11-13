import { HttpResponse, http } from "msw"
import { clientConfig } from "../fixtures/client-config"
import { apiUrl } from "./utils"

export const clientConfigHandlers = [
  http.get(apiUrl("/v1/public/client-config"), () => HttpResponse.json(clientConfig)),
]
