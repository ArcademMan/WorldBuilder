import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

export function StringField({ def, value, onChange, disabled }: Props) {
  return (
    <FormField label={def.label} helpText={def.helpText} required={def.required}>
      <input
        type="text"
        className={styles.input}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        disabled={disabled}
      />
    </FormField>
  );
}
