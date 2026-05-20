import { createContext, useContext, type ReactNode } from "react";

import styles from "./fields.module.css";

type Props = {
  label: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
};

/**
 * Context flag the LayoutRenderer flips for "table-row" items so
 * FormField hides its own label/help — the surrounding <td> draws
 * them instead, no per-component prop drilling required.
 */
const BareFieldContext = createContext(false);

export function BareFieldProvider({ children }: { children: ReactNode }) {
  return (
    <BareFieldContext.Provider value={true}>
      {children}
    </BareFieldContext.Provider>
  );
}

/**
 * Standard "label + input + help text" wrapper used by every field
 * component that follows the vertical layout (string, text, number, …).
 * Boolean/checkbox-style fields draw their own layout instead.
 */
export function FormField({ label, helpText, required, children }: Props) {
  const bare = useContext(BareFieldContext);
  if (bare) {
    return <div className={styles.fieldBare}>{children}</div>;
  }
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
