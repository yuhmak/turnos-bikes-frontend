import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCookies } from "react-cookie";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Wrench,
} from "lucide-react";
import { clientAxios } from "../utils/clientAxios";
import { aDDMMAAAA, aDiaCorto, hoyISO, rangoDelMes } from "../utils/dates";
import { aCSV, descargarCSV } from "../utils/csv";
import { getProblemLabel } from "../utils/servicios";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Estado = pildora redondeada con icono (se lee sin color). Accion = boton cortado con verbo.
const ESTADOS = {
  Pendiente: { icono: Clock, texto: "text-estado-pen", fondo: "bg-estado-pen/15", borde: "bg-estado-pen" },
  Atendido: { icono: Check, texto: "text-estado-ate", fondo: "bg-estado-ate/15", borde: "bg-estado-ate" },
  Anulado: { icono: Ban, texto: "text-estado-anu", fondo: "bg-estado-anu/15", borde: "bg-estado-anu" },
};

const estadoDe = (s) => s.U_State || "Pendiente";

const columnasCSV = [
  { titulo: "Fecha", valor: (s) => aDDMMAAAA(s.U_Fecha) },
  { titulo: "Hora", valor: (s) => s.U_StartTime },
  { titulo: "Nombre", valor: (s) => s.U_custmrName },
  { titulo: "Teléfono", valor: (s) => s.U_Telephone },
  { titulo: "DNI", valor: (s) => s.U_dni },
  { titulo: "Motivo", valor: (s) => getProblemLabel(s.U_problemTyp, s.U_ProSubType) },
  { titulo: "Descripción", valor: (s) => s.U_descrption },
  { titulo: "Estado", valor: estadoDe },
];

const TODOS = "todos";

const EstadoPill = ({ estado }) => {
  const e = ESTADOS[estado] ?? ESTADOS.Pendiente;
  const Icono = e.icono;
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 font-display text-sm font-bold uppercase tracking-wide ${e.fondo} ${e.texto}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {estado}
    </span>
  );
};

/**
 * Acciones de un turno. Solo los pendientes tienen acciones principales; atendidos y
 * anulados muestran su estado en la pildora y, en el caso de atendido, un "deshacer".
 * Anulado no se deshace desde aca: anular libera el cupo y volver a pendiente no lo
 * vuelve a ocupar (quedaria sobreturno).
 */
const AccionesTurno = ({ shift, onCambiar, ocupado }) => {
  const [confirmando, setConfirmando] = useState(false);
  const estado = estadoDe(shift);

  // La confirmacion de anular se cae sola a los 4s si no se toca.
  useEffect(() => {
    if (!confirmando) return;
    const t = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(t);
  }, [confirmando]);

  if (estado === "Atendido") {
    return (
      <button
        onClick={() => onCambiar(shift, "Pendiente")}
        disabled={ocupado}
        className="inline-flex h-11 items-center gap-1.5 rounded border border-taller-strong px-3 text-sm font-semibold text-taller-muted hover:border-white hover:text-white disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Volver a pendiente
      </button>
    );
  }
  if (estado === "Anulado") return null;

  if (confirmando) {
    return (
      <div className="flex flex-1 gap-2 md:flex-none">
        <button
          onClick={() => onCambiar(shift, "Anulado")}
          disabled={ocupado}
          className="t-btn h-11 flex-1 bg-estado-anu text-black hover:bg-red-300 md:flex-none"
        >
          <Ban className="h-4 w-4" aria-hidden="true" />
          Sí, anular
        </button>
        <button onClick={() => setConfirmando(false)} className="t-btn-ghost h-11 flex-1 md:flex-none">
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-2 md:flex-none">
      <button
        onClick={() => onCambiar(shift, "Atendido")}
        disabled={ocupado}
        className="t-btn h-11 flex-1 bg-white text-black hover:bg-gray-200 md:flex-none"
      >
        <Wrench className="h-4 w-4" aria-hidden="true" />
        Marcar atendido
      </button>
      <button
        onClick={() => setConfirmando(true)}
        disabled={ocupado}
        className="t-btn h-11 flex-1 bg-estado-anu/15 text-estado-anu hover:bg-estado-anu/25 md:flex-none"
        aria-label={`Anular el turno de ${shift.U_custmrName}`}
      >
        Anular
      </button>
    </div>
  );
};

/** Mes en grilla para elegir dia (desktop ancho). */
const MiniMes = ({ anio, mes, conteo, dia, hoyStr, onElegir }) => {
  const primero = new Date(anio, mes - 1, 1);
  const offset = (primero.getDay() + 6) % 7; // semana arranca en lunes
  const ultimo = new Date(anio, mes, 0).getDate();
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: ultimo }, (_, i) => i + 1)];
  const iso = (d) => `${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div className="grid grid-cols-7 gap-0.5 text-center">
      {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
        <span key={i} className="py-1 font-display text-xs font-bold text-taller-faint">{d}</span>
      ))}
      {celdas.map((d, i) => {
        if (!d) return <span key={i} />;
        const fecha = iso(d);
        const n = conteo[fecha];
        const elegido = fecha === dia;
        return (
          <button
            key={i}
            onClick={() => n && onElegir(fecha)}
            disabled={!n}
            aria-pressed={elegido}
            aria-label={`${aDDMMAAAA(fecha)}${n ? `, ${n} turnos` : ", sin turnos"}`}
            className={`flex h-9 flex-col items-center justify-center rounded-sm text-sm font-semibold leading-none ${
              elegido
                ? "bg-accent text-black"
                : n
                ? "bg-taller-surface2 text-white hover:bg-taller-surface3"
                : "text-taller-faint"
            } ${fecha === hoyStr && !elegido ? "ring-1 ring-inset ring-accent" : ""}`}
          >
            {d}
            {n ? <span className={`mt-0.5 text-[10px] font-medium ${elegido ? "text-black" : "text-taller-muted"}`}>{n}</span> : null}
          </button>
        );
      })}
    </div>
  );
};

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
  const filtroEstado = params.get("estado") || "";

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
  const [actualizando, setActualizando] = useState(null); // DocEntry en curso

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

  const conteo = useMemo(() => {
    const c = {};
    turnos.forEach((t) => (c[t.U_Fecha] = (c[t.U_Fecha] || 0) + 1));
    return c;
  }, [turnos]);
  const dias = useMemo(() => Object.keys(conteo).sort(), [conteo]);

  // Dia elegido: el de la URL, si no hoy (si tiene turnos), si no el primero.
  const hoyStr = hoyISO();
  const dia =
    diaParam === TODOS
      ? TODOS
      : dias.includes(diaParam)
      ? diaParam
      : dias.includes(hoyStr)
      ? hoyStr
      : dias[0] ?? TODOS;
  const indiceDia = dias.indexOf(dia);

  const delDia = turnos.filter((t) => dia === TODOS || t.U_Fecha === dia);
  const contarEn = (lista, estado) => lista.filter((t) => estadoDe(t) === estado).length;

  const texto = q.toLowerCase().replace(/\s/g, "");
  const visibles = delDia
    // Sin filtro se ven los activos: el anulado ya libero su cupo y no se atiende, pero
    // no se borra (queda en SAP, en el contador y en el filtro "Anulados" para consultas).
    .filter((t) => (filtroEstado ? estadoDe(t) === filtroEstado : estadoDe(t) !== "Anulado"))
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
  // El proximo a atender: primer pendiente del dia de hoy.
  const proximo = dia === hoyStr ? visibles.find((t) => estadoDe(t) === "Pendiente") : null;

  const handleStatusChange = async (shift, newState) => {
    setActualizando(shift.DocEntry);
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
      toast.success(
        newState === "Anulado"
          ? `Turno de ${shift.U_custmrName} anulado. Lo ves en el filtro "Anulados".`
          : `${shift.U_custmrName}: ${newState.toLowerCase()}`
      );
    } catch (e) {
      console.error("Error al actualizar el estado del turno:", e);
      toast.error("No se pudo actualizar el estado del turno.");
    } finally {
      setActualizando(null);
    }
  };

  const exportar = () => {
    const sufijo = dia === TODOS ? `${anio}-${String(mes).padStart(2, "0")}` : dia;
    descargarCSV(`turnos-${cookies.officeSelected?.BPLName ?? bplId}-${sufijo}.csv`, aCSV(visibles, columnasCSV));
  };

  const irADia = (i) => dias[i] && setFiltro({ dia: dias[i] });
  const anios = [hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1];

  const selectorPeriodo = (
    <div className="flex gap-2">
      <select
        className="t-ctl min-w-0 flex-1"
        value={mes}
        onChange={(e) => setFiltro({ mes: e.target.value, dia: "" })}
        aria-label="Mes"
      >
        {months.map((nombre, i) => (
          <option key={nombre} value={i + 1}>{nombre}</option>
        ))}
      </select>
      <select
        className="t-ctl w-24"
        value={anio}
        onChange={(e) => setFiltro({ anio: e.target.value, dia: "" })}
        aria-label="Año"
      >
        {anios.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <button onClick={buscar} disabled={cargando} className="t-ibtn shrink-0" aria-label="Actualizar">
        <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin motion-reduce:animate-none" : ""}`} />
      </button>
    </div>
  );

  const metricas = [
    ["Pendiente", "Pendientes"],
    ["Atendido", "Atendidos"],
    ["Anulado", "Anulados"],
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      {/* Columna lateral: en mobile va arriba */}
      <aside className="grid gap-4 xl:order-2">
        <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
          {metricas.map(([estado, titulo]) => {
            const e = ESTADOS[estado];
            const Icono = e.icono;
            return (
              <div key={estado} className="relative flex flex-col gap-1 bg-taller-surface px-3 py-2 sm:px-4 sm:py-3 xl:flex-row xl:items-center">
                <span className={`absolute inset-x-0 top-0 h-[3px] xl:inset-y-0 xl:right-auto xl:h-auto xl:w-[3px] ${e.borde}`} />
                <span className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wider text-taller-muted">
                  <Icono className={`hidden h-4 w-4 sm:block ${e.texto}`} aria-hidden="true" />
                  {titulo}
                </span>
                <span className="t-display text-[34px] tabular-nums xl:ml-auto xl:text-[40px]">
                  {contarEn(delDia, estado)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="hidden bg-taller-surface p-4 xl:block">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="t-display text-xl">{months[mes - 1]} {anio}</h3>
            <span className="t-label">{turnos.length} turnos</span>
          </div>
          <MiniMes anio={anio} mes={mes} conteo={conteo} dia={dia} hoyStr={hoyStr} onElegir={(f) => setFiltro({ dia: f })} />
          <div className="mt-3">{selectorPeriodo}</div>
          {dia !== TODOS && (
            <button onClick={() => setFiltro({ dia: TODOS })} className="t-btn-ghost mt-2 w-full">
              Ver todo el mes
            </button>
          )}
        </div>
      </aside>

      <section className="min-w-0">
        {/* Cabecera del dia */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="t-display mr-auto min-w-0 text-[clamp(36px,9vw,44px)]">
            {dia === TODOS ? (
              <>{months[mes - 1]} <span className="text-accent">{anio}</span></>
            ) : (
              <>
                {aDiaCorto(dia).split(" ")[0]} <span className="text-accent">{aDiaCorto(dia).split(" ")[1]}</span>
              </>
            )}
            <small className="mt-1 block font-barlow text-sm font-medium normal-case not-italic tracking-normal text-taller-muted">
              {dia === TODOS ? "Todo el mes" : dia === hoyStr ? "Hoy" : aDDMMAAAA(dia)} · {delDia.length} turnos · {cookies.officeSelected?.AliasName}
            </small>
          </h2>
          {dias.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={() => irADia(indiceDia - 1)} disabled={dia === TODOS || indiceDia <= 0} className="t-ibtn" aria-label="Día anterior">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {dias.includes(hoyStr) && dia !== hoyStr && (
                <button onClick={() => setFiltro({ dia: hoyStr })} className="t-btn-primary">Hoy</button>
              )}
              <button onClick={() => irADia(indiceDia + 1)} disabled={dia === TODOS || indiceDia >= dias.length - 1} className="t-ibtn" aria-label="Día siguiente">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Periodo y dia (debajo de xl; en xl estan en la columna lateral) */}
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:hidden">
          {selectorPeriodo}
          {dias.length > 0 && (
            <select className="t-ctl" value={dia} onChange={(e) => setFiltro({ dia: e.target.value })} aria-label="Día">
              <option value={TODOS}>Todo el mes ({turnos.length})</option>
              {dias.map((d) => (
                <option key={d} value={d}>{aDiaCorto(d)} ({conteo[d]})</option>
              ))}
            </select>
          )}
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex flex-[1_1_100%] gap-1 overflow-x-auto md:flex-none" role="group" aria-label="Filtrar por estado">
            {[["", "Activos", delDia.length - contarEn(delDia, "Anulado")], ...metricas.map(([e, t]) => [e, t, contarEn(delDia, e)])].map(([valor, titulo, n]) => (
              <button
                key={titulo}
                onClick={() => setFiltro({ estado: valor })}
                aria-pressed={filtroEstado === valor}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded border px-3 text-sm font-semibold ${
                  filtroEstado === valor
                    ? "border-white bg-white text-black"
                    : "border-taller-strong text-taller-muted hover:text-white"
                }`}
              >
                {titulo}
                <b className={`font-display text-[17px] ${filtroEstado === valor ? "text-black" : "text-white"}`}>{n}</b>
              </button>
            ))}
          </div>
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-taller-faint" aria-hidden="true" />
            <input
              className="t-ctl w-full pl-9"
              type="search"
              placeholder="Buscar cliente, DNI, teléfono..."
              value={q}
              onChange={(e) => setFiltro({ q: e.target.value })}
            />
          </label>
          <button onClick={exportar} disabled={visibles.length === 0} className="t-btn-ghost">
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </button>
        </div>

        {error && (
          <div className="mt-4 border-l-[3px] border-estado-anu bg-estado-anu/10 p-3 text-sm text-estado-anu">{error}</div>
        )}

        {/* Turnos */}
        {cargando && turnos.length === 0 ? (
          <p className="py-10 text-center text-taller-muted">Cargando turnos...</p>
        ) : visibles.length === 0 ? (
          <p className="py-10 text-center text-taller-muted">
            {turnos.length === 0 ? `No hay turnos en ${months[mes - 1]} ${anio}.` : "Ningún turno coincide con el filtro."}
          </p>
        ) : (
          <ul className="mt-4 border-t border-taller-border">
            {visibles.map((shift) => {
              const estado = estadoDe(shift);
              const anulado = estado === "Anulado";
              return (
                <li
                  key={shift.DocEntry}
                  className="relative grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-taller-border py-3 pl-3 lg:grid-cols-[80px_minmax(0,1.3fr)_minmax(0,1fr)_400px] lg:pl-4"
                >
                  <span className={`absolute bottom-3 left-0 top-3 w-1 ${ESTADOS[estado]?.borde ?? ESTADOS.Pendiente.borde}`} aria-hidden="true" />
                  <span className={`t-display text-[30px] tabular-nums ${anulado ? "text-taller-faint" : ""}`}>
                    {shift.U_StartTime}
                    {dia === TODOS && (
                      <small className="block font-barlow text-xs font-medium not-italic tracking-normal text-taller-muted">
                        {aDDMMAAAA(shift.U_Fecha).slice(0, 5)}
                      </small>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
                      <span className={anulado ? "text-taller-muted line-through" : ""}>{shift.U_custmrName}</span>
                      {proximo?.DocEntry === shift.DocEntry && (
                        <span className="t-cut inline-flex h-[22px] items-center bg-accent px-2.5 font-display text-[13px] font-black italic tracking-wide text-black">
                          PRÓXIMO
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1.5 text-taller-muted">
                      <Wrench className="h-4 w-4 text-accent" aria-hidden="true" />
                      {getProblemLabel(shift.U_problemTyp, shift.U_ProSubType)}
                    </p>
                    {shift.U_descrption && (
                      <p className="mt-0.5 line-clamp-2 text-sm italic text-taller-faint" title={shift.U_descrption}>
                        “{shift.U_descrption}”
                      </p>
                    )}
                  </div>
                  <div className="col-start-2 flex flex-wrap gap-x-4 text-sm text-taller-muted lg:col-start-auto lg:flex-col lg:gap-0">
                    {shift.U_Telephone && (
                      <a href={`tel:${shift.U_Telephone}`} className="inline-flex items-center gap-1.5 text-white hover:text-accent">
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        {shift.U_Telephone}
                      </a>
                    )}
                    {shift.U_dni && <span>DNI {shift.U_dni}</span>}
                  </div>
                  <div className="col-span-full mt-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:mt-0 lg:justify-end">
                    <EstadoPill estado={estado} />
                    <AccionesTurno shift={shift} onCambiar={handleStatusChange} ocupado={actualizando === shift.DocEntry} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Metrics;
