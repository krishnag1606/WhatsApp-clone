import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// AES-256-GCM at-rest encryption for message content.
// This protects against DB theft, NOT end-to-end: the server holds the key,
// encrypts on write and decrypts on read so moderation/polls/search still work.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM
const TAG_LENGTH = 16; // 128-bit GCM authentication tag
const KEY_LENGTH = 32; // AES-256

// Accept the key as 64-char hex or 44-char base64; must decode to 32 bytes.
const loadKey = () => {
  const raw = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32"
    );
  }
  let key;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `MESSAGE_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}). Use a 32-byte hex or base64 key.`
    );
  }
  return key;
};

// Resolved lazily on first use so importing this module doesn't crash boot
// if the env isn't loaded yet; cached after the first successful load.
let cachedKey = null;
const getKey = () => {
  if (!cachedKey) cachedKey = loadKey();
  return cachedKey;
};

// encrypt(plaintext) -> { ciphertext, iv, tag } (all base64 strings)
export const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
};

// decrypt({ ciphertext, iv, tag }) -> plaintext. Throws if the envelope is
// malformed or if the auth tag fails (tampered/corrupt data); callers should
// treat any throw as an integrity error. The shape/length checks reject
// truncated or non-GCM input before it reaches OpenSSL so failures are clear.
export const decrypt = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("decrypt: missing encryption envelope");
  }
  const { ciphertext, iv, tag } = payload;
  if (
    typeof ciphertext !== "string" ||
    typeof iv !== "string" ||
    typeof tag !== "string"
  ) {
    throw new Error("decrypt: ciphertext, iv and tag must all be strings");
  }

  const ivBuf = Buffer.from(iv, "base64");
  const tagBuf = Buffer.from(tag, "base64");
  const dataBuf = Buffer.from(ciphertext, "base64");
  if (ivBuf.length !== IV_LENGTH) {
    throw new Error(`decrypt: iv must be ${IV_LENGTH} bytes`);
  }
  if (tagBuf.length !== TAG_LENGTH) {
    throw new Error(`decrypt: auth tag must be ${TAG_LENGTH} bytes`);
  }
  if (dataBuf.length === 0) {
    throw new Error("decrypt: ciphertext is empty");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), ivBuf);
  decipher.setAuthTag(tagBuf);
  const plaintext = Buffer.concat([decipher.update(dataBuf), decipher.final()]);
  return plaintext.toString("utf8");
};
