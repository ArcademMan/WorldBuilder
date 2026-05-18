import { useState } from "react";

import { useCurrentProject } from "../../hooks/use-current-project";
import * as api from "../../lib/api";
import type { FieldDef } from "../../types";

import { AssetThumb } from "./ImageField";
import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  disabled?: boolean;
};

/** Multi-image grid. Each thumb has its own remove button. */
export function ImageListField({ def, value, onChange, disabled }: Props) {
  const { project } = useCurrentProject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = value ?? [];

  async function handlePick() {
    if (!project) return;
    setError(null);
    const paths = await api.pickImage(true);
    if (!paths || paths.length === 0) return;
    setBusy(true);
    try {
      const next = [...ids];
      for (const p of paths) {
        const asset = await api.importAsset(project.path, p);
        next.push(asset.id);
      }
      onChange(next);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function removeAt(index: number) {
    const next = ids.filter((_, i) => i !== index);
    onChange(next.length === 0 ? null : next);
  }

  return (
    <FormField
      label={def.label}
      helpText={def.helpText ?? "Multiple images can be added at once."}
      required={def.required}
    >
      <div className={styles.imageGrid}>
        {project &&
          ids.map((id, i) => (
            <div key={`${id}-${i}`} className={styles.imageGridItem}>
              <AssetThumb projectPath={project.path} assetId={id} size={96} />
              <button
                type="button"
                className={styles.imageGridRemove}
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        <button
          type="button"
          className={styles.imageGridAdd}
          onClick={handlePick}
          disabled={disabled || busy || !project}
        >
          {busy ? "…" : "+"}
        </button>
      </div>
      {error && <p className={styles.warning}>{error}</p>}
    </FormField>
  );
}
