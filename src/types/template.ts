import type { FieldDef } from "./field";
import type { LayoutSection } from "./layout";

/**
 * A user-editable template that defines the infobox fields for an entry type.
 * Templates live as JSON files inside `<project>/templates/<id>.json`.
 *
 * Common fields (name, summary, tags, body, images) are not declared here:
 * they are intrinsic to every entry regardless of template.
 */
export type Template = {
  id: string;
  name: string;
  /** Optional parent template; sub-templates inherit and extend its fields. */
  parentId?: string;
  /** Emoji or icon identifier displayed next to entries of this template. */
  icon?: string;
  fields: FieldDef[];
  /** Optional infobox layout. Fields not referenced fall through to a
   * trailing block so adding a field never makes it disappear. */
  layout: LayoutSection[];
};
