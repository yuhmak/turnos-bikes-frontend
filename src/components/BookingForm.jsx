import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { clientAxios } from "../utils/clientAxios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { es } from "dayjs/locale/es";
import utc from "dayjs/plugin/utc";

dayjs.locale("es");
dayjs.extend(utc);


const BookingForm = () => {
  const [officeList, setOfficeList] = useState([]);
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [dateData, setDateData] = useState([]);


  const initialValues = {
    U_Fecha: "",
    U_custmrName: "",
    U_City: "",
    U_Street: "",
    U_Telephone: "",
    U_descrption: "",
    U_StartTime: "",
    U_Email: "",
    U_dni: "",
    U_TipoOrigen: "BIKES",
    U_BPLName: "",
    U_problemTyp: services[0] || "",
    U_State: "Pendiente",
    U_ProSubType: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  const selectedBplId = watch("U_BPLId");
  const selectedDate = watch("U_Fecha");

  // calcular horarios disponibles según la fecha seleccionada y los datos traídos desde el servidor
  const availableTimes = React.useMemo(() => {
    if (!Array.isArray(dateData) || dateData.length === 0) return dateData;
    const found = dateData.find(
      (d) => String(d.U_Fecha) === String(selectedDate)
    );
    if (!found) return [];
    // cada horario esperado tiene una propiedad 'hs' (hora)
    return Array.isArray(found.U_HorarioRecep)
      ? found.U_HorarioRecep.map((h) => h.hs)
      : [];
  }, [dateData, selectedDate]);

  // Si cambian los horarios disponibles, seleccionar el primero por defecto
  React.useEffect(() => {
    if (availableTimes && availableTimes.length > 0) {
      setValue("U_StartTime", availableTimes[0]);
    }
  }, [availableTimes, setValue]);

  useEffect(() => {
    // Obtener sucursales
    const getSucursal = async () => {
      try {
        const { data } = await clientAxios.get(`/sucursalesClient`);
        setOfficeList(Array.isArray(data) ? data : []);
        // si existen sucursales, seleccionar la primera por defecto
        if (Array.isArray(data) && data.length > 0) {
          setValue("U_BPLId", data[0].BPLId);
          setValue("U_BPLName", data[0].Street);
        }
      } catch (err) {
        console.error("Error fetching offices:", err);
        toast.error("No se pudieron cargar las sucursales");
      }
    };

    getSucursal();
  }, [setValue]);

  // Mantener U_BPLName sincronizado con la select U_BPLId
  useEffect(() => {
    if (!selectedBplId) return;
    const found = officeList.find(
      (o) => String(o.BPLId) === String(selectedBplId)
    );
    if (found) setValue("U_BPLName", found.Street);
  }, [selectedBplId, officeList, setValue]);

  // Obtener fechas y horarios disponibles para una sucursal
  const getShiftPermonth = async (bplId) => {
    if (!bplId) {
      setDateData([]);
      return;
    }

    try {
      // solicitar al backend las fechas por sucursal
      const { data } = await clientAxios.get(`/getShiftPerMonth`, {
        params: { BPLId: bplId },
      });

      if (!Array.isArray(data) || data.length === 0) {
        setDateData([]);
        toast.info("No hay fechas disponibles para la sucursal seleccionada.");
        return;
      }

      // Filtra y transforma los datos recibidos: conservar solo horarios habilitados
      const filteredData = data.reduce((acc, item) => {
        const habilitados = Array.isArray(item.U_HorarioRecep)
          ? item.U_HorarioRecep.filter((horario) => horario.habilitad === "S")
          : [];

        if (habilitados.length > 0) {
          acc.push({ ...item, U_HorarioRecep: habilitados });
        }
        return acc;
      }, []);

      setDateData(filteredData);
    } catch (error) {
      console.error("Error fetching shift per month:", error);
      toast.error("Error cargando fechas disponibles. Intente nuevamente.");
      setDateData([]);
    }
  };

  // Ejecutar la carga de fechas cada vez que cambie la sucursal seleccionada
  useEffect(() => {
    if (!selectedBplId) return;
    getShiftPermonth(selectedBplId);
  }, [selectedBplId]);

  // Cuando cambian las fechas traídas, establecer la primera fecha disponible por defecto
  useEffect(() => {
    if (Array.isArray(dateData) && dateData.length > 0) {
      setValue("U_Fecha", dateData[0].U_Fecha);
    } else {
      // fallback a días locales
      setValue("U_Fecha",  "");
    }
  }, [dateData, setValue]);

  // Devuelve los códigos de tipo y subtipo según la selección del cliente
  const getProblemCodes = (stringType) => {
    const map = {
      "Service Completo": { U_problemTyp: 39, U_ProSubType: 131 },
      "Alineación de ruedas": { U_problemTyp: 39, U_ProSubType: 99 },
      "Frenos y cambio": { U_problemTyp: 39, U_ProSubType: 104 },
      "Suspensión": { U_problemTyp: 41, U_ProSubType: 94 },
      "Instalación de accesorios": { U_problemTyp: 39, U_ProSubType: 132 },
      "Personalizado": { U_problemTyp: 41, U_ProSubType: 95 },
      "Posventa": { U_problemTyp: 39, U_ProSubType: 131 }
    };
    return map[stringType] || { U_problemTyp: stringType, U_ProSubType: "" };
  };


  const onSubmit = async (formData) => {
    setSending(true);
    try {
      // Primero verificar si existe un turno para el DNI en la fecha seleccionada
      const shiftExisting = await clientAxios.get("/getShiftExist", {
        params: {
          U_dni: formData.U_dni,
          U_Fecha: formData.U_Fecha,
        },
      });
      console.log("shiftExisting:", shiftExisting.data);
      // Si hay un turno existente, mostrar mensaje y no continuar
      if (shiftExisting.data.exists) {
        toast.error("Ya existe un turno para este DNI en la fecha seleccionada");
        setSending(false);
        return;
      }

      // Normalizar campos (nombre, calle, ciudad, email) a mayúsculas antes de enviar
      const normalizedForm = {
        ...formData,
        U_custmrName: String(formData.U_custmrName || "").trim().toUpperCase(),
        U_Street: String(formData.U_Street || "").trim().toUpperCase(),
        U_City: String(formData.U_City || "").trim().toUpperCase(),
        U_Email: String(formData.U_Email || "").trim().toUpperCase(),
      };

      // Determinar códigos por el tipo de servicio (no normalizamos U_problemTyp porque es clave para el mapeo)
      const codes = getProblemCodes(formData.U_problemTyp);
      const payload = {
        ...normalizedForm,
        U_problemTyp: codes.U_problemTyp,
        U_ProSubType: codes.U_ProSubType,
        U_TipoOrigen: "BIKES",
        U_State: "Pendiente",
      };

      // Debug: ver el formulario normalizado y el payload final antes de enviarlo
      console.debug("Normalized form:", normalizedForm);
      console.debug("Payload antes de enviar:", payload);

      // Enviar al servidor
      const { data } = await clientAxios.post("/turnos", payload);

      const confirmObj = {
        ...payload,
        ...(data && typeof data === "object" ? data : { apiMessage: data }),
      };

      // Guardar confirmación y notificar
      setConfirm(confirmObj);
      toast.success("Reserva creada correctamente");

      // Resetear formulario manteniendo la sucursal seleccionada
      reset({
        ...initialValues,
        U_BPLId: formData.U_BPLId,
        U_BPLName: formData.U_BPLName,
      });
    } catch (err) {
      console.error("Error creating booking:", err);
      toast.error(err.response.data.error || "Error al crear la reserva. Intente nuevamente.",{
        position: "top-center",

      });
    } finally {
      setSending(false);
    }
  };
  console.log("Confirm:", confirm);

  return (
    <div className="card relative">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-700 ">Nombre *</span>
          <input
            className="mt-1 block w-full p-2 border rounded text-transform: uppercase"
            {...register("U_custmrName", { 
              required: "El nombre es obligatorio",
              minLength: {
                value: 3,
                message: "El nombre debe tener al menos 3 caracteres"
              },
              pattern: {
                value: /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/,
                message: "El nombre solo debe contener letras"
              }
            })}
          />
          {errors.U_custmrName && (
            <span className="text-sm text-red-500">{errors.U_custmrName.message}</span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-700">Teléfono *</span>
            <input
              type="tel"
              className="mt-1 block w-full p-2 border rounded"
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              {...register("U_Telephone", {
                required: "El teléfono es obligatorio",
                pattern: {
                  value: /^(?:11|[2368]\d)[0-9]{8}$/,
                  message: "Ingrese un número válido (ej: 3812345678)",
                },
                minLength: {
                  value: 10,
                  message: "El teléfono debe tener 10 dígitos",
                },
                maxLength: {
                  value: 10,
                  message: "El teléfono debe tener 10 dígitos",
                },
              })}
            />
            {errors.U_Telephone && (
              <span className="text-sm text-red-500">{errors.U_Telephone.message}</span>
            )}
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Email *</span>
            <input
              type="email"
              className="mt-1 block w-full p-2 border rounded uppercase"
              {...register("U_Email", {
                required: "El email es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Ingrese un email válido",
                },
              })}
            />
            {errors.U_Email && (
              <span className="text-sm text-red-500">{errors.U_Email.message}</span>
            )}
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-gray-700">DNI *</span>
          <input
            type="text"
            className="mt-1 block w-full p-2 border rounded"
            placeholder="Ej: 12345678"
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            {...register("U_dni", {
              required: "El DNI es obligatorio",
              pattern: {
                value: /^\d{7,8}$/,
                message: "Ingrese un DNI válido (7-8 dígitos sin puntos)",
              },
              minLength: {
                value: 7,
                message: "El DNI debe tener entre 7 y 8 dígitos"
              },
              maxLength: {
                value: 8,
                message: "El DNI debe tener entre 7 y 8 dígitos"
              }
            })}
          />
          {errors.U_dni && (
            <span className="text-sm text-red-500">{errors.U_dni.message}</span>
          )}
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Dirección / Ciudad</span>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Calle"
              className="mt-1 block w-full p-2 border rounded text-transform: uppercase"
              {...register("U_Street")}
            />
            <input
              placeholder="Ciudad"
              className="mt-1 block w-full p-2 border rounded text-transform: uppercase"
              {...register("U_City")}
            />
          </div>
        </label>
          <label className="block">
            <span className="text-sm text-gray-700">Código Postal</span>
            <input
              type="text"
              className="mt-1 block w-full p-2 border rounded"
              placeholder="Ej: 12345"
              {...register("ZipCode", {
                required: "El código postal es obligatorio",
                pattern: {
                  value: /^\d{4}$/,
                  message: "Ingrese un código postal válido (4 dígitos)",
                },
              })}
            />
            {errors.ZipCode && (
              <span className="text-sm text-red-500">{errors.ZipCode.message}</span>
            )}
          </label>

        <label className="block">
          <span className="text-sm text-gray-700">Seleccionar sucursal</span>
          <select
            className="mt-1 block w-full p-2 border rounded"
            {...register("U_BPLId", { required: true })}
          >
            {officeList.map((o) => (
              <option key={o.BPLId} value={o.BPLId}>
                {o.Street}
              </option>
            ))}
          </select>
          {errors.U_BPLId && (
            <span className="text-sm text-red-500">
              Seleccione una sucursal
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Seleccionar día</span>
          <select
            className="mt-1 block w-full p-2 border rounded"
            {...register("U_Fecha", { required: true })}
          >
            {Array.isArray(dateData) && dateData.length > 0
              ? dateData.map((item) => (
                  <option key={item.U_Fecha} value={item.U_Fecha}>
                    {dayjs.utc(item.U_Fecha).format('dddd, DD/MM/YYYY')}
                  </option>
                ))
              : <option value="">No hay fechas disponibles</option>}
          </select>
          {errors.U_Fecha && (
            <span className="text-sm text-red-500">Seleccione una fecha</span>
          )}
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Horario disponible</span>
          <select
            className="mt-1 block w-full p-2 border rounded"
            {...register("U_StartTime", { required: true })}
          >
            {availableTimes && availableTimes.length > 0 ? (
              availableTimes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))
            ) : (
              <option value="">No hay horarios disponibles</option>
            )}
          </select>
          {errors.U_StartTime && (
            <span className="text-sm text-red-500">Seleccione un horario</span>
          )}
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Tipo de servicio</span>
          <select
            className="mt-1 block w-full p-2 border rounded text-transform: uppercase"
            {...register("U_problemTyp", { required: true })}
          >
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={sending}
            className="bg-primary-600 text-white px-4 py-2 rounded font-semibold shadow"
          >
            {sending ? "Enviando..." : "Reservar cita"}
          </button>
          <button
            type="button"
            className="bg-gray-100 px-4 py-2 rounded"
            onClick={() => reset(initialValues)}
          >
            Reset
          </button>
        </div>
      </form>

      {confirm && (
        <div className="confirmation fixed inset-0 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-lg animate-confirm">
            <svg
              className="mx-auto mb-4"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Reserva confirmada</h3>
            <p className="text-gray-700">
              Has reservado el{" "}
              <strong>
                {dayjs.utc(confirm.U_Fecha).format('dddd, DD/MM/YYYY')}
              </strong>{" "}
              a las <strong>{confirm.U_StartTime }</strong>.
            </p>
            {<p>
               Te enviamos un correo con la información del turno.
              </p>}
            <div className="mt-6">
              <button
                className="bg-primary-600 text-white px-4 py-2 rounded"
                onClick={() => setConfirm(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const services = [
  "Service Completo",
  "Alineación de ruedas",
  "Frenos y cambio",
  "Suspensión",
  "Instalación de accesorios",
  "Personalizado",
  "Posventa"
];

export default BookingForm;
