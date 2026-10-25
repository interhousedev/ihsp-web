// Login cues: staff keep a list of names per group; registrants pick their name instead of typing the EMIS login.
// Contract from the backend (`/v1/admin/login-cues*`, `/v1/id/login-cues/*`, `/v1/id/register/emis/cue`).

/** One cue as staff see it. The numeric EMIS login is only ever returned masked. */
export type LoginCueResponse = {
  id: string
  full_name: string
  group_id: string
  group_name: string
  login_masked: string
  created_at: string
  /** Set once a registration used this cue. */
  consumed_at: string | null
}

export type LoginCuesParams = { group_id?: string }

/** POST /v1/admin/login-cues. `emis_login` is digits only. */
export type LoginCueBody = { emis_login: string; full_name: string; group_id: string }

/** POST /v1/admin/login-cues/bulk; 1 to 500 items, all or nothing. */
export type LoginCueBulkBody = { items: LoginCueBody[] }
export type LoginCueBulkResponse = { created: LoginCueResponse[] }

/** Public: a group a registrant can pick from. */
export type LoginCueGroup = { group_id: string; name: string }

/** Public: a name in a group. The login is never sent. */
export type LoginCueName = { cue_id: string; display_name: string }

/** POST /v1/id/register/emis/cue: the picked cue and the EMIS password; returns the same start as /v1/id/register/emis. */
export type RegisterCueBody = { cue_id: string; emis_password: string }
