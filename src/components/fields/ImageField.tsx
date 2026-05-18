import { useState } from "react";

import { useAssetUrl } from "../../hooks/use-asset-url";
import { useCurrentProject } from "../../hooks/use-current-project";
import * as api from "../../lib/api";
import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/** Single image. Stores the asset id; renders via useAssetUrl. */
export function ImageField({ def, value, onChange, disabled }: Props) {
  const { project } = useCurrentProject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick() {
    if (!project) return;
    setError(null);
    const paths = await api.pickImage(false);
    if (!paths || paths.length === 0) return;
    setBusy(true);
    try {
      const asset = await api.importAsset(project.path, paths[0]);
      onChange(asset.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormField label={def.label} helpText={def.helpText} required={def.required}>
      <div className={styles.imageFieldRow}>
        {value && project && (
          <AssetThumb
            projectPath={project.path}
            assetId={value}
            size={120}
          />
        )}
        <div className={styles.imageFieldActions}>
          <button
            type="button"
            className={styles.imageButton}
            onClick={handlePick}
            disabled={disabled || busy || !project}
          >
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              className={styles.imageButton}
              onClick={() => onChange(null)}
              disabled={disabled || busy}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className={styles.warning}>{error}</p>}
    </FormField>
  );
}

type ThumbProps = { projectPath: string; assetId: string; size: number };

/** Local renderer for an asset; pulled out so the parent stays thin. */
export function AssetThumb({ projectPath, assetId, size }: ThumbProps) {
  const { url, loading, error } = useAssetUrl(projectPath, assetId);
  if (loading) {
    return (
      <div
        className={styles.imageThumbPlaceholder}
        style={{ width: size, height: size }}
      >
        …
      </div>
    );
  }
  if (error || !url) {
    return (
      <div
        className={`${styles.imageThumbPlaceholder} ${styles.imageThumbBroken}`}
        style={{ width: size, height: size }}
        title={error ?? "Missing asset"}
      >
        ⚠︎
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={styles.imageThumb}
      style={{ width: size, height: size }}
    />
  );
}
