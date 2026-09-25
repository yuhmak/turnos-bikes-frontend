import { ArrowRight } from "lucide-react";

const HeroLanding = () => (
  <section className="lb-cut-hero relative flex min-h-[min(100svh,880px)] items-end overflow-hidden pt-24">
    <div className="lb-push absolute inset-0 -z-0">
      {/* El ciclista esta a la derecha: en mobile se encuadra hacia ese lado para no cortarlo. */}
      <img
        src="/img/hero-bike.webp"
        alt="Ciclista de montaña saltando en un sendero de cerro al atardecer"
        fetchpriority="high"
        className="h-full w-full object-cover object-[72%_50%] md:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10 md:bg-gradient-to-r md:from-black/90 md:via-black/50 md:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
    </div>

    <div className="relative mx-auto w-full max-w-[73.5rem] px-4 pb-[calc(var(--lb-cut,24px)+40px)] md:px-8">
      <span className="t-cut inline-flex items-center bg-accent px-3 py-1 font-display text-sm font-extrabold uppercase italic tracking-[.08em] text-black">
        Service de bicis · Tucumán
      </span>
      <h1 className="t-display my-4 text-[clamp(3.5rem,13vw,9rem)] leading-[.9] md:mb-5">
        <span className="lb-line"><span>Sacá turno.</span></span>
        <span className="lb-line"><span className="text-accent">Volvé a rodar.</span></span>
      </h1>
      <p className="max-w-md text-lg text-taller-muted">
        Frenos, cambios, suspensión y service completo por técnicos Yuhmak. Reservás en un minuto.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a href="#turno" className="lb-btn lb-btn-primary">
          <span>Sacar turno</span>
          <ArrowRight className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
        </a>
        <a href="#mis-turnos" className="lb-btn lb-btn-ghost">
          <span>Ya tengo turno</span>
        </a>
      </div>
      <div className="lb-speed mt-10 flex gap-1" aria-hidden="true">
        <i className="w-24" />
        <i className="w-12" />
        <i className="w-6" />
      </div>
    </div>
  </section>
);

export default HeroLanding;
