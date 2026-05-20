import { RouterProvider } from "react-router-dom";

import { CurrentProjectProvider } from "./hooks/use-current-project";
import { PreferencesProvider } from "./hooks/use-preferences";
import { ThemeProvider } from "./hooks/use-theme";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <CurrentProjectProvider>
          <RouterProvider router={router} />
        </CurrentProjectProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
