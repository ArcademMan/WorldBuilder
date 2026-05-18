import type { ReactNode } from "react";

import styles from "./fields.module.css";

type Props = {
  label: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
};

/**
 * Standard "label + input + help text" wrapper used by every field
 * component that follows the vertical layout (string, text, number, …).
 * Boolean/checkbox-style fields draw their own layout instead.
 */
export function FormField({ label, helpText, required, children }: Props) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </span>
      {children}
      {helpText && <small className={styles.helpText}>{helpText}</small>}
    </label>
  );
}
