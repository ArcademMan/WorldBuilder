/**
 * Markdown rendering for export. Mirrors `components/Markdown.tsx` but
 * resolves wikilinks against a pre-built export context instead of React
 * contexts, so it works inside `renderToStaticMarkup`.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import markdownStyles from "../../components/Markdown.module.css";

import type { StaticRenderContext } from "./StaticEntryView";

const WIKI_SCHEME = "wiki:";
const WIKILINK_RE = /\[\[([^\[\]\n]+?)\]\]/g;

export function renderMarkdownToReact(
  source: string,
  ctx: StaticRenderContext,
): React.ReactNode {
  const prepared = transformWikilinks(source);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // react-markdown v10's default urlTransform strips any non-allowlisted
      // scheme (including our `wiki:` indirection) to an empty href before
      // the custom `a` renderer runs. Pass-through so wikilinks survive.
      urlTransform={(url) => url}
      components={{
        a: ({ href, children }) => {
          if (href?.startsWith(WIKI_SCHEME)) {
            const target = decodeURIComponent(href.slice(WIKI_SCHEME.length));
            return resolveWikilink(target, children, ctx);
          }
          return (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          );
        },
      }}
    >
      {prepared}
    </ReactMarkdown>
  );
}

function transformWikilinks(input: string): string {
  return input.replace(WIKILINK_RE, (_match, raw: string) => {
    const text = raw.trim();
    if (!text) return _match;
    return `[${escapeMd(text)}](${WIKI_SCHEME}${encodeURIComponent(text)})`;
  });
}

function escapeMd(text: string): string {
  return text.replace(/([\\`*_{}\[\]()#+\-.!|])/g, "\\$1");
}

function resolveWikilink(
  target: string,
  children: React.ReactNode,
  ctx: StaticRenderContext,
): React.ReactElement {
  const colon = target.indexOf(":");
  const templateName = colon >= 0 ? target.slice(0, colon).trim() : null;
  const entryName = (colon >= 0 ? target.slice(colon + 1) : target).trim();
  const key = entryName.toLowerCase();

  const matches: { id: string; templateId: string }[] = [];
  for (const e of ctx.entriesById.values()) {
    if (e.name.trim().toLowerCase() !== key) continue;
    if (templateName) {
      const tpl = ctx.templatesById.get(e.templateId);
      if (tpl?.name.trim().toLowerCase() !== templateName.toLowerCase())
        continue;
    }
    matches.push({ id: e.id, templateId: e.templateId });
  }

  if (matches.length !== 1) {
    return (
      <span className={markdownStyles.brokenLink} title="No matching entry">
        {children}
      </span>
    );
  }

  const href = ctx.linkForEntry(matches[0].id);
  if (!href) {
    return (
      <span className={markdownStyles.brokenLink} title="Out of export scope">
        {children}
      </span>
    );
  }
  return (
    <a href={href} className={markdownStyles.wikiLink}>
      {children}
    </a>
  );
}
