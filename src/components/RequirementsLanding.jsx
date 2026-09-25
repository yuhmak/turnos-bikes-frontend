import { Check } from "lucide-react";

const pasos = [
  { titulo: "Reservás", texto: "Sucursal, servicio, día y horario." },
  { titulo: "La traés", texto: "Con tu DNI, en tu horario." },
  { titulo: "La ajustamos", texto: "Si aparece algo extra, te consultamos." },
  { titulo: "A rodar", texto: "Lista en 1 a 3 días según el trabajo." },
];

const requisitos = [
  { titulo: "Documento", texto: "Traé tu DNI o comprobante." },
  { titulo: "Estado de la bici", texto: "Avisanos si hay daños visibles." },
  { titulo: "Accesorios", texto: "Retirá los accesorios sueltos si hace falta." },
  { titulo: "Tiempo", texto: "Entre 1 y 3 días según la complejidad." },
];

const RequirementsLanding = () => (
  <section id="como" className="lb-cut-how scroll-mt-16 bg-taller-surface2 py-[calc(var(--lb-cut,24px)+64px)]">
    <div className="mx-auto max-w-[73.5rem] px-4 md:px-8">
      <h2 className="t-display mb-10 text-[clamp(3rem,9vw,5.5rem)] leading-[.9]">
        De la reserva
        <br />
        <span className="text-accent">a la ruta</span>
      </h2>

      <ol className="grid gap-6 lg:grid-cols-4 lg:gap-0">
        {pasos.map((p, i) => (
          <li key={p.titulo} data-rv style={{ "--d": `${i * 80}ms` }} className="lb-leg relative pl-16 lg:pl-0 lg:pr-6 lg:pt-[72px]">
            <span className="t-cut absolute left-0 top-0 grid h-12 w-12 place-items-center bg-accent font-display text-[28px] font-black italic text-black">
              {i + 1}
            </span>
            <h3 className="font-display text-2xl font-extrabold uppercase italic leading-none">{p.titulo}</h3>
            <p className="mt-2 text-sm text-taller-muted">{p.texto}</p>
          </li>
        ))}
      </ol>

      <h3 className="t-label mb-3 mt-14">Qué tenés que traer</h3>
      <ul className="grid gap-3 md:grid-cols-4">
        {requisitos.map((r, i) => (
          <li key={r.titulo} data-rv style={{ "--d": `${i * 80}ms` }} className="border-l-4 border-accent bg-black p-4">
            <b className="flex items-center gap-2 font-semibold">
              <Check className="h-4 w-4 text-estado-ate" strokeWidth={3} aria-hidden="true" />
              {r.titulo}
            </b>
            <span className="mt-1 block text-sm text-taller-muted">{r.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default RequirementsLanding;
