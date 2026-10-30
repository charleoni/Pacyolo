/**
 * Utilidad universal de impresión aislada de alta fidelidad para documentos contables oficiales de PACYOLO.
 * Incorpora una hoja de estilo tipográfica corporativa NIIF autónoma e independiente de Tailwind,
 * garantizando que el documento membretado se imprima idéntico en cualquier navegador, impresora o exportador PDF.
 */

export const ESTILOS_IMPRESION_CORPORATIVA = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: letter portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #0f172a !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }

  .doc-wrapper {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    background: #ffffff;
  }

  /* 1. ENCABEZADO MEMBRETADO */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }

  .company-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .company-logo {
    width: 32px;
    height: 32px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
    letter-spacing: -0.5px;
  }

  .company-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: -0.3px;
    line-height: 1.1;
  }

  .company-tax-info {
    font-size: 9.5px;
    color: #475569;
    line-height: 1.4;
  }

  .doc-consecutive-box {
    border: 2px solid #0f172a;
    border-radius: 8px;
    background: #f8fafc;
    padding: 6px 14px;
    text-align: center;
    min-width: 220px;
  }

  .doc-consecutive-badge {
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    display: block;
  }

  .doc-consecutive-title {
    font-size: 11.5px;
    font-weight: 900;
    color: #0f172a;
    display: block;
    margin-top: 1px;
    line-height: 1.2;
  }

  .doc-consecutive-number {
    font-size: 15px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 900;
    color: #1e3a8a;
    display: block;
    margin-top: 3px;
  }

  /* 2. REJILLA DE METADATOS */
  .doc-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 6px 12px;
    margin-bottom: 10px;
  }

  .meta-item-label {
    font-size: 8.5px;
    text-transform: uppercase;
    font-weight: 800;
    color: #64748b;
    display: block;
  }

  .meta-item-value {
    font-size: 10.5px;
    font-weight: 700;
    color: #0f172a;
    display: block;
    margin-top: 1px;
  }

  .meta-item-value.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .meta-status-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 8.5px;
    font-weight: 800;
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  /* 3. CAJA BENEFICIARIO & GLOSA */
  .doc-concept-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 12px;
    background: #ffffff;
  }

  .concept-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 10.5px;
  }

  .concept-label {
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748b;
    margin-right: 6px;
  }

  .concept-text {
    font-size: 10.5px;
    font-weight: 700;
    color: #0f172a;
  }

  .amount-words-box {
    background: #f1f5f9;
    border-left: 3.5px solid #0f172a;
    padding: 5px 8px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 6px;
  }

  /* 4. TABLA DE PARTIDA DOBLE */
  .doc-table-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .doc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }

  .doc-table th {
    background: #0f172a;
    color: #ffffff;
    padding: 6px 8px;
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #cbd5e1;
  }

  .doc-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }

  .doc-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .doc-table tfoot td {
    background: #f1f5f9;
    font-weight: 900;
    color: #0f172a;
    border-top: 2px solid #0f172a;
    border-bottom: 2px solid #0f172a;
    padding: 7px 8px;
    font-size: 10px;
  }

  .text-right {
    text-align: right;
  }

  .text-center {
    text-align: center;
  }

  .font-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  /* 5. CUADRO DE FIRMAS REGLAMENTARIAS */
  .doc-signatures-section {
    margin-top: 14px;
  }

  .signatures-title {
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
    display: block;
  }

  .signatures-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .signatures-grid.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .signature-box {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    padding: 8px;
    text-align: center;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .signature-role {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748b;
  }

  .signature-line {
    border-bottom: 1px dashed #94a3b8;
    margin: 16px 0 4px 0;
  }

  .signature-name {
    font-size: 9px;
    font-weight: 700;
    color: #0f172a;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .signature-meta {
    font-size: 7.5px;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    display: block;
    margin-top: 1px;
  }

  /* 6. PIE DE PÁGINA */
  .doc-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: #64748b;
  }
`;

export function imprimirElementoAislado(elementoId: string, tituloDocumento: string): void {
  const el = document.getElementById(elementoId);
  if (!el) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.name = 'pacyolo_print_frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${tituloDocumento}</title>
        <style>
          ${ESTILOS_IMPRESION_CORPORATIVA}
        </style>
      </head>
      <body>
        <div class="doc-wrapper">
          ${el.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Esperar a que el iframe procese el CSS inyectado
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Limpieza posterior
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}
