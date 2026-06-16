import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// AES-256-GCM at-rest encryption for message content.
// This protects against DB theft, NOT end-to-end: the server holds the key,
// encrypts on write and decrypts on read so moderation/polls/search still work.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM
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

// decrypt({ ciphertext, iv, tag }) -> plaintext. Throws if the tag fails
// (tampered/corrupt data), which callers should treat as an integrity error.
export const decrypt = ({ ciphertext, iv, tag }) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
};
