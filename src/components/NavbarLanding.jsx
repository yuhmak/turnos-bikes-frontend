import { useEffect, useState } from "react";

const NavbarLanding = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur" : "bg-gradient-to-b from-black to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[73.5rem] items-center justify-between px-4 md:px-8">
        <a href="#" aria-label="Yuhmak Bikes, inicio">
          <img src="/logo-dark.png" alt="Yuhmak Bikes" className="h-6 w-auto md:h-7" />
        </a>
        <nav aria-label="Secciones" className="hidden gap-6 font-display text-base font-semibold uppercase tracking-[.08em] md:flex">
          <a href="#servicios" className="text-taller-muted transition-colors hover:text-accent">Servicios</a>
          <a href="#como" className="text-taller-muted transition-colors hover:text-accent">Cómo funciona</a>
          <a href="#sucursales" className="text-taller-muted transition-colors hover:text-accent">Sucursales</a>
          <a href="#mis-turnos" className="text-taller-muted transition-colors hover:text-accent">Mis turnos</a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="/login" className="hidden text-sm text-taller-muted hover:text-white md:inline">
            Iniciar sesión
          </a>
          <a href="#turno" className="lb-btn lb-btn-primary lb-btn-sm">
            <span>Sacar turno</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default NavbarLanding;
