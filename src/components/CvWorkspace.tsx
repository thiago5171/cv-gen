import type { CvDocument } from "../hooks/useCvDocument";

type Props = {
  doc: CvDocument;
  /** Hide the sample-loading buttons (AI tab replaces the document itself). */
  hideSamples?: boolean;
  /** Label above the JSON editor. */
  editorTitle?: string;
  editorSubtitle?: string;
};

/**
 * The JSON editor + action buttons + preview. Extracted verbatim from the
 * original App so both the Manual tab and the AI tab render the exact same
 * editing / preview / export surface without duplicating logic.
 */
export function CvWorkspace({
  doc,
  hideSamples = false,
  editorTitle = "Entrada JSON",
  editorSubtitle = "Cole ou edite o JSON do seu CV.",
}: Props) {
  return (
    <>
      <main className="app-body">
        {/* ── Editor Column ── */}
        <section className="card editor-card">
          <div className="card-header">
            <div>
              <h2>{editorTitle}</h2>
              <p>{editorSubtitle}</p>
            </div>
            <span className="chip">Schema v1</span>
          </div>
          <label className="field-label" htmlFor="json-input">
            JSON do CV
          </label>
          <textarea
            id="json-input"
            value={doc.jsonText}
            onChange={(event) => doc.setJsonText(event.target.value)}
            spellCheck={false}
          />
          <div className="editor-actions">
            {!hideSamples ? (
              <div className="button-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => doc.loadSample("minimal")}
                >
                  Carregar mínimo
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => doc.loadSample("full")}
                >
                  Carregar completo
                </button>
              </div>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={doc.handleFormat}
            >
              Formatar JSON
            </button>
          </div>
        </section>

        {/* ── Sidebar ── */}
        <aside className="side-stack">
          <section className="card action-card delay-1">
            <h3>Ações</h3>
            {!doc.templateReady && (
              <p className="template-warning">
                Template sem placeholders. DOCX exportará como HTML.
              </p>
            )}
            <div className="button-stack">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={doc.handlePreview}
                disabled={doc.isGenerating}
              >
                👁 Ver Preview
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={doc.runValidation}
                disabled={doc.isGenerating}
              >
                Validar JSON
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={doc.handleGeneratePdf}
                disabled={doc.isGenerating}
              >
                {doc.isGenerating ? "Gerando..." : "⬇ Gerar PDF"}
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={doc.handleGenerateDocx}
                disabled={doc.isGenerating}
              >
                {doc.isGenerating ? "Gerando..." : "⬇ Gerar DOCX"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={doc.handleCopyPrompt}
                disabled={doc.isGenerating}
              >
                Copiar prompt
              </button>
            </div>

            {/* Validation result */}
            {doc.validation && (
              <div className={`status-card ${doc.validation.ok ? "ok" : "error"}`}>
                <p className="status-title">
                  {doc.validation.ok ? "✓ JSON válido" : "✗ JSON com erros"}
                </p>
                {!doc.validation.ok && (
                  <ul>
                    {doc.validation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Render errors */}
            {doc.renderErrors && doc.renderErrors.length > 0 && (
              <div className="status-card error">
                <p className="status-title">⚠ Aviso de geração</p>
                <ul>
                  {doc.renderErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
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
      {doc.previewHtml && (
        <section className="preview-section">
          <div className="preview-header">
            <h3>Preview do CV</h3>
            <div className="preview-actions">
              <span className="chip chip-muted">
                {doc.language === "pt-BR" ? "Português" : "English"}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={doc.closePreview}
              >
                Fechar ✕
              </button>
            </div>
          </div>
          <div className="preview-frame-wrapper">
            <iframe
              className="preview-frame"
              title="Preview do CV"
              srcDoc={doc.previewHtml}
              sandbox="allow-scripts"
            />
          </div>
        </section>
      )}
    </>
  );
}
