import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { clientAxios } from "../utils/clientAxios";
import world from "../assets/login.webp";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Login() {
  const [login, setLogin] = useState({ UserName: "", Password: "" });
  const [cookies, setCookie] = useCookies();
  const [offices, setOffices] = useState([]);
  const navigate = useNavigate();

  const handleChange = (event) =>
    setLogin({ ...login, [event.target.name]: event.target.value });

  const setSessionOffices = (offices) => {
    const allowedBPLIds = [68, 81, 128];
    const filteredOffices = offices.filter(office => allowedBPLIds.includes(office.BPLId));
    sessionStorage.setItem("offices", JSON.stringify(filteredOffices));
    setOffices(filteredOffices);
  };

  const getSessionOffices = () => {
    const storedOffices = sessionStorage.getItem("offices");
    return storedOffices ? JSON.parse(storedOffices) : [];
  };

  const clearSessionData = () => {
    sessionStorage.removeItem("offices");
    setOffices([]);
  };

  useEffect(() => {
    const storedOffices = getSessionOffices();
    setOffices(storedOffices);
  }, []);

  const baseCookies = () => {
    setCookie("user", null);
    setCookie("rol", []);
    setCookie("asignee", null);
    setCookie("loading", false);
    setCookie("officeSelected", {});
    setCookie("poi", null);
    setCookie("isLoggedIn", false);
    clearSessionData();
  };

  // Solo al montar: limpia las cookies si no hay usuario.
  useEffect(() => {
    if (!!cookies.user === false) baseCookies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loggedIn = async () => {
    const { data } = await clientAxios.post("/login", login);
    for (const cookie of data.session["set-cookie"].split(",")) {
      const cookieName = cookie.split("=")[0].replace(" ", "");
      const cookieValue = cookie.split("=")[1].split(";")[0];
      setCookie(cookieName, cookieValue, { path: "" });
    }

    setCookie("user", login.UserName);
    setCookie("rol", data.rol);
    setCookie("asignee", data.asignee);
    setCookie("offices", data.sucu);
    setSessionOffices(data.sucu); // Guardar sucursales en sessionStorage
    return data;
  };

  const loginWithToast = async (e) => {
    e.preventDefault();
    setCookie("loading", true);
    try {
      if (!login.UserName || !login.Password) {
        toast.error("Por favor, complete todos los campos.");
        setCookie("loading", false);
        return;
      }
      await toast.promise(loggedIn(), {
        loading: "Ingresando...",
        success: <b>Usuario logueado exitosamente!</b>,
        error: (
          <b>
            Ocurrió un problema al iniciar sesión. Puede que el usuario o la
            contraseña sean incorrectas.
          </b>
        ),
      });
      setCookie("loading", false);
    } catch (error) {
      setCookie("loading", false);
      console.error(error);
      baseCookies();
      
    }
  };
  const obtainPOI = async (event) => {
    const storedOffices = getSessionOffices();
    const office = storedOffices.filter(
      (office) => office.BPLId === parseInt(event.target.value)
    );
    const { data } = await clientAxios.get("/usuarioPtoEmision", {
      params: { UserCode: cookies.user, Warehouse: office[0].BPLId },
    });
    setCookie("officeSelected", office[0]);
    setCookie("poi", data);
    setCookie("isLoggedIn", true);
  };

  const poiWithToast = async (event) => {
    event.preventDefault();
    setCookie("loading", true);
    try {
      await toast.promise(obtainPOI(event), {
        loading: "Obteniendo el POI de la sucursal...",
        success: <b>Usuario logueado exitosamente!</b>,
        error: (
          <b>
            Ocurrió un problema al obtener el POI. Porfavor solicitar que a su
            usuario se le asigne el POI correspondiente a la sucursal que
            eligió.
          </b>
        ),
      });
      setCookie("loading", false);
      // si el login fue exitoso y cookie isLoggedIn es true, navegar al dashboard de turnos
      const isLogged =
        sessionStorage.getItem("redirectAfterLogin") === "true" ||
        cookies.isLoggedIn;
      if (isLogged || cookies.isLoggedIn) navigate("/turnos");
    } catch (error) {
      setCookie("loading", false);
      console.error(error);
    }
  };

  useEffect(() => {
    if (cookies.isLoggedIn && cookies.officeSelected) {
      navigate("/turnos");
    }
  }, [cookies.isLoggedIn, cookies.officeSelected, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Image */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#e45f00] to-[#464544] shadow-slate-700 ">
        <div className="relative w-full h-full">
          <img
            src={world}
            className="absolute inset-0 w-full h-full object-cover "
            alt="login-background"
          />
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="w-24 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              Turnos Service Bikes
            </h1>
          </div>

          {cookies.user === null && (
            <div className="bg-white p-8 rounded-xl shadow-lg ">
              <img src="/logo.png" alt="Logo" className=" mb-8 rounded-lg" />
              <h2 className="text-2xl font-bold text-gray-700 mb-8 text-center">
                Iniciar Sesión
              </h2>
              <form className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Usuario
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <input
                      name="UserName"
                      type="text"
                      autoComplete="username"
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese su usuario"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <input
                      type="password"
                      name="Password"
                      autoComplete="current-password"
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese su contraseña"
                    />
                  </div>
                </div>
                <button
                  onClick={loginWithToast}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#e45f00] hover:bg-[#cf844f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Ingresar
                </button>
              </form>
            </div>
          )}

          {cookies.user !== null && offices.length > 0 && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Bienvenido <span className="text-blue-600">{cookies.user}</span>
              </h2>
              <form className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Selecciona una sucursal
                  </label>
                  <select
                    onChange={poiWithToast}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option hidden>Seleccione una sucursal</option>
                    {offices.map((office) => (
                      <option key={office.BPLId} value={office.BPLId}>
                        {office.BPLName} - {office.AliasName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    baseCookies();
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </form>
            </div>
          )}

          {cookies.user !== null && !offices.length && !cookies.loading && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Bienvenido <span className="text-blue-600">{cookies.user}</span>
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    El usuario no posee sucursales asociadas. Intente ingresar
                    con otro usuario o solicite que se le asocien sucursales.
                  </p>
                </div>
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    baseCookies();
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
