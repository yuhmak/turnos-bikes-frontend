import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation, NavLink } from "react-router-dom";
import { useCookies } from "react-cookie";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Settings2,
  MapPinned,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Store,
} from "lucide-react";
import SearchShift from "../components/SearchShift.jsx";
import TableShifts from "../components/TableShifts.jsx";
import Metrics from "../components/Metrics.jsx";
import Cobertura from "../components/Cobertura.jsx";
import { clientAxios } from "../utils/clientAxios";
import { useStore } from "../store/useStore";

const secciones = [
  { path: "panel", titulo: "Panel de turnos", icono: CalendarDays },
  { path: "admin", titulo: "Calendario de cupos", icono: Settings2 },
  { path: "cobertura", titulo: "Cobertura de sucursales", icono: MapPinned },
];

const AdminTurnos = () => (
  <>
    <p className="mb-4 text-sm text-gray-600">
      Desde acá podés gestionar la cantidad de turnos por horario.
    </p>
    <SearchShift />
    <TableShifts />
  </>
);

// "68 - Av. Perón": el numero solo no le dice nada al usuario.
const nombreSucursal = (s) =>
  s ? [s.BPLName, s.AliasName].filter(Boolean).join(" - ") : "";

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
  const actual = cookies.officeSelected?.BPLId;

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

  if (sucursales.length <= 1) {
    return <p className="text-xs text-gray-500">{nombreSucursal(cookies.officeSelected)}</p>;
  }
  return (
    <label className="block">
      <span className="sr-only">Sucursal</span>
      <select
        value={actual ?? ""}
        onChange={cambiar}
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {sucursales.map((s) => (
          <option key={s.BPLId} value={s.BPLId}>
            {nombreSucursal(s)}
          </option>
        ))}
      </select>
    </label>
  );
};

const Dashboard = () => {
  const [colapsado, setColapsado] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies();
  const navigate = useNavigate();
  const location = useLocation();

  const seccionActual =
    secciones.find((s) => location.pathname.includes(`/turnos/${s.path}`)) ?? secciones[0];

  // Cerrar el drawer al navegar.
  useEffect(() => setDrawerAbierto(false), [location.pathname]);

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

  const menu = (compacto) => (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <img
          src={compacto ? "/miniLogo.png" : "/logo.png"}
          alt="Yuhmak Bikes"
          className="mx-auto h-auto max-h-16"
        />
      </div>

      <div className="space-y-1 border-b p-4">
        {compacto ? (
          <Store className="mx-auto h-5 w-5 text-gray-500" aria-label="Sucursal" />
        ) : (
          <>
            <p className="truncate text-sm font-medium text-gray-900">{cookies.user}</p>
            <SelectorSucursal />
          </>
        )}
      </div>

      <nav className="flex-1 p-3" aria-label="Secciones del panel">
        <ul className="space-y-1">
          {secciones.map(({ path, titulo, icono }) => {
            const Icono = icono;
            return (
            <li key={path}>
              <NavLink
                to={`/turnos/${path}`}
                title={compacto ? titulo : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors active:scale-[.98] ${
                    isActive
                      ? "bg-orange-50 font-medium text-orange-700"
                      : "text-gray-600 hover:bg-gray-50"
                  } ${compacto ? "justify-center" : ""}`
                }
              >
                <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!compacto && <span>{titulo}</span>}
              </NavLink>
            </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t p-3">
        <button
          onClick={() => setColapsado(!colapsado)}
          className="hidden w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-50 lg:flex"
          aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
        >
          {colapsado ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 ${
            compacto ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          {!compacto && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside
        className={`hidden shrink-0 bg-white shadow-lg transition-[width] duration-300 lg:block ${
          colapsado ? "w-20" : "w-64"
        }`}
      >
        {menu(colapsado)}
      </aside>

      {/* Drawer mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${drawerAbierto ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerAbierto}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            drawerAbierto ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerAbierto(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none ${
            drawerAbierto ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setDrawerAbierto(false)}
            className="absolute right-2 top-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
          {menu(false)}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setDrawerAbierto(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="flex-1 truncate text-lg font-semibold text-gray-900 sm:text-xl">
              {seccionActual.titulo}
            </h1>
            <span className="inline-flex max-w-[45vw] items-center gap-1.5 truncate rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              {nombreSucursal(cookies.officeSelected)}
            </span>
          </div>
        </header>

        <main className="p-3 sm:p-6">
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <Routes>
              <Route index element={<Navigate to="panel" replace />} />
              <Route path="panel" element={<Metrics />} />
              <Route path="admin" element={<AdminTurnos />} />
              <Route path="cobertura" element={<Cobertura />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
