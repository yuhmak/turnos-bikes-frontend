import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCookies } from "react-cookie";
import { clientAxios } from "../utils/clientAxios";
import { useStore } from "../store/useStore";
import { getDatesOfMonth } from "../controllers/datesManagement";
import { aDDMMAAAA, hoyISO } from "../utils/dates";

const Metrics = () => {
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uniqueDates, setUniqueDates] = useState([]);

  const [cookies, setCookie] = useCookies();

  // Zustand store
  const existShifts = useStore((s) => s.existShifts);
  const shifts = useStore((s) => s.shifts);
  const monthSelected = useStore((s) => s.monthSelected);
  const yearSelected = useStore((s) => s.yearSelected);
  const setStoreTurnos = useStore((s) => s.getTurnos);

  const handleMonth = (event) => {
    const filtered = months.filter((mon) => mon.value === Number(event.target.value));
    setMonth(filtered[0] || null);
  };

  const handleYear = (event) => setYear(event.target.value);

  const formatDate = aDDMMAAAA;

  // Mapear códigos numéricos de U_problemTyp/U_ProSubType a etiquetas legibles
  const getProblemLabel = (typ, subtype) => {
    // si ya viene como texto, devolver tal cual
    if (!typ && !subtype) return "(sin motivo)";
    if (typeof typ === "string" && isNaN(Number(typ))) return typ;

    const t = Number(typ);
    const s = subtype !== undefined && subtype !== null ? Number(subtype) : null;

    const mapByPair = {
      "39|131": "Service Completo",
      "39|99": "Alineación de ruedas",
      "39|104": "Frenos y cambio",
      "41|94": "Suspensión",
      "39|132": "Instalación de accesorios",
      "41|95": "Personalizado",
    };

    if (s) {
      const pairKey = `${t}|${s}`;
      if (mapByPair[pairKey]) return mapByPair[pairKey];
    }

    // Mapeo por tipo en caso no tengamos subtype
    const mapByType = {
      39: "Mantenimiento / Servicio",
      41: "Soporte técnico",
    };

    return mapByType[t] || String(typ);
  };

  const searchShifts = async () => {
    if (!month) return toast.error("Ingresar el mes.");
    if (!year) return toast.error("Ingresar el año.");
    if (String(year).length !== 4) return toast.error("El año debe contener 4 dígitos.");
    if (!cookies.officeSelected?.BPLId) return toast.error("No hay una sucursal seleccionada.");

    let toastId = null;
    try {
      const dates = getDatesOfMonth(year, month.value, cookies.officeSelected.BPLId);
      setCookie("loading", true);
      toastId = toast.loading("Buscando turnos pertenecientes a ese mes y año...", { duration: 0 });

      // Alineado a SearchShift
      const { data } = await clientAxios.get("/getShiftMonth", {
        params: {
          FechInicio: dates[0].U_Fecha,
          FechFinal: dates[dates.length - 1].U_Fecha,
          BPLId: cookies.officeSelected.BPLId,
        },
      });

      if (data.shiftsExist.length > 0) {
        setStoreTurnos({
          data: data.shifts,
          month,
          year,
          shifts: data.shiftsExist,
        });
        toast.success("Turnos cargados exitosamente.");
      } else {
        setStoreTurnos({
          data: dates,
          month: null,
          year: null,
          shifts: [],
        });
        toast.error("No se encontraron turnos para el período seleccionado.");
      }
    } catch (error) {
      console.error("Error al buscar turnos:", error);
      setStoreTurnos({ data: [], month: null, year: null, shifts: [] });
      toast.error("Error al buscar turnos. Por favor intente nuevamente.");
    } finally {
      setCookie("loading", false);
      if (toastId) toast.dismiss(toastId);
    }
  };

  const handleStatusChange = async (shift, newState) => {
    try {
      const toastId = toast.loading("Actualizando estado del turno...", { duration: 0 });

      await clientAxios.patch(`/patchShiftStatus/${shift.DocEntry}`, {
        U_State: newState,
        U_StartTime: shift.U_StartTime,
        U_Fecha: shift.U_Fecha,
        U_BPLId: shift.U_BPLId,
      });

      const updatedShifts = existShifts.map((s) =>
        s.DocEntry === shift.DocEntry ? { ...s, U_State: newState } : s
      );

      // Mantener datos y mes/año actuales del store, NO cambiar la página actual
      setStoreTurnos({
        data: shifts,
        month: monthSelected,
        year: yearSelected,
        shifts: updatedShifts,
      });

      toast.dismiss(toastId);
      toast.success("Estado del turno actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar el estado del turno:", error);
      toast.error("Error al actualizar el estado del turno.");
    }
  };

  // Agrupar por fecha para paginar y mostrar primero el día de hoy si existe
  useEffect(() => {
    if (Array.isArray(existShifts) && existShifts.length > 0) {
      const dates = [...new Set(existShifts.map((s) => s.U_Fecha))].sort();
      setUniqueDates(dates);
      // Buscar si existe el día de hoy en las fechas
      const todayISO = hoyISO();
      const todayIndex = dates.findIndex((d) => d === todayISO);
      if (todayIndex !== -1) {
        setCurrentPage(todayIndex + 1); // Páginas son 1-indexadas
      } else {
        setCurrentPage(1);
      }
    } else {
      setUniqueDates([]);
      setCurrentPage(1);
    }
  }, [existShifts]);

  // Filtro por búsqueda
  const filteredShifts = (existShifts || []).filter((shift) => {
    const text = searchTerm.toLowerCase().replace(/\s/g, "");
    return Object.values(shift).some((v) =>
      v && v.toString().toLowerCase().replace(/\s/g, "").includes(text)
    );
  });

  // Paginación por fecha
  const totalPages = uniqueDates.length;
  const currentDate = uniqueDates[currentPage - 1];
  const currentShifts = filteredShifts.filter((s) =>
    currentDate ? s.U_Fecha === currentDate : true
  );

  const pendientes = existShifts.filter(
    (s) => s.U_State === "Pendiente" || s.U_State === null
  ).length;
  const atendidos = existShifts.filter((s) => s.U_State === "Atendido").length;
  const anulados = existShifts.filter((s) => s.U_State === "Anulado").length;

  return (
    <>
      {/* Buscador por Mes/Año */}
      <h3 className="pt-3 text-lg font-medium">Ingresar el mes y el año:</h3>
      <div className="flex gap-3 items-center mt-3">
        <div>
          <select className="border rounded px-2 py-1" onChange={handleMonth} defaultValue={0}>
            {months.map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            className="border rounded px-2 py-1 w-32"
            type="number"
            placeholder="Año"
            onChange={handleYear}
          />
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={searchShifts}>
          Buscar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        <div className="bg-yellow-500 text-white rounded p-4">
          <div className="text-lg font-semibold">Turnos Pendientes</div>
          <div className="text-2xl">{pendientes}</div>
        </div>
        <div className="bg-green-600 text-white rounded p-4">
          <div className="text-lg font-semibold">Turnos Atendidos</div>
          <div className="text-2xl">{atendidos}</div>
        </div>
        <div className="bg-red-600 text-white rounded p-4">
          <div className="text-lg font-semibold">Turnos Anulados</div>
          <div className="text-2xl">{anulados}</div>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1"
            type="text"
            placeholder="Buscar cliente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
      </div>

      {/* Tabla de turnos por fecha (paginada) */}
      {currentShifts && currentShifts.length > 0 ? (
        <div className="bg-white shadow rounded p-4">
          {/* Paginación */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-sm bg-gray-200 rounded px-3 py-1 disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="text-sm">
                {currentDate ? formatDate(currentDate) : "Todos"} - Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-sm bg-gray-200 rounded px-3 py-1 disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}

          <div className="overflow-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="text-left text-sm text-gray-600">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentShifts.map((shift) => (
                  <tr
                    className="border-b text-sm"
                    key={`${shift.DocEntry}-${shift.U_Fecha}-${shift.U_StartTime}`}
                  >
                    <td className="px-3 py-2">{shift.U_custmrName}</td>
                    <td className="px-3 py-2">{shift.U_Telephone}</td>
                    <td className="px-3 py-2">{shift.U_dni}</td>
                    <td className="px-3 py-2 text-blue-600">{getProblemLabel(shift.U_problemTyp, shift.U_ProSubType)}</td>
                    
                    <td className="px-3 py-2">{formatDate(shift.U_Fecha)}</td>
                    <td className="px-3 py-2">{shift.U_StartTime}</td>
                    <td className="px-3 py-2">
                      <select
                        className={`px-2 py-1 rounded text-white ${
                          shift.U_State === "Pendiente"
                            ? "bg-yellow-500"
                            : shift.U_State === "Atendido"
                            ? "bg-green-600"
                            : shift.U_State === "Anulado"
                            ? "bg-red-600"
                            : "bg-yellow-500"
                        }`}
                        value={shift.U_State || "Pendiente"}
                        onChange={(e) => handleStatusChange(shift, e.target.value)}
                      >
                        <option value="Pendiente" className="bg-yellow-500 text-white">Pendiente</option>
                        <option value="Atendido" className="bg-green-600 text-white">Atendido</option>
                        <option value="Anulado" className="bg-red-600 text-white">Anulado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {Array.isArray(existShifts) && existShifts.length === 0
            ? "Seleccione un mes y año para ver los turnos"
            : "No hay turnos disponibles para el período seleccionado"}
        </div>
      )}
    </>
  );
};

export default Metrics;

const months = [
  { value: 0, name: "" },
  { value: 1, name: "Enero" },
  { value: 2, name: "Febrero" },
  { value: 3, name: "Marzo" },
  { value: 4, name: "Abril" },
  { value: 5, name: "Mayo" },
  { value: 6, name: "Junio" },
  { value: 7, name: "Julio" },
  { value: 8, name: "Agosto" },
  { value: 9, name: "Septiembre" },
  { value: 10, name: "Octubre" },
  { value: 11, name: "Noviembre" },
  { value: 12, name: "Diciembre" },
];

const headers = [
  "Nombre",
  "N° Contacto",
  "Documento",
  "Motivo",
  
  "Fecha",
  "H.Inicio",
  "Estado",
];