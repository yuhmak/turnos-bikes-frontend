# ADR-0004: Los anulados se ocultan en el panel y no se deshacen

- **Fecha:** 25/09/2026
- **Estado:** Aceptada
- **Commits:** `781900c` (frontend)

## Contexto

En el panel, el estado de un turno se cambiaba con un select libre entre Pendiente, Atendido y Anulado. Había dos problemas:

1. **Anular y volver a pendiente dejaba un sobreturno.** `patchShiftStatus` libera el cupo al anular, pero no lo vuelve a ocupar cuando el turno vuelve a pendiente. Ese horario quedaba ofreciendo un lugar que ya no tenía.
2. **"Atendido" como botón y como estado se confundían a simple vista**, tal como marcó el usuario al revisar el diseño.

## Decisión

- **Estado y acción se distinguen por la forma:**
  - el **estado** es una píldora redondeada con ícono (reloj, tilde o círculo tachado), que se lee sin depender del color;
  - la **acción** es un botón con corte diagonal y un verbo: "Marcar atendido" o "Anular".
- **Solo los pendientes tienen acciones.** Un atendido puede volver a pendiente. **Un anulado no se deshace** desde el panel.
- **Anular pide confirmación** en el mismo botón ("Sí, anular / No"), y la confirmación se cae sola a los 4 segundos.
- **La lista muestra por defecto los activos** (pendientes y atendidos). Los anulados **no se borran**: siguen en SAP, en el contador y en el filtro "Anulados".

## Alternativas descartadas

- **Borrar el anulado del panel:** se pierde trazabilidad. Si el cliente llama diciendo "yo tenía turno", el asesor tiene que poder ver que se anuló.
- **Permitir deshacer y volver a ocupar el cupo:** puede fallar si otro cliente ya tomó ese lugar, y necesita chequear cupo del lado del backend. No vale la complejidad para un caso raro.

## Consecuencias

- Un anulado por error se corrige sacando un turno nuevo, desde la landing o como lo haga la sucursal hoy.
- Las métricas de arriba cuentan el día elegido, anulados incluidos.
