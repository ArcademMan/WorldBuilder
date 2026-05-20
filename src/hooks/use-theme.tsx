import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyThemeTokens,
  resolveTheme,
  THEME_LIST,
  type ThemeId,
} from "../lib/themes";

const STORAGE_KEY = "worldbuilder.theme";
const DEFAULT_THEME: ThemeId = "system";

const VALID_THEMES: ReadonlySet<ThemeId> = new Set<ThemeId>([
  "system",
  ...THEME_LIST.map((t) => t.id),
]);

function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_THEMES.has(raw as ThemeId)) return raw as ThemeId;
  } catch {
    // localStorage may be unavailable; fall through to default.
  }
  return DEFAULT_THEME;
}

type ThemeContextValue = {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => readStoredTheme());
  const [prefersDark, setPrefersDark] = useState<boolean>(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(themeId, prefersDark);
    applyThemeTokens(resolved.tokens, resolved.mode);
  }, [themeId, prefersDark]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Persisting is best-effort.
    }
  }, []);

  const value = useMemo(() => ({ themeId, setTheme }), [themeId, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
