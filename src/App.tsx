import { useState, useCallback } from "react";
import "./App.css";
import { sampleFull, sampleMinimal } from "./data/samples";
import {
  buildDocxBlob,
  downloadBlob,
  downloadPdfFromHtml,
} from "./lib/documents";
import { buildPrompt } from "./lib/prompt";
import { getTemplatePath, languageOptions } from "./lib/templates";
import { validateCvJson, type ValidationResult } from "./lib/validation";
import { renderCvHtml, type CvData, type CvLanguage } from "./lib/cv-renderer";

type Status = {
  type: "ok" | "error" | "info" | "loading";
  message: string;
};

const toPrettyJson = (value: unknown) => JSON.stringify(value, null, 2);

function App() {
  const [language, setLanguage] = useState<CvLanguage>(
    (languageOptions[0]?.id as CvLanguage) ?? "pt-BR",
  );
  const [jsonText, setJsonText] = useState(toPrettyJson(sampleFull));
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [renderErrors, setRenderErrors] = useState<string[] | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const templatePath = getTemplatePath(language);
  const templateReady = Boolean(templatePath);

  // ─── Validation ────────────────────────────────────────────────────────────

  const runValidation = useCallback((): ValidationResult => {
    setRenderErrors(null);
    const result = validateCvJson(jsonText);
    setValidation(result);
    setStatus(
      result.ok
        ? { type: "ok", message: "JSON validado com sucesso." }
        : { type: "error", message: "Revise os erros abaixo." },
    );
    return result;
  }, [jsonText]);

  // ─── Preview ───────────────────────────────────────────────────────────────

  const handlePreview = useCallback(() => {
    const result = validateCvJson(jsonText);
    setValidation(result);
    if (!result.ok) {
      setStatus({ type: "error", message: "Corrija os erros para ver o preview." });
      setPreviewHtml(null);
      return;
    }
    const html = renderCvHtml(result.data as CvData, language);
    setPreviewHtml(html);
    setStatus({ type: "ok", message: "Preview atualizado." });
  }, [jsonText, language]);

  // ─── Format ────────────────────────────────────────────────────────────────

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(toPrettyJson(parsed));
      setStatus({ type: "ok", message: "JSON formatado." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON invalido";
      setStatus({ type: "error", message });
    }
  };

  // ─── Generate DOCX ─────────────────────────────────────────────────────────

  const handleGenerateDocx = async () => {
    const result = runValidation();
    if (!result.ok) return;

    const data = result.data as CvData;
    setIsGenerating(true);
    setRenderErrors(null);

    // Try docxtemplater first (if template has placeholders)
    if (templatePath) {
      setStatus({ type: "loading", message: "Gerando DOCX via template..." });
      const docxResult = await buildDocxBlob(
        templatePath,
        data as unknown as Record<string, unknown>,
      );

      if (!("error" in docxResult)) {
        downloadBlob(docxResult.blob, `cv-${language}.docx`);
        setStatus({ type: "ok", message: "DOCX gerado e baixado." });
        setIsGenerating(false);
        return;
      }

      // If docxtemplater failed (no placeholders in template), fall through to HTML
      setRenderErrors([
        "Template sem placeholders — gerando DOCX via HTML (layout simplificado).",
        docxResult.error.message,
      ]);
    }

    // Fallback: generate via HTML → Blob (plain HTML download as alternative)
    setStatus({
      type: "info",
      message: "Gerando versão HTML do CV (adicione placeholders ao template para DOCX fiel).",
    });

    // Download the HTML as .html file so the user can open/print it
    const html = renderCvHtml(data, language);
    const htmlBlob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(htmlBlob, `cv-${language}.html`);
    setStatus({
      type: "ok",
      message: "CV exportado como HTML. Abra no browser e use Ctrl+P para imprimir como DOCX/PDF.",
    });
    setIsGenerating(false);
  };

  // ─── Generate PDF ──────────────────────────────────────────────────────────

  const handleGeneratePdf = async () => {
    const result = runValidation();
    if (!result.ok) return;

    const data = result.data as CvData;
    setIsGenerating(true);
    setRenderErrors(null);
    setStatus({ type: "loading", message: "Gerando PDF..." });

    try {
      const html = renderCvHtml(data, language);
      await downloadPdfFromHtml(html, `cv-${language}.pdf`);
      setStatus({ type: "ok", message: "PDF gerado e baixado com sucesso." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao gerar PDF.";
      setRenderErrors([message]);
      setStatus({ type: "error", message });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Copy Prompt ───────────────────────────────────────────────────────────

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt());
      setStatus({ type: "ok", message: "Prompt copiado para a área de transferência." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao copiar prompt";
      setStatus({ type: "error", message });
    }
  };

  // ─── Load samples ──────────────────────────────────────────────────────────

  const loadSample = (variant: "minimal" | "full") => {
    const value = variant === "minimal" ? sampleMinimal : sampleFull;
    setJsonText(toPrettyJson(value));
    setPreviewHtml(null);
    setValidation(null);
    setStatus({ type: "info", message: `Exemplo ${variant} carregado.` });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value as CvLanguage);
                setPreviewHtml(null);
              }}
            >
              {languageOptions.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="app-body">
        {/* ── Editor Column ── */}
        <section className="card editor-card">
          <div className="card-header">
            <div>
              <h2>Entrada JSON</h2>
              <p>Cole ou edite o JSON do seu CV.</p>
            </div>
            <span className="chip">Schema v1</span>
          </div>
          <label className="field-label" htmlFor="json-input">
            JSON do CV
          </label>
          <textarea
            id="json-input"
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setPreviewHtml(null);
            }}
            spellCheck={false}
          />
          <div className="editor-actions">
            <div className="button-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => loadSample("minimal")}
              >
                Carregar mínimo
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => loadSample("full")}
              >
                Carregar completo
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleFormat}
            >
              Formatar JSON
            </button>
          </div>
        </section>

        {/* ── Sidebar ── */}
        <aside className="side-stack">
          <section className="card action-card delay-1">
            <h3>Ações</h3>
            {!templateReady && (
              <p className="template-warning">
                Template sem placeholders. DOCX exportará como HTML.
              </p>
            )}
            <div className="button-stack">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreview}
                disabled={isGenerating}
              >
                👁 Ver Preview
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runValidation}
                disabled={isGenerating}
              >
                Validar JSON
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleGeneratePdf}
                disabled={isGenerating}
              >
                {isGenerating ? "Gerando..." : "⬇ Gerar PDF"}
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleGenerateDocx}
                disabled={isGenerating}
              >
                {isGenerating ? "Gerando..." : "⬇ Gerar DOCX"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyPrompt}
                disabled={isGenerating}
              >
                Copiar prompt
              </button>
            </div>

            {/* Validation result */}
            {validation && (
              <div className={`status-card ${validation.ok ? "ok" : "error"}`}>
                <p className="status-title">
                  {validation.ok ? "✓ JSON válido" : "✗ JSON com erros"}
                </p>
                {!validation.ok && (
                  <ul>
                    {validation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Render errors */}
            {renderErrors && renderErrors.length > 0 && (
              <div className="status-card error">
                <p className="status-title">⚠ Aviso de geração</p>
                <ul>
                  {renderErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card prompt-card delay-2">
            <h3>Prompt helper</h3>
            <p>
              Gera um prompt para orientar o modelo a manter o JSON no formato
              correto com todos os campos obrigatórios.
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCopyPrompt}
            >
              Copiar prompt completo
            </button>
          </section>

          <section className="card info-card delay-3">
            <h3>Notas rápidas</h3>
            <ul>
              <li>PDF gerado diretamente do HTML — sem página em branco.</li>
              <li>DOCX via template requer placeholders <code>{`{{name}}`}</code>.</li>
              <li>Preview mostra o CV antes de baixar.</li>
            </ul>
          </section>
        </aside>
      </main>

      {/* ── Preview Panel ── */}
      {previewHtml && (
        <section className="preview-section">
          <div className="preview-header">
            <h3>Preview do CV</h3>
            <div className="preview-actions">
              <span className="chip chip-muted">
                {language === "pt-BR" ? "Português" : "English"}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewHtml(null)}
              >
                Fechar ✕
              </button>
            </div>
          </div>
          <div className="preview-frame-wrapper">
            <iframe
              className="preview-frame"
              title="Preview do CV"
              srcDoc={previewHtml}
              sandbox="allow-scripts"
            />
          </div>
        </section>
      )}

      {/* ── Status Bar ── */}
      {status && (
        <div className={`status-bar ${status.type}`} role="status">
          {status.type === "loading" && (
            <span className="status-spinner" aria-hidden="true" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
}

export default App;
