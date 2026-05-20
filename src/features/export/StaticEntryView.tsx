/**
 * Read-only "wiki article" rendering for export. Mirrors EntryReadView /
 * LayoutRenderer / ReadValue HTML structure 1:1 while staying pure (no
 * hooks, no contexts) so it can be passed to `renderToStaticMarkup`.
 *
 * Reuses the actual CSS modules from the viewer — class names are the
 * same hashed identifiers used at runtime, and the export's <style> tag
 * inlines the compiled CSS via `?inline`. The result inside an exported
 * HTML file is visually identical to what the user sees in the app.
 */

import { COMMON_FIELD_DEFS, isCommonFieldKey, type CommonFieldKey } from "../../constants/common-fields";
import readViewStyles from "../entry-editor/EntryReadView.module.css";
import layoutStyles from "../entry-editor/LayoutRenderer.module.css";
import readValueStyles from "../entry-editor/ReadValue.module.css";
import fieldStyles from "../../components/fields/fields.module.css";
import markdownStyles from "../../components/Markdown.module.css";

import type { LoadedVocab } from "../../hooks/use-vocabularies";
import type {
  Entry,
  FieldDef,
  FieldValue,
  LayoutDisplay,
  LayoutItem,
  Template,
} from "../../types";

import { renderMarkdownToReact } from "./static-markdown";

export type StaticRenderContext = {
  entriesById: Map<string, Entry>;
  templatesById: Map<string, Template>;
  vocabsById: Map<string, LoadedVocab>;
  /** assetId → data: URL (pre-resolved at export time). */
  assetUrls: Map<string, string>;
  /** entryId → href used by ref/wikilink anchors. */
  linkForEntry: (id: string) => string | null;
};

const IMAGE_PIXEL_SIZES: Record<string, number> = {
  "image-small": 80,
  "image-medium": 160,
  "image-large": 280,
};

function readValue(entry: Entry, key: string): FieldValue | undefined {
  if (isCommonFieldKey(key)) return entry[key as CommonFieldKey];
  return entry.fields[key];
}

// ---------------------------------------------------------------------------
// Top-level article
// ---------------------------------------------------------------------------

export function StaticEntryView({
  entry,
  ctx,
}: {
  entry: Entry;
  ctx: StaticRenderContext;
}) {
  const template = ctx.templatesById.get(entry.templateId);

  const placedInLayout = new Set<string>();
  for (const sec of template?.layout ?? []) {
    for (const it of sec.items) placedInLayout.add(it.fieldKey);
  }

  const showTags = entry.tags.length > 0 && !placedInLayout.has("tags");
  const hasLayoutOrFields =
    !!template && (template.fields.length > 0 || template.layout.length > 0);
  const showBody = !placedInLayout.has("body");

  return (
    <article className={readViewStyles.article} id={`entry-${entry.id}`}>
      <header className={readViewStyles.header}>
        {template && (
          <div className={readViewStyles.badge}>
            {template.icon && <span>{template.icon}</span>}
            <span>{template.name}</span>
          </div>
        )}
        <h1 className={readViewStyles.title}>
          {entry.name || (
            <span className={readViewStyles.titlePlaceholder}>Untitled</span>
          )}
        </h1>
        {showTags && (
          <ul className={readViewStyles.tagList}>
            {entry.tags.map((t) => (
              <li key={t} className={readViewStyles.tag}>
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      {hasLayoutOrFields && template && (
        <section className={readViewStyles.fieldsSection}>
          <StaticLayout template={template} entry={entry} ctx={ctx} />
        </section>
      )}

      {showBody && entry.body && (
        <section className={readViewStyles.bodySection}>
          <div className={markdownStyles.root}>
            {renderMarkdownToReact(entry.body, ctx)}
          </div>
        </section>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Layout (mirrors LayoutRenderer.tsx)
// ---------------------------------------------------------------------------

function StaticLayout({
  template,
  entry,
  ctx,
}: {
  template: Template;
  entry: Entry;
  ctx: StaticRenderContext;
}) {
  const fieldByKey = new Map<string, FieldDef>();
  for (const f of COMMON_FIELD_DEFS) fieldByKey.set(f.key, f);
  for (const f of template.fields) fieldByKey.set(f.key, f);

  const referencedKeys = new Set<string>();
  for (const sec of template.layout) {
    for (const item of sec.items) referencedKeys.add(item.fieldKey);
  }
  const orphanFields = template.fields.filter((f) => !referencedKeys.has(f.key));

  return (
    <>
      {template.layout.map((section, secIdx) => (
        <section key={section.id ?? `sec-${secIdx}`} className={layoutStyles.section}>
          {section.title && (
            <h3 className={layoutStyles.sectionTitle}>{section.title}</h3>
          )}
          <div
            className={layoutStyles.columns}
            style={{
              gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: section.columns }, (_, colIdx) => (
              <StaticColumn
                key={colIdx}
                items={section.items.filter((it) => it.columnIndex === colIdx)}
                fieldByKey={fieldByKey}
                entry={entry}
                ctx={ctx}
              />
            ))}
          </div>
        </section>
      ))}

      {orphanFields.length > 0 && (
        <section className={layoutStyles.section}>
          {template.layout.length > 0 && (
            <h3 className={layoutStyles.sectionTitle}>Other fields</h3>
          )}
          <div className={layoutStyles.orphans}>
            {orphanFields.map((f) => (
              <div key={f.key} className={layoutStyles.readField}>
                <div className={layoutStyles.readLabel}>{f.label}</div>
                <StaticReadValue def={f} value={readValue(entry, f.key)} ctx={ctx} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
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
    if (it.display === "table-row") buffer.push(it);
    else {
      flush();
      out.push({ kind: "single", item: it });
    }
  }
  flush();
  return out;
}

function StaticColumn({
  items,
  fieldByKey,
  entry,
  ctx,
}: {
  items: LayoutItem[];
  fieldByKey: Map<string, FieldDef>;
  entry: Entry;
  ctx: StaticRenderContext;
}) {
  const blocks = groupTableRows(items);
  return (
    <div className={layoutStyles.column}>
      {blocks.map((block, bIdx) => {
        if (block.kind === "table") {
          return (
            <table className={layoutStyles.kvTable} key={`tbl-${bIdx}`}>
              <tbody>
                {block.items.map((it, i) => {
                  const def = fieldByKey.get(it.fieldKey);
                  return (
                    <tr key={it.id ?? `row-${i}`}>
                      <th className={layoutStyles.kvKey}>
                        {def?.label ?? it.fieldKey}
                      </th>
                      <td className={layoutStyles.kvVal}>
                        {def ? (
                          <StaticReadValue
                            def={def}
                            value={readValue(entry, def.key)}
                            ctx={ctx}
                          />
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
        const item = block.item;
        const def = fieldByKey.get(item.fieldKey);
        if (!def) {
          return (
            <p className={layoutStyles.missing} key={`mi-${bIdx}`}>
              Missing field <code>{item.fieldKey}</code>
            </p>
          );
        }
        if (isImageDisplay(item.display)) {
          return (
            <div className={layoutStyles.imageDisplay} key={`it-${bIdx}`}>
              <StaticImage
                def={def}
                value={readValue(entry, def.key)}
                size={IMAGE_PIXEL_SIZES[item.display]}
                ctx={ctx}
              />
            </div>
          );
        }
        // body field placed in layout has no label (mirrors viewer)
        const hideLabel = def.key === "body";
        return (
          <div className={layoutStyles.readField} key={`it-${bIdx}`}>
            {!hideLabel && (
              <div className={layoutStyles.readLabel}>{def.label}</div>
            )}
            <StaticReadValue
              def={def}
              value={readValue(entry, def.key)}
              ctx={ctx}
            />
          </div>
        );
      })}
    </div>
  );
}

function isImageDisplay(d: LayoutDisplay): d is
  | "image-small"
  | "image-medium"
  | "image-large" {
  return d === "image-small" || d === "image-medium" || d === "image-large";
}

// ---------------------------------------------------------------------------
// Read-only field renderer (mirrors ReadValue.tsx)
// ---------------------------------------------------------------------------

function StaticReadValue({
  def,
  value,
  ctx,
}: {
  def: FieldDef;
  value: FieldValue | undefined;
  ctx: StaticRenderContext;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className={readValueStyles.empty}>—</span>;
  }

  switch (def.type) {
    case "string":
    case "date":
    case "number":
      return <span className={readValueStyles.text}>{String(value)}</span>;
    case "text":
      return <p className={readValueStyles.paragraph}>{String(value)}</p>;
    case "markdown":
      return (
        <div className={markdownStyles.root}>
          {renderMarkdownToReact(String(value), ctx)}
        </div>
      );
    case "boolean":
      return (
        <span className={readValueStyles.text}>{value ? "Yes" : "No"}</span>
      );
    case "stringList": {
      const items = Array.isArray(value) ? value : [];
      if (items.length === 0)
        return <span className={readValueStyles.empty}>—</span>;
      return (
        <ul className={readValueStyles.pillList}>
          {items.map((s, i) => (
            <li key={i} className={readValueStyles.pill}>
              {s}
            </li>
          ))}
        </ul>
      );
    }
    case "vocab":
      return <StaticVocab def={def} itemId={String(value)} ctx={ctx} />;
    case "vocabList": {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0)
        return <span className={readValueStyles.empty}>—</span>;
      return (
        <ul className={readValueStyles.pillList}>
          {ids.map((id) => (
            <li key={id}>
              <StaticVocab def={def} itemId={id} ctx={ctx} pill />
            </li>
          ))}
        </ul>
      );
    }
    case "ref":
      return <StaticRef entryId={String(value)} ctx={ctx} />;
    case "refList": {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0)
        return <span className={readValueStyles.empty}>—</span>;
      return (
        <ul className={readValueStyles.refList}>
          {ids.map((id) => (
            <li key={id}>
              <StaticRef entryId={id} ctx={ctx} />
            </li>
          ))}
        </ul>
      );
    }
    case "image":
      return (
        <StaticImage
          def={def}
          value={typeof value === "string" ? value : null}
          size={240}
          ctx={ctx}
        />
      );
    case "imageList": {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0)
        return <span className={readValueStyles.empty}>—</span>;
      return (
        <div className={readValueStyles.gallery}>
          {ids.map((id) => (
            <StaticImage key={id} def={def} value={id} size={120} ctx={ctx} />
          ))}
        </div>
      );
    }
  }
}

function StaticVocab({
  def,
  itemId,
  ctx,
  pill,
}: {
  def: FieldDef;
  itemId: string;
  ctx: StaticRenderContext;
  pill?: boolean;
}) {
  const label =
    (def.vocabularyId &&
      ctx.vocabsById.get(def.vocabularyId)?.itemsById.get(itemId)?.label) ||
    itemId;
  return pill ? (
    <span className={readValueStyles.pill}>{label}</span>
  ) : (
    <span className={readValueStyles.text}>{label}</span>
  );
}

function StaticRef({
  entryId,
  ctx,
}: {
  entryId: string;
  ctx: StaticRenderContext;
}) {
  const target = ctx.entriesById.get(entryId);
  if (!target)
    return <span className={readValueStyles.brokenRef}>(missing entry)</span>;
  const href = ctx.linkForEntry(target.id);
  const label = target.name || "(untitled)";
  if (!href) return <span className={readValueStyles.text}>{label}</span>;
  return (
    <a href={href} className={readValueStyles.refLink}>
      {label}
    </a>
  );
}

function StaticImage({
  def: _def,
  value,
  size,
  ctx,
}: {
  def: FieldDef;
  value: FieldValue | string | null | undefined;
  size: number;
  ctx: StaticRenderContext;
}) {
  if (!value || typeof value !== "string") {
    return <span className={readValueStyles.empty}>—</span>;
  }
  const url = ctx.assetUrls.get(value);
  if (!url) {
    return (
      <div
        className={`${fieldStyles.imageThumbPlaceholder} ${fieldStyles.imageThumbBroken}`}
        style={{ width: size, height: size }}
        title="Missing asset"
      >
        ⚠︎
      </div>
    );
  }
  return (
    <div className={readValueStyles.imageWrap}>
      <img
        src={url}
        alt=""
        className={fieldStyles.imageThumb}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
