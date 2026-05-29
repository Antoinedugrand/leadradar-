#!/usr/bin/env node
/**
 * Apply pending Supabase SQL migrations.
 * Requires SUPABASE_DB_URL in .env.local, e.g.:
 * postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local optional if vars exported
  }
}

loadEnvLocal();

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL (or DATABASE_URL).\n" +
      "Add to .env.local from Supabase → Project Settings → Database → Connection string (URI).",
  );
  process.exit(1);
}

const migrationsDir = join(root, "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const sql = postgres(dbUrl, { max: 1, ssl: "require" });

try {
  await sql`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const applied = await sql`select filename from schema_migrations`;
  const appliedSet = new Set(applied.map((row) => row.filename));

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`skip  ${file}`);
      continue;
    }

    const body = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);
    await sql.unsafe(body);
    await sql`insert into schema_migrations (filename) values (${file})`;
    count += 1;
  }

  console.log(count > 0 ? `Done — ${count} migration(s) applied.` : "Done — already up to date.");
} finally {
  await sql.end({ timeout: 5 });
}
