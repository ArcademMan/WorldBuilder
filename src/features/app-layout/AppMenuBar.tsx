import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChevronRight } from "lucide-react";

import { useCurrentProject } from "../../hooks/use-current-project";
import * as api from "../../lib/api";
import type { RecentProject } from "../../types";

import styles from "./AppMenuBar.module.css";

const NEW_PROJECT_PROMPT_NAME = "New World";

/**
 * Classic desktop-style menubar (HTML, in-app).
 * Currently exposes a single "File" menu; structured so additional
 * top-level menus can be added later without changing this layout.
 */
type Props = {
  /** Notified when any top-level menu opens/closes (used by RootShell). */
  onOpenChange?: (open: boolean) => void;
};

export function AppMenuBar({ onOpenChange }: Props = {}) {
  const navigate = useNavigate();
  const { project, setProject } = useCurrentProject();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentProject[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onOpenChange?.(openMenu !== null);
  }, [openMenu, onOpenChange]);

  // Refresh recents whenever the menu opens, so the submenu is current.
  useEffect(() => {
    if (openMenu !== "file") return;
    let cancelled = false;
    void api
      .listRecents()
      .then((items) => {
        if (!cancelled) setRecents(items);
      })
      .catch(() => {
        if (!cancelled) setRecents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [openMenu]);

  // Click-away to close the menu.
  useEffect(() => {
    if (!openMenu) return;
    function onDocClick(e: MouseEvent) {
      if (!barRef.current?.contains(e.target as Node)) setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  function close() {
    setOpenMenu(null);
  }

  async function openProjectByPath(path: string) {
    close();
    try {
      const meta = await api.openProject(path);
      setProject({ path, meta });
      await api.addRecent({
        path,
        name: meta.name,
        lastOpenedAt: new Date().toISOString(),
      });
      navigate("/project");
    } catch (e) {
      alert(`Failed to open project: ${e}`);
    }
  }

  async function handleOpen() {
    close();
    const folder = await api.pickFolder();
    if (!folder) return;
    await openProjectByPath(folder);
  }

  async function handleNew() {
    close();
    const folder = await api.pickFolder();
    if (!folder) return;
    const name =
      window.prompt("Project name:", NEW_PROJECT_PROMPT_NAME) ?? "";
    if (!name.trim()) return;
    try {
      const meta = await api.createProject(folder, name.trim());
      setProject({ path: folder, meta });
      await api.addRecent({
        path: folder,
        name: meta.name,
        lastOpenedAt: new Date().toISOString(),
      });
      navigate("/project");
    } catch (e) {
      alert(`Failed to create project: ${e}`);
    }
  }

  function handleClose() {
    close();
    setProject(null);
    navigate("/");
  }

  async function handleExit() {
    close();
    try {
      await getCurrentWindow().close();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={styles.menubar} ref={barRef}>
      <div className={styles.submenu}>
        <button
          type="button"
          className={`${styles.menuItem} ${openMenu === "file" ? styles.menuItemOpen : ""}`}
          onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
        >
          File
        </button>
        {openMenu === "file" && (
          <div className={styles.dropdown} role="menu">
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => void handleNew()}
            >
              New project…
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => void handleOpen()}
            >
              Open project…
            </button>
            <div className={styles.separator} />
            <RecentsSubmenu recents={recents} onPick={openProjectByPath} />
            <div className={styles.separator} />
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleClose}
              disabled={!project}
            >
              Close project
            </button>
            <div className={styles.separator} />
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => void handleExit()}
            >
              Exit
            </button>
          </div>
        )}
      </div>

      <div className={styles.submenu}>
        <button
          type="button"
          className={`${styles.menuItem} ${openMenu === "export" ? styles.menuItemOpen : ""}`}
          onClick={() =>
            setOpenMenu(openMenu === "export" ? null : "export")
          }
        >
          Export
        </button>
        {openMenu === "export" && (
          <div className={styles.dropdown} role="menu">
            <button
              type="button"
              className={styles.dropdownItem}
              disabled={!project}
              onClick={() => {
                close();
                navigate("/project/export");
              }}
            >
              Export…
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              disabled={!project}
              onClick={() => {
                close();
                navigate("/project/export?all=1");
              }}
            >
              Export all…
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentsSubmenu({
  recents,
  onPick,
}: {
  recents: RecentProject[];
  onPick: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={styles.submenu}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" className={styles.dropdownItem}>
        <span className={styles.submenuLabel}>
          <span>Recent projects</span>
          <ChevronRight size={14} strokeWidth={1.75} />
        </span>
      </button>
      {open && (
        <div className={styles.submenuPanel} role="menu">
          {recents.length === 0 ? (
            <div className={styles.empty}>No recent projects</div>
          ) : (
            recents.map((r) => (
              <button
                key={r.path}
                type="button"
                className={styles.dropdownItem}
                onClick={() => onPick(r.path)}
                title={r.path}
              >
                <span>{r.name}</span>
                <span className={styles.recentPath}>{r.path}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
