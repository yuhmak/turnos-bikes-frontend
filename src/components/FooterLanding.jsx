import { ArrowRight } from "lucide-react";

// Telefonos de las sucursales (lineas comerciales, publicas).
const sucursales = [
  { calle: "Santiago 485", ciudad: "San Miguel de Tucumán", tel: "+54 9 381 301-9203" },
  { calle: "Solano Vera 75", ciudad: "Yerba Buena", tel: "+54 9 381 350-0955" },
  { calle: "Av. Perón 139", ciudad: "Yerba Buena", tel: "+54 9 381 473-9136" },
];

const mapa = (s) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.calle}, ${s.ciudad}, Tucumán`)}`;

const FooterLanding = () => (
  <>
    <section id="sucursales" className="scroll-mt-16 pb-0">
      <div className="mx-auto max-w-[73.5rem] px-4 md:px-8">
        <h2 className="t-display mb-10 text-[clamp(3rem,9vw,5.5rem)] leading-[.9]">
          Sucur<span className="text-accent">sales</span>
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {sucursales.map((s, i) => (
            <li
              key={s.calle}
              data-rv
              style={{ "--d": `${i * 80}ms` }}
              className="group relative overflow-hidden bg-taller-surface2 p-6"
            >
              <span className="absolute inset-y-0 left-0 w-1 origin-bottom scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100 motion-reduce:transition-none" />
              <small className="text-xs font-semibold uppercase tracking-[.08em] text-accent">{s.ciudad}</small>
              <h3 className="my-2 font-display text-4xl font-black uppercase italic leading-none">{s.calle}</h3>
              <a href={`tel:${s.tel.replace(/[^\d+]/g, "")}`} className="text-sm text-taller-muted hover:text-white">
                Tel. {s.tel}
              </a>
              <a
                href={mapa(s)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                Cómo llegar <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-taller-muted">
          <span><b className="font-semibold text-white">Lun a Vie</b> 08:30–13:00 · 17:00–21:00</span>
          <span><b className="font-semibold text-white">Sáb</b> 08:30–13:00</span>
        </p>
      </div>
      <div
        className="overflow-hidden whitespace-nowrap pt-8 text-center font-display text-[clamp(4rem,18vw,15rem)] font-black uppercase italic leading-[.8] text-taller-surface2"
        aria-hidden="true"
      >
        Yuhmak Bikes
      </div>
    </section>

    <footer className="border-t border-taller-surface2 py-8">
      <div className="mx-auto flex max-w-[73.5rem] flex-wrap items-center justify-between gap-4 px-4 text-xs text-[#858585] md:px-8">
        <img src="/logo-dark.png" alt="Yuhmak Bikes" className="h-6 w-auto" />
        <span>© {new Date().getFullYear()} Grupo Yuhmak. Todos los derechos reservados.</span>
      </div>
    </footer>
  </>
);

export default FooterLanding;
