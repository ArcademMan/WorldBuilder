import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useCurrentProject } from "../../hooks/use-current-project";
import * as api from "../../lib/api";
import { useEntriesContext } from "../project-shell/entries-context";
import { useTemplatesContext } from "../project-shell/templates-context";
import { useVocabulariesContext } from "../project-shell/vocabularies-context";
import type { Entry } from "../../types";

import { renderPerEntryFiles, renderSingleFile } from "./html-render";
import styles from "./ExportPage.module.css";

type Format = "html" | "pdf";
type OutputMode = "single" | "per-entry";

/** Wizard-ish page: pick entries, choose order, pick format/output. */
export function ExportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { project } = useCurrentProject();
  const { items: entries } = useEntriesContext();
  const { items: templates, byId: templatesById } = useTemplatesContext();
  const { vocabsById } = useVocabulariesContext();

  // Selection by template id ("all" = every entry). `selectedIds` is the
  // canonical source of truth and stays in sync with the ordered list.
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    params.get("all") ? entries.map((e) => e.id) : [],
  );
  const [format, setFormat] = useState<Format>("html");
  const [outputMode, setOutputMode] = useState<OutputMode>("single");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset selection once on first entries load if ?all=1 fired before entries arrived.
  useEffect(() => {
    if (params.get("all") && selectedIds.length === 0 && entries.length > 0) {
      setSelectedIds(entries.map((e) => e.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const entriesById = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const e of entries) m.set(e.id, e);
    return m;
  }, [entries]);

  // Keep ordered list in sync with the selection set; preserve existing order.
  const orderedEntries = useMemo<Entry[]>(() => {
    const set = new Set(selectedIds);
    const ordered: Entry[] = [];
    for (const id of selectedIds) {
      const e = entriesById.get(id);
      if (e) ordered.push(e);
    }
    // Drop any orphan ids silently.
    return ordered.filter((e) => set.has(e.id));
  }, [selectedIds, entriesById]);

  function toggleEntry(id: string) {
    setSelectedIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    );
  }

  function selectAll() {
    setSelectedIds(entries.map((e) => e.id));
  }
  function selectNone() {
    setSelectedIds([]);
  }
  function selectTemplate(templateId: string) {
    const ids = entries.filter((e) => e.templateId === templateId).map((e) => e.id);
    setSelectedIds((curr) => Array.from(new Set([...curr, ...ids])));
  }

  function sortBy(kind: "name" | "template" | "created") {
    setSelectedIds((curr) => {
      const items = curr
        .map((id) => entriesById.get(id))
        .filter((e): e is Entry => !!e);
      items.sort((a, b) => {
        if (kind === "name") return a.name.localeCompare(b.name);
        if (kind === "created") return a.createdAt.localeCompare(b.createdAt);
        // by template name, fallback to entry name
        const ta = templatesById.get(a.templateId)?.name ?? "";
        const tb = templatesById.get(b.templateId)?.name ?? "";
        const cmp = ta.localeCompare(tb);
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
      });
      return items.map((e) => e.id);
    });
  }

  function move(from: number, to: number) {
    setSelectedIds((curr) => {
      if (to < 0 || to >= curr.length || from === to) return curr;
      const next = curr.slice();
      const [taken] = next.splice(from, 1);
      next.splice(to, 0, taken);
      return next;
    });
  }

  async function runExport() {
    if (!project) return;
    if (orderedEntries.length === 0) {
      setError("Select at least one entry.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input = {
        projectPath: project.path,
        projectName: project.meta.name,
        entries: orderedEntries,
        allEntriesById: entriesById,
        templatesById,
        vocabsById,
      };

      if (format === "pdf") {
        const html = await renderSingleFile(input);
        await printHtmlToPdf(html, `${project.meta.name}.pdf`);
      } else if (outputMode === "single") {
        const path = await api.pickSaveFile(
          `${project.meta.name}.html`,
          "html",
          "HTML",
        );
        if (!path) {
          setBusy(false);
          return;
        }
        const html = await renderSingleFile(input);
        await api.writeTextFile(path, html);
      } else {
        const dir = await api.pickExportFolder();
        if (!dir) {
          setBusy(false);
          return;
        }
        const files = await renderPerEntryFiles(input);
        await api.writeTextFiles(dir, files);
      }

      if (format !== "pdf") navigate("/project");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!project) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>No project open.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Export</h1>
        <p className={styles.muted}>
          Choose what to export, pick the order, and select the output format.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. What to export</h2>
        <div className={styles.row}>
          <button type="button" onClick={selectAll}>
            All entries ({entries.length})
          </button>
          <button type="button" onClick={selectNone}>
            None
          </button>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTemplate(t.id)}
              title={`Add all entries of template "${t.name}"`}
            >
              + {t.name}
            </button>
          ))}
        </div>
        <details className={styles.picker}>
          <summary>
            Pick specific entries… ({selectedIds.length} selected)
          </summary>
          <ul className={styles.checkList}>
            {entries.map((e) => (
              <li key={e.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggleEntry(e.id)}
                  />
                  <span>{e.name || "Untitled"}</span>
                  <span className={styles.tplHint}>
                    {templatesById.get(e.templateId)?.name ?? "—"}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className={styles.section}>
        <h2>2. Order ({orderedEntries.length})</h2>
        <div className={styles.row}>
          <button type="button" onClick={() => sortBy("name")}>
            Sort by name
          </button>
          <button type="button" onClick={() => sortBy("template")}>
            Sort by template
          </button>
          <button type="button" onClick={() => sortBy("created")}>
            Sort by created date
          </button>
        </div>
        {orderedEntries.length === 0 ? (
          <p className={styles.muted}>Nothing selected yet.</p>
        ) : (
          <OrderableList
            entries={orderedEntries}
            templateName={(id) => templatesById.get(id)?.name ?? "—"}
            onMove={move}
            onRemove={(id) => toggleEntry(id)}
          />
        )}
      </section>

      <section className={styles.section}>
        <h2>3. Format & output</h2>
        <div className={styles.formatRow}>
          <label>
            <span>Format</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
            >
              <option value="html">HTML</option>
              <option value="pdf">PDF (via print dialog)</option>
            </select>
          </label>
          <label>
            <span>Output</span>
            <select
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value as OutputMode)}
              disabled={format === "pdf"}
              title={
                format === "pdf"
                  ? "PDF export always produces a single document."
                  : undefined
              }
            >
              <option value="single">Single file (concatenated, with TOC)</option>
              <option value="per-entry">One file per entry (in a folder)</option>
            </select>
          </label>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <footer className={styles.footer}>
        <button type="button" onClick={() => navigate("/project")} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => void runExport()}
          disabled={busy || orderedEntries.length === 0}
        >
          {busy ? "Exporting…" : "Export"}
        </button>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF export via the webview's print dialog. The user picks "Save as PDF"
// (or a real printer) and the OS handles file-picking and rendering.
// ---------------------------------------------------------------------------

function printHtmlToPdf(html: string, suggestedTitle: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    // The print dialog uses document.title as the suggested filename.
    const titled = injectTitle(html, suggestedTitle.replace(/\.pdf$/i, ""));

    iframe.srcdoc = titled;

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
      resolve();
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      // Some browsers/webviews don't fire afterprint reliably; fall back to a timer.
      const fallback = window.setTimeout(cleanup, 60_000);
      win.addEventListener("afterprint", () => {
        window.clearTimeout(fallback);
        cleanup();
      });
      // Defer one frame to let layout/CSS settle inside the iframe.
      requestAnimationFrame(() => {
        try {
          win.focus();
          win.print();
        } catch {
          cleanup();
        }
      });
    };

    document.body.appendChild(iframe);
  });
}

function injectTitle(html: string, title: string): string {
  const tag = `<title>${title.replace(/</g, "&lt;")}</title>`;
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, tag);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`);
  }
  return `${tag}\n${html}`;
}

// ---------------------------------------------------------------------------
// Ordered list with drag-and-drop reordering.
// ---------------------------------------------------------------------------

function OrderableList({
  entries,
  templateName,
  onMove,
  onRemove,
}: {
  entries: Entry[];
  templateName: (templateId: string) => string;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <ol className={styles.orderList}>
      {entries.map((e, i) => (
        <li
          key={e.id}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragOver={(ev) => {
            ev.preventDefault();
            if (overIndex !== i) setOverIndex(i);
          }}
          onDrop={(ev) => {
            ev.preventDefault();
            if (dragIndex != null) onMove(dragIndex, i);
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`${styles.orderItem} ${overIndex === i ? styles.dropTarget : ""} ${dragIndex === i ? styles.dragging : ""}`}
        >
          <span className={styles.handle} aria-hidden>
            ⋮⋮
          </span>
          <span className={styles.idx}>{i + 1}.</span>
          <span className={styles.entryName}>{e.name || "Untitled"}</span>
          <span className={styles.tplHint}>{templateName(e.templateId)}</span>
          <div className={styles.itemActions}>
            <button
              type="button"
              onClick={() => onMove(i, i - 1)}
              disabled={i === 0}
              aria-label="Move up"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(i, i + 1)}
              disabled={i === entries.length - 1}
              aria-label="Move down"
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onRemove(e.id)}
              aria-label="Remove from export"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
