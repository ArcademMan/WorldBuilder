import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Markdown } from "../../components/Markdown";
import { AssetThumb } from "../../components/fields/ImageField";
import { useCurrentProject } from "../../hooks/use-current-project";
import { useEntriesContext } from "../project-shell/entries-context";
import { useVocabulariesContext } from "../project-shell/vocabularies-context";
import type { FieldDef, FieldValue } from "../../types";

import styles from "./ReadValue.module.css";

type Props = {
  def: FieldDef;
  value: FieldValue | undefined;
};

/**
 * Read-only renderer for a single field value, used by the entry viewer
 * (= "print" mode). Resolves vocabulary labels and reference names so
 * the user sees human-readable content rather than raw ids.
 */
export function ReadValue({ def, value }: Props) {
  if (value === null || value === undefined || value === "") {
    return <span className={styles.empty}>—</span>;
  }

  switch (def.type) {
    case "string":
    case "date":
      return <span className={styles.text}>{String(value)}</span>;

    case "number":
      return <span className={styles.text}>{String(value)}</span>;

    case "text":
      return <p className={styles.paragraph}>{String(value)}</p>;

    case "markdown":
      return <Markdown source={String(value)} />;

    case "boolean":
      return <span className={styles.text}>{value ? "Yes" : "No"}</span>;

    case "stringList": {
      const items = Array.isArray(value) ? value : [];
      if (items.length === 0) return <span className={styles.empty}>—</span>;
      return (
        <ul className={styles.pillList}>
          {items.map((s, i) => (
            <li key={i} className={styles.pill}>
              {s}
            </li>
          ))}
        </ul>
      );
    }

    case "vocab":
      return <VocabReadValue vocabularyId={def.vocabularyId} itemId={String(value)} />;

    case "vocabList": {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0) return <span className={styles.empty}>—</span>;
      return (
        <ul className={styles.pillList}>
          {ids.map((id) => (
            <li key={id}>
              <VocabReadValue vocabularyId={def.vocabularyId} itemId={id} pill />
            </li>
          ))}
        </ul>
      );
    }

    case "ref":
      return <RefReadValue entryId={String(value)} />;

    case "refList": {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0) return <span className={styles.empty}>—</span>;
      return (
        <ul className={styles.refList}>
          {ids.map((id) => (
            <li key={id}>
              <RefReadValue entryId={id} />
            </li>
          ))}
        </ul>
      );
    }

    case "image":
      return <ImageReadValue assetId={typeof value === "string" ? value : null} />;

    case "imageList": {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0) return <span className={styles.empty}>—</span>;
      return (
        <div className={styles.gallery}>
          {ids.map((id) => (
            <ImageReadValue key={id} assetId={id} size={120} />
          ))}
        </div>
      );
    }
  }
}

function VocabReadValue({
  vocabularyId,
  itemId,
  pill,
}: {
  vocabularyId: string | undefined;
  itemId: string;
  pill?: boolean;
}) {
  const { vocabsById } = useVocabulariesContext();
  const label =
    (vocabularyId && vocabsById.get(vocabularyId)?.itemsById.get(itemId)?.label) ||
    itemId;
  return pill ? <span className={styles.pill}>{label}</span> : <span className={styles.text}>{label}</span>;
}

function RefReadValue({ entryId }: { entryId: string }) {
  const { items } = useEntriesContext();
  const entry = useMemo(() => items.find((e) => e.id === entryId), [items, entryId]);
  if (!entry) return <span className={styles.brokenRef}>(missing entry)</span>;
  return (
    <Link to={`/project/entry/${entry.id}`} className={styles.refLink}>
      {entry.name || "(untitled)"}
    </Link>
  );
}

function ImageReadValue({ assetId, size = 240 }: { assetId: string | null; size?: number }) {
  const { project } = useCurrentProject();
  if (!assetId || !project) return <span className={styles.empty}>—</span>;
  return (
    <div className={styles.imageWrap}>
      <AssetThumb projectPath={project.path} assetId={assetId} size={size} />
    </div>
  );
}
