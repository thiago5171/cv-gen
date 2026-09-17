import { lazy, Suspense, useState } from "react";
import "./App.css";
import { useCvDocument } from "./hooks/useCvDocument";
import { CvWorkspace } from "./components/CvWorkspace";
import { languageOptions } from "./lib/templates";
import type { CvLanguage } from "./lib/cv-renderer";

// Lazy — keeps the Anthropic SDK, pdfjs, and mammoth out of the Manual tab's
// initial bundle; loaded only when the "Com IA" tab is first opened.
const AiPanel = lazy(() =>
  import("./components/ai/AiPanel").then((m) => ({ default: m.AiPanel })),
);

type Tab = "manual" | "ai";

function App() {
  const doc = useCvDocument();
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">CV</div>
          <div>
            <p className="brand-title">CV Gen</p>
            <p className="brand-sub">JSON → DOCX · PDF · Preview</p>
          </div>
        </div>
        <div className="header-controls">
          <div className="field">
            <label htmlFor="language">Idioma</label>
            <select
              id="language"
              value={doc.language}
              onChange={(event) => doc.changeLanguage(event.target.value as CvLanguage)}
            >
              {languageOptions.map((option) => (
                <option key={option.id} value={option.id} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "manual"}
          className={`tab ${tab === "manual" ? "active" : ""}`}
          onClick={() => setTab("manual")}
        >
          Manual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ai"}
          className={`tab ${tab === "ai" ? "active" : ""}`}
          onClick={() => setTab("ai")}
        >
          Com IA
        </button>
      </nav>

      {tab === "manual" ? (
        <CvWorkspace doc={doc} />
      ) : (
        <Suspense fallback={<p className="ai-hint">Carregando módulo de IA…</p>}>
          <AiPanel doc={doc} />
        </Suspense>
      )}

      {/* ── Status Bar ── */}
      {doc.status && (
        <div className={`status-bar ${doc.status.type}`} role="status">
          {doc.status.type === "loading" && (
            <span className="status-spinner" aria-hidden="true" />
          )}
          {doc.status.message}
        </div>
      )}
    </div>
  );
}

export default App;
