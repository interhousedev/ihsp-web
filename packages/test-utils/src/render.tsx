import { configureApiClient, resetAuthState, setSession, type Session } from "@ihsp/auth"
import { I18nTestProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import enMessages from "@ihsp/i18n/messages/en.json"
import ruMessages from "@ihsp/i18n/messages/ru.json"
import uzMessages from "@ihsp/i18n/messages/uz.json"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"
import { render, type RenderResult } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactElement, ReactNode } from "react"
import { userMe } from "./fixtures/id"
import { setTestRoute } from "./router"

const SHARED_MESSAGES: Record<Locale, Messages> = { en: enMessages, ru: ruMessages, uz: uzMessages }

export type RenderWithProvidersOptions = {
  /** Current location, e.g. `/lessons/view/?id=l-1`; read by `usePathname`, `useSearchParams` and nuqs. */
  route?: string
  /**
   * The logged-in user. Default: the demo student (`userMe`). Pass `null` for an anonymous visitor, or
   * `{ user: teacherMe }` to log in as someone else.
   */
  session?: Partial<Session> | null
  /** Default `en`. */
  locale?: Locale
  /** The app's own messages (`import en from "../../messages/en.json"`), merged over the shared ones. */
  messages?: Messages
  /** Use your own client to inspect the cache; the default has retries off. */
  queryClient?: QueryClient
}

export type RenderWithProvidersResult = RenderResult & {
  user: UserEvent
  queryClient: QueryClient
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: 0 }, mutations: { retry: false } },
  })
}

/**
 * Renders with the providers every IHSP page needs: TanStack Query, i18n (shared messages in `en`), a fake session,
 * the nuqs testing adapter and a controllable `next/navigation` (`setTestRoute`, `testRouter`).
 * The API client is wired to the fake session, so requests carry its token and hit the MSW handlers.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const { route = "/", session, locale = "en", messages, queryClient = createTestQueryClient() } = options

  setTestRoute(route)
  const url = new URL(route, "http://localhost:3000")

  resetAuthState()
  configureApiClient()
  if (session !== null) {
    setSession({
      access_token: "test-access-token",
      expires_at: Date.now() + 15 * 60_000,
      user: userMe,
      ...session,
    })
  } else {
    setSession(null)
  }

  const allMessages = messages ? mergeMessages(SHARED_MESSAGES[locale], messages) : SHARED_MESSAGES[locale]

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nTestProvider locale={locale} messages={allMessages}>
          <NuqsTestingAdapter searchParams={url.search} hasMemory>
            {children}
          </NuqsTestingAdapter>
        </I18nTestProvider>
      </QueryClientProvider>
    )
  }

  const result = render(ui, { wrapper: Wrapper })
  return Object.assign(result, { user: userEvent.setup(), queryClient })
}

// Testing Library's jest-dom matchers (`toBeInTheDocument`, `toHaveAttribute`, ...) are registered by `preload.ts`;
// this makes `bun:test`'s `expect` know their types in every test file that imports from `@ihsp/test-utils`.
declare module "bun:test" {
  interface Matchers<T> extends TestingLibraryMatchers<unknown, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers<unknown, unknown> {}
}
