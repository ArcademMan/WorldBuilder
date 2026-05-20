import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { TemplateIcon } from "../../../components/TemplateIcon";
import { ICON_GROUPS, makeLucideIconValue } from "../../../lib/template-icons";

import styles from "./IconPicker.module.css";

const POPOVER_WIDTH = 340;
const POPOVER_MAX_HEIGHT = 420;
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;

type Props = {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
};

type PopoverPos = { top: number; left: number };

/**
 * Click the trigger to pop up a curated grid of Lucide icons. `value`
 * is stored as `lucide:<Name>`; "Clear" wipes the icon entirely.
 */
export function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    function compute() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal: prefer left-aligned with trigger; flip if it overflows.
      let left = rect.left;
      if (left + POPOVER_WIDTH + VIEWPORT_MARGIN > vw) {
        left = rect.right - POPOVER_WIDTH;
      }
      left = Math.max(VIEWPORT_MARGIN, left);

      // Vertical: prefer below trigger; flip above if it overflows.
      const spaceBelow = vh - rect.bottom - VIEWPORT_MARGIN;
      let top = rect.bottom + TRIGGER_GAP;
      if (spaceBelow < POPOVER_MAX_HEIGHT && rect.top > spaceBelow) {
        top = Math.max(VIEWPORT_MARGIN, rect.top - POPOVER_MAX_HEIGHT - TRIGGER_GAP);
      }
      setPos({ top, left });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_GROUPS;
    return ICON_GROUPS.map((g) => ({
      ...g,
      icons: g.icons.filter((i) => i.id.toLowerCase().includes(q)),
    })).filter((g) => g.icons.length > 0);
  }, [query]);

  function pick(name: string) {
    onChange(makeLucideIconValue(name));
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange(undefined);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.triggerPreview}>
          {value ? <TemplateIcon icon={value} size={18} /> : <span className={styles.triggerPlaceholder}>—</span>}
        </span>
        <span className={styles.triggerLabel}>{value ? "Change icon" : "Pick an icon"}</span>
      </button>

      {open && pos && (
        <div
          ref={popoverRef}
          className={styles.popover}
          role="dialog"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className={styles.searchRow}>
            <Search size={14} strokeWidth={1.75} className={styles.searchIcon} />
            <input
              autoFocus
              type="text"
              className={styles.search}
              placeholder="Search icons…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {value && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clear}
                title="Clear icon"
              >
                <X size={14} strokeWidth={2} />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className={styles.scroll}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>No icons match.</p>
            ) : (
              filtered.map((group) => (
                <div key={group.name} className={styles.group}>
                  <div className={styles.groupName}>{group.name}</div>
                  <div className={styles.grid}>
                    {group.icons.map((i) => {
                      const Icon = i.component;
                      const selected = value === makeLucideIconValue(i.id);
                      return (
                        <button
                          key={i.id}
                          type="button"
                          className={`${styles.cell} ${selected ? styles.cellActive : ""}`}
                          onClick={() => pick(i.id)}
                          title={i.id}
                        >
                          <Icon size={18} strokeWidth={1.75} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
