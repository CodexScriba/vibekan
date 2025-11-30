import matter from 'gray-matter';

export type ParsedFrontmatter = Record<string, unknown>;

export interface ParsedDocument {
  data: ParsedFrontmatter;
  content: string;
  hasFrontmatter: boolean;
}

export function cleanFrontmatter(data: ParsedFrontmatter): ParsedFrontmatter {
  const cleaned: ParsedFrontmatter = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

export function parseFrontmatter(frontmatterText: string): ParsedFrontmatter {
  try {
    const parsed = matter(`---\n${frontmatterText}\n---\n`);
    return parsed.data as ParsedFrontmatter;
  } catch (error) {
    console.error('[Vibekan] Failed to parse frontmatter with gray-matter', error);
    return {};
  }
}

export function parseFrontmatterDocument(text: string): ParsedDocument {
  try {
    const parsed = matter(text);
    return {
      data: parsed.data as ParsedFrontmatter,
      content: parsed.content,
      hasFrontmatter: !!parsed.matter?.trim() || Object.keys(parsed.data || {}).length > 0,
    };
  } catch (error) {
    console.error('[Vibekan] Failed to parse document with gray-matter', error);
    return { data: {}, content: text, hasFrontmatter: false };
  }
}

export function serializeFrontmatter(data: ParsedFrontmatter): string {
  try {
    const full = matter.stringify('', cleanFrontmatter(data));
    const match = full.match(/^---\n([\s\S]*?)\n---/);
    return match ? match[1] : '';
  } catch (error) {
    console.error('[Vibekan] Failed to serialize frontmatter with gray-matter', error);
    return '';
  }
}

export function stringifyDocument(content: string, data: ParsedFrontmatter): string {
  const sanitized = cleanFrontmatter(data);
  try {
    const body = content.startsWith('\n') || content === '' ? content : `\n${content}`;
    return matter.stringify(body, sanitized);
  } catch (error) {
    console.error('[Vibekan] Failed to stringify document with gray-matter', error);
    return `---\n${serializeFrontmatter(sanitized)}\n---${content.startsWith('\n') ? '' : '\n'}${content}`;
  }
}

export function extractUserNotes(content: string): string {
  const match = content.match(/<!-- USER CONTENT -->\s*([\s\S]*)/);
  return match ? match[1].trim() : '';
}
