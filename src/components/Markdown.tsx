import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import remarkGfm from "remark-gfm";

import { useEntriesContext } from "../features/project-shell/entries-context";
import { useTemplatesContext } from "../features/project-shell/templates-context";
import { WIKILINK_RE, resolveWikilinkTarget } from "../lib/wikilinks";

import styles from "./Markdown.module.css";

type Props = {
  source: string;
};

/**
 * Renders markdown with GFM + custom `[[wikilink]]` resolution.
 *
 * Wikilink forms:
 *   [[Name]]              — match any entry whose name == "Name" (case-insensitive).
 *   [[Template:Name]]     — disambiguate by template name. Useful when several
 *                           entries share a name across different templates.
 *
 * Implementation note: wikilinks are pre-transformed into standard markdown
 * links with a `wiki:` scheme, then the custom `a` renderer turns them back
 * into either a react-router Link (if resolved) or a broken-link span. This
 * lets us reuse react-markdown's parser without writing a remark plugin.
 */
export function Markdown({ source }: Props) {
  const prepared = useMemo(() => transformWikilinks(source), [source]);

  return (
    <div className={styles.root}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // react-markdown v10's default urlTransform strips non-allowlisted
        // schemes to "" — that would kill our `wiki:` indirection before
        // the custom `a` renderer below ever sees it.
        urlTransform={(url) => url}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith(WIKI_SCHEME)) {
              const target = decodeURIComponent(href.slice(WIKI_SCHEME.length));
              return <WikiLink target={target}>{children}</WikiLink>;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                // Stop propagation so the surrounding "click to edit" wrapper
                // (EditableField, InlineBody) doesn't flip into edit mode.
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}

const WIKI_SCHEME = "wiki:";

function transformWikilinks(input: string): string {
  return input.replace(WIKILINK_RE, (_match, raw: string) => {
    const text = raw.trim();
    if (!text) return _match;
    const encoded = encodeURIComponent(text);
    return `[${escapeMd(text)}](${WIKI_SCHEME}${encoded})`;
  });
}

function escapeMd(text: string): string {
  return text.replace(/([\\`*_{}\[\]()#+\-.!|])/g, "\\$1");
}

function WikiLink({
  target,
  children,
}: {
  target: string;
  children: React.ReactNode;
}) {
  const { items: entries } = useEntriesContext();
  const { byId: templatesById } = useTemplatesContext();

  const resolved = useMemo(
    () => resolveWikilinkTarget(target, entries, templatesById),
    [target, entries, templatesById],
  );

  if (!resolved) {
    return (
      <span
        className={styles.brokenLink}
        title="No matching entry"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      to={`/project/entry/${resolved.id}`}
      className={styles.wikiLink}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}
