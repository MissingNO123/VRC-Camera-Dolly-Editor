import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import PointVisualizer from "./components/PointVisualizer";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <PointVisualizer />
  </StrictMode>
);