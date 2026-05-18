import { useState, type FormEvent } from "react";

import { Button } from "../../../components/Button";
import * as api from "../../../lib/api";

import styles from "./Cards.module.css";

type Props = {
  onCreate: (path: string, name: string) => Promise<void>;
};

export function NewProjectCard({ onCreate }: Props) {
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick() {
    setError(null);
    const folder = await api.pickFolder();
    if (!folder) return;
    setPickedPath(folder);
    setName(deriveDefaultName(folder));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pickedPath || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(pickedPath, name.trim());
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPickedPath(null);
    setName("");
    setError(null);
  }

  if (!pickedPath) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>New project</h3>
        <p className={styles.muted}>
          Pick or create an empty folder. WorldBuilder will scaffold templates,
          entries, and assets inside it.
        </p>
        <Button variant="primary" onClick={handlePick}>
          Choose folder…
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h3 className={styles.title}>New project</h3>
      <p className={styles.path}>{pickedPath}</p>

      <label className={styles.field}>
        <span>Project name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.cardActions}>
        <Button variant="ghost" onClick={reset} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={busy || !name.trim()}
        >
          {busy ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}

function deriveDefaultName(folderPath: string): string {
  const segments = folderPath.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] ?? "";
}
