import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

import { Button } from "../../../components/Button";
import {
  COMMON_FIELD_DEFS,
  isCommonFieldKey,
} from "../../../constants/common-fields";
import type {
  FieldDef,
  LayoutDisplay,
  LayoutItem,
  LayoutSection,
} from "../../../types";

import styles from "../TemplateEditorPage.module.css";

const COLUMN_OPTIONS = [1, 2, 3];

const DISPLAY_OPTIONS: Array<{ value: LayoutDisplay; label: string }> = [
  { value: "field", label: "Standard field" },
  { value: "image-small", label: "Image · small" },
  { value: "image-medium", label: "Image · medium" },
  { value: "image-large", label: "Image · large" },
  { value: "table-row", label: "Key:value row" },
];

type Props = {
  fields: FieldDef[];
  layout: LayoutSection[];
  onChange: (next: LayoutSection[]) => void;
};

/**
 * Compose-by-clicking layout editor. The user creates sections (each
 * 1/2/3 columns) and adds items pointing at the template's own fields.
 * No drag&drop — re-order with ↑/↓. Display mode is validated against
 * the field type so e.g. "image-large" only appears on image fields.
 */
export function LayoutEditor({ fields, layout, onChange }: Props) {
  // Common (built-in) fields are always referenceable from the layout,
  // alongside template-specific ones.
  const allFields: FieldDef[] = [...COMMON_FIELD_DEFS, ...fields];
  function patchSection(index: number, partial: Partial<LayoutSection>) {
    onChange(layout.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  }

  function moveSection(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= layout.length) return;
    const next = layout.slice();
    const [s] = next.splice(index, 1);
    next.splice(target, 0, s);
    onChange(next);
  }

  function addSection() {
    onChange([
      ...layout,
      { title: "", columns: 1, items: [] },
    ]);
  }

  function removeSection(index: number) {
    onChange(layout.filter((_, i) => i !== index));
  }

  function patchItem(secIdx: number, itemIdx: number, partial: Partial<LayoutItem>) {
    const next = layout.slice();
    const items = next[secIdx].items.slice();
    items[itemIdx] = { ...items[itemIdx], ...partial };
    next[secIdx] = { ...next[secIdx], items };
    onChange(next);
  }

  function moveItem(secIdx: number, itemIdx: number, delta: -1 | 1) {
    const target = itemIdx + delta;
    const items = layout[secIdx].items;
    if (target < 0 || target >= items.length) return;
    const nextItems = items.slice();
    const [it] = nextItems.splice(itemIdx, 1);
    nextItems.splice(target, 0, it);
    const next = layout.slice();
    next[secIdx] = { ...next[secIdx], items: nextItems };
    onChange(next);
  }

  function removeItem(secIdx: number, itemIdx: number) {
    const next = layout.slice();
    next[secIdx] = {
      ...next[secIdx],
      items: next[secIdx].items.filter((_, i) => i !== itemIdx),
    };
    onChange(next);
  }

  function addItem(secIdx: number, columnIndex: number) {
    // Pick the first field not yet placed in this section as a sensible
    // default; fall back to the very first field.
    const usedKeys = new Set(layout[secIdx].items.map((i) => i.fieldKey));
    const candidate =
      allFields.find((f) => !usedKeys.has(f.key)) ?? allFields[0];
    if (!candidate) return;
    const next = layout.slice();
    next[secIdx] = {
      ...next[secIdx],
      items: [
        ...next[secIdx].items,
        {
          fieldKey: candidate.key,
          columnIndex,
          display: defaultDisplayFor(candidate),
        },
      ],
    };
    onChange(next);
  }

  return (
    <div className={styles.layoutEditor}>
      {layout.length === 0 && (
        <p className={styles.empty}>
          No sections yet — fields will render in declaration order. Click
          <em> Add section</em> to start composing.
        </p>
      )}

      {layout.map((section, secIdx) => (
        <div key={section.id ?? `sec-${secIdx}`} className={styles.layoutSection}>
          <div className={styles.layoutSectionHeader}>
            <input
              className={styles.input}
              value={section.title ?? ""}
              placeholder="Section title (optional)"
              onChange={(e) => patchSection(secIdx, { title: e.target.value })}
            />
            <label className={styles.inlineLabel}>
              Columns
              <select
                className={styles.select}
                value={section.columns}
                onChange={(e) =>
                  patchSection(secIdx, { columns: Number(e.target.value) })
                }
              >
                {COLUMN_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.fieldActions}>
              <button
                type="button"
                className={styles.iconAction}
                disabled={secIdx === 0}
                title="Move section up"
                aria-label="Move section up"
                onClick={() => moveSection(secIdx, -1)}
              >
                <ChevronUp size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className={styles.iconAction}
                disabled={secIdx === layout.length - 1}
                title="Move section down"
                aria-label="Move section down"
                onClick={() => moveSection(secIdx, 1)}
              >
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className={`${styles.iconAction} ${styles.iconActionDanger}`}
                title="Remove section"
                aria-label="Remove section"
                onClick={() => removeSection(secIdx)}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div
            className={styles.layoutColumns}
            style={{
              gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: section.columns }, (_, colIdx) => {
              const itemsInCol = section.items
                .map((it, i) => ({ it, i }))
                .filter(({ it }) => it.columnIndex === colIdx);
              return (
                <div key={colIdx} className={styles.layoutColumn}>
                  <div className={styles.layoutColumnHeader}>
                    Column {colIdx + 1}
                  </div>
                  {itemsInCol.map(({ it, i }) => (
                    <LayoutItemRow
                      key={it.id ?? `it-${i}`}
                      item={it}
                      fields={allFields}
                      onChange={(partial) => patchItem(secIdx, i, partial)}
                      onMoveUp={() => moveItem(secIdx, i, -1)}
                      onMoveDown={() => moveItem(secIdx, i, 1)}
                      onRemove={() => removeItem(secIdx, i)}
                    />
                  ))}
                  <button
                    type="button"
                    className={styles.addLayoutItem}
                    onClick={() => addItem(secIdx, colIdx)}
                    disabled={allFields.length === 0}
                  >
                    <Plus size={14} strokeWidth={2} />
                    Add item
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        onClick={addSection}
        className={`${styles.iconButton} ${styles.addSection}`}
      >
        <Plus size={15} strokeWidth={2} />
        <span>Add section</span>
      </Button>
    </div>
  );
}

type ItemRowProps = {
  item: LayoutItem;
  fields: FieldDef[];
  onChange: (partial: Partial<LayoutItem>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

function LayoutItemRow({
  item,
  fields,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ItemRowProps) {
  const currentField = fields.find((f) => f.key === item.fieldKey);
  const allowedDisplays = DISPLAY_OPTIONS.filter((d) =>
    isDisplayValidForField(d.value, currentField),
  );

  return (
    <div className={styles.layoutItemRow}>
      <select
        className={styles.select}
        value={item.fieldKey}
        onChange={(e) => {
          const nextField = fields.find((f) => f.key === e.target.value);
          onChange({
            fieldKey: e.target.value,
            // Reset display if the new field doesn't support the current one.
            display: nextField && isDisplayValidForField(item.display, nextField)
              ? item.display
              : defaultDisplayFor(nextField),
          });
        }}
      >
        <optgroup label="Built-in">
          {fields
            .filter((f) => isCommonFieldKey(f.key))
            .map((f) => (
              <option key={f.key} value={f.key}>
                {f.label || f.key}
              </option>
            ))}
        </optgroup>
        <optgroup label="Template fields">
          {fields
            .filter((f) => !isCommonFieldKey(f.key))
            .map((f) => (
              <option key={f.key} value={f.key}>
                {f.label || f.key}
              </option>
            ))}
        </optgroup>
        {!currentField && (
          <option value={item.fieldKey}>
            ⚠ {item.fieldKey} (missing)
          </option>
        )}
      </select>
      <select
        className={styles.select}
        value={item.display}
        onChange={(e) =>
          onChange({ display: e.target.value as LayoutDisplay })
        }
      >
        {allowedDisplays.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
      <div className={styles.fieldActions}>
        <button
          type="button"
          className={styles.iconAction}
          title="Move up"
          aria-label="Move up"
          onClick={onMoveUp}
        >
          <ChevronUp size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={styles.iconAction}
          title="Move down"
          aria-label="Move down"
          onClick={onMoveDown}
        >
          <ChevronDown size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={`${styles.iconAction} ${styles.iconActionDanger}`}
          title="Remove item"
          aria-label="Remove item"
          onClick={onRemove}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function isDisplayValidForField(
  display: LayoutDisplay,
  field: FieldDef | undefined,
): boolean {
  if (!field) return true; // tolerate orphaned items so user can fix them
  const isImage = field.type === "image" || field.type === "imageList";
  switch (display) {
    case "image-small":
    case "image-medium":
    case "image-large":
      return isImage;
    default:
      return true;
  }
}

function defaultDisplayFor(field: FieldDef | undefined): LayoutDisplay {
  if (!field) return "field";
  if (field.type === "image" || field.type === "imageList") return "image-medium";
  return "field";
}
