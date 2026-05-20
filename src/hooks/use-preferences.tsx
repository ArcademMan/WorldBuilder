import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * App-wide user preferences (non-theme).
 *
 * Persistence: a single localStorage key holds the whole object as JSON.
 * Each new preference is added to the `Preferences` type and `DEFAULTS`,
 * with a sensible default — old persisted blobs missing the new key fall
 * back to the default at read time. Settings UIs call `setPreference`.
 *
 * Theme is intentionally kept in `use-theme.tsx` (separate concern,
 * already wired). New prefs go here.
 */

export type MenuBarMode = "auto" | "always";

export type Preferences = {
  /** "always": menubar always visible. "auto": hidden until Alt is pressed. */
  menuBarMode: MenuBarMode;
};

const DEFAULTS: Preferences = {
  menuBarMode: "always",
};

const STORAGE_KEY = "worldbuilder.preferences";

function readStored(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

type ContextValue = {
  prefs: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
};

const PreferencesContext = createContext<ContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => readStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* best-effort */
    }
  }, [prefs]);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPrefs((p) => ({ ...p, [key]: value }));
    },
    [],
  );

  const value = useMemo(() => ({ prefs, setPreference }), [prefs, setPreference]);
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): ContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error(
      "usePreferences must be used inside <PreferencesProvider>",
    );
  }
  return ctx;
}
