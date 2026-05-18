import type { FieldValue } from "./field";

/**
 * A single wiki-like entry inside a project.
 * Stored as `<project>/entries/<id>.json`.
 *
 * Common fields are first-class properties; template-specific values
 * live under `fields`, keyed by their `FieldDef.key`.
 */
export type Entry = {
  id: string;
  templateId: string;
  name: string;
  summary?: string;
  tags: string[];
  /** Markdown body — the main wiki content. */
  body: string;
  /** Asset ids referenced by this entry (resolved against `<project>/assets/`). */
  images: string[];
  /** Template-specific field values. */
  fields: Record<string, FieldValue>;
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
};

/**
 * Single incoming reference to an entry: source entry id + which of its
 * fields holds the link. Source name/template are denormalized so the
 * panel can render without an extra lookup.
 */
export type Backlink = {
  sourceEntryId: string;
  sourceTemplateId: string;
  sourceName: string;
  fieldKey: string;
};
