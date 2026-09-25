import { ArrowRight } from "lucide-react";

// Mismos nombres que las opciones del formulario de turno.
const servicios = [
  { titulo: "Service Completo", desc: "Inspección, limpieza y ajuste general. El más pedido." },
  { titulo: "Alineación de ruedas", desc: "Centrado y ajuste de rayos." },
  { titulo: "Frenos y cambio", desc: "Pastillas, cables y regulación." },
  { titulo: "Suspensión", desc: "Service de amortiguadores." },
  { titulo: "Instalación de accesorios", corto: "Accesorios", desc: "Luces, portapaquetes, soportes." },
  { titulo: "Personalizado", desc: "Modificaciones a medida para tu bici." },
  { titulo: "Posventa", desc: "Garantía de tu bici comprada en Yuhmak.", flag: "Compra Yuhmak" },
];

const Ticker = () => {
  const nombres = servicios.map((s) => s.corto ?? s.titulo);
  return (
    <div className="lb-ticker relative z-[2] -mx-4 -mt-2 -rotate-2 overflow-hidden bg-accent py-3 text-black" aria-hidden="true">
      <div className="lb-ticker-track">
        {[...nombres, ...nombres].map((n, i) => (
          <span key={i} className="whitespace-nowrap px-5 font-display text-[28px] font-black uppercase italic">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
};

const ServicesLanding = () => {
  const [principal, ...resto] = servicios;
  return (
    <>
      <Ticker />
      <section id="servicios" className="scroll-mt-16 py-[72px] lg:py-28">
        <div className="mx-auto max-w-[73.5rem] px-4 md:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="t-display text-[clamp(3rem,9vw,5.5rem)] leading-[.9]">
              Elegí tu
              <br />
              <span className="text-accent">service</span>
            </h2>
            <p className="max-w-sm text-taller-muted">
              Siete servicios para ruta, MTB y urbana. Si no sabés cuál, elegí Personalizado y contanos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="#turno"
              data-rv
              className="lb-cut-card group relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-accent p-5 text-black lg:col-span-2 lg:row-span-2"
            >
              <img
                src="/img/taller.webp"
                alt=""
                loading="lazy"
                className="pointer-events-none absolute -bottom-12 -right-12 w-3/5 rotate-[-8deg] opacity-35 mix-blend-multiply"
              />
              <span className="relative font-display text-[120px] font-black italic leading-[.8]">01</span>
              <div className="relative">
                <h3 className="t-display text-[clamp(40px,6vw,64px)] leading-none">
                  Service
                  <br />
                  Completo
                </h3>
                <p className="mt-2 text-sm">{principal.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  Reservar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </a>

            {resto.map((s, i) => (
              <a
                key={s.titulo}
                href="#turno"
                data-rv
                style={{ "--d": `${(i + 1) * 80}ms` }}
                className={`lb-cut-card group relative flex min-h-[176px] flex-col justify-between bg-taller-surface2 p-5 transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-taller-surface3 ${i >= resto.length - 2 ? "lg:col-span-2" : ""}`}
              >
                {s.flag && (
                  <span className="absolute right-4 top-4 bg-black px-2 py-0.5 text-xs font-semibold uppercase tracking-[.08em] text-accent">
                    {s.flag}
                  </span>
                )}
                <span className="font-display text-[56px] font-black italic leading-[.8] text-taller-surface3 transition-colors group-hover:text-accent">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="mt-4 font-display text-[28px] font-extrabold uppercase italic leading-none">{s.corto ?? s.titulo}</h3>
                  <p className="mt-2 text-sm text-taller-muted">{s.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesLanding;
