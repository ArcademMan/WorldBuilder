import { Fragment, useState } from "react";

import { BareFieldProvider, FieldRenderer } from "../../components/fields";
import { AssetThumb } from "../../components/fields/ImageField";
import {
  COMMON_FIELD_DEFS,
  isCommonFieldKey,
  type CommonFieldKey,
} from "../../constants/common-fields";
import { useCurrentProject } from "../../hooks/use-current-project";
import * as api from "../../lib/api";
import type {
  Entry,
  FieldDef,
  FieldValue,
  LayoutDisplay,
  LayoutItem,
  Template,
} from "../../types";

import { EditableField } from "./EditableField";
import { InlineBody } from "./InlineBody";
import styles from "./LayoutRenderer.module.css";

/** Look up a field value, falling back to top-level common fields. */
function readValue(entry: Entry, key: string): FieldValue | undefined {
  if (isCommonFieldKey(key)) {
    return entry[key as CommonFieldKey];
  }
  return entry.fields[key];
}

type Props = {
  template: Template;
  entry: Entry;
  disabled?: boolean;
  /** "edit" = classic form with labels; "view" = inline-editable read view. */
  mode?: "edit" | "view";
  onChange?: (key: string, value: FieldValue | null) => void;
  /** Called when an inline edit loses focus (view mode only). */
  onCommit?: () => void;
};

const IMAGE_PIXEL_SIZES: Record<string, number> = {
  "image-small": 80,
  "image-medium": 160,
  "image-large": 280,
};

/**
 * Renders an entry's template fields according to the template's layout.
 * Consecutive `table-row` items in the same column collapse into a
 * single key:value table; image-{size} items render as fixed-size
 * thumbnails (clicking still goes through the regular ImageField for
 * upload/remove). Any field not referenced by the layout is rendered
 * normally in a trailing "Other" block so adding a field never makes
 * it invisible.
 */
const noop = () => {};

export function LayoutRenderer({
  template,
  entry,
  disabled,
  mode = "edit",
  onChange,
  onCommit,
}: Props) {
  const fieldByKey = new Map<string, FieldDef>();
  for (const f of COMMON_FIELD_DEFS) fieldByKey.set(f.key, f);
  for (const f of template.fields) fieldByKey.set(f.key, f);

  const referencedKeys = new Set<string>();
  for (const sec of template.layout) {
    for (const item of sec.items) referencedKeys.add(item.fieldKey);
  }
  // Only template fields can be "orphaned" — common fields are
  // rendered elsewhere (title, body section) when not in the layout.
  const orphanFields = template.fields.filter((f) => !referencedKeys.has(f.key));
  const handleChange = onChange ?? noop;
  const handleCommit = onCommit ?? noop;

  return (
    <>
      {template.layout.map((section, secIdx) => {
        // Wiki-style flow: in view mode, when a multi-column section
        // contains the body field, render the body column as the main
        // flow and the other columns as a floated aside so a long body
        // wraps under the infobox instead of being trapped in a narrow
        // column.
        const bodyItem =
          mode === "view"
            ? section.items.find((it) => it.fieldKey === "body")
            : undefined;
        const wikiFlow = bodyItem && section.columns >= 2;

        return (
          <section
            key={section.id ?? `sec-${secIdx}`}
            className={styles.section}
          >
            {section.title && <h3 className={styles.sectionTitle}>{section.title}</h3>}
            {wikiFlow ? (
              <div className={styles.wikiFlow}>
                <aside className={styles.wikiAside}>
                  {Array.from({ length: section.columns }, (_, colIdx) =>
                    colIdx === bodyItem!.columnIndex ? null : (
                      <ColumnRenderer
                        key={colIdx}
                        items={section.items.filter((it) => it.columnIndex === colIdx)}
                        fieldByKey={fieldByKey}
                        entry={entry}
                        disabled={disabled}
                        mode={mode}
                        onChange={handleChange}
                        onCommit={handleCommit}
                      />
                    ),
                  )}
                </aside>
                <ColumnRenderer
                  items={section.items.filter(
                    (it) => it.columnIndex === bodyItem!.columnIndex,
                  )}
                  fieldByKey={fieldByKey}
                  entry={entry}
                  disabled={disabled}
                  mode={mode}
                  onChange={handleChange}
                  onCommit={handleCommit}
                />
              </div>
            ) : (
              <div
                className={styles.columns}
                style={{
                  gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: section.columns }, (_, colIdx) => (
                  <ColumnRenderer
                    key={colIdx}
                    items={section.items.filter((it) => it.columnIndex === colIdx)}
                    fieldByKey={fieldByKey}
                    entry={entry}
                    disabled={disabled}
                    mode={mode}
                    onChange={handleChange}
                    onCommit={handleCommit}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {orphanFields.length > 0 && (
        <section className={styles.section}>
          {template.layout.length > 0 && (
            <h3 className={styles.sectionTitle}>Other fields</h3>
          )}
          <div className={styles.orphans}>
            {orphanFields.map((f) =>
              mode === "view" ? (
                <div key={f.key} className={styles.readField}>
                  <div className={styles.readLabel}>{f.label}</div>
                  <EditableField
                    def={f}
                    value={readValue(entry, f.key)}
                    onChange={(v) => handleChange(f.key, v)}
                    onCommit={handleCommit}
                  />
                </div>
              ) : (
                <FieldRenderer
                  key={f.key}
                  def={f}
                  value={readValue(entry, f.key)}
                  onChange={(v) => handleChange(f.key, v)}
                  disabled={disabled}
                />
              ),
            )}
          </div>
        </section>
      )}
    </>
  );
}

type ColProps = {
  items: LayoutItem[];
  fieldByKey: Map<string, FieldDef>;
  entry: Entry;
  disabled?: boolean;
  mode: "edit" | "view";
  onChange: (key: string, value: FieldValue | null) => void;
  onCommit: () => void;
};

/**
 * Walks one column's items, batching consecutive table-row entries into
 * a single rendered table so multiple key:value rows visually belong to
 * the same infobox block.
 */
function ColumnRenderer({
  items,
  fieldByKey,
  entry,
  disabled,
  mode,
  onChange,
  onCommit,
}: ColProps) {
  const blocks = groupTableRows(items);
  return (
    <div className={styles.column}>
      {blocks.map((block, bIdx) => {
        if (block.kind === "table") {
          return (
            <TableBlock
              key={`tbl-${bIdx}`}
              items={block.items}
              fieldByKey={fieldByKey}
              entry={entry}
              disabled={disabled}
              mode={mode}
              onChange={onChange}
              onCommit={onCommit}
            />
          );
        }
        const item = block.item;
        const def = fieldByKey.get(item.fieldKey);
        return (
          <Fragment key={`it-${bIdx}`}>
            <SingleItem
              item={item}
              def={def}
              entry={entry}
              disabled={disabled}
              mode={mode}
              onChange={onChange}
              onCommit={onCommit}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

type Block =
  | { kind: "table"; items: LayoutItem[] }
  | { kind: "single"; item: LayoutItem };

function groupTableRows(items: LayoutItem[]): Block[] {
  const out: Block[] = [];
  let buffer: LayoutItem[] = [];
  const flush = () => {
    if (buffer.length > 0) {
      out.push({ kind: "table", items: buffer });
      buffer = [];
    }
  };
  for (const it of items) {
    if (it.display === "table-row") {
      buffer.push(it);
    } else {
      flush();
      out.push({ kind: "single", item: it });
    }
  }
  flush();
  return out;
}

function SingleItem({
  item,
  def,
  entry,
  disabled,
  mode,
  onChange,
  onCommit,
}: {
  item: LayoutItem;
  def: FieldDef | undefined;
  entry: Entry;
  disabled?: boolean;
  mode: "edit" | "view";
  onChange: (key: string, value: FieldValue | null) => void;
  onCommit: () => void;
}) {
  if (!def) {
    return (
      <p className={styles.missing}>
        Missing field <code>{item.fieldKey}</code>
      </p>
    );
  }
  if (isImageDisplay(item.display)) {
    return (
      <ImageDisplay
        def={def}
        value={readValue(entry, def.key)}
        size={IMAGE_PIXEL_SIZES[item.display]}
        disabled={disabled}
        mode={mode}
        onChange={(v) => onChange(def.key, v)}
        onCommit={onCommit}
      />
    );
  }
  if (mode === "view") {
    // Body is the article's main prose. Render it via InlineBody (a
    // plain <div> trigger) instead of EditableField's <button>, because
    // a <button> establishes a Block Formatting Context and would stop
    // the body text from wrapping around the floated infobox aside in
    // wiki-style layouts. Also no label wrapper, for the same reason
    // (.readField is display:flex, another BFC).
    if (def.key === "body") {
      return (
        <InlineBody
          value={typeof readValue(entry, "body") === "string" ? (readValue(entry, "body") as string) : ""}
          onChange={(v) => onChange("body", v)}
          onCommit={onCommit}
        />
      );
    }
    return (
      <div className={styles.readField}>
        <div className={styles.readLabel}>{def.label}</div>
        <EditableField
          def={def}
          value={readValue(entry, def.key)}
          onChange={(v) => onChange(def.key, v)}
          onCommit={onCommit}
        />
      </div>
    );
  }
  return (
    <FieldRenderer
      def={def}
      value={readValue(entry, def.key)}
      onChange={(v) => onChange(def.key, v)}
      disabled={disabled}
    />
  );
}

function TableBlock({
  items,
  fieldByKey,
  entry,
  disabled,
  mode,
  onChange,
  onCommit,
}: {
  items: LayoutItem[];
  fieldByKey: Map<string, FieldDef>;
  entry: Entry;
  disabled?: boolean;
  mode: "edit" | "view";
  onChange: (key: string, value: FieldValue | null) => void;
  onCommit: () => void;
}) {
  return (
    <table className={styles.kvTable}>
      <tbody>
        {items.map((it, i) => {
          const def = fieldByKey.get(it.fieldKey);
          return (
            <tr key={it.id ?? `row-${i}`}>
              <th className={styles.kvKey}>
                {def?.label ?? it.fieldKey}
                {mode === "edit" && def?.required && (
                  <span className={styles.kvReq}>*</span>
                )}
              </th>
              <td className={styles.kvVal}>
                {def ? (
                  mode === "view" ? (
                    <EditableField
                      def={def}
                      value={readValue(entry, def.key)}
                      onChange={(v) => onChange(def.key, v)}
                      onCommit={onCommit}
                    />
                  ) : (
                    <BareFieldProvider>
                      <FieldRenderer
                        def={def}
                        value={readValue(entry, def.key)}
                        onChange={(v) => onChange(def.key, v)}
                        disabled={disabled}
                      />
                    </BareFieldProvider>
                  )
                ) : (
                  <em>missing</em>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ImageDisplay({
  def,
  value,
  size,
  disabled,
  mode,
  onChange,
  onCommit,
}: {
  def: FieldDef;
  value: FieldValue | undefined;
  size: number;
  disabled?: boolean;
  mode: "edit" | "view";
  onChange: (v: FieldValue | null) => void;
  onCommit: () => void;
}) {
  // For now layout-mode image display only supports the single-image
  // field type; an imageList falls through to its normal renderer so
  // the user can still manage the gallery.
  if (def.type !== "image") {
    if (mode === "view") {
      return <EditableField def={def} value={value} onChange={onChange} onCommit={onCommit} />;
    }
    return (
      <FieldRenderer
        def={def}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (mode === "view") {
    return (
      <ViewImage
        def={def}
        value={typeof value === "string" ? value : null}
        size={size}
        onChange={onChange}
        onCommit={onCommit}
      />
    );
  }
  return (
    <EditImage
      def={def}
      value={typeof value === "string" ? value : null}
      size={size}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

function EditImage({
  def,
  value,
  size,
  disabled,
  onChange,
}: {
  def: FieldDef;
  value: string | null;
  size: number;
  disabled?: boolean;
  onChange: (v: FieldValue | null) => void;
}) {
  const { project } = useCurrentProject();
  return (
    <div className={styles.imageDisplay}>
      {value && project ? (
        <AssetThumb projectPath={project.path} assetId={value} size={size} />
      ) : (
        <div
          className={styles.imagePlaceholder}
          style={{ width: size, height: size }}
        >
          {def.label}
        </div>
      )}
      <FieldRenderer
        def={def}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function ViewImage({
  def,
  value,
  size,
  onChange,
  onCommit,
}: {
  def: FieldDef;
  value: string | null;
  size: number;
  onChange: (v: FieldValue | null) => void;
  onCommit: () => void;
}) {
  const { project } = useCurrentProject();
  const [busy, setBusy] = useState(false);

  async function pickAndUpload() {
    if (!project || busy) return;
    setBusy(true);
    try {
      const paths = await api.pickImage(false);
      if (paths && paths.length > 0) {
        const asset = await api.importAsset(project.path, paths[0]);
        onChange(asset.id);
        onCommit();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!value) {
    return (
      <button
        type="button"
        className={styles.imageUploadPlaceholder}
        style={{ width: size, height: size }}
        onClick={() => void pickAndUpload()}
        disabled={busy || !project}
        title={`Add image — ${def.label}`}
      >
        <span className={styles.imageUploadIcon}>+</span>
        <span className={styles.imageUploadHint}>
          {busy ? "Uploading…" : def.label}
        </span>
      </button>
    );
  }

  return (
    <EditableField
      def={def}
      value={value}
      onChange={onChange}
      onCommit={onCommit}
    />
  );
}

function isImageDisplay(d: LayoutDisplay): d is
  | "image-small"
  | "image-medium"
  | "image-large" {
  return d === "image-small" || d === "image-medium" || d === "image-large";
}
