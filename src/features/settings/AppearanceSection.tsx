import {
  usePreferences,
  type MenuBarMode,
} from "../../hooks/use-preferences";

import styles from "./ThemeSection.module.css";

const OPTIONS: { value: MenuBarMode; label: string; description: string }[] = [
  {
    value: "always",
    label: "Always visible",
    description: "The top menu bar is shown at all times.",
  },
  {
    value: "auto",
    label: "Show on Alt",
    description:
      "Hide the menu bar by default; reveal it while the Alt key is held.",
  },
];

export function AppearanceSection() {
  const { prefs, setPreference } = usePreferences();

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h1 className={styles.title}>Appearance</h1>
        <p className={styles.hint}>
          Tune how the application chrome behaves.
        </p>
      </header>

      <div>
        <h2 style={{ fontSize: "1rem", margin: "0 0 var(--space-2)" }}>
          Menu bar
        </h2>
        <div className={styles.grid}>
          {OPTIONS.map((opt) => {
            const active = prefs.menuBarMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.card} ${active ? styles.cardActive : ""}`}
                onClick={() => setPreference("menuBarMode", opt.value)}
                aria-pressed={active}
              >
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{opt.label}</div>
                  <div className={styles.cardDescription}>{opt.description}</div>
                </div>
                {active && <span className={styles.activeBadge}>Active</span>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
