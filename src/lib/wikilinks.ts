import type { Entry, Template } from "../types";

/**
 * Conservative wikilink matcher — only inside one line, no nested brackets.
 * Kept in sync with the one used by `Markdown` to render `[[link]]` syntax.
 */
export const WIKILINK_RE = /\[\[([^\[\]\n]+?)\]\]/g;

/**
 * Resolve a wikilink target string (`"Name"` or `"Template:Name"`) against
 * the provided entries. Returns the unique match, or `null` if there is no
 * match OR if multiple entries match (which we treat as broken so the user
 * is nudged to disambiguate with a `Template:` prefix).
 */
export function resolveWikilinkTarget(
  target: string,
  entries: Entry[],
  templatesById: Map<string, Template>,
): Entry | null {
  const colon = target.indexOf(":");
  const templateName = colon >= 0 ? target.slice(0, colon).trim() : null;
  const entryName = (colon >= 0 ? target.slice(colon + 1) : target).trim();
  const entryKey = entryName.toLowerCase();

  let found: Entry | null = null;
  for (const e of entries) {
    if (e.name.trim().toLowerCase() !== entryKey) continue;
    if (templateName) {
      const tpl = templatesById.get(e.templateId);
      if (tpl?.name.trim().toLowerCase() !== templateName.toLowerCase()) continue;
    }
    if (found) return null; // ambiguous — count as broken
    found = e;
  }
  return found;
}

/** Extract every `[[…]]` target string from a chunk of text. */
export function extractWikilinkTargets(text: string): string[] {
  const out: string[] = [];
  WIKILINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    const t = m[1].trim();
    if (t) out.push(t);
  }
  return out;
}

/**
 * Returns true if `entry` contains at least one `[[wikilink]]` that does
 * not resolve to a unique existing entry. Scans the body and every
 * string-valued field (markdown / text / string fields all live as
 * strings in `entry.fields`).
 */
export function hasBrokenWikilinks(
  entry: Entry,
  entries: Entry[],
  templatesById: Map<string, Template>,
): boolean {
  const sources: string[] = [];
  if (entry.body) sources.push(entry.body);
  for (const v of Object.values(entry.fields)) {
    if (typeof v === "string") sources.push(v);
  }
  for (const text of sources) {
    for (const target of extractWikilinkTargets(text)) {
      if (!resolveWikilinkTarget(target, entries, templatesById)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Compute the set of entry ids whose body/fields contain at least one
 * broken wikilink. O(entries × links × entries) worst case — memoize at
 * the caller (it's identity-keyed on entries + templates).
 */
export function computeBrokenEntryIds(
  entries: Entry[],
  templatesById: Map<string, Template>,
): Set<string> {
  const out = new Set<string>();
  for (const e of entries) {
    if (hasBrokenWikilinks(e, entries, templatesById)) {
      out.add(e.id);
    }
  }
  return out;
}
