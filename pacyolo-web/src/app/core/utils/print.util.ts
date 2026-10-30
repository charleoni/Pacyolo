/**
 * Utilidad universal de impresión aislada para documentos oficiales de PACYOLO (Pilar 2 de Gobernanza).
 * Renderiza el elemento en un iframe aislado de impresión para garantizar:
 * 1. Exactamente las páginas necesarias del documento (evita hojas en blanco o residuos del dashboard).
 * 2. Cero interferencia de fondos oscuros, barras de navegación o tablas de fondo.
 * 3. Conservación total de estilos Tailwind CSS, fuentes tipográficas, colores y bordes.
 */
export function imprimirElementoAislado(elementoId: string, tituloDocumento: string): void {
  const el = document.getElementById(elementoId);
  if (!el) {
    window.print();
    return;
  }

  // Crear iframe invisible
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

  // Recopilar todos los estilos cargados en la aplicación (Tailwind CSS + fuentes)
  let estilosHtml = '';
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    estilosHtml += node.outerHTML;
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${tituloDocumento}</title>
        ${estilosHtml}
        <style>
          @page {
            size: letter portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .pacyolo-print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            padding: 4px !important;
            margin: 0 !important;
          }
        </style>
      </head>
      <body>
        <div class="pacyolo-print-wrapper">
          ${el.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Esperar a que el navegador procese los estilos en el iframe
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
