import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { usePreferences } from "../../hooks/use-preferences";

import { AppMenuBar } from "./AppMenuBar";

/**
 * Root visual frame. Renders the classic top menubar once and then
 * delegates the rest of the viewport to whichever route is active.
 *
 * Menubar visibility follows the `menuBarMode` preference:
 *  - "always": always rendered
 *  - "auto":   hidden until the user presses Alt (Windows-style),
 *              and stays visible while a top-level menu is open.
 */
export function RootShell() {
  const { prefs } = usePreferences();
  const [altShown, setAltShown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (prefs.menuBarMode !== "auto") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Alt") setAltShown(true);
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") setAltShown(false);
    }
    function onBlur() {
      setAltShown(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [prefs.menuBarMode]);

  const visible =
    prefs.menuBarMode === "always" || altShown || menuOpen;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {visible && <AppMenuBar onOpenChange={setMenuOpen} />}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Outlet />
      </div>
    </div>
  );
}
