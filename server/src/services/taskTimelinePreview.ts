const markdownImagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/i;
const htmlImagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;

function normalizeImageUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  return value ? value : null;
}

export function extractFirstImageUrl(content: string | null | undefined): string | null {
  if (!content) {
    return null;
  }

  const markdownMatch = content.match(markdownImagePattern);
  if (markdownMatch) {
    return normalizeImageUrl(markdownMatch[1]);
  }

  const htmlMatch = content.match(htmlImagePattern);
  if (htmlMatch) {
    return normalizeImageUrl(htmlMatch[1]);
  }

  return null;
}

export function resolveTaskPreviewImageUrl(input: {
  description?: string | null;
  comments?: string[];
}): string | null {
  const descriptionImage = extractFirstImageUrl(input.description);
  if (descriptionImage) {
    return descriptionImage;
  }

  for (const comment of input.comments ?? []) {
    const commentImage = extractFirstImageUrl(comment);
    if (commentImage) {
      return commentImage;
    }
  }

  return null;
}