import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../components/Button";
import { useEntriesContext } from "../project-shell/entries-context";
import { useVocabulariesContext } from "../project-shell/vocabularies-context";
import { SYSTEM_TAGS_VOCAB_ID } from "../../types";

import { VocabularyItemRow } from "./components/VocabularyItemRow";
import styles from "./ProjectVocabulariesPage.module.css";

export function ProjectVocabulariesPage() {
  const {
    vocabs,
    vocabsById,
    createVocabulary,
    createItem,
    renameItem,
    deleteItem,
    deleteVocabulary,
  } = useVocabulariesContext();
  const { items: entries } = useEntriesContext();

  const [selectedId, setSelectedId] = useState<string>("");
  const [newItemLabel, setNewItemLabel] = useState("");

  useEffect(() => {
    if (vocabs.length === 0) {
      setSelectedId("");
    } else if (!vocabs.some((v) => v.id === selectedId)) {
      setSelectedId(vocabs[0].id);
    }
  }, [vocabs, selectedId]);

  const usageByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      const seen = new Set<string>();
      for (const tag of entry.tags) seen.add(tag);
      for (const value of Object.values(entry.fields)) {
        if (typeof value === "string") seen.add(value);
        else if (Array.isArray(value)) {
          for (const v of value) if (typeof v === "string") seen.add(v);
        }
      }
      for (const id of seen) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  const selected = selectedId ? vocabsById.get(selectedId) : null;
  const isSystem = selectedId === SYSTEM_TAGS_VOCAB_ID;

  async function handleNewVocabulary() {
    const name = prompt("New vocabulary name:")?.trim();
    if (!name) return;
    try {
      const v = await createVocabulary(name);
      setSelectedId(v.id);
    } catch (e) {
      alert(`Failed to create vocabulary: ${e}`);
    }
  }

  async function handleDeleteVocabulary() {
    if (!selected || isSystem) return;
    const itemCount = selected.items.length;
    const totalUses = selected.items.reduce(
      (sum, it) => sum + (usageByItemId.get(it.id) ?? 0),
      0,
    );
    const msg = `Delete the entire "${selected.vocab.name}" vocabulary? This removes ${itemCount} value${itemCount === 1 ? "" : "s"} from ${totalUses} entr${totalUses === 1 ? "y" : "ies"}.`;
    if (!confirm(msg)) return;
    try {
      await deleteVocabulary(selected.vocab.id);
    } catch (e) {
      alert(`Failed to delete vocabulary: ${e}`);
    }
  }

  async function handleAddItem() {
    const label = newItemLabel.trim();
    if (!label || !selected) return;
    try {
      await createItem(selected.vocab.id, label);
      setNewItemLabel("");
    } catch (e) {
      alert(`Failed to add item: ${e}`);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/project" className={styles.backLink}>
          ← Back to project
        </Link>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Vocabularies</h1>
          <Button variant="primary" onClick={handleNewVocabulary}>
            + New vocabulary
          </Button>
        </div>
      </header>

      {vocabs.length === 0 ? (
        <p className={styles.empty}>No vocabularies yet.</p>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.vocabList}>
            {vocabs.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`${styles.vocabItem} ${v.id === selectedId ? styles.vocabItemActive : ""}`}
                onClick={() => setSelectedId(v.id)}
              >
                <span>{v.name}</span>
                <small>{vocabsById.get(v.id)?.items.length ?? 0}</small>
              </button>
            ))}
          </aside>

          <section className={styles.detail}>
            {!selected ? (
              <p className={styles.empty}>Select a vocabulary.</p>
            ) : (
              <>
                <div className={styles.detailHeader}>
                  <h2 className={styles.detailTitle}>{selected.vocab.name}</h2>
                  {!isSystem && (
                    <Button variant="ghost" onClick={handleDeleteVocabulary}>
                      Delete vocabulary
                    </Button>
                  )}
                </div>

                {selected.items.length === 0 ? (
                  <p className={styles.empty}>No values yet.</p>
                ) : (
                  <ul className={styles.itemList}>
                    {selected.items.map((it) => (
                      <VocabularyItemRow
                        key={it.id}
                        item={it}
                        usageCount={usageByItemId.get(it.id) ?? 0}
                        onRename={renameItem}
                        onDelete={deleteItem}
                      />
                    ))}
                  </ul>
                )}

                <form
                  className={styles.addRow}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleAddItem();
                  }}
                >
                  <input
                    className={styles.addInput}
                    placeholder="Add a value…"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!newItemLabel.trim()}
                  >
                    Add
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
