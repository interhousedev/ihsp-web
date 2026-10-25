import type { AppEnv } from "@ihsp/config"

/** `API_URL` of the test environment; every MSW handler matches this origin. */
export const TEST_API_URL = "http://localhost:8000"

/** Origin of the presigned upload URLs returned by the mocked `POST /v1/files`. */
export const TEST_STORAGE_URL = "http://localhost:9000"

/** Runtime configuration of the test environment (`window.__ENV__`). */
export const TEST_ENV: AppEnv = {
  APP_ENV: "test",
  API_URL: TEST_API_URL,
  ID_URL: "http://localhost:3001",
  HYDRA_URL: "http://localhost:4444",
  SP_URL: "http://localhost:3002",
  STAFF_URL: "http://localhost:3003",
  ADMIN_URL: "http://localhost:3004",
  LMS_URL: "http://localhost:3005",
  LIBRARY_URL: "http://localhost:3008",
  SHARE_URL: "http://localhost:3006",
  SHORT_LINKS_URL: "http://localhost:8000",
  ROOMS_URL: "http://localhost:8000",
  MCP_URL: "http://localhost:8000/mcp",
  BOT_USERNAME: "ihspbot",
  OAUTH_CLIENT_ID: "sp",
  APP_MODE: "sp",
  STORAGE_ORIGIN: TEST_STORAGE_URL,
  SECURITY_CONTACT: "alex@sayfi.uz, @megaplov (Telegram)",
}
