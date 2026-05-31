/**
 * Converts a subset of markdown to HTML for product descriptions.
 * Supported: bullet lists (- item), numbered lists (1. item), **bold**, *italic*, plain text.
 */
export function renderRichTextMarkdown(text: string): string {
  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeUl = () => { if (inUl) { htmlParts.push('</ul>'); inUl = false; } };
  const closeOl = () => { if (inOl) { htmlParts.push('</ol>'); inOl = false; } };

  const inlineFormat = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeUl(); closeOl();
      continue;
    }

    const ulMatch = /^[-*]\s+(.+)/.exec(line);
    const olMatch = /^\d+\.\s+(.+)/.exec(line);

    if (ulMatch) {
      closeOl();
      if (!inUl) { htmlParts.push('<ul class="list-disc pl-4 text-sm space-y-0.5">'); inUl = true; }
      htmlParts.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
    } else if (olMatch) {
      closeUl();
      if (!inOl) { htmlParts.push('<ol class="list-decimal pl-4 text-sm space-y-0.5">'); inOl = true; }
      htmlParts.push(`<li>${inlineFormat(olMatch[1])}</li>`);
    } else {
      closeUl(); closeOl();
      htmlParts.push(`<p class="text-sm leading-relaxed">${inlineFormat(line)}</p>`);
    }
  }

  closeUl(); closeOl();
  return htmlParts.join('');
}
