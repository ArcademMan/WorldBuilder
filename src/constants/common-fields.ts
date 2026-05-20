import type { FieldDef } from "../types";

/**
 * Field keys that exist on every entry as first-class properties,
 * regardless of template. Templates MUST NOT declare a `FieldDef`
 * with one of these keys.
 */
export const COMMON_FIELD_KEYS = [
  "name",
  "summary",
  "tags",
  "body",
  "images",
] as const;

export type CommonFieldKey = (typeof COMMON_FIELD_KEYS)[number];

export function isCommonFieldKey(key: string): key is CommonFieldKey {
  return (COMMON_FIELD_KEYS as readonly string[]).includes(key);
}

/**
 * Pseudo-FieldDefs for the built-in entry fields. Used by the layout
 * editor (so users can place body/tags/etc. into columns) and by the
 * layout renderer (so it knows how to render them). `name` is
 * intentionally excluded — it's always the article title.
 */
export const COMMON_FIELD_DEFS: FieldDef[] = [
  { key: "summary", label: "Summary", type: "text" },
  { key: "body", label: "Body", type: "markdown" },
  { key: "tags", label: "Tags", type: "stringList" },
  { key: "images", label: "Images", type: "imageList" },
];
