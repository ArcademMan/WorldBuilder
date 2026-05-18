import { useState } from "react";

import { Button } from "../../../components/Button";
import * as api from "../../../lib/api";

import styles from "./Cards.module.css";

type Props = {
  onOpen: (path: string) => Promise<void>;
};

export function OpenProjectCard({ onOpen }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    const folder = await api.pickFolder();
    if (!folder) return;
    setBusy(true);
    try {
      await onOpen(folder);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Open project</h3>
      <p className={styles.muted}>
        Pick a folder that already contains a <code>worldbuilder.json</code>.
      </p>
      <Button variant="secondary" onClick={handleClick} disabled={busy}>
        {busy ? "Opening…" : "Choose folder…"}
      </Button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
