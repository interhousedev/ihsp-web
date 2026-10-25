import type { LoginCueGroup, LoginCueName, LoginCueResponse } from "@ihsp/api"
import { uuid } from "./world"

export const loginCueGroups: LoginCueGroup[] = [
  { group_id: uuid(101, 1), name: "2TN2" },
  { group_id: uuid(101, 2), name: "3TN1" },
]

/** Staff view: the numeric EMIS login is only ever masked. */
export const loginCues: LoginCueResponse[] = [
  {
    id: uuid(102, 1),
    full_name: "Brastilov Aleksey",
    group_id: uuid(101, 1),
    group_name: "2TN2",
    login_masked: "•••••4821",
    created_at: "2026-10-01T04:00:00Z",
    consumed_at: null,
  },
  {
    id: uuid(102, 2),
    full_name: "Kalandarova Gavxar",
    group_id: uuid(101, 1),
    group_name: "2TN2",
    login_masked: "•••••9034",
    created_at: "2026-10-01T04:00:00Z",
    consumed_at: "2026-10-03T06:12:00Z",
  },
]

/** Public: names a registrant can pick, per group. The login is never sent. */
export const loginCueNames: Record<string, LoginCueName[]> = {
  [uuid(101, 1)]: [
    { cue_id: uuid(102, 1), display_name: "Brastilov Aleksey" },
    { cue_id: uuid(102, 2), display_name: "Kalandarova Gavxar" },
  ],
  [uuid(101, 2)]: [{ cue_id: uuid(102, 3), display_name: "Ismoilov Jasur" }],
}
