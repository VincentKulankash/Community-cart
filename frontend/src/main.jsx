import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./styles/home.css";
import "./styles/shared-components.css";
import "./styles/underground-entry.css";
import "./styles/underground.css";
import "./styles/market-pages.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
