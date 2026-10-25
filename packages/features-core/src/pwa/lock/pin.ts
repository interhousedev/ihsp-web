import { DEFAULT_RELOCK, isRelockOption, type RelockOption } from "./lock-policy"

/**
 * The app lock (optional PIN of the installed app) as pure functions: validation, PBKDF2 hashing with a random salt,
 * verification, and the count of wrong tries. Only the salted hash is ever stored, never the PIN. A PIN is a short
 * secret: the hash protects against reading it out of storage by accident, the five-try limit protects against guessing,
 * and the lock is a screen lock for the phone in a pocket, not a replacement for the account password.
 */

export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 6

/** Wrong tries before the user is signed out and the PIN is removed. */
export const PIN_MAX_ATTEMPTS = 5

/** PBKDF2-SHA-256 rounds; about a tenth of a second on a phone. Stored with the hash, so it can be raised later. */
export const PIN_ITERATIONS = 200_000

const SALT_BYTES = 16
const HASH_BITS = 256

/** What is stored per user: the salted hash and what is needed to check a try. */
export type PinRecord = {
  version: 1
  /** Base64 of the random salt. */
  salt: string
  /** Base64 of the PBKDF2 output. */
  hash: string
  iterations: number
  /** Number of digits, so the lock screen can submit by itself and draw the right number of dots. */
  length: number
  /** Wrong tries since the last right one; kept in storage so that reloading the page does not reset it. */
  failed: number
  /** How long the app may stay in the background before it asks for the PIN again. */
  relock: RelockOption
}

/** 4 to 6 digits, nothing else. */
export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`).test(pin)
}

function toBase64(bytes: Uint8Array): string {
  let text = ""
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text)
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const subtle = globalThis.crypto.subtle
  const key = await subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"])
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    HASH_BITS,
  )
  return new Uint8Array(bits)
}

/** The comparison takes the same time wherever the first difference is. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0)
  return difference === 0
}

/** Hashes a new PIN with a fresh random salt. Throws for a PIN that is not 4 to 6 digits. */
export async function createPinRecord(
  pin: string,
  iterations: number = PIN_ITERATIONS,
  relock: RelockOption = DEFAULT_RELOCK,
): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new RangeError(`the PIN must be ${PIN_MIN_LENGTH} to ${PIN_MAX_LENGTH} digits`)
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(pin, salt, iterations)
  return { version: 1, salt: toBase64(salt), hash: toBase64(hash), iterations, length: pin.length, failed: 0, relock }
}

/** True when `pin` is the one the record was made from. */
export async function verifyPin(record: PinRecord, pin: string): Promise<boolean> {
  if (!isValidPin(pin)) return false
  const hash = await derive(pin, fromBase64(record.salt), record.iterations)
  return sameBytes(hash, fromBase64(record.hash))
}

/** What happens after a wrong try: the new record (with the count stored) and how many tries remain. */
export type WrongPinResult = { record: PinRecord; attemptsLeft: number; lockedOut: boolean }

export function registerWrongPin(record: PinRecord, maxAttempts: number = PIN_MAX_ATTEMPTS): WrongPinResult {
  const failed = record.failed + 1
  const attemptsLeft = Math.max(0, maxAttempts - failed)
  return { record: { ...record, failed }, attemptsLeft, lockedOut: attemptsLeft === 0 }
}

/** The same PIN with another "ask again" delay. */
export function withRelock(record: PinRecord, relock: RelockOption): PinRecord {
  return record.relock === relock ? record : { ...record, relock }
}

/** A right try clears the count. */
export function registerRightPin(record: PinRecord): PinRecord {
  return record.failed === 0 ? record : { ...record, failed: 0 }
}

/** Tries left before sign-out; zero for a record that has already used them all. */
export function attemptsLeft(record: PinRecord, maxAttempts: number = PIN_MAX_ATTEMPTS): number {
  return Math.max(0, maxAttempts - record.failed)
}

/** The record from its stored text, or `null` when it is missing or damaged (then there is no lock). */
export function parsePinRecord(raw: string | null): PinRecord | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== "object" || value === null) return null
    const { version, salt, hash, iterations, length, failed, relock } = value as Partial<PinRecord>
    const valid =
      version === 1 &&
      typeof salt === "string" &&
      typeof hash === "string" &&
      Number.isInteger(iterations) &&
      (iterations as number) > 0 &&
      Number.isInteger(length) &&
      (length as number) >= PIN_MIN_LENGTH &&
      (length as number) <= PIN_MAX_LENGTH &&
      Number.isInteger(failed) &&
      (failed as number) >= 0
    // A record written before the delay was a setting has none: it keeps the default.
    return valid ? { ...(value as PinRecord), relock: isRelockOption(relock) ? relock : DEFAULT_RELOCK } : null
  } catch {
    return null
  }
}
