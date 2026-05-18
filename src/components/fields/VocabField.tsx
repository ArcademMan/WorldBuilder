import type { FieldDef } from "../../types";
import { useVocabulariesContext } from "../../features/project-shell/vocabularies-context";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/**
 * Single-selection vocabulary picker. Uses a native <select> for now —
 * autocomplete + inline create is reserved for VocabListField where the
 * UX win is bigger.
 */
export function VocabField({ def, value, onChange, disabled }: Props) {
  const { vocabsById } = useVocabulariesContext();
  const vocabularyId = def.vocabularyId;

  if (!vocabularyId) {
    return <FormField label={def.label} helpText="Missing vocabularyId in template field.">
      <p className={styles.warning}>Misconfigured field.</p>
    </FormField>;
  }

  const loaded = vocabsById.get(vocabularyId);
  if (!loaded) {
    return <FormField label={def.label}>
      <p className={styles.warning}>Vocabulary not found: {vocabularyId}</p>
    </FormField>;
  }

  const selectedItem = value ? loaded.itemsById.get(value) : null;
  const isBroken = !!value && !selectedItem;

  return (
    <FormField label={def.label} helpText={def.helpText} required={def.required}>
      <select
        className={styles.select}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        disabled={disabled}
      >
        <option value="">— None —</option>
        {loaded.items.map((it) => (
          <option key={it.id} value={it.id}>
            {it.label}
          </option>
        ))}
      </select>
      {isBroken && (
        <p className={styles.warning}>
          Referenced item no longer exists. Pick a new value to clear.
        </p>
      )}
    </FormField>
  );
}
