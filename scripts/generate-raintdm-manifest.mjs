import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const weaponsDir = path.resolve(__dirname, "../public/data/raintdm-weapons");

const files = readdirSync(weaponsDir)
  .filter((name) => name.endsWith(".json") && name !== "manifest.json")
  .sort((a, b) => a.localeCompare(b));

const manifest = {
  version: "1.0",
  description: "Homebrew MH weapons catalog — one JSON file per weapon.",
  weapons: files,
};

writeFileSync(
  path.join(weaponsDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Generated manifest with ${files.length} weapon(s).`);
