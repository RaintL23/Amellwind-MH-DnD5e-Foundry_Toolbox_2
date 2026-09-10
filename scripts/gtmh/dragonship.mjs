/**
 * Extract Dragonship rules (blueprint / upgrades / combat) from chapter 4.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGING_DIR,
  headingBlocks,
  readUtf8,
  toParagraphs,
} from "./common.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CHAPTER4 = path.join(STAGING_DIR, "gtmh-patreon-chapter4.md");
const OUT_FILE = path.join(
  ROOT,
  "src/features/amellwind/siege-weapons/data/dragonship.generated.json",
);

function paragraphsFrom(body) {
  return toParagraphs(body).filter(Boolean);
}

export function buildDragonshipGuide() {
  const markdown = readUtf8(CHAPTER4).replace(/\r\n/g, "\n");
  const start = markdown.indexOf("## Dragonships");
  if (start === -1) {
    return {
      intro: "Dragonship rules unavailable.",
      sections: [],
    };
  }
  const end = markdown.indexOf("## Creating your own Loot Tables", start);
  const block = markdown.slice(start, end === -1 ? markdown.length : end);

  const h3 = headingBlocks(block, 3);
  const rootParas = paragraphsFrom(
    block.replace(/^## Dragonships\n+/, "").split(/^### /m)[0] ?? "",
  );

  const subsections = h3.map((entry) => ({
    name: entry.title,
    paragraphs: paragraphsFrom(entry.body),
  }));

  // Capture free-text "Dragonship" vehicle stat block between last deck section and Blueprint
  const blueprintIdx = block.indexOf("### Dragonship Blueprint");
  const vehicleIdx = block.search(/\nDragonship\nGargantuan vehicle/);
  let vehicleParagraphs = [];
  if (vehicleIdx !== -1) {
    const to =
      blueprintIdx === -1 ? block.length : blueprintIdx;
    vehicleParagraphs = paragraphsFrom(block.slice(vehicleIdx, to));
  }

  return {
    intro:
      "Desert travel vessels from Amellwind's Guide (Chapter 4). Stat block, blueprint notes, upgrades, and Ghosts of Saltmarsh combat/travel references.",
    page: 107,
    paragraphs: rootParas,
    subsections: [
      ...subsections.filter(
        (s) =>
          !/^Dragonship Blueprint$/i.test(s.name) &&
          !/^Upgrading the Dragonship$/i.test(s.name) &&
          !/^Ships in Combat/i.test(s.name),
      ),
      ...(vehicleParagraphs.length
        ? [
            {
              name: "Dragonship Stat Block",
              paragraphs: vehicleParagraphs,
            },
          ]
        : []),
      ...subsections.filter(
        (s) =>
          /^Dragonship Blueprint$/i.test(s.name) ||
          /^Upgrading the Dragonship$/i.test(s.name) ||
          /^Ships in Combat/i.test(s.name),
      ),
    ],
  };
}

export function writeDragonshipGuide(outPath = OUT_FILE) {
  const data = buildDragonshipGuide();
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const data = writeDragonshipGuide();
  console.log(
    `Wrote dragonship guide (${data.subsections.length} subsections) → ${path.relative(ROOT, OUT_FILE)}`,
  );
}
