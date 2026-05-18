import { useMemo, useState, type KeyboardEvent } from "react";

import { useVocabulariesContext } from "../../features/project-shell/vocabularies-context";
import type { FieldDef, VocabularyItem } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  disabled?: boolean;
};

/**
 * Multi-selection vocabulary picker with chips + autocomplete +
 * inline "create new" option.
 */
export function VocabListField({ def, value, onChange, disabled }: Props) {
  const { vocabsById, createItem } = useVocabulariesContext();
  const vocabularyId = def.vocabularyId;

  if (!vocabularyId) {
    return (
      <FormField label={def.label} helpText="Missing vocabularyId in template field.">
        <p className={styles.warning}>Misconfigured field.</p>
      </FormField>
    );
  }

  const loaded = vocabsById.get(vocabularyId);
  if (!loaded) {
    return (
      <FormField label={def.label}>
        <p className={styles.warning}>Vocabulary not found: {vocabularyId}</p>
      </FormField>
    );
  }

  const selectedIds = value ?? [];
  const selectedSet = new Set(selectedIds);

  function pick(itemId: string) {
    if (selectedSet.has(itemId)) return;
    onChange([...selectedIds, itemId]);
  }

  function removeId(itemId: string) {
    const next = selectedIds.filter((id) => id !== itemId);
    onChange(next.length === 0 ? null : next);
  }

  async function handleCreate(label: string): Promise<void> {
    const item = await createItem(vocabularyId!, label);
    pick(item.id);
  }

  return (
    <FormField
      label={def.label}
      helpText={def.helpText ?? "Pick from existing values or type to add a new one."}
      required={def.required}
    >
      <div className={styles.chipInput}>
        {selectedIds.map((id) => {
          const item = loaded.itemsById.get(id);
          const isBroken = !item;
          return (
            <span
              key={id}
              className={`${styles.chip} ${isBroken ? styles.chipBroken : ""}`}
            >
              {item ? item.label : <em>(deleted)</em>}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => removeId(id)}
                disabled={disabled}
                aria-label="Remove"
              >
                ✕
              </button>
            </span>
          );
        })}

        <VocabAutocomplete
          items={loaded.items}
          excludeIds={selectedSet}
          onPick={pick}
          onCreate={handleCreate}
          disabled={disabled}
        />
      </div>
    </FormField>
  );
}

// --- internal: autocomplete control ---------------------------------------

type AutocompleteProps = {
  items: VocabularyItem[];
  excludeIds: Set<string>;
  onPick: (itemId: string) => void;
  onCreate: (label: string) => Promise<void>;
  disabled?: boolean;
};

function VocabAutocomplete({
  items,
  excludeIds,
  onPick,
  onCreate,
  disabled,
}: AutocompleteProps) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();

  const candidates = useMemo(() => {
    return items
      .filter((it) => !excludeIds.has(it.id))
      .filter((it) => !lowered || it.label.toLowerCase().includes(lowered));
  }, [items, excludeIds, lowered]);

  const exactExisting = items.find(
    (it) => it.label.toLowerCase() === lowered,
  );

  async function commit() {
    if (!trimmed) return;
    if (exactExisting) {
      if (!excludeIds.has(exactExisting.id)) onPick(exactExisting.id);
      setText("");
      return;
    }
    setBusy(true);
    try {
      await onCreate(trimmed);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "," ) {
      e.preventDefault();
      void commit();
    }
  }

  return (
    <div className={styles.autocompleteWrap}>
      <input
        type="text"
        className={styles.chipNewInput}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a mousedown on a suggestion can still fire.
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        disabled={disabled || busy}
      />
      {open && (trimmed.length > 0 || candidates.length > 0) && (
        <ul className={styles.suggestionList}>
          {candidates.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className={styles.suggestionItem}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(it.id);
                  setText("");
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
          {trimmed && !exactExisting && (
            <li>
              <button
                type="button"
                className={`${styles.suggestionItem} ${styles.suggestionCreate}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  void commit();
                }}
              >
                + Create "{trimmed}"
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
