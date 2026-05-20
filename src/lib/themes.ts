export type ThemeId =
  | "system"
  | "light"
  | "dark"
  | "sepia"
  | "solarized-dark"
  | "nord"
  | "gruvbox-dark"
  | "one-dark"
  | "catppuccin-mocha"
  | "magnetic-dark";

export type ThemeMode = "light" | "dark";

export type ThemeTokens = {
  "color-bg": string;
  "color-bg-elevated": string;
  "color-border": string;
  "color-text": string;
  "color-text-muted": string;
  "color-accent": string;
  "color-accent-hover": string;
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  description: string;
  /** Base mode used by components that need a light/dark hint. */
  mode: ThemeMode;
  /** Preview swatches shown in the settings page (bg, surface, accent, text). */
  swatches: [string, string, string, string];
  tokens: ThemeTokens;
};

const LIGHT: ThemeTokens = {
  "color-bg": "#f6f6f6",
  "color-bg-elevated": "#ffffff",
  "color-border": "#e2e2e2",
  "color-text": "#0f0f0f",
  "color-text-muted": "#6b6b6b",
  "color-accent": "#396cd8",
  "color-accent-hover": "#2a55b3",
};

const DARK: ThemeTokens = {
  "color-bg": "#1a1a1a",
  "color-bg-elevated": "#242424",
  "color-border": "#333333",
  "color-text": "#f6f6f6",
  "color-text-muted": "#9a9a9a",
  "color-accent": "#5a8eff",
  "color-accent-hover": "#7aa5ff",
};

const SEPIA: ThemeTokens = {
  "color-bg": "#f4ecd8",
  "color-bg-elevated": "#fbf5e3",
  "color-border": "#d9cdb0",
  "color-text": "#3e2f1c",
  "color-text-muted": "#7a6849",
  "color-accent": "#a0522d",
  "color-accent-hover": "#7d3f20",
};

const SOLARIZED_DARK: ThemeTokens = {
  "color-bg": "#002b36",
  "color-bg-elevated": "#073642",
  "color-border": "#0f4756",
  "color-text": "#eee8d5",
  "color-text-muted": "#93a1a1",
  "color-accent": "#2aa198",
  "color-accent-hover": "#56c4bb",
};

const NORD: ThemeTokens = {
  "color-bg": "#2e3440",
  "color-bg-elevated": "#3b4252",
  "color-border": "#434c5e",
  "color-text": "#eceff4",
  "color-text-muted": "#a6adbb",
  "color-accent": "#88c0d0",
  "color-accent-hover": "#a6d4e0",
};

const GRUVBOX_DARK: ThemeTokens = {
  "color-bg": "#282828",
  "color-bg-elevated": "#32302f",
  "color-border": "#3c3836",
  "color-text": "#ebdbb2",
  "color-text-muted": "#928374",
  "color-accent": "#d65c0b",
  "color-accent-hover": "#fe8019",
};

const ONE_DARK: ThemeTokens = {
  "color-bg": "#282c34",
  "color-bg-elevated": "#2c2e31",
  "color-border": "#3e4451",
  "color-text": "#abb2bf",
  "color-text-muted": "#5c6370",
  "color-accent": "#61afef",
  "color-accent-hover": "#81b1ff",
};

const CATPPUCCIN_MOCHA: ThemeTokens = {
  "color-bg": "#1e1e2e",
  "color-bg-elevated": "#313244",
  "color-border": "#45475a",
  "color-text": "#cdd6f4",
  "color-text-muted": "#908caa",
  "color-accent": "#89b4fa",
  "color-accent-hover": "#a8d5ff",
};

const MAGNETIC_DARK: ThemeTokens = {
  "color-bg": "#1a1a1a",
  "color-bg-elevated": "#242424",
  "color-border": "#333333",
  "color-text": "#f6f6f6",
  "color-text-muted": "#9a9a9a",
  "color-accent": "#9d7aff",
  "color-accent-hover": "#b89cff",
};

export const THEMES: Record<Exclude<ThemeId, "system">, ThemeDefinition> = {
  light: {
    id: "light",
    label: "Light",
    description: "Clean and bright. The classic.",
    mode: "light",
    swatches: [LIGHT["color-bg"], LIGHT["color-bg-elevated"], LIGHT["color-accent"], LIGHT["color-text"]],
    tokens: LIGHT,
  },
  dark: {
    id: "dark",
    label: "Dark",
    description: "Easy on the eyes after dusk.",
    mode: "dark",
    swatches: [DARK["color-bg"], DARK["color-bg-elevated"], DARK["color-accent"], DARK["color-text"]],
    tokens: DARK,
  },
  sepia: {
    id: "sepia",
    label: "Sepia",
    description: "Warm parchment, perfect for long writing sessions.",
    mode: "light",
    swatches: [SEPIA["color-bg"], SEPIA["color-bg-elevated"], SEPIA["color-accent"], SEPIA["color-text"]],
    tokens: SEPIA,
  },
  "solarized-dark": {
    id: "solarized-dark",
    label: "Solarized Dark",
    description: "Muted teal palette by Ethan Schoonover.",
    mode: "dark",
    swatches: [
      SOLARIZED_DARK["color-bg"],
      SOLARIZED_DARK["color-bg-elevated"],
      SOLARIZED_DARK["color-accent"],
      SOLARIZED_DARK["color-text"],
    ],
    tokens: SOLARIZED_DARK,
  },
  nord: {
    id: "nord",
    label: "Nord",
    description: "Cold arctic blues from the Nord palette.",
    mode: "dark",
    swatches: [NORD["color-bg"], NORD["color-bg-elevated"], NORD["color-accent"], NORD["color-text"]],
    tokens: NORD,
  },
  "gruvbox-dark": {
    id: "gruvbox-dark",
    label: "Gruvbox Dark",
    description: "Retro groove. Warm, medium contrast, brownish.",
    mode: "dark",
    swatches: [
      GRUVBOX_DARK["color-bg"],
      GRUVBOX_DARK["color-bg-elevated"],
      GRUVBOX_DARK["color-accent"],
      GRUVBOX_DARK["color-text"],
    ],
    tokens: GRUVBOX_DARK,
  },
  "one-dark": {
    id: "one-dark",
    label: "One Dark",
    description: "The Atom theme. Clean and modern.",
    mode: "dark",
    swatches: [
      ONE_DARK["color-bg"],
      ONE_DARK["color-bg-elevated"],
      ONE_DARK["color-accent"],
      ONE_DARK["color-text"],
    ],
    tokens: ONE_DARK,
  },
  "catppuccin-mocha": {
    id: "catppuccin-mocha",
    label: "Catppuccin Mocha",
    description: "Soothing pastel colors in dark mode.",
    mode: "dark",
    swatches: [
      CATPPUCCIN_MOCHA["color-bg"],
      CATPPUCCIN_MOCHA["color-bg-elevated"],
      CATPPUCCIN_MOCHA["color-accent"],
      CATPPUCCIN_MOCHA["color-text"],
    ],
    tokens: CATPPUCCIN_MOCHA,
  },
  "magnetic-dark": {
    id: "magnetic-dark",
    label: "Magnetic Dark",
    description: "Dark with a touch of violet magic.",
    mode: "dark",
    swatches: [
      MAGNETIC_DARK["color-bg"],
      MAGNETIC_DARK["color-bg-elevated"],
      MAGNETIC_DARK["color-accent"],
      MAGNETIC_DARK["color-text"],
    ],
    tokens: MAGNETIC_DARK,
  },
};

export const THEME_LIST: ThemeDefinition[] = [
  THEMES.light,
  THEMES.dark,
  THEMES.sepia,
  THEMES["solarized-dark"],
  THEMES.nord,
  THEMES["gruvbox-dark"],
  THEMES["one-dark"],
  THEMES["catppuccin-mocha"],
  THEMES["magnetic-dark"],
];

export function resolveTheme(id: ThemeId, prefersDark: boolean): ThemeDefinition {
  if (id === "system") return prefersDark ? THEMES.dark : THEMES.light;
  return THEMES[id];
}

export function applyThemeTokens(tokens: ThemeTokens, mode: ThemeMode): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${key}`, value);
  }
  root.dataset.themeMode = mode;
}
