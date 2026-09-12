import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

// Session rows hold the user's OAuth access and refresh tokens. Stateless
// sessions get that protection from the encrypted cookie; once we move the data
// into Postgres we have to provide it ourselves, so anyone with read access to
// the table gets ciphertext rather than durable account access.
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function key(): Buffer {
  const secret = process.env.AUTH0_SECRET;

  if (!secret) {
    throw new Error("AUTH0_SECRET is not set — required to encrypt sessions");
  }

  // AUTH0_SECRET is a 64-char hex string; hash it to a fixed 32-byte key so any
  // secret length works.
  return createHash("sha256").update(secret).digest();
}

export function encryptSession(payload: unknown): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64url",
  );
}

export function decryptSession<T>(encoded: string): T | null {
  try {
    const raw = Buffer.from(encoded, "base64url");
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, key(), iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    return JSON.parse(plaintext) as T;
  } catch {
    // Tampered, truncated, or written under a rotated AUTH0_SECRET. Treat it as
    // no session rather than throwing on every request.
    return null;
  }
}
