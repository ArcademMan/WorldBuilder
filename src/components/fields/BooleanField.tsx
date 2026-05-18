import type { FieldDef } from "../../types";

import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function BooleanField({ def, value, onChange, disabled }: Props) {
  return (
    <label className={styles.checkboxRow}>
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className={styles.label}>
        {def.label}
        {def.required && <span className={styles.required}>*</span>}
      </span>
      {def.helpText && <small className={styles.helpText}>{def.helpText}</small>}
    </label>
  );
}
