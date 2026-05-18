import { useState, type KeyboardEvent } from "react";

import { Button } from "../../../components/Button";
import type { VocabularyItem } from "../../../types";

import styles from "./VocabularyItemRow.module.css";

type Props = {
  item: VocabularyItem;
  usageCount: number;
  onRename: (id: string, label: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

export function VocabularyItemRow({ item, usageCount, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function start() {
    setDraft(item.label);
    setEditing(true);
    setError(null);
  }

  function cancel() {
    setEditing(false);
    setDraft(item.label);
    setError(null);
  }

  async function commit() {
    const next = draft.trim();
    if (!next || next === item.label) {
      cancel();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onRename(item.id, next);
      setEditing(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  async function handleDelete() {
    const msg =
      usageCount > 0
        ? `Delete "${item.label}"? This will remove it from ${usageCount} entr${usageCount === 1 ? "y" : "ies"}.`
        : `Delete "${item.label}"?`;
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(item.id);
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  }

  return (
    <li className={styles.row}>
      <div className={styles.labelCell}>
        {editing ? (
          <input
            autoFocus
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => void commit()}
            disabled={busy}
          />
        ) : (
          <button
            type="button"
            className={styles.labelButton}
            onClick={start}
            disabled={busy}
            title="Click to rename"
          >
            {item.label}
          </button>
        )}
        {error && <small className={styles.error}>{error}</small>}
      </div>
      <span className={styles.usage}>
        {usageCount} {usageCount === 1 ? "use" : "uses"}
      </span>
      <Button variant="ghost" onClick={handleDelete} disabled={busy} title="Delete">
        ✕
      </Button>
    </li>
  );
}
