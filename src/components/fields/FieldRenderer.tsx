import type { FieldDef, FieldValue } from "../../types";

import { BooleanField } from "./BooleanField";
import { DateField } from "./DateField";
import { MarkdownField } from "./MarkdownField";
import { ImageField } from "./ImageField";
import { ImageListField } from "./ImageListField";
import { NumberField } from "./NumberField";
import { RefField } from "./RefField";
import { RefListField } from "./RefListField";
import { StringField } from "./StringField";
import { StringListField } from "./StringListField";
import { TextField } from "./TextField";
import { VocabField } from "./VocabField";
import { VocabListField } from "./VocabListField";

type Props = {
  def: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue | null) => void;
  disabled?: boolean;
};

/**
 * Picks the right concrete field component for `def.type` and forwards
 * a narrowly-typed value/onChange pair. Adding a new FieldType means
 * adding a case here + a sibling component.
 */
export function FieldRenderer({ def, value, onChange, disabled }: Props) {
  switch (def.type) {
    case "string":
      return (
        <StringField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "text":
      return (
        <TextField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "markdown":
      return (
        <MarkdownField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "stringList":
      return (
        <StringListField
          def={def}
          value={asStringList(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <NumberField
          def={def}
          value={asNumber(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "boolean":
      return (
        <BooleanField
          def={def}
          value={asBoolean(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "date":
      return (
        <DateField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "vocab":
      return (
        <VocabField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "vocabList":
      return (
        <VocabListField
          def={def}
          value={asStringList(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "ref":
      return (
        <RefField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "refList":
      return (
        <RefListField
          def={def}
          value={asStringList(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "image":
      return (
        <ImageField
          def={def}
          value={asString(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "imageList":
      return (
        <ImageListField
          def={def}
          value={asStringList(value)}
          onChange={onChange}
          disabled={disabled}
        />
      );
  }
}

function asString(v: FieldValue | undefined): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: FieldValue | undefined): number | null {
  return typeof v === "number" ? v : null;
}

function asBoolean(v: FieldValue | undefined): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function asStringList(v: FieldValue | undefined): string[] | null {
  return Array.isArray(v) ? v : null;
}
