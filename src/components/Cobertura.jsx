import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { clientAxios } from "../utils/clientAxios";
import { aDDMMAAAA } from "../utils/dates";

const ESTADOS = {
  ok: { texto: "Al día", clase: "bg-green-100 text-green-800" },
  "por-vencer": { texto: "Por vencer", clase: "bg-yellow-100 text-yellow-800" },
  completa: { texto: "Sin cupo libre", clase: "bg-red-100 text-red-800" },
  "sin-calendario": { texto: "Sin calendario", clase: "bg-gray-100 text-gray-700" },
};

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          Una sucursal aparece en la web si tiene cupos libres a futuro. Avisamos cuando el
          calendario vence en {datos?.diasParaAvisar ?? 30} días o menos.
        </p>
        <button
          onClick={() => cargar(true)}
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50 active:scale-[.98] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!datos && cargando && <div className="py-8 text-center text-gray-500">Calculando...</div>}

      {datos && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {datos.sucursales.map((s) => {
            const estado = ESTADOS[s.estado] ?? ESTADOS["sin-calendario"];
            return (
              <li key={s.BPLId} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{s.BPLName}</p>
                    <p className="truncate text-sm text-gray-500">{s.Street}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>
                    {estado.texto}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Hasta</dt>
                    <dd className="tabular-nums">{s.calendarioHasta ? aDDMMAAAA(s.calendarioHasta) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Faltan</dt>
                    <dd className="tabular-nums">{s.diasRestantes != null ? `${s.diasRestantes} días` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Libres</dt>
                    <dd className="tabular-nums">{s.lugaresLibres}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
      {datos && datos.sucursales.length === 0 && (
        <p className="py-8 text-center text-gray-500">No hay sucursales de bicicletas en SAP.</p>
      )}
    </>
  );
};

export default Cobertura;
