/** Derives a file extension from a MIME type extracted from a data URL. */
function mimeToExtension(mime: string): string {
  if (/jpeg|jpg/i.test(mime)) return "jpg";
  if (/png/i.test(mime)) return "png";
  if (/gif/i.test(mime)) return "gif";
  if (/webp/i.test(mime)) return "webp";
  return "png";
}

/**
 * Triggers a browser download for a base64 data URL image.
 * The file extension is derived from the embedded MIME type.
 *
 * @param dataUrl - Base64 data URL (e.g. `data:image/jpeg;base64,...`)
 * @param baseName - Filename without extension (e.g. `Hero_Fighter_Level5-portrait`)
 */
export function downloadImageDataUrl(dataUrl: string, baseName: string): void {
  const match = /^data:([^;,]+)?(?:;base64)?/.exec(dataUrl);
  const mime = match?.[1] ?? "image/png";
  const ext = mimeToExtension(mime);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${baseName}.${ext}`;
  anchor.click();
}

/**
 * Downloads portrait and token images (if present) using the given filename base.
 * Portrait → `<base>-portrait.<ext>`, token → `<base>-token.<ext>`.
 */
export function downloadCharacterImages(
  filenameBase: string,
  portraitImage: string | null | undefined,
  tokenImage: string | null | undefined,
): void {
  if (portraitImage) {
    downloadImageDataUrl(portraitImage, `${filenameBase}-portrait`);
  }
  if (tokenImage) {
    downloadImageDataUrl(tokenImage, `${filenameBase}-token`);
  }
}
