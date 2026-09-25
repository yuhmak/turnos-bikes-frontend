/**
 * Fechas de turnos. SAP devuelve U_Fecha como "2026-09-01" o "2026-09-01T00:00:00Z"
 * (en TURNOS de bikes conviven los dos formatos).
 *
 * IMPORTANTE: nunca usar `new Date("2026-09-01")` ni `.toISOString()` con estas fechas.
 * El string ISO sin hora se parsea en UTC y en Argentina (UTC-3) retrocede un dia;
 * toISOString() formatea en UTC y despues de las 21hs da el dia siguiente.
 * Estas funciones trabajan sobre strings y en hora local.
 */

const pad = (n) => String(n).padStart(2, "0");

/** Cualquier formato de SAP -> "YYYY-MM-DD". "" si no se puede. */
export const aISO = (valor) => {
  if (!valor) return "";
  const [a, m, d] = valor.toString().trim().split("T")[0].split("-");
  return a && m && d ? `${a.padStart(4, "0")}-${pad(m)}-${pad(d)}` : "";
};

/** -> "DD/MM/AAAA" */
export const aDDMMAAAA = (valor) => {
  const iso = aISO(valor);
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

/** Hoy en "YYYY-MM-DD", en hora local. */
export const hoyISO = (h = new Date()) =>
  `${h.getFullYear()}-${pad(h.getMonth() + 1)}-${pad(h.getDate())}`;
