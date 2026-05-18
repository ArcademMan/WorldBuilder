/**
 * Field type taxonomy supported in the MVP.
 * Used by templates to declare what kind of value a field holds,
 * and by the UI to pick the right input control.
 */
export type FieldType =
  | "string"
  | "text"
  | "markdown"
  | "stringList"
  | "number"
  | "boolean"
  | "date"
  | "image"
  | "imageList"
  | "ref"
  | "refList";

/**
 * Definition of a single field in a template's infobox.
 * Templates own a `FieldDef[]`; entries store the matching values
 * keyed by `FieldDef.key`.
 */
export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  /** For `ref` / `refList`: restrict to entries of these template ids. Empty/undefined = any. */
  refTemplateIds?: string[];
};

/**
 * Concrete value stored for a field on an entry.
 * The runtime shape depends on `FieldDef.type`:
 *  - string / text / markdown / date / image / ref → string
 *  - number → number
 *  - boolean → boolean
 *  - stringList / imageList / refList → string[]
 * `null` means "explicitly empty" (vs. absent from the record).
 */
export type FieldValue = string | number | boolean | string[] | null;
