import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { clientAxios } from "../utils/clientAxios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import { aDiaCorto } from "../utils/dates";

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
        toast("No hay fechas disponibles para la sucursal seleccionada.");
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
      toast.error(err.response?.data?.error || "Error al crear la reserva. Intente nuevamente.",{
        position: "top-center",

      });
    } finally {
      setSending(false);
    }
  };
  const campo = "w-full rounded border border-taller-strong bg-black p-3 text-base text-white placeholder:text-[#858585] transition-[border-color,box-shadow] hover:border-[#858585] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  const etiqueta = "text-xs font-semibold uppercase tracking-[.08em] text-taller-muted";
  const error = (e, msg) => e && <span role="alert" className="text-sm text-estado-anu">{e.message || msg}</span>;
  const soloNumeros = (e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); };
  const paso = (n, titulo) => (
    <h3 className="col-span-full mt-2 flex items-center gap-3 font-display text-xl font-extrabold uppercase italic tracking-[.04em] text-taller-muted">
      <i className="grid h-7 w-7 place-items-center bg-black text-base not-italic text-accent">{n}</i>
      {titulo}
    </h3>
  );
  // Dia y horario como radios nativos con aspecto de boton: accesibles y registrados en react-hook-form.
  const chip = "block cursor-pointer rounded border border-taller-strong bg-black text-center transition-colors hover:border-accent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-accent";

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid gap-4 border-t-4 border-accent bg-taller-surface2 px-4 py-6 md:grid-cols-2 md:gap-x-4 md:p-8"
        aria-label="Sacar turno"
      >
        {paso(1, "Sucursal")}
        <label className="col-span-full grid gap-2">
          <span className={etiqueta}>Sucursal</span>
          <select className={campo} {...register("U_BPLId", { required: true })}>
            {officeList.map((o) => (
              <option key={o.BPLId} value={o.BPLId}>
                {o.Street}{o.City ? ` · ${o.City}` : ""}
              </option>
            ))}
          </select>
          {error(errors.U_BPLId, "Seleccioná una sucursal")}
        </label>

        {paso(2, "Service y horario")}
        <label className="col-span-full grid gap-2">
          <span className={etiqueta}>Servicio</span>
          <select className={campo} {...register("U_problemTyp", { required: true })}>
            {services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <fieldset className="col-span-full grid min-w-0 gap-2">
          <legend className={`${etiqueta} mb-2`}>Fecha</legend>
          {dateData.length > 0 ? (
            <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
              {dateData.map((item) => {
                const [dia, fecha] = aDiaCorto(item.U_Fecha).split(" ");
                return (
                  <label key={item.U_Fecha} className="relative shrink-0 snap-start">
                    <input type="radio" value={item.U_Fecha} className="peer sr-only" {...register("U_Fecha", { required: true })} />
                    <span className={`${chip} w-[84px] px-1 py-2`}>
                      <small className="block text-xs font-semibold uppercase tracking-wide">{dia}</small>
                      <b className="mt-0.5 block font-display text-[26px] font-black italic leading-none tabular-nums">{fecha}</b>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-taller-muted">No hay fechas disponibles para esta sucursal.</p>
          )}
          {error(errors.U_Fecha, "Seleccioná una fecha")}
        </fieldset>

        <fieldset className="col-span-full grid gap-2">
          <legend className={`${etiqueta} mb-2`}>Horario</legend>
          {availableTimes && availableTimes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableTimes.map((t) => (
                <label key={t} className="relative">
                  <input type="radio" value={t} className="peer sr-only" {...register("U_StartTime", { required: true })} />
                  <span className={`${chip} px-3 py-2 text-sm tabular-nums`}>{t}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-taller-muted">Elegí una fecha para ver los horarios.</p>
          )}
          {error(errors.U_StartTime, "Seleccioná un horario")}
        </fieldset>

        {paso(3, "Tus datos")}
        <label className="grid gap-2">
          <span className={etiqueta}>DNI *</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            className={campo}
            placeholder="Sin puntos"
            onKeyPress={soloNumeros}
            {...register("U_dni", {
              required: "El DNI es obligatorio",
              pattern: { value: /^\d{7,8}$/, message: "Ingresá un DNI válido (7 u 8 dígitos, sin puntos)" },
            })}
          />
          {error(errors.U_dni)}
        </label>
        <label className="grid gap-2">
          <span className={etiqueta}>Nombre y apellido *</span>
          <input
            autoComplete="name"
            className={`${campo} uppercase`}
            {...register("U_custmrName", {
              required: "El nombre es obligatorio",
              minLength: { value: 3, message: "El nombre debe tener al menos 3 caracteres" },
              pattern: { value: /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/, message: "El nombre solo debe contener letras" },
            })}
          />
          {error(errors.U_custmrName)}
        </label>
        <label className="grid gap-2">
          <span className={etiqueta}>Teléfono *</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            className={campo}
            placeholder="10 dígitos, sin 0 ni 15"
            onKeyPress={soloNumeros}
            {...register("U_Telephone", {
              required: "El teléfono es obligatorio",
              pattern: { value: /^(?:11|[2368]\d)[0-9]{8}$/, message: "Ingresá un número válido de 10 dígitos" },
            })}
          />
          {error(errors.U_Telephone)}
        </label>
        <label className="grid gap-2">
          <span className={etiqueta}>Email *</span>
          <input
            type="email"
            autoComplete="email"
            className={campo}
            {...register("U_Email", {
              required: "El email es obligatorio",
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Ingresá un email válido" },
            })}
          />
          {error(errors.U_Email)}
        </label>
        <label className="grid gap-2">
          <span className={etiqueta}>Calle</span>
          <input autoComplete="street-address" className={`${campo} uppercase`} {...register("U_Street")} />
        </label>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <label className="grid gap-2">
            <span className={etiqueta}>Ciudad</span>
            <input autoComplete="address-level2" className={`${campo} uppercase`} {...register("U_City")} />
          </label>
          <label className="grid gap-2">
            <span className={etiqueta}>C.P. *</span>
            <input
              inputMode="numeric"
              autoComplete="postal-code"
              className={campo}
              onKeyPress={soloNumeros}
              {...register("ZipCode", {
                required: "El código postal es obligatorio",
                pattern: { value: /^\d{4}$/, message: "4 dígitos" },
              })}
            />
          </label>
          <span className="col-span-full -mt-1">{error(errors.ZipCode)}</span>
        </div>
        <label className="col-span-full grid gap-2">
          <span className={etiqueta}>Qué le pasa a tu bici (opcional)</span>
          <textarea
            rows={3}
            maxLength={250}
            className={`${campo} resize-y`}
            placeholder="Ej: ruido en el pedalier al subir"
            {...register("U_descrption")}
          />
        </label>

        <div className="col-span-full mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xs text-xs text-taller-muted">Te enviamos la confirmación del turno por email.</p>
          <button type="submit" disabled={sending} className="lb-btn lb-btn-primary">
            <span>{sending ? "Enviando..." : "Sacar turno"}</span>
          </button>
        </div>
      </form>

      {confirm && (
        <div className="confirmation fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" role="dialog" aria-modal="true" aria-labelledby="confirm-titulo">
          <div className="animate-confirm w-full max-w-md border-t-4 border-accent bg-taller-surface2 p-8 text-center">
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-estado-ate/15 text-estado-ate">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <h3 id="confirm-titulo" className="t-display text-4xl">Turno <span className="text-accent">reservado</span></h3>
            <p className="mt-3 text-taller-muted">
              Te esperamos el{" "}
              <strong className="text-white">{dayjs.utc(confirm.U_Fecha).format("dddd DD/MM/YYYY")}</strong> a las{" "}
              <strong className="text-white">{confirm.U_StartTime}</strong>.
            </p>
            <p className="mt-2 text-sm text-taller-muted">Te enviamos un email con los datos del turno.</p>
            <button className="lb-btn lb-btn-primary mt-6" onClick={() => setConfirm(null)} autoFocus>
              <span>Listo</span>
            </button>
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
