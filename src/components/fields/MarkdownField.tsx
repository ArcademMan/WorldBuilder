import { useLayoutEffect, useRef } from "react";

import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/**
 * Plain-textarea editor for now — a real markdown editor (live preview,
 * formatting toolbar) will replace this in a later polish phase.
 *
 * The textarea auto-grows with content so it never appears smaller than
 * the rendered markdown that preceded it in view mode.
 */
function findScrollableAncestor(el: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") &&
        node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

export function MarkdownField({ def, value, onChange, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Collapsing the textarea (height:auto) shrinks the document and
    // can cause the scrolling ancestor to clamp its scrollTop, yanking
    // the view to the top while the user is typing. Snapshot and
    // restore the scroll position around the resize.
    const scroller = findScrollableAncestor(el);
    const prev = scroller === window
      ? window.scrollY
      : (scroller as HTMLElement).scrollTop;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    if (scroller === window) {
      window.scrollTo(window.scrollX, prev);
    } else {
      (scroller as HTMLElement).scrollTop = prev;
    }
  }, [value]);

  return (
    <FormField
      label={def.label}
      helpText={def.helpText ?? "Markdown supported. Use [[Name]] or [[Template:Name]] to link entries."}
      required={def.required}
    >
      <textarea
        ref={ref}
        className={`${styles.textarea} ${styles.textareaLarge} ${styles.textareaAutoGrow}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        disabled={disabled}
      />
    </FormField>
  );
}
