#!/usr/bin/env node
/**
 * Vérifie les dépendances critiques avant/après repair (logs debug session).
 */
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7666/ingest/e918e765-2abe-4396-a005-3384e08a0bdb";
const SESSION_ID = "189c71";

function log(hypothesisId, message, data, runId = "verify") {
  const payload = {
    sessionId: SESSION_ID,
    hypothesisId,
    location: "scripts/verify-deps.mjs",
    message,
    data,
    timestamp: Date.now(),
    runId,
  };
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
  console.log(JSON.stringify(payload));
}

const checks = [];

function checkPackage(name, relPath) {
  const pkgPath = join(root, relPath);
  try {
    const raw = readFileSync(pkgPath, "utf8");
    JSON.parse(raw);
    checks.push({ name, pkgPath, ok: true });
    return true;
  } catch (e) {
    checks.push({
      name,
      pkgPath,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}

// H1: package.json corrompu (enhanced-resolve)
const h1Ok = checkPackage(
  "enhanced-resolve",
  "node_modules/enhanced-resolve/package.json",
);

// H2: peer deps Supabase (cookie, iceberg-js)
const cookieOk = existsSync(join(root, "node_modules/cookie/package.json"));
const icebergOk = existsSync(join(root, "node_modules/iceberg-js/package.json"));

let resolveOk = false;
let resolveError = null;
try {
  require.resolve("enhanced-resolve");
  resolveOk = true;
} catch (e) {
  resolveError = e instanceof Error ? e.message : String(e);
}

log("H1", "enhanced-resolve package.json", { parseOk: h1Ok, resolveOk, resolveError });
log("H2", "supabase transitive deps", { cookieOk, icebergOk });

const allOk = h1Ok && resolveOk && cookieOk && icebergOk;
log("SUMMARY", allOk ? "deps OK" : "deps FAILED", { checks, allOk });
process.exit(allOk ? 0 : 1);
