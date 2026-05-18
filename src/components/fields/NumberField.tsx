import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
};

export function NumberField({ def, value, onChange, disabled }: Props) {
  function handleChange(raw: string) {
    if (raw === "") {
      onChange(null);
      return;
    }
    const n = Number(raw);
    onChange(Number.isFinite(n) ? n : null);
  }

  return (
    <FormField label={def.label} helpText={def.helpText} required={def.required}>
      <input
        type="number"
        className={styles.input}
        value={value ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
      />
    </FormField>
  );
}
