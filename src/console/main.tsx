import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/theme.css";
import { ConsolePage } from "./ConsolePage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConsolePage />
  </StrictMode>,
);
