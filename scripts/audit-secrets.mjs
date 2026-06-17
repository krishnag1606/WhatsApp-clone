#!/usr/bin/env node
/**
 * Phase 8 — secret-hygiene audit.
 *
 * Fails (exit 1) if any real .env file is tracked, or if a JWT_SECRET /
 * MESSAGE_ENCRYPTION_KEY value appears to have been committed anywhere in
 * the git history. Safe to run in CI or a pre-push hook.
 *
 *   node scripts/audit-secrets.mjs
 */
import { execSync } from "node:child_process";

const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const SECRET_VARS = ["JWT_SECRET", "MESSAGE_ENCRYPTION_KEY", "DB_PASSWORD"];

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

// 1) No real .env files tracked (only *.example allowed).
console.log("\n[1] Tracked .env files");
const trackedEnv = sh("git ls-files")
  .split("\n")
  .filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".example"));
if (trackedEnv.length) {
  trackedEnv.forEach((f) => fail(`tracked: ${f}  ->  git rm --cached "${f}"`));
} else {
  ok("no real .env files are tracked (only .example)");
}

// 2) The live .env files are actually ignored.
console.log("\n[2] .gitignore coverage");
for (const f of ["server/.env", "apps/client-ui/.env", "socket/.env"]) {
  try {
    sh(`git check-ignore "${f}"`);
    ok(`${f} is ignored`);
  } catch {
    fail(`${f} is NOT ignored — add it to .gitignore`);
  }
}

// 3) No secret VALUES committed across all history.
//    We look for `VAR=<value>` where the value is not an obvious placeholder.
console.log("\n[3] Secret values in git history (all branches)");
const revs = sh("git rev-list --all").split("\n").filter(Boolean);
const placeholder = /your|placeholder|example|change.?me|<|rand|here/i;
let leakFound = false;
for (const v of SECRET_VARS) {
  let hits = "";
  try {
    // -I skips binary; search every reachable commit.
    hits = execSync(`git grep -nIE "${v}\\s*=\\s*\\S+" ${revs.join(" ")}`, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    hits = ""; // git grep exits 1 when there are no matches
  }
  const real = hits
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      const val = line.split(/=\s*/).slice(1).join("=");
      return val && !placeholder.test(val);
    });
  if (real.length) {
    leakFound = true;
    real.slice(0, 10).forEach((l) => fail(`possible ${v} leak: ${l}`));
  }
}
if (!leakFound) ok("no committed secret values found for " + SECRET_VARS.join(", "));

console.log(
  failed
    ? "\n❌ Secret audit FAILED — see above. (If history is dirty, scrub with git-filter-repo and rotate the key.)\n"
    : "\n✅ Secret audit passed.\n"
);
process.exit(failed ? 1 : 0);
