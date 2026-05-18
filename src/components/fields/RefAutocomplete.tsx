import { useMemo, useState, type KeyboardEvent } from "react";

import { useEntriesContext } from "../../features/project-shell/entries-context";
import { useTemplatesContext } from "../../features/project-shell/templates-context";
import type { Entry, Template } from "../../types";

import styles from "./fields.module.css";

type Props = {
  /** Template ids whose entries are eligible targets. Empty = any template. */
  targetTemplateIds: string[];
  /** Entry ids already selected — excluded from suggestions. */
  excludeIds: Set<string>;
  /** Called when the user picks (or just created) an existing/new entry. */
  onPick: (entry: Entry) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Shared input used by RefField and RefListField. Filters entries by the
 * template targets configured on the field, supports inline create
 * ("+ Create new <name> in <Template>"), and dispatches the resolved entry.
 */
export function RefAutocomplete({
  targetTemplateIds,
  excludeIds,
  onPick,
  disabled,
  placeholder,
}: Props) {
  const { items: allEntries, create } = useEntriesContext();
  const { byId: templatesById } = useTemplatesContext();

  const allowedSet = useMemo(
    () => new Set(targetTemplateIds),
    [targetTemplateIds],
  );
  const allowedTemplates: Template[] = useMemo(() => {
    return targetTemplateIds
      .map((id) => templatesById.get(id))
      .filter((t): t is Template => !!t);
  }, [targetTemplateIds, templatesById]);

  const eligibleEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (excludeIds.has(e.id)) return false;
      if (allowedSet.size > 0 && !allowedSet.has(e.templateId)) return false;
      return true;
    });
  }, [allEntries, allowedSet, excludeIds]);

  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();

  const candidates = useMemo(() => {
    return eligibleEntries.filter(
      (e) => !lowered || e.name.toLowerCase().includes(lowered),
    );
  }, [eligibleEntries, lowered]);

  async function createIn(templateId: string) {
    if (!trimmed) return;
    setBusy(true);
    try {
      const entry = await create(templateId, trimmed);
      onPick(entry);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      // Enter creates in the first allowed template when there's only one;
      // otherwise we want the user to pick explicitly.
      e.preventDefault();
      if (trimmed && allowedTemplates.length === 1) {
        void createIn(allowedTemplates[0].id);
      }
    }
  }

  return (
    <div className={styles.autocompleteWrap}>
      <input
        type="text"
        className={styles.chipNewInput}
        value={text}
        placeholder={placeholder ?? "Type to search or create…"}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        disabled={disabled || busy}
      />
      {open && (trimmed.length > 0 || candidates.length > 0) && (
        <ul className={styles.suggestionList}>
          {candidates.map((e) => {
            const tpl = templatesById.get(e.templateId);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className={styles.suggestionItem}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    onPick(e);
                    setText("");
                  }}
                >
                  {e.name}
                  {tpl && (
                    <span className={styles.suggestionMeta}>
                      {" "}
                      — {tpl.icon ? `${tpl.icon} ` : ""}
                      {tpl.name}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {trimmed &&
            allowedTemplates.map((t) => (
              <li key={`create-${t.id}`}>
                <button
                  type="button"
                  className={`${styles.suggestionItem} ${styles.suggestionCreate}`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    void createIn(t.id);
                  }}
                >
                  + Create "{trimmed}" in {t.icon ? `${t.icon} ` : ""}
                  {t.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
