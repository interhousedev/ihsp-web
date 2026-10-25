// Login cues: staff maintain the name list per group; the public registration path picks a name (no EMIS login shown).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type {
  LoginCueBody,
  LoginCueBulkBody,
  LoginCueBulkResponse,
  LoginCueGroup,
  LoginCueName,
  LoginCueResponse,
  LoginCuesParams,
  RegisterCueBody,
} from "../types/login-cues"
import type { RegistrationStart } from "../types/registration"

/** GET /v1/admin/login-cues — admin; every cue, or those of one group. */
export function getAdminLoginCues(params?: LoginCuesParams, opts?: RequestOptions): Promise<LoginCueResponse[]> {
  return api.get<LoginCueResponse[]>("/v1/admin/login-cues", { ...opts, query: params })
}
export const getAdminLoginCuesQuery = (params?: LoginCuesParams) =>
  queryOptions({
    queryKey: keys.admin.loginCues(params?.group_id),
    queryFn: ({ signal }) => getAdminLoginCues(params, { signal }),
  })

/** POST /v1/admin/login-cues — admin; one cue. */
export function postAdminLoginCue(body: LoginCueBody, opts?: RequestOptions): Promise<LoginCueResponse> {
  return api.post<LoginCueResponse>("/v1/admin/login-cues", body, opts)
}

/** POST /v1/admin/login-cues/bulk — admin; 1 to 500 cues, all or nothing. */
export function postAdminLoginCuesBulk(body: LoginCueBulkBody, opts?: RequestOptions): Promise<LoginCueBulkResponse> {
  return api.post<LoginCueBulkResponse>("/v1/admin/login-cues/bulk", body, opts)
}

/** DELETE /v1/admin/login-cues/{cue_id} — admin. */
export function deleteAdminLoginCue(cueId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/admin/login-cues/${seg(cueId)}`, opts)
}

/** GET /v1/id/login-cues/groups — none. */
export function getIdLoginCueGroups(opts?: RequestOptions): Promise<LoginCueGroup[]> {
  return api.get<LoginCueGroup[]>("/v1/id/login-cues/groups", { ...opts, auth: "none" })
}
export const getIdLoginCueGroupsQuery = () =>
  queryOptions({
    queryKey: keys.id.registrationGroups(),
    queryFn: ({ signal }) => getIdLoginCueGroups({ signal }),
  })

/** GET /v1/id/login-cues/groups/{group_id} — none; names a registrant can pick in a group. */
export function getIdLoginCueNames(groupId: string, opts?: RequestOptions): Promise<LoginCueName[]> {
  return api.get<LoginCueName[]>(`/v1/id/login-cues/groups/${seg(groupId)}`, { ...opts, auth: "none" })
}
export const getIdLoginCueNamesQuery = (groupId: string) =>
  queryOptions({
    queryKey: keys.id.registrationCues(groupId),
    queryFn: ({ signal }) => getIdLoginCueNames(groupId, { signal }),
  })

/** POST /v1/id/register/emis/cue — none; starts registration from a picked name and the EMIS password. */
export function postIdRegisterCue(body: RegisterCueBody, opts?: RequestOptions): Promise<RegistrationStart> {
  return api.post<RegistrationStart>("/v1/id/register/emis/cue", body, { ...opts, auth: "none" })
}
