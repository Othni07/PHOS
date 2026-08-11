import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/theme.css";
import { ProjectionPage } from "./ProjectionPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectionPage />
  </StrictMode>,
);
