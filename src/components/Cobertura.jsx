import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarX, CircleCheck, Ban, RefreshCw } from "lucide-react";
import { clientAxios } from "../utils/clientAxios";
import { aDDMMAAAA } from "../utils/dates";

const ESTADOS = {
  ok: { texto: "Al día", icono: CircleCheck, clase: "bg-estado-ate/15 text-estado-ate", barra: "bg-estado-ate" },
  "por-vencer": { texto: "Por vencer", icono: AlertTriangle, clase: "bg-estado-pen/15 text-estado-pen", barra: "bg-estado-pen" },
  completa: { texto: "Sin cupo libre", icono: Ban, clase: "bg-estado-anu/15 text-estado-anu", barra: "bg-estado-anu" },
  "sin-calendario": { texto: "Sin calendario", icono: CalendarX, clase: "bg-taller-surface3 text-white", barra: "bg-taller-surface3" },
};

// La barra se llena respecto de 60 dias, que es hasta donde se abre la agenda en la web.
const HORIZONTE = 60;

/** Hasta cuándo llega el calendario de cada sucursal y cuál hay que cargar. */
const Cobertura = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (forzar = false) => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await clientAxios.get("/coberturaSucursales", {
        params: forzar ? { forzar: true } : {},
      });
      setDatos(data);
    } catch (e) {
      console.error(e);
      setError("No se pudo calcular la cobertura.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <p className="mr-auto max-w-[60ch] text-sm text-taller-muted">
          Una sucursal aparece en la web si tiene cupos libres a futuro. Avisamos cuando el
          calendario vence en {datos?.diasParaAvisar ?? 30} días o menos.
        </p>
        <button onClick={() => cargar(true)} disabled={cargando} className="t-btn-ghost">
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {error && <div className="border-l-[3px] border-estado-anu bg-estado-anu/10 p-3 text-sm text-estado-anu">{error}</div>}
      {!datos && cargando && <p className="py-10 text-center text-taller-muted">Calculando...</p>}

      {datos && (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {datos.sucursales.map((s) => {
            const e = ESTADOS[s.estado] ?? ESTADOS["sin-calendario"];
            const Icono = e.icono;
            const lleno = s.diasRestantes != null ? Math.min(100, Math.max(0, (s.diasRestantes / HORIZONTE) * 100)) : 0;
            return (
              <li
                key={s.BPLId}
                className="grid grid-cols-[1fr_auto] items-start gap-3 bg-taller-surface p-4 [clip-path:polygon(0_0,calc(100%-20px)_0,100%_20px,100%_100%,0_100%)]"
              >
                <p className="t-display min-w-0 text-[22px]">
                  {s.BPLName} · {s.AliasName}
                  <small className="mt-1 block truncate font-barlow text-[13px] font-medium normal-case not-italic tracking-normal text-taller-muted">
                    {s.Street}{s.City ? `, ${s.City}` : ""}
                  </small>
                </p>
                <p className="t-display text-right text-[40px] leading-[.9] tabular-nums">
                  {s.diasRestantes ?? "—"}
                  <small className="block font-display text-xs font-bold not-italic tracking-[.08em] text-taller-muted">DÍAS</small>
                </p>
                <div className="col-span-full h-1 bg-taller-surface3">
                  <i className={`block h-full ${e.barra}`} style={{ width: `${lleno}%` }} />
                </div>
                <div className="col-span-full flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-taller-muted">
                  <span className={`mr-auto inline-flex h-[26px] items-center gap-1.5 px-2.5 font-display text-sm font-extrabold uppercase tracking-wide ${e.clase}`}>
                    <Icono className="h-3.5 w-3.5" aria-hidden="true" />
                    {e.texto}
                  </span>
                  <span>Hasta <b className="tabular-nums text-white">{s.calendarioHasta ? aDDMMAAAA(s.calendarioHasta) : "—"}</b></span>
                  <span><b className="tabular-nums text-white">{s.lugaresLibres}</b> libres</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {datos && datos.sucursales.length === 0 && (
        <p className="py-10 text-center text-taller-muted">No hay sucursales de bicicletas en SAP.</p>
      )}
    </>
  );
};

export default Cobertura;
