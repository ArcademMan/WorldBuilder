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
