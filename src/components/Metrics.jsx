import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCookies } from "react-cookie";
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search } from "lucide-react";
import { clientAxios } from "../utils/clientAxios";
import { aDDMMAAAA, aDiaCorto, hoyISO, rangoDelMes } from "../utils/dates";
import { aCSV, descargarCSV } from "../utils/csv";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ESTADOS = {
  Pendiente: "bg-yellow-500",
  Atendido: "bg-green-600",
  Anulado: "bg-red-600",
};

// U_problemTyp/U_ProSubType -> etiqueta legible
const getProblemLabel = (typ, subtype) => {
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

const estadoDe = (s) => s.U_State || "Pendiente";

const columnasCSV = [
  { titulo: "Fecha", valor: (s) => aDDMMAAAA(s.U_Fecha) },
  { titulo: "Hora", valor: (s) => s.U_StartTime },
  { titulo: "Nombre", valor: (s) => s.U_custmrName },
  { titulo: "Teléfono", valor: (s) => s.U_Telephone },
  { titulo: "DNI", valor: (s) => s.U_dni },
  { titulo: "Motivo", valor: (s) => getProblemLabel(s.U_problemTyp, s.U_ProSubType) },
  { titulo: "Estado", valor: estadoDe },
];

const TODOS = "todos";

const Metrics = () => {
  const [cookies] = useCookies();
  const bplId = cookies.officeSelected?.BPLId;

  // Filtros en la URL: sobreviven al refresh y se pueden compartir.
  const [params, setParams] = useSearchParams();
  const hoy = new Date();
  const mes = Number(params.get("mes")) || hoy.getMonth() + 1;
  const anio = Number(params.get("anio")) || hoy.getFullYear();
  const diaParam = params.get("dia");
  const q = params.get("q") || "";

  const setFiltro = useCallback(
    (cambios) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(cambios).forEach(([k, v]) =>
            v === "" || v == null ? next.delete(k) : next.set(k, v)
          );
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const buscar = useCallback(async () => {
    if (!bplId) return;
    const { desde, hasta } = rangoDelMes(anio, mes);
    setCargando(true);
    setError(null);
    try {
      const { data } = await clientAxios.get("/getShiftMonth", {
        params: { FechInicio: desde, FechFinal: hasta, BPLId: bplId },
      });
      setTurnos(data.shiftsExist || []);
    } catch (e) {
      console.error("Error al buscar turnos:", e);
      setTurnos([]);
      setError("No se pudieron cargar los turnos. Si sigue pasando, volvé a iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }, [bplId, anio, mes]);

  // Carga el mes al entrar y cada vez que cambia el mes, el año o la sucursal.
  useEffect(() => {
    buscar();
  }, [buscar]);

  // Dias con turnos, con su cantidad.
  const dias = useMemo(() => {
    const conteo = {};
    turnos.forEach((t) => (conteo[t.U_Fecha] = (conteo[t.U_Fecha] || 0) + 1));
    return Object.keys(conteo).sort().map((fecha) => ({ fecha, cantidad: conteo[fecha] }));
  }, [turnos]);

  // Dia elegido: el de la URL, si no hoy (si tiene turnos), si no el primero.
  const hoyStr = hoyISO();
  const dia =
    diaParam === TODOS
      ? TODOS
      : dias.some((d) => d.fecha === diaParam)
      ? diaParam
      : dias.some((d) => d.fecha === hoyStr)
      ? hoyStr
      : dias[0]?.fecha ?? TODOS;
  const indiceDia = dias.findIndex((d) => d.fecha === dia);

  const texto = q.toLowerCase().replace(/\s/g, "");
  const visibles = turnos
    .filter((t) => dia === TODOS || t.U_Fecha === dia)
    .filter(
      (t) =>
        !texto ||
        Object.values(t).some(
          (v) => v && v.toString().toLowerCase().replace(/\s/g, "").includes(texto)
        )
    )
    .sort((a, b) =>
      `${a.U_Fecha}${a.U_StartTime}`.localeCompare(`${b.U_Fecha}${b.U_StartTime}`)
    );

  const contar = (estado) => turnos.filter((t) => estadoDe(t) === estado).length;

  const handleStatusChange = async (shift, newState) => {
    const toastId = toast.loading("Actualizando estado del turno...");
    try {
      await clientAxios.patch(`/patchShiftStatus/${shift.DocEntry}`, {
        U_State: newState,
        U_StartTime: shift.U_StartTime,
        U_Fecha: shift.U_Fecha,
        U_BPLId: shift.U_BPLId,
      });
      setTurnos((prev) =>
        prev.map((s) => (s.DocEntry === shift.DocEntry ? { ...s, U_State: newState } : s))
      );
      toast.success("Estado del turno actualizado.", { id: toastId });
    } catch (e) {
      console.error("Error al actualizar el estado del turno:", e);
      toast.error("No se pudo actualizar el estado del turno.", { id: toastId });
    }
  };

  const exportar = () => {
    const sufijo = dia === TODOS ? `${anio}-${String(mes).padStart(2, "0")}` : dia;
    descargarCSV(`turnos-${cookies.officeSelected?.BPLName ?? bplId}-${sufijo}.csv`, aCSV(visibles, columnasCSV));
  };

  const irADia = (i) => dias[i] && setFiltro({ dia: dias[i].fecha });

  const selectorEstado = (shift) => (
    <select
      aria-label={`Estado del turno de ${shift.U_custmrName}`}
      className={`rounded px-2 py-1 text-sm text-white ${ESTADOS[estadoDe(shift)] ?? ESTADOS.Pendiente}`}
      value={estadoDe(shift)}
      onChange={(e) => handleStatusChange(shift, e.target.value)}
    >
      {Object.keys(ESTADOS).map((estado) => (
        <option key={estado} value={estado} className="bg-white text-gray-900">
          {estado}
        </option>
      ))}
    </select>
  );

  const anios = [hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1];

  return (
    <>
      {/* Periodo */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Mes</span>
          <select
            className="rounded border px-2 py-1.5"
            value={mes}
            onChange={(e) => setFiltro({ mes: e.target.value, dia: "" })}
          >
            {months.map((nombre, i) => (
              <option key={nombre} value={i + 1}>{nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Año</span>
          <select
            className="rounded border px-2 py-1.5"
            value={anio}
            onChange={(e) => setFiltro({ anio: e.target.value, dia: "" })}
          >
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <button
          onClick={buscar}
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 active:scale-[.98] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {/* Metricas del periodo */}
      <div className="my-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          ["Pendientes", contar("Pendiente"), "bg-yellow-500"],
          ["Atendidos", contar("Atendido"), "bg-green-600"],
          ["Anulados", contar("Anulado"), "bg-red-600"],
        ].map(([titulo, valor, color]) => (
          <div key={titulo} className={`${color} rounded p-3 text-white sm:p-4`}>
            <div className="text-xs font-semibold sm:text-base">{titulo}</div>
            <div className="text-2xl font-bold tabular-nums">{valor}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Navegacion por dia + busqueda */}
      {dias.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => irADia(indiceDia - 1)}
              disabled={dia === TODOS || indiceDia <= 0}
              className="rounded border p-1.5 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              className="rounded border px-2 py-1.5 text-sm"
              value={dia}
              onChange={(e) => setFiltro({ dia: e.target.value })}
              aria-label="Día"
            >
              <option value={TODOS}>Todo el mes ({turnos.length})</option>
              {dias.map((d) => (
                <option key={d.fecha} value={d.fecha}>
                  {aDiaCorto(d.fecha)} ({d.cantidad})
                </option>
              ))}
            </select>
            <button
              onClick={() => irADia(indiceDia + 1)}
              disabled={dia === TODOS || indiceDia >= dias.length - 1}
              className="rounded border p-1.5 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {dias.some((d) => d.fecha === hoyStr) && dia !== hoyStr && (
            <button
              onClick={() => setFiltro({ dia: hoyStr })}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Hoy
            </button>
          )}
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              className="w-full rounded border py-1.5 pl-8 pr-2 text-sm"
              type="search"
              placeholder="Buscar cliente, DNI, teléfono..."
              value={q}
              onChange={(e) => setFiltro({ q: e.target.value })}
            />
          </label>
          <button
            onClick={exportar}
            disabled={visibles.length === 0}
            className="inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800 active:scale-[.98] disabled:opacity-40"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </button>
        </div>
      )}

      {/* Turnos */}
      {cargando && turnos.length === 0 ? (
        <div className="py-8 text-center text-gray-500">Cargando turnos...</div>
      ) : visibles.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {turnos.length === 0
            ? `No hay turnos en ${months[mes - 1]} ${anio}.`
            : "Ningún turno coincide con la búsqueda."}
        </div>
      ) : (
        <>
          {/* Mobile: tarjetas */}
          <ul className="space-y-2 md:hidden">
            {visibles.map((shift) => (
              <li key={`${shift.DocEntry}`} className="rounded border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{shift.U_custmrName}</p>
                    <p className="text-sm text-gray-500">
                      {aDDMMAAAA(shift.U_Fecha)} · {shift.U_StartTime}
                    </p>
                  </div>
                  {selectorEstado(shift)}
                </div>
                <p className="mt-2 text-sm text-orange-700">
                  {getProblemLabel(shift.U_problemTyp, shift.U_ProSubType)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {shift.U_Telephone && <a href={`tel:${shift.U_Telephone}`} className="underline">{shift.U_Telephone}</a>}
                  {shift.U_dni && <span> · DNI {shift.U_dni}</span>}
                </p>
              </li>
            ))}
          </ul>

          {/* Desktop: tabla */}
          <div className="hidden overflow-auto md:block">
            <table className="min-w-full table-auto border-collapse">
              <thead className="text-left text-sm text-gray-600">
                <tr>
                  {["Nombre", "N° Contacto", "Documento", "Motivo", "Fecha", "H. Inicio", "Estado"].map((h) => (
                    <th key={h} className="border-b px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map((shift) => (
                  <tr className="border-b text-sm" key={shift.DocEntry}>
                    <td className="px-3 py-2">{shift.U_custmrName}</td>
                    <td className="px-3 py-2">{shift.U_Telephone}</td>
                    <td className="px-3 py-2">{shift.U_dni}</td>
                    <td className="px-3 py-2 text-orange-700">
                      {getProblemLabel(shift.U_problemTyp, shift.U_ProSubType)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{aDDMMAAAA(shift.U_Fecha)}</td>
                    <td className="px-3 py-2 tabular-nums">{shift.U_StartTime}</td>
                    <td className="px-3 py-2">{selectorEstado(shift)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default Metrics;
