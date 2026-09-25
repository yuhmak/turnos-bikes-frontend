import { useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation, NavLink } from "react-router-dom";
import { useCookies } from "react-cookie";
import toast from "react-hot-toast";
import { CalendarDays, SlidersHorizontal, MapPinned, LogOut, Store, ChevronDown } from "lucide-react";
import SearchShift from "../components/SearchShift.jsx";
import TableShifts from "../components/TableShifts.jsx";
import Metrics from "../components/Metrics.jsx";
import Cobertura from "../components/Cobertura.jsx";
import { clientAxios } from "../utils/clientAxios";
import { useStore } from "../store/useStore";

// Cada seccion es su propia pantalla (ruta), no pestañas de una misma pagina.
const secciones = [
  { path: "panel", corto: "Turnos", titulo: "Turnos del día", icono: CalendarDays },
  { path: "admin", corto: "Cupos", titulo: "Calendario de cupos", icono: SlidersHorizontal },
  { path: "cobertura", corto: "Cobertura", titulo: "Cobertura", icono: MapPinned },
];

const AdminTurnos = () => (
  <>
    <p className="mb-6 max-w-[60ch] text-sm text-taller-muted">
      Cargá cuántas recepciones entran por horario. Los horarios en 0 quedan cerrados para la web.
    </p>
    <SearchShift />
    <TableShifts />
  </>
);

// "093 - BIKES AV PERON": el numero solo no le dice nada al usuario.
const nombreSucursal = (s) => (s ? [s.BPLName, s.AliasName].filter(Boolean).join(" - ") : "");

// Las sucursales habilitadas del usuario las guarda el Login en sessionStorage.
const leerSucursales = () => {
  try {
    return JSON.parse(sessionStorage.getItem("offices")) || [];
  } catch {
    return [];
  }
};

const SelectorSucursal = () => {
  const [cookies, setCookie] = useCookies();
  const resetState = useStore((s) => s.resetState);
  const sucursales = leerSucursales();
  const actual = cookies.officeSelected;

  const cambiar = async (event) => {
    const elegida = sucursales.find((s) => s.BPLId === Number(event.target.value));
    if (!elegida) return;
    const toastId = toast.loading("Cambiando de sucursal...");
    try {
      // Mismo paso que el Login: sin punto de emision para esa sucursal no se opera.
      const { data } = await clientAxios.get("/usuarioPtoEmision", {
        params: { UserCode: cookies.user, Warehouse: elegida.BPLId },
      });
      setCookie("officeSelected", elegida);
      setCookie("poi", data);
      resetState(); // el calendario cargado era de la sucursal anterior
      toast.success(`Sucursal ${nombreSucursal(elegida)}`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Tu usuario no tiene punto de emisión en esa sucursal.", { id: toastId });
    }
  };

  const badge =
    "t-cut relative flex h-9 min-w-0 max-w-[58vw] items-center gap-2 bg-accent pl-4 font-display text-[15px] font-extrabold italic uppercase text-black sm:max-w-md sm:text-[17px]";

  if (sucursales.length <= 1) {
    return (
      <span className={`${badge} pr-4`} title={nombreSucursal(actual)}>
        <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{nombreSucursal(actual)}</span>
      </span>
    );
  }
  return (
    <label className={`${badge} pr-8`}>
      <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Sucursal</span>
      <select
        value={actual?.BPLId ?? ""}
        onChange={cambiar}
        className="min-w-0 cursor-pointer appearance-none truncate bg-transparent focus:outline-none"
      >
        {sucursales.map((s) => (
          <option key={s.BPLId} value={s.BPLId} className="bg-white font-barlow not-italic text-black">
            {nombreSucursal(s)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4" aria-hidden="true" />
    </label>
  );
};

const Dashboard = () => {
  const [cookies, setCookie, removeCookie] = useCookies();
  const navigate = useNavigate();
  const location = useLocation();

  const seccionActual =
    secciones.find((s) => location.pathname.includes(`/turnos/${s.path}`)) ?? secciones[0];

  const handleLogout = () => {
    Object.keys(cookies).forEach((cookieName) => removeCookie(cookieName, { path: "/" }));
    sessionStorage.removeItem("offices");
    navigate("/login");
  };

  const relogin = async () => {
    try {
      const { data } = await clientAxios.post("/loginAgain", { UserName: cookies.user });
      for (const cookie of data["set-cookie"]) {
        const cookieName = cookie.split("=")[0].replace(" ", "");
        const cookieValue = cookie.split("=")[1].split(";")[0];
        setCookie(cookieName, cookieValue, { path: "" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Solo al montar: renueva la sesion de SAP una vez.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTimeout(() => relogin(), 100000); }, []);

  const inicial = String(cookies.user || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-taller-bg font-barlow text-[15px] text-white antialiased">
      {/* Riel en desktop, tab bar abajo en mobile */}
      <aside
        aria-label="Menú"
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-taller-border bg-taller-bg lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[88px] lg:flex-col lg:border-r lg:border-t-0"
      >
        <div className="hidden h-16 place-items-center border-b border-taller-border lg:grid">
          <img src="/miniLogo.png" alt="Yuhmak Bikes" className="h-10 w-10 rounded" />
        </div>
        <nav aria-label="Secciones del panel" className="grid w-full grid-cols-3 lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:p-2">
          {secciones.map(({ path, corto, icono }) => {
            const Icono = icono;
            return (
              <NavLink
                key={path}
                to={`/turnos/${path}`}
                className={({ isActive }) =>
                  `group relative flex flex-col items-center justify-center gap-1 px-1 py-2 text-center font-display text-xs font-bold uppercase tracking-wide transition-colors lg:h-[72px] ${
                    isActive ? "text-white" : "text-taller-muted hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-x-1/4 top-0 h-[3px] bg-accent lg:inset-x-auto lg:inset-y-3 lg:-left-2 lg:h-auto lg:w-1" />
                    )}
                    <Icono className={`h-[22px] w-[22px] ${isActive ? "text-accent" : ""}`} aria-hidden="true" />
                    {corto}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="hidden h-16 flex-col items-center justify-center gap-1 border-t border-taller-border font-display text-xs font-bold uppercase tracking-wide text-taller-muted hover:text-white lg:flex"
        >
          <LogOut className="h-[22px] w-[22px]" aria-hidden="true" />
          Salir
        </button>
      </aside>

      <div className="min-w-0 pb-20 lg:ml-[88px] lg:pb-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-taller-border bg-taller-bg px-4 md:px-8">
          <img src="/miniLogo.png" alt="Yuhmak Bikes" className="h-9 w-9 shrink-0 rounded sm:hidden" />
          <img src="/logo-dark.png" alt="Yuhmak Bikes" className="hidden h-7 w-auto md:block" />
          <span className="hidden h-8 w-px bg-taller-border md:block" aria-hidden="true" />
          <h1 className="t-display min-w-0 flex-1 truncate text-2xl sm:text-[28px]">
            <span className="sr-only sm:not-sr-only">{seccionActual.titulo}</span>
          </h1>
          <SelectorSucursal />
          <span className="hidden items-center gap-2 text-sm text-taller-muted xl:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-taller-strong text-xs font-bold text-white">
              {inicial}
            </span>
            {cookies.user}
          </span>
          <button onClick={handleLogout} className="t-ibtn lg:hidden" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="p-4 md:px-8 md:pb-12 md:pt-6">
          <Routes>
            <Route index element={<Navigate to="panel" replace />} />
            <Route path="panel" element={<Metrics />} />
            <Route path="admin" element={<AdminTurnos />} />
            <Route path="cobertura" element={<Cobertura />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
