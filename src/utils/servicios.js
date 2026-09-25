// U_problemTyp/U_ProSubType (codigos SAP) -> etiqueta legible. Mismos pares que arma el BookingForm.
export const getProblemLabel = (typ, subtype) => {
  if (!typ && !subtype) return "(sin motivo)";
  if (typeof typ === "string" && isNaN(Number(typ))) return typ;

  const mapByPair = {
    "39|131": "Service Completo",
    "39|99": "Alineación de ruedas",
    "39|104": "Frenos y cambio",
    "41|94": "Suspensión",
    "39|132": "Instalación de accesorios",
    "41|95": "Personalizado",
  };
  const pair = mapByPair[`${Number(typ)}|${Number(subtype)}`];
  if (pair) return pair;
  return { 39: "Mantenimiento / Servicio", 41: "Soporte técnico" }[Number(typ)] || String(typ);
};
