#!/usr/bin/env node
/**
 * Verify prospects table schema required for map search ingest.
 */
import { readFileSync } from "node:fs";
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
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL in .env.local");
  process.exit(1);
}

const sql = postgres(dbUrl, { max: 1, ssl: "require" });
let ok = true;

try {
  const requiredColumns = [
    "email_source",
    "phone_source",
    "contacts_enriched_at",
    "social_links",
    "business_type_label",
    "user_id",
  ];

  const columns = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prospects'
  `;
  const columnSet = new Set(columns.map((row) => row.column_name));

  console.log("Columns:");
  for (const name of requiredColumns) {
    const present = columnSet.has(name);
    console.log(`  ${name}: ${present ? "OK" : "MISSING"}`);
    if (!present) ok = false;
  }

  const indexes = await sql`
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'prospects'
      and indexname = 'prospects_user_google_place_id_key'
  `;
  console.log(
    `Index prospects_user_google_place_id_key: ${indexes.length > 0 ? "OK" : "MISSING"}`,
  );
  if (indexes.length === 0) ok = false;

  const usersTable = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  `;
  console.log(`Table public.users: ${usersTable.length > 0 ? "OK" : "MISSING"}`);

  const legacyCount = await sql`
    select count(*)::int as count from public.prospects where user_id is null
  `;
  console.log(`Legacy prospects (user_id IS NULL): ${legacyCount[0]?.count ?? 0}`);

  if (!ok) {
    console.log("\nRun: npm run db:migrate");
    process.exit(1);
  }

  console.log("\nSchema OK for map search ingest.");
} finally {
  await sql.end({ timeout: 5 });
}
