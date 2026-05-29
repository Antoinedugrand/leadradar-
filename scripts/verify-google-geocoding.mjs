#!/usr/bin/env node
/**
 * Test server-side Geocoding API key (GOOGLE_PLACES_API_KEY).
 * Usage: node scripts/verify-google-geocoding.mjs [city]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const city = process.argv[2] ?? "Perth";

if (!apiKey) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env.local or environment.");
  process.exit(1);
}

const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
url.searchParams.set("address", city);
url.searchParams.set("key", apiKey);

const response = await fetch(url);
const payload = await response.json();

console.log(`City: ${city}`);
console.log(`HTTP: ${response.status}`);
console.log(`Google status: ${payload.status}`);
if (payload.error_message) {
  console.log(`Google error_message: ${payload.error_message}`);
}
if (payload.status === "OK") {
  console.log(`Result: ${payload.results?.[0]?.formatted_address ?? "OK"}`);
  console.log("\n✓ Geocoding key works for server-side calls.");
  process.exit(0);
}

console.log("\n✗ Geocoding failed. Checklist:");
console.log("  1. Enable Geocoding API + Places API in Google Cloud Console");
console.log("  2. Enable billing on the Google Cloud project");
console.log("  3. Use a SERVER key for GOOGLE_PLACES_API_KEY (no HTTP referrer restriction)");
console.log("  4. Set GOOGLE_PLACES_API_KEY on Vercel (Production) and redeploy");
console.log("\nSee GOOGLE_MAPS_SETUP.md for full steps.");
process.exit(1);
