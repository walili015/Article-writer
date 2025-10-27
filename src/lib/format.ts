export function formatParagraphs(text: string) {
  return text
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function extractIntroParagraphs(intro: string) {
  return formatParagraphs(intro);
}

export function formatSlug(slug: string) {
  return slug.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}
