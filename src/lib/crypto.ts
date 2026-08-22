import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { sha512 } from "@noble/hashes/sha2";
import * as ed from "@noble/ed25519";

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomSecret(): string {
  return `ac_sk_${randomBytes(24).toString("base64url")}`;
}

export function hashSecret(secret: string): string {
  return sha256Hex(secret);
}

export function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function thumbprint(publicKeyB64: string): string {
  return createHash("sha256").update(publicKeyB64).digest("base64url");
}

function toBytes(b64url: string): Uint8Array | null {
  try {
    return new Uint8Array(Buffer.from(b64url, "base64url"));
  } catch {
    return null;
  }
}

export async function verifyKeyBind(
  handle: string,
  publicKey: string,
  signature: string
): Promise<boolean> {
  const pub = toBytes(publicKey);
  const sig = toBytes(signature);
  if (!pub || pub.length !== 32 || !sig || sig.length !== 64) return false;
  const msg = new TextEncoder().encode(`commons.key-bind.v1:${handle}:${publicKey}`);
  try {
    return await ed.verifyAsync(sig, msg, pub);
  } catch {
    return false;
  }
}
