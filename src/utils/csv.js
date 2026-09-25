// Separador ";" y BOM: es lo que Excel en español abre bien con doble clic.
const celda = (v) => {
  const s = v == null ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** columnas: [{ titulo, valor: (fila) => any }] */
export const aCSV = (filas, columnas) =>
  "﻿" +
  [columnas.map((c) => celda(c.titulo)).join(";"),
   ...filas.map((f) => columnas.map((c) => celda(c.valor(f))).join(";"))].join("\r\n");

export const descargarCSV = (nombre, contenido) => {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  a.click();
  URL.revokeObjectURL(url);
};
