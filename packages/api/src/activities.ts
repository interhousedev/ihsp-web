// Typed wrappers over `/v1/activities/*`, `/v1/admin/activities/*` and `/v1/public/clubs*`: path, method, path
// parameters, query, body and response are all derived from the generated openapi `paths`.

import { api } from "./client"
import type { CallOptions } from "./client"
import type { paths } from "./generated/openapi"

type ActivitiesPath = Extract<keyof paths, `/v1/activities/${string}` | `/v1/admin/activities/${string}` | `/v1/public/clubs${string}`>
type Method = "get" | "post" | "put" | "patch" | "delete"
type MethodsOf<P extends ActivitiesPath> = { [M in Method]: paths[P][M] extends undefined | never ? never : M }[Method]
type Operation<P extends ActivitiesPath, M extends Method> = NonNullable<paths[P][M]>

type PathParams<O> = O extends { parameters: { path: infer T } } ? (T extends Record<string, unknown> ? T : never) : never
type QueryOf<O> = O extends { parameters: { query?: infer Q } } ? Exclude<Q, undefined | never> : never
type BodyOf<O> = O extends { requestBody: { content: { "application/json": infer B } } } ? B : never
type ResponseOf<O> = O extends { responses: infer R }
  ? R extends { 200: { content: { "application/json": infer T } } }
    ? T
    : R extends { 201: { content: { "application/json": infer T } } }
      ? T
      : void
  : void

type Args<O> = ([PathParams<O>] extends [never] ? { path?: never } : { path: PathParams<O> }) &
  ([QueryOf<O>] extends [never] ? { query?: never } : { query?: QueryOf<O> }) &
  ([BodyOf<O>] extends [never] ? { body?: never } : { body: BodyOf<O> })

function fill(path: string, params: Record<string, unknown> | undefined): string {
  return path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(String(params?.[key])))
}

/** One typed call; `activities.get("/v1/activities/clubs/{club_id}", { path: { club_id } })`. */
function call<M extends Method>(method: M) {
  return async <P extends ActivitiesPath>(
    path: M extends MethodsOf<P> ? P : never,
    args: Args<Operation<P, M>> = {} as Args<Operation<P, M>>,
    options?: CallOptions,
  ): Promise<ResponseOf<Operation<P, M>>> => {
    const { path: params, query, body } = args as { path?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown }
    return api.request({
      method: method.toUpperCase() as "GET",
      path: fill(path as string, params),
      query: query as never,
      body,
      ...options,
    })
  }
}

export const activities = {
  get: call("get"),
  post: call("post"),
  put: call("put"),
  patch: call("patch"),
  delete: call("delete"),
}

export type ActivitiesRoute = ActivitiesPath
