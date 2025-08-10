// Utilities to keep MarkdownEditor lean
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// Convert Data URL to Blob (robust)
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, ...rest] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:([^;]+);?/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const dataPart = rest.join(',');
  let bstr: string;
  if (/;base64/i.test(meta)) {
    let base64 = dataPart.replace(/[\s\r\n]+/g, '');
    base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
    while (base64.length % 4 !== 0) base64 += '=';
    bstr = atob(base64);
  } else {
    bstr = decodeURIComponent(dataPart);
  }
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

export const isTooLargeBytes = (size: number) => size > IMAGE_MAX_BYTES;

// Regex for data URL images inside markdown
const dataImageRegex = /!\[[^\]]*\]\(\s*(data:image\/[a-zA-Z]+;base64,[0-9A-Za-z+/=]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;

// Replace data URL images with uploaded URLs using the provided uploader
export async function replaceDataUrlsWithUploads(
  markdown: string,
  uploadDataUrl: (dataUrl: string) => Promise<string>
): Promise<string> {
  const matches = [...markdown.matchAll(dataImageRegex)];
  let updated = markdown;
  for (const match of matches) {
    const dataUrl = match[1];
    try {
      const url = await uploadDataUrl(dataUrl);
      updated = updated.replace(dataUrl, url);
    } catch {
      // swallow and keep data URL if upload fails
    }
  }
  return updated;
}

// Rewrite legacy /uploads/ links to /api/file/
export function rewriteLegacyUploads(markdown: string): string {
  return markdown.replace(/\]\(\s*\/uploads\//g, ']( /api/file/');
}

// Strip optional image titles ("..." or '...') to avoid hover tooltips
export function stripImageTitles(markdown: string): string {
  return markdown.replace(/(!\[[^\]]*\]\(\s*[^)\s]+)\s+(?:"[^"]*"|'[^']*')\s*\)/g, '$1)');
}

// Extract filenames referenced via server endpoints
export function extractServerFilenames(md: string): Set<string> {
  const result = new Set<string>();
  const re = /(?:\/api\/file\/|\/uploads\/)([A-Za-z0-9._-]+\.[A-Za-z0-9]+)(?=[)\s"'])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) result.add(m[1]);
  return result;
}

export function computeRemovedFilenames(prevMd: string, nextMd: string): string[] {
  const prev = extractServerFilenames(prevMd);
  const next = extractServerFilenames(nextMd);
  const removed: string[] = [];
  prev.forEach((f) => { if (!next.has(f)) removed.push(f); });
  return removed;
}
