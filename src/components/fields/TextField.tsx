import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  rows?: number;
};

export function TextField({ def, value, onChange, disabled, rows = 4 }: Props) {
  return (
    <FormField label={def.label} helpText={def.helpText} required={def.required}>
      <textarea
        className={styles.textarea}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        disabled={disabled}
      />
    </FormField>
  );
}
