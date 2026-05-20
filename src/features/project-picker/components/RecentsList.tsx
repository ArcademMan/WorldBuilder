import { Folder, X, ChevronRight } from "lucide-react";

import { Button } from "../../../components/Button";
import { useRecents } from "../../../hooks/use-recents";

import styles from "./RecentsList.module.css";

type Props = {
  onOpen: (path: string) => Promise<void>;
};

export function RecentsList({ onOpen }: Props) {
  const { items, loading, error, remove } = useRecents();

  if (loading) return <p className={styles.muted}>Loading recents…</p>;
  if (error) return <p className={styles.error}>Failed to load recents: {error}</p>;
  if (items.length === 0) return <p className={styles.muted}>No recent projects yet.</p>;

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.path} className={styles.item}>
          <span className={styles.folderIcon}>
            <Folder size={16} strokeWidth={1.75} />
          </span>
          <button
            type="button"
            className={styles.itemMain}
            onClick={() => void onOpen(item.path)}
          >
            <strong>{item.name}</strong>
            <span className={styles.path}>{item.path}</span>
          </button>
          <ChevronRight size={14} className={styles.chevron} strokeWidth={1.75} />
          <Button
            variant="ghost"
            title="Remove from recents"
            aria-label={`Remove ${item.name} from recents`}
            onClick={() => void remove(item.path)}
          >
            <X size={14} strokeWidth={2} />
          </Button>
        </li>
      ))}
    </ul>
  );
}
