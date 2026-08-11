import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/theme.css";
import { OverlayPage } from "./OverlayPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OverlayPage />
  </StrictMode>,
);
