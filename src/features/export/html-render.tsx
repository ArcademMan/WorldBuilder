import { renderToStaticMarkup } from "react-dom/server";

import * as api from "../../lib/api";
import type { LoadedVocab } from "../../hooks/use-vocabularies";
import type { Entry, Template } from "../../types";

// CSS modules — `?inline` returns the compiled CSS with the same hashed
// class names that the JS-side default import gives us. Inlining these
// is what makes the export visually identical to the viewer.
import readViewCss from "../entry-editor/EntryReadView.module.css?inline";
import layoutCss from "../entry-editor/LayoutRenderer.module.css?inline";
import readValueCss from "../entry-editor/ReadValue.module.css?inline";
import fieldsCss from "../../components/fields/fields.module.css?inline";
import markdownCss from "../../components/Markdown.module.css?inline";
import globalCss from "../../styles/global.css?inline";

import { StaticEntryView, type StaticRenderContext } from "./StaticEntryView";

export type ExportInput = {
  projectPath: string;
  projectName: string;
  entries: Entry[]; // selected, in the desired order
  allEntriesById: Map<string, Entry>;
  templatesById: Map<string, Template>;
  vocabsById: Map<string, LoadedVocab>;
};

/** Single concatenated HTML document with a navigable TOC. */
export async function renderSingleFile(input: ExportInput): Promise<string> {
  const ctx = await buildContext(input, /* singleFile */ true);

  const toc = input.entries.map(
    (e) =>
      `      <li><a href="#entry-${escapeAttr(e.id)}">${escapeHtml(e.name || "Untitled")}</a></li>`,
  );

  const articles = input.entries
    .map((e) => renderToStaticMarkup(<StaticEntryView entry={e} ctx={ctx} />))
    .join('\n<hr class="wb-entry-sep" />\n');

  const docHeader = `
    <header class="wb-doc-header">
      <h1>${escapeHtml(input.projectName)}</h1>
      <p class="wb-doc-meta">${input.entries.length} entries — exported ${escapeHtml(new Date().toLocaleString())}</p>
    </header>
    <nav class="wb-toc">
      <h2>Contents</h2>
      <ol>
${toc.join("\n")}
      </ol>
    </nav>`;

  return wrapDocument(input.projectName, docHeader + "\n<main>\n" + articles + "\n</main>");
}

/** One HTML file per entry + a small index page. */
export async function renderPerEntryFiles(
  input: ExportInput,
): Promise<{ name: string; content: string }[]> {
  const ctx = await buildContext(input, /* singleFile */ false);

  const files = input.entries.map((e) => {
    const article = renderToStaticMarkup(<StaticEntryView entry={e} ctx={ctx} />);
    const back = `<p class="wb-back"><a href="index.html">&larr; Index</a></p>`;
    return {
      name: `entry-${safeId(e.id)}.html`,
      content: wrapDocument(
        `${input.projectName} — ${e.name || "Untitled"}`,
        back + "\n" + article,
      ),
    };
  });

  const indexList = input.entries
    .map(
      (e) =>
        `      <li><a href="entry-${safeId(e.id)}.html">${escapeHtml(e.name || "Untitled")}</a></li>`,
    )
    .join("\n");

  files.unshift({
    name: "index.html",
    content: wrapDocument(
      input.projectName,
      `
    <header class="wb-doc-header">
      <h1>${escapeHtml(input.projectName)}</h1>
      <p class="wb-doc-meta">${input.entries.length} entries — exported ${escapeHtml(new Date().toLocaleString())}</p>
    </header>
    <main>
      <ol class="wb-index-list">
${indexList}
      </ol>
    </main>`,
    ),
  });

  return files;
}

// ---------------------------------------------------------------------------
// Context building — pre-resolves assets to data: URLs and builds the
// link resolver appropriate for the selected output mode.
// ---------------------------------------------------------------------------

async function buildContext(
  input: ExportInput,
  singleFile: boolean,
): Promise<StaticRenderContext> {
  const selectedIds = new Set(input.entries.map((e) => e.id));

  const linkForEntry = singleFile
    ? (id: string) => (selectedIds.has(id) ? `#entry-${id}` : null)
    : (id: string) => (selectedIds.has(id) ? `entry-${safeId(id)}.html` : null);

  const assetIds = collectAssetIds(input.entries);
  const assetUrls = await loadAssetsAsDataUrls(input.projectPath, assetIds);

  return {
    entriesById: input.allEntriesById,
    templatesById: input.templatesById,
    vocabsById: input.vocabsById,
    assetUrls,
    linkForEntry,
  };
}

function collectAssetIds(entries: Entry[]): string[] {
  const ids = new Set<string>();
  for (const e of entries) {
    for (const id of e.images) ids.add(id);
    for (const v of Object.values(e.fields)) {
      if (typeof v === "string" && v) ids.add(v);
      else if (Array.isArray(v)) for (const it of v) if (typeof it === "string" && it) ids.add(it);
    }
  }
  // We over-collect — non-asset strings end up here too, but readAsset
  // will simply fail for those and we skip them silently.
  return Array.from(ids);
}

async function loadAssetsAsDataUrls(
  projectPath: string,
  ids: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      try {
        const { mimeType, bytes } = await api.readAsset(projectPath, id);
        out.set(id, `data:${mimeType};base64,${bytesToBase64(bytes)}`);
      } catch {
        // Not an asset id (it's just some other field's string value), skip.
      }
    }),
  );
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  // chunked btoa to avoid call-stack limits with big images
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Document shell
// ---------------------------------------------------------------------------

function wrapDocument(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
${globalCss}
${readViewCss}
${layoutCss}
${readValueCss}
${fieldsCss}
${markdownCss}
${EXPORT_EXTRA_CSS}
</style>
</head>
<body>
<div class="wb-export-root">
${inner}
</div>
</body>
</html>`;
}

/** Tiny additions that exist only in the exported file (TOC, header). */
const EXPORT_EXTRA_CSS = `
.wb-export-root { max-width: 880px; margin: 0 auto; padding: var(--space-6); }
.wb-doc-header { margin-bottom: var(--space-6); }
.wb-doc-header h1 { font-size: 1.8rem; margin: 0 0 4px 0; }
.wb-doc-meta { color: var(--color-text-muted); margin: 0; font-size: 0.9rem; }
.wb-toc { background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-6); }
.wb-toc h2 { font-size: 1rem; margin: 0 0 6px 0; }
.wb-toc ol { margin: 0; padding-left: 1.25rem; }
.wb-entry-sep { border: none; border-top: 1px solid var(--color-border); margin: var(--space-6) 0; }
.wb-back { font-size: 0.9rem; margin: 0 0 var(--space-4) 0; }
.wb-index-list a { text-decoration: none; }
.wb-index-list a:hover { text-decoration: underline; }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
