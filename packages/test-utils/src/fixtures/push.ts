import type { PushConfig } from "@ihsp/api"

/** A real-looking VAPID public key (65-byte P-256 point, base64url) for tests. */
export const pushPublicKey = "BF-9bFMfqAmQ6TYgBFjiw6BHjB3d6nyMeSywyUqzS77qWp3V-4IJIN3SoSVtwUwXPYwZIi8IkIOHR1tYM88DUxk"

export const pushConfig: PushConfig = { enabled: true, vapid_public_key: pushPublicKey }
