import { useTheme } from "../../hooks/use-theme";
import { THEME_LIST, type ThemeDefinition } from "../../lib/themes";

import styles from "./ThemeSection.module.css";

export function ThemeSection() {
  const { themeId, setTheme } = useTheme();

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h1 className={styles.title}>Theme</h1>
        <p className={styles.hint}>
          Choose how WorldBuilder looks. The system option follows your OS preference.
        </p>
      </header>

      <div className={styles.grid}>
        <SystemCard active={themeId === "system"} onSelect={() => setTheme("system")} />
        {THEME_LIST.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            active={themeId === theme.id}
            onSelect={() => setTheme(theme.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ThemeCard({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeDefinition;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${active ? styles.cardActive : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className={styles.swatches}>
        {theme.swatches.map((color, i) => (
          <span key={i} className={styles.swatch} style={{ background: color }} />
        ))}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{theme.label}</div>
        <div className={styles.cardDescription}>{theme.description}</div>
      </div>
      {active && <span className={styles.activeBadge}>Active</span>}
    </button>
  );
}

function SystemCard({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.card} ${active ? styles.cardActive : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className={styles.swatches}>
        <span className={styles.swatch} style={{ background: "#f6f6f6" }} />
        <span className={styles.swatch} style={{ background: "#ffffff" }} />
        <span className={styles.swatch} style={{ background: "#1a1a1a" }} />
        <span className={styles.swatch} style={{ background: "#242424" }} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>System</div>
        <div className={styles.cardDescription}>Follow the operating system setting.</div>
      </div>
      {active && <span className={styles.activeBadge}>Active</span>}
    </button>
  );
}
