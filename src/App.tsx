import { RouterProvider } from "react-router-dom";

import { CurrentProjectProvider } from "./hooks/use-current-project";
import { router } from "./routes";

export default function App() {
  return (
    <CurrentProjectProvider>
      <RouterProvider router={router} />
    </CurrentProjectProvider>
  );
}
