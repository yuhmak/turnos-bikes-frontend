import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Ban, Clock, MapPin, Search, Wrench } from "lucide-react";
import { clientAxios } from "../utils/clientAxios";
import { aDiaCorto, hoyISO } from "../utils/dates";
import { getProblemLabel } from "../utils/servicios";

/** Un turno con su boton de anular. La anulacion pide confirmacion: libera el cupo y no se deshace. */
const Turno = ({ turno, onAnular }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [dia, fecha] = aDiaCorto(turno.U_Fecha).split(" ");

  useEffect(() => {
    if (!confirmando) return;
    const t = setTimeout(() => setConfirmando(false), 5000);
    return () => clearTimeout(t);
  }, [confirmando]);

  const anular = async () => {
    setAnulando(true);
    await onAnular(turno);
    setAnulando(false);
    setConfirmando(false);
  };

  return (
    <li className="lb-cut-card grid gap-4 bg-taller-surface2 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex items-baseline gap-3 sm:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-taller-muted">
          {turno.U_Fecha === hoyISO() ? "Hoy" : dia}
        </p>
        <p className="t-display text-[40px] leading-none tabular-nums">{fecha}</p>
      </div>
      <div className="min-w-0 space-y-1 text-sm">
        <p className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase italic leading-none text-accent">
          <Clock className="h-5 w-5" aria-hidden="true" />
          {turno.U_StartTime} hs
        </p>
        <p className="flex items-center gap-2 text-taller-muted">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{turno.U_BPLName}</span>
        </p>
        <p className="flex items-center gap-2 text-taller-muted">
          <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
          {getProblemLabel(turno.U_problemTyp, turno.U_ProSubType)}
        </p>
      </div>
      {confirmando ? (
        <div className="flex gap-2">
          <button onClick={anular} disabled={anulando} className="t-btn flex-1 bg-estado-anu text-black hover:bg-red-300 sm:flex-none">
            <Ban className="h-4 w-4" aria-hidden="true" />
            {anulando ? "Anulando..." : "Sí, anular"}
          </button>
          <button onClick={() => setConfirmando(false)} disabled={anulando} className="t-btn flex-1 bg-black text-white hover:bg-taller-surface3 sm:flex-none">
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="t-btn bg-estado-anu/15 text-estado-anu hover:bg-estado-anu/25"
          aria-label={`Anular el turno del ${fecha} a las ${turno.U_StartTime}`}
        >
          Anular turno
        </button>
      )}
    </li>
  );
};

const MisTurnos = () => {
  const [dni, setDni] = useState("");
  const [turnos, setTurnos] = useState(null); // null = todavia no consulto
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  const consultar = async (e) => {
    e.preventDefault();
    if (!/^\d{7,8}$/.test(dni)) {
      setError("Ingresá tu DNI (7 u 8 dígitos, sin puntos).");
      return;
    }
    setBuscando(true);
    setError(null);
    try {
      const { data } = await clientAxios.get("/misTurnos", { params: { U_dni: dni } });
      setTurnos(data.turnos || []);
    } catch (err) {
      console.error(err);
      setTurnos(null);
      setError("No pudimos consultar tus turnos. Probá de nuevo en un rato.");
    } finally {
      setBuscando(false);
    }
  };

  const anular = async (turno) => {
    try {
      await clientAxios.patch("/misTurnos/anular", { U_dni: dni, DocEntry: turno.DocEntry });
      setTurnos((prev) => prev.filter((t) => t.DocEntry !== turno.DocEntry));
      toast.success("Listo, tu turno quedó anulado.");
    } catch (err) {
      toast.error(err.response?.data?.error || "No pudimos anular el turno. Probá de nuevo.");
    }
  };

  return (
    <section id="mis-turnos" className="scroll-mt-16 pb-[72px] lg:pb-28">
      <div className="mx-auto max-w-[73.5rem] px-4 md:px-8">
        <div className="grid gap-8 border-t border-taller-surface2 pt-[72px] lg:grid-cols-[.9fr_1.4fr] lg:gap-16 lg:pt-28">
          <div>
            <h2 className="t-display text-[clamp(3rem,9vw,5.5rem)] leading-[.9]">
              ¿Ya tenés
              <br />
              <span className="text-accent">turno?</span>
            </h2>
            <p className="mt-4 max-w-sm text-taller-muted">
              Consultá cuándo es con tu DNI. Si no vas a poder venir, anulalo así el horario queda libre para otro.
            </p>
          </div>

          <div>
            <form onSubmit={consultar} className="flex flex-wrap gap-2" noValidate>
              <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">DNI</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#858585]" aria-hidden="true" />
                <input
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Tu DNI, sin puntos"
                  aria-invalid={Boolean(error)}
                  className="h-[52px] w-full rounded border border-taller-strong bg-black pl-11 pr-3 text-base text-white placeholder:text-[#858585] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <button type="submit" disabled={buscando} className="lb-btn lb-btn-primary">
                <span>{buscando ? "Buscando..." : "Consultar"}</span>
              </button>
            </form>
            {error && <p role="alert" className="mt-3 text-sm text-estado-anu">{error}</p>}

            {turnos && (
              <div className="mt-6" aria-live="polite">
                {turnos.length === 0 ? (
                  <p className="border-l-4 border-taller-strong bg-taller-surface2 p-4 text-taller-muted">
                    No encontramos turnos vigentes con ese DNI.{" "}
                    <a href="#turno" className="font-semibold text-accent underline-offset-4 hover:underline">Sacá uno acá</a>.
                  </p>
                ) : (
                  <ul className="grid gap-3">
                    {turnos.map((t) => (
                      <Turno key={t.DocEntry} turno={t} onAnular={anular} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MisTurnos;
