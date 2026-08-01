/**
 * Converts the raster icons in `public/mh-icons/` to WebP to speed up loading.
 *
 * For each `.png` / `.jpg` / `.jpeg` it encodes both a lossless and a lossy
 * WebP and keeps the smaller one, then removes the original so the folder ends
 * up as WebP-only. Simple flat icons win with lossless (pixel-identical);
 * photographic weapon art wins with lossy. Existing `.webp` files are left as-is.
 *
 * Re-run any time new icons are added:  pnpm optimize:icons
 */
import { readdir, stat, readFile, writeFile, unlink } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ICONS_DIR = fileURLToPath(new URL("../public/mh-icons", import.meta.url));
const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const LOSSY_QUALITY = 82;

/** Returns the smallest WebP encoding (lossless vs lossy) of the input buffer. */
async function encodeSmallestWebp(inputBuffer) {
  const [lossless, lossy] = await Promise.all([
    sharp(inputBuffer).webp({ lossless: true, effort: 6 }).toBuffer(),
    sharp(inputBuffer).webp({ quality: LOSSY_QUALITY, effort: 6 }).toBuffer(),
  ]);
  return lossless.length <= lossy.length ? lossless : lossy;
}

async function main() {
  const entries = await readdir(ICONS_DIR);

  let originalTotal = 0;
  let webpTotal = 0;
  let converted = 0;
  let grew = 0;

  for (const name of entries.sort()) {
    const ext = extname(name).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(ext)) continue;

    const inputPath = join(ICONS_DIR, name);
    if (!(await stat(inputPath)).isFile()) continue;

    const inputBuffer = await readFile(inputPath);
    const webpBuffer = await encodeSmallestWebp(inputBuffer);

    const outputName = `${basename(name, ext)}.webp`;
    await writeFile(join(ICONS_DIR, outputName), webpBuffer);
    await unlink(inputPath);

    originalTotal += inputBuffer.length;
    webpTotal += webpBuffer.length;
    converted += 1;
    if (webpBuffer.length > inputBuffer.length) grew += 1;

    const saved = (1 - webpBuffer.length / inputBuffer.length) * 100;
    console.log(
      `${name.padEnd(28)} ${(inputBuffer.length / 1024).toFixed(1).padStart(6)} KB -> ` +
        `${outputName.padEnd(28)} ${(webpBuffer.length / 1024).toFixed(1).padStart(6)} KB  (${saved.toFixed(0)}%)`,
    );
  }

  if (converted === 0) {
    console.log("No PNG/JPG icons to convert — mh-icons is already WebP-only.");
    return;
  }

  console.log(
    `\nConverted ${converted} icon(s): ${(originalTotal / 1024).toFixed(1)} KB -> ` +
      `${(webpTotal / 1024).toFixed(1)} KB ` +
      `(${((1 - webpTotal / originalTotal) * 100).toFixed(1)}% smaller).` +
      (grew > 0 ? ` ${grew} tiny icon(s) grew slightly.` : ""),
  );
}

main().catch((error) => {
  console.error("[optimize-mh-icons] Failed:", error);
  process.exit(1);
});
