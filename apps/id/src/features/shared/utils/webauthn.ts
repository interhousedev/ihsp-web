// Passkeys with the native navigator.credentials API: the backend sends WebAuthn options as JSON (base64url
// binary fields) and expects the browser's answer in the same JSON shape (RegistrationResponseJSON /
// AuthenticationResponseJSON).

type Json = Record<string, unknown>

export function base64urlToBuffer(value: string): ArrayBuffer {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=")
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export function bufferToBase64url(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

type Descriptor = { id: string; type?: string; transports?: string[] }

function descriptors(list: unknown): PublicKeyCredentialDescriptor[] {
  if (!Array.isArray(list)) return []
  return (list as Descriptor[]).map((item) => ({
    type: "public-key",
    id: base64urlToBuffer(item.id),
    ...(item.transports ? { transports: item.transports as AuthenticatorTransport[] } : {}),
  }))
}

/** True when this browser can create and use passkeys. */
export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function" && !!navigator.credentials
}

/** True when the browser can offer passkeys in the login field's autofill (conditional mediation). */
export async function conditionalMediationSupported(): Promise<boolean> {
  if (!passkeysSupported()) return false
  const check = (window.PublicKeyCredential as { isConditionalMediationAvailable?: () => Promise<boolean> })
    .isConditionalMediationAvailable
  if (typeof check !== "function") return false
  try {
    return await check.call(window.PublicKeyCredential)
  } catch {
    return false
  }
}

export function toCreationOptions(json: Json): PublicKeyCredentialCreationOptions {
  const user = json.user as { id: string; name: string; displayName: string }
  return {
    ...(json as unknown as PublicKeyCredentialCreationOptions),
    challenge: base64urlToBuffer(json.challenge as string),
    user: { ...user, id: base64urlToBuffer(user.id) },
    excludeCredentials: descriptors(json.excludeCredentials),
  }
}

export function toRequestOptions(json: Json): PublicKeyCredentialRequestOptions {
  return {
    ...(json as unknown as PublicKeyCredentialRequestOptions),
    challenge: base64urlToBuffer(json.challenge as string),
    allowCredentials: descriptors(json.allowCredentials),
  }
}

/** The credential in the JSON shape py_webauthn verifies. */
export function credentialToJson(credential: PublicKeyCredential): Json {
  const response = credential.response as AuthenticatorAttestationResponse & AuthenticatorAssertionResponse
  const out: Json = {
    clientDataJSON: bufferToBase64url(response.clientDataJSON),
  }
  if ("attestationObject" in response && response.attestationObject) {
    out.attestationObject = bufferToBase64url(response.attestationObject)
    out.transports = typeof response.getTransports === "function" ? response.getTransports() : []
  }
  if ("authenticatorData" in response && response.authenticatorData) {
    out.authenticatorData = bufferToBase64url(response.authenticatorData)
    out.signature = bufferToBase64url(response.signature)
    if (response.userHandle) out.userHandle = bufferToBase64url(response.userHandle)
  }
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: out,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
  }
}

/** navigator.credentials.create with backend options; null when the user cancelled. */
export async function createPasskey(options: Json): Promise<Json | null> {
  const credential = await navigator.credentials.create({ publicKey: toCreationOptions(options) })
  return credential ? credentialToJson(credential as PublicKeyCredential) : null
}

/** navigator.credentials.get with backend options (optionally as conditional UI); null when nothing was chosen. */
export async function getPasskey(
  options: Json,
  { conditional = false, signal }: { conditional?: boolean; signal?: AbortSignal } = {},
): Promise<Json | null> {
  const credential = await navigator.credentials.get({
    publicKey: toRequestOptions(options),
    ...(conditional ? { mediation: "conditional" as CredentialMediationRequirement } : {}),
    ...(signal ? { signal } : {}),
  })
  return credential ? credentialToJson(credential as PublicKeyCredential) : null
}

/** A user cancel or timeout (NotAllowedError) or an aborted conditional request: not worth an error message. */
export function isPasskeyCancel(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "AbortError")
}
