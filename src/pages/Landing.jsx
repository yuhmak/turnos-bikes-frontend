import { useEffect } from "react";
import NavbarLanding from "../components/NavbarLanding";
import HeroLanding from "../components/HeroLanding";
import ServicesLanding from "../components/ServicesLanding";
import RequirementsLanding from "../components/RequirementsLanding";
import BookingForm from "../components/BookingForm";
import FooterLanding from "../components/FooterLanding";
import MisTurnos from "../components/MisTurnos";

// Reveal al entrar en pantalla. Sin IntersectionObserver (o con reduced-motion, ver CSS) se ve todo.
const useReveal = () => {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("lb-js");
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          el.classList.add("is-in");
          io.unobserve(el);
          // Terminada la entrada se sueltan las clases: si no, el transform del reveal pisa los hover.
          setTimeout(() => {
            el.removeAttribute("data-rv");
            el.classList.remove("is-in");
          }, 1400);
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-rv]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("lb-js");
    };
  }, []);
};

const Landing = () => {
  useReveal();

  return (
    <div className="min-h-screen overflow-x-clip bg-black font-barlow text-white antialiased">
      <NavbarLanding />
      <main>
        <HeroLanding />
        <ServicesLanding />
        <RequirementsLanding />

        <section id="turno" className="scroll-mt-16 py-[72px] lg:py-28">
          <div className="mx-auto grid max-w-[73.5rem] gap-10 px-4 md:px-8 lg:grid-cols-[.9fr_1.4fr] lg:items-start lg:gap-16">
            <div className="lg:sticky lg:top-24">
              <h2 className="t-display text-[clamp(3rem,9vw,5.5rem)] leading-[.9]">
                Tu turno
                <br />
                <span className="text-accent">en 1 minuto</span>
              </h2>
              <p className="mt-4 max-w-sm text-taller-muted">
                Elegí sucursal, servicio, día y horario. Te confirmamos por email.
              </p>
              <img
                src="/img/servicio-completo.webp"
                alt="Técnico ajustando el eje pedalero de una bicicleta"
                loading="lazy"
                className="lb-cut-img mt-8 hidden aspect-[4/3] w-full object-cover lg:block"
              />
            </div>
            <BookingForm />
          </div>
        </section>
        <MisTurnos />
      </main>
      <FooterLanding />
    </div>
  );
};

export default Landing;
