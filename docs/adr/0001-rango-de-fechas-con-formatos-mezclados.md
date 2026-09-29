# ADR-0001: Los filtros sobre `TURNOS.U_Fecha` son rangos con borde superior exclusivo

- **Fecha:** 25/09/2026
- **Estado:** Aceptada
- **Commits:** `ccad21e` (backend), `9489414` (frontend), `3462ecf` (backend, duplicados)

## Contexto

Métricas mostraba septiembre 2026 hasta el 29, aunque había turnos cargados el 30. El front mandaba bien el rango (`2026-09-01` a `2026-09-30`), y el filtro ya era el mismo que se arregló en Turnos-Service (su ADR-0001, que saca el sufijo de hora del literal).

La causa estaba en el dato. ADMTURNOS devuelve `U_Fecha` con hora (`2026-09-26T00:00:00Z`, verificado contra SAP), el formulario copiaba ese valor tal cual al crear el turno, y así TURNOS quedó con los dos formatos mezclados. Como OData compara el literal entrecomillado como string:

```
'2026-09-30T00:00:00Z' le '2026-09-30'   →  false   (se pierde el último día)
'2026-09-01T00:00:00Z' ge '2026-09-01'   →  true    (el primero entra)
```

Es el espejo del bug de service: allá la hora estaba en el literal, acá en el dato.

## Decisión

- **Rangos:** los filtros sobre `TURNOS.U_Fecha` usan `ge 'día' and lt 'día+1'`, con literales date-only y sin hora. Cubren los dos formatos. Lo aplican `buildShiftMonthFilter()` y `buildTurnoDelDiaFilter()`.
- **Día siguiente:** se calcula en hora local con `diaSiguiente()` y `toYMD()` (`utils/fechas.mjs`), nunca con `toISOString()`.
- **Respuesta:** `getShiftMonth` devuelve `U_Fecha` normalizado a `YYYY-MM-DD`, así un mismo día no queda partido en dos páginas del panel.
- **Turnos nuevos:** se guardan date-only.
- **Front:** arma las fechas como strings y solo usa los helpers de `src/utils/dates.js`.

## Alternativas descartadas

- **Normalizar los registros viejos en SAP:** es un proceso masivo sobre una UDT en producción para arreglar un filtro. Además, el rango también protege contra datos que puedan entrar con hora en el futuro.
- **Pedirle al front que mande `FechFinal` con hora:** repite el bug de service del otro lado.
- **`eq` para el chequeo de duplicados:** falla con los registros viejos que tienen hora, y el cliente podría sacar dos turnos el mismo día.

## Consecuencias

- El último día de cada mes vuelve a aparecer en el panel. El usuario lo verificó en local con septiembre 2026.
- **Regla para todo filtro nuevo sobre `TURNOS.U_Fecha`:** usar un rango, nunca `eq` ni `le` contra el último día.
- Los tests de `test/shift-filters.test.mjs` fallan si vuelve un `le` o un sufijo de hora.
