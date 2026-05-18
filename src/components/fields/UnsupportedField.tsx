import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = { def: FieldDef };

/**
 * Renders a stub for field types not yet implemented (image, imageList,
 * ref, refList). Keeps the form readable until the matching phase
 * lands the real control.
 */
export function UnsupportedField({ def }: Props) {
  return (
    <FormField label={def.label} helpText={`Type "${def.type}" is not editable yet.`}>
      <p className={styles.unsupported}>Coming in a later phase.</p>
    </FormField>
  );
}
