import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/**
 * Plain-textarea editor for now — a real markdown editor (live preview,
 * formatting toolbar) will replace this in a later polish phase.
 */
export function MarkdownField({ def, value, onChange, disabled }: Props) {
  return (
    <FormField
      label={def.label}
      helpText={def.helpText ?? "Markdown supported."}
      required={def.required}
    >
      <textarea
        className={`${styles.textarea} ${styles.textareaLarge}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        disabled={disabled}
      />
    </FormField>
  );
}
