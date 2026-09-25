import { clientAxios } from "../utils/clientAxios";
import toast from "react-hot-toast";
import { useStore } from "../store/useStore";
import { useCookies } from "react-cookie";
import { aDDMMAAAA, aDiaCorto } from "../utils/dates";

function TableShifts() {
  const shifts = useStore((s) => s.shifts);
  const manageShiftBody = useStore((s) => s.manageShiftBody);

  const [, setCookie] = useCookies();

  const handleChange = (event, date, hour) => {
    const maped = shifts.map((day) => {
      if (day.U_Fecha === date.U_Fecha) {
        return {
          ...day,
          U_HorarioRecep: date.U_HorarioRecep.map((hs) => {
            if (hs.hs === hour.hs) {
              const newCantrecep = Number(event.target.value);
              if (hs.ocupado > newCantrecep) {
                toast.error(
                  "La cantidad ocupada no puede ser mayor que la cantidad de recepciones."
                );
                return hs;
              }
              const newHabilitad = newCantrecep !== 0 ? "S" : "N";
              return {
                ...hs,
                cantrecep: newCantrecep,
                habilitad: newHabilitad,
              };
            } else return hs;
          }),
        };
      } else return day;
    });
    manageShiftBody(maped);
  };

  const generateCalendar = async () => {
    for (let day of shifts) {
      for (let hour of day.U_HorarioRecep) {
        if (hour.ocupado > hour.cantrecep) {
          toast.error(
            "Error de validación: ocupado no puede ser mayor que cantRecep."
          );
          return;
        }
      }
    }

    const bodyStringified = shifts.map((day) => ({
      ...day,
      U_HorarioRecep: JSON.stringify(day.U_HorarioRecep),
    }));
    setCookie("loading", true);
    const toastId = toast.loading(
      bodyStringified[0].DocEntry ? "Editando calendario..." : "Cargando calendario...",
      { duration: 0 }
    );

    const editando = Boolean(bodyStringified[0].DocEntry);
    try {
      if (editando) {
        await clientAxios.patch("/patchShiftList", bodyStringified);
      } else {
        const { data } = await clientAxios.post("/createShiftList", bodyStringified);
        manageShiftBody(data);
      }
      toast.success(editando ? "Calendario editado." : "Calendario generado.", { id: toastId, duration: 3000 });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el calendario. Intentá de nuevo.", { id: toastId, duration: 3000 });
    } finally {
      setCookie("loading", false);
    }
  };

  const celda = (hour) => {
    if (!hour.cantrecep) return "off";
    if (hour.ocupado >= hour.cantrecep) return "full";
    if (hour.ocupado > 0) return "part";
    return "";
  };
  const fondos = {
    off: "bg-[repeating-linear-gradient(-45deg,#000_0_4px,#282828_4px_8px)]",
    full: "bg-estado-anu/15",
    part: "bg-estado-pen/15",
    "": "bg-taller-surface2",
  };
  const horarios = shifts[0]?.U_HorarioRecep?.map((h) => h.hs) ?? [];

  if (!Array.isArray(shifts) || shifts.length === 0) {
    return <p className="py-10 text-center text-taller-muted">Elegí un mes y año para ver el calendario de cupos.</p>;
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="mr-auto flex flex-wrap gap-4 text-[13px] text-taller-muted">
          <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-3.5 bg-taller-surface2" />Libre</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-3.5 bg-estado-pen/40" />Con reservas</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-3.5 bg-estado-anu/40" />Completo</span>
          <span className="inline-flex items-center gap-1.5"><i className={`h-3.5 w-3.5 ${fondos.off}`} />Cerrado (0)</span>
        </div>
        <button className="t-btn-primary" onClick={generateCalendar}>
          {shifts[0].DocEntry ? "Guardar cambios" : "Cargar calendario"}
        </button>
      </div>

      <div className="overflow-x-auto border border-taller-border bg-taller-surface">
        <table className="w-full min-w-[880px] table-fixed border-separate border-spacing-0.5 p-1">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[112px] bg-taller-surface px-2 text-left font-display text-sm font-bold text-taller-muted">Día</th>
              {horarios.map((hs) => (
                <th key={hs} className="px-0.5 py-1 font-display text-sm font-bold text-taller-muted tabular-nums">{hs}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts.map((head) => (
              <tr key={head.U_Fecha}>
                <td className="sticky left-0 z-10 bg-taller-surface py-1 pl-2 pr-3 font-display text-lg font-extrabold uppercase italic leading-none">
                  {aDiaCorto(head.U_Fecha)}
                </td>
                {head.U_HorarioRecep.map((hour) => {
                  const tipo = celda(hour);
                  return (
                    <td key={hour.hs} className="p-0">
                      <label className={`relative flex h-[52px] w-full flex-col items-center justify-center ${fondos[tipo]}`} title={`${aDDMMAAAA(head.U_Fecha)} ${hour.hs}`}>
                        <span className="sr-only">{`Recepciones ${aDDMMAAAA(head.U_Fecha)} ${hour.hs}`}</span>
                        <input
                          type="number"
                          min="0"
                          value={hour.cantrecep}
                          onChange={(event) => handleChange(event, head, hour)}
                          className={`w-10 border-0 border-b bg-transparent text-center font-display text-xl font-extrabold leading-tight tabular-nums focus:border-accent focus:outline-none ${
                            tipo === "off" ? "border-transparent text-taller-faint" : "border-taller-strong text-white"
                          }`}
                        />
                        <small className={`text-[11px] leading-tight ${tipo === "full" ? "font-bold text-estado-anu" : tipo === "part" ? "text-estado-pen" : "text-taller-muted"}`}>
                          {hour.ocupado} ocup.
                        </small>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default TableShifts;
