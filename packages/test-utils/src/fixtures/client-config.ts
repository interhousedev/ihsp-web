import type { ClientConfig } from "@ihsp/api"

/** `GET /v1/public/client-config`: login cues off, both documentation links set. */
export const clientConfig: ClientConfig = {
  features: { login_cues: false },
  docs: {
    personal_tokens_url: "https://docs.iht.test/personal-tokens",
    entrance_devices_url: "https://docs.iht.test/entrance-devices",
  },
}
