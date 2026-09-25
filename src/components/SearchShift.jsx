import { useState } from "react";
import toast from "react-hot-toast";
import { clientAxios } from "../utils/clientAxios";
import { useStore } from "../store/useStore";
import { getDatesOfMonth } from "../controllers/datesManagement";
import { useCookies } from "react-cookie";

const months = [
  { value: 0, name: " " },
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

function SearchShift() {
  // Arranca en el mes actual: antes el select venia vacio y "Buscar" tiraba "Ingresar el mes".
  const [month, setMonth] = useState(months[new Date().getMonth() + 1]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const setStoreTurnos = useStore((s) => s.getTurnos);
  const [cookies, setCookie] = useCookies([]);

  const handleMonth = (event) => {
    const filtered = months.filter((mon) => mon.value === Number(event.target.value));
    setMonth(filtered[0]);
  };

  const handleYear = (event) => setYear(event.target.value);

  const searchShift = async () => {
    if (!month) {
      toast.error("Ingresar el mes.");
      return;
    }
    if (!year) {
      toast.error("Ingresar el año.");
      return;
    }
    if (year.length !== 4) {
      toast.error("El año debe contener 4 dígitos");
      return;
    }
    
    if (!cookies.officeSelected?.BPLId) {
      toast.error("No hay una sucursal seleccionada");
      return;
    }

    let toastId = null;
    
    try {
      const dates = getDatesOfMonth(year, month.value, cookies.officeSelected.BPLId);
      setCookie("loading", true);
      toastId = toast.loading("Buscando turnos pertenecientes a ese mes y año...", { duration: 0 });
      
      const { data } = await clientAxios.get("/getShiftsLastMonth", {
        params: {
          FechInicio: dates[0].U_Fecha,
          FechFinal: dates[dates.length - 1].U_Fecha,
          BPLId: cookies.officeSelected.BPLId,
        },
      });

      if (data.shifts.length > 0) {
        setStoreTurnos({ 
          data: data.shifts, 
          month, 
          year, 
          shifts: data.shiftsExist 
        });
        toast.success("Turnos cargados exitosamente");
      } else {
        setStoreTurnos({ 
          data: dates, 
          month: null, 
          year: null, 
          shifts: [] 
        });
        toast.error("No se encontraron turnos para el período seleccionado");
      }
    } catch (error) {
      console.error("Error al buscar turnos:", error);
      toast.error("Error al buscar turnos. Por favor intente nuevamente.");
      setStoreTurnos({ 
        data: [], 
        month: null, 
        year: null, 
        shifts: [] 
      });
    } finally {
      setCookie("loading", false);
      if (toastId) toast.dismiss(toastId);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-end gap-2">
      <label>
        <span className="t-label mb-1 block">Mes</span>
        <select className="t-ctl" onChange={handleMonth} defaultValue={month.value}>
          {months.map((opt) => (
            <option value={opt.value} key={opt.value}>
              {opt.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="t-label mb-1 block">Año</span>
        <input className="t-ctl w-28" type="number" placeholder="Año" defaultValue={year} onChange={handleYear} />
      </label>
      <button className="t-btn-primary" onClick={searchShift}>
        Buscar
      </button>
    </div>
  );
}

export default SearchShift;
