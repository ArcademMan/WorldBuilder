import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Markdown } from "../../components/Markdown";

import styles from "./EntryReadView.module.css";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
};

/**
 * Click-to-edit markdown body. Idle state renders the markdown inside a
 * plain <div> so the surrounding block context can flow around floats
 * (e.g. an infobox aside). A <button> wrapper would establish a BFC and
 * prevent that, so we use a div with role/tabindex instead.
 */
export function InlineBody({ value, onChange, onCommit }: Props) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [editing]);

  useLayoutEffect(() => {
    if (!editing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, value]);

  function finish() {
    setEditing(false);
    onCommit();
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        className={styles.bodyInput}
        value={value}
        placeholder="Write the body — markdown supported. Use [[Name]] or [[Template:Name]] to link entries."
        onChange={(e) => onChange(e.target.value)}
        onBlur={finish}
      />
    );
  }

  function maybeStart(e: { target: EventTarget | null }) {
    if (
      e.target instanceof Element &&
      e.target.closest("a, button, input, select, textarea")
    ) {
      return;
    }
    setEditing(true);
  }

  return (
    <div
      className={styles.bodyTrigger}
      tabIndex={0}
      onClick={maybeStart}
      onFocus={maybeStart}
    >
      {value ? (
        <Markdown source={value} />
      ) : (
        <p className={styles.bodyEmpty}>Click to write the body…</p>
      )}
    </div>
  );
}
