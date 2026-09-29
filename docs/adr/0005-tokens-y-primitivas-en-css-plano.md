# ADR-0005: Tokens en Tailwind y primitivas de componentes en CSS plano

- **Fecha:** 25/09/2026
- **Estado:** Aceptada
- **Commits:** `781900c`, `2298ae6` (frontend)

## Contexto

El rediseño definió dos direcciones visuales con la misma marca:

- **landing "B · deportiva":** negro con `#ff6a00` a pleno y Barlow Condensed en itálica;
- **panel "modo taller":** oscuro, denso, pensado como herramienta de trabajo.

La primera versión de las primitivas del panel (`.t-btn`, `.t-ctl`, …) usaba `@apply` con utilidades propias del theme (`font-display`, `bg-taller-*`). En el dev server del usuario rompió todo el CSS con `The 'font-display' class does not exist`, y el panel se veía en blanco: ese Vite había arrancado antes de que cambiara `tailwind.config.js`.

## Decisión

- **Tokens** (colores `taller`, `accent`, `estado` y las fuentes `barlow`/`display`) en `tailwind.config.js`, para usarlos como utilidades en el JSX.
- **Primitivas que se repiten** en `src/index.css`, dentro de `@layer components` y **en CSS plano, sin `@apply` de utilidades del theme:**
  - `.t-*` para el panel;
  - `.lb-*` para la landing.
- **Contraste:** sobre `#ff6a00` el texto va siempre negro, porque blanco da 3:1.
- **Motion:** solo CSS, con `prefers-reduced-motion` respetado en cada animación. No se suman dependencias.

## Alternativas descartadas

- **`@apply` con utilidades del theme:** queda más corto, pero es frágil ante un dev server con la config cacheada, y el error tira abajo todo el CSS, no solo esa clase.
- **Un sistema de tema claro/oscuro como el de Turnos-Service:** no se pidió, y el panel quedó oscuro por decisión de diseño.

## Consecuencias

- **Valores duplicados:** los colores están en `tailwind.config.js` y también escritos dentro de las primitivas. Si cambia un token, hay que tocar los dos lugares. Un comentario en `index.css` lo avisa.
- **Después de cambiar `tailwind.config.js`,** hay que reiniciar `npm run dev`.
