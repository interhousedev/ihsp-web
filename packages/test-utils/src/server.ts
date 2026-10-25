import { setupServer } from "msw/node"
import { allHandlers } from "./handlers"

/** The MSW server started by `preload.ts`; use `server.use(...)` in a test to override a handler (reset after each test). */
export const server = setupServer(...allHandlers)
