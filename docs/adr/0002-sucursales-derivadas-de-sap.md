# ADR-0002: Las sucursales de la web se derivan de SAP, sin lista fija

- **Fecha:** 25/09/2026
- **Estado:** Aceptada
- **Commits:** `3462ecf` (backend)

## Contexto

`getSucursalesForClient` tenía los BPLId escritos a mano en el filtro (`68`, `81` y `128`), así que habilitar una sucursal era un commit y un deploy. Turnos-Service tuvo el mismo problema con 24 BPLId y lo resolvió derivándolas del calendario (su ADR-0002).

## Decisión

`services/sucursalesService.mjs` arma el estado de cada sucursal a partir de SAP y lo cachea 5 minutos. Una sucursal aparece en la web si cumple tres condiciones:

- es del negocio de bicicletas (`BusinessPlaces.Industry === "BIKES"`, el mismo campo que service usa para excluirlas);
- no está deshabilitada (`Disabled !== "tYES"`) y tiene `Street`;
- tiene al menos un lugar libre a futuro en ADMTURNOS.

La misma función alimenta `/sucursalesClient` (solo las disponibles) y `/coberturaSucursales` (todas, con su estado) para el panel.

## Alternativas descartadas

- **Mantener la lista fija:** es el problema que motivó el cambio.
- **Usar `U_DivisionMotos` u otro flag propio:** no está cargado de forma confiable. `Industry` ya distingue bikes y es el campo que usa service.

## Consecuencias

- **Verificación:** contra SAP el 25/09/2026, `/sucursalesClient` devuelve las mismas tres (68, 81 y 128). Cobertura muestra además tres sucursales de bikes sin calendario (Catamarca, Avellaneda 870 y Bs. As.), que la web correctamente no ofrece.
- **Habilitar una sucursal nueva:** se carga su calendario de cupos en el panel y aparece sola, en 5 minutos como máximo.
- **Pendiente:** la sección "Sucursales" del pie de la landing sigue fija en `FooterLanding.jsx`, porque tiene los teléfonos y SAP no los devuelve. Si se habilita una sucursal nueva, hay que agregarla ahí a mano.
- **Riesgo:** si alguien cambia el `Industry` de una sucursal en SAP, sale de la web. Se ve en la pantalla de Cobertura.
