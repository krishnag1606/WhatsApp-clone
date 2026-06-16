import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// The socket server reuses the REST server's models + crypto/jwt helpers, which
// require the SAME secrets (JWT_SECRET, MESSAGE_ENCRYPTION_KEY) and DB creds.
// Rather than duplicate a .env, we load server/.env into process.env here.
//
// This must run BEFORE any module that calls dotenv.config()/reads process.env
// at import time (crypto.js, jwt.js, db.js). Static imports evaluate in order,
// so this file is imported first in index.js. It is dependency-free (plain fs)
// so the socket package needs nothing beyond socket.io.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../server/.env");

const parseEnv = (contents) => {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding single/double quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Don't clobber anything already provided by the real environment.
    if (process.env[key] === undefined) process.env[key] = value;
  }
};

try {
  parseEnv(fs.readFileSync(ENV_PATH, "utf8"));
  console.log(`🔐 Loaded environment from ${ENV_PATH}`);
} catch (error) {
  console.warn(
    `⚠️  Could not read ${ENV_PATH} (${error.code}). Relying on the ambient environment for JWT_SECRET / MESSAGE_ENCRYPTION_KEY / DB creds.`
  );
}
