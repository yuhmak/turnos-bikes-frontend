# ADR-0003: El cliente consulta y anula sus turnos con el DNI

- **Fecha:** 25/09/2026
- **Estado:** Aceptada · aprobada por el área de seguridad (29/09/2026)
- **Commits:** `c89e8d7` (backend), `2298ae6` (frontend)

## Contexto

El cliente no tenía cómo saber cuándo era su turno ni cómo cancelarlo: tenía que llamar a la sucursal. Además, un turno que no se iba a usar seguía ocupando el cupo hasta que un asesor lo anulaba. Turnos-Service resolvió lo mismo con `/misTurnos` (su ADR-0005).

El cliente de la landing es anónimo: no tiene cuenta ni contraseña, y su único identificador es el DNI, que **no es un secreto**.

## Decisión

Se agrega la sección "¿Ya tenés turno?" en la landing, con dos endpoints públicos:

- **`GET /misTurnos?U_dni`** devuelve los turnos vigentes con **proyección mínima**: fecha, hora, sucursal, servicio y estado. No incluye nombre, teléfono, email ni dirección.
- **`PATCH /misTurnos/anular { U_dni, DocEntry }`** anula el turno y libera el cupo. Los controles son:
  - el turno tiene que ser de ese DNI y de una sucursal de bikes; si no, responde 404, sin confirmar que existe;
  - no se anula lo ya anulado (el cupo se liberaría dos veces) ni lo pasado;
  - la fecha, el horario y la sucursal para liberar el cupo se leen del turno en SAP, nunca del body.
- **Validaciones:** DNI (`/^\d{6,10}$/`) y DocEntry se validan antes de armar cualquier filtro OData.
- **Solo bikes:** a diferencia de service, se filtra por las sucursales de bikes (ADR-0002), porque TURNOS puede tener turnos de motos del mismo DNI.
- **Front:** anular pide confirmación en el mismo botón ("Sí, anular / No").

## Alternativas descartadas

- **Pedir DNI + patente o DNI + fecha:** es más seguro, pero el cliente que se olvidó la fecha tampoco sabe con qué dato sacó el turno. Queda como opción si seguridad lo pide.
- **Link firmado por mail al confirmar el turno:** es la solución correcta a largo plazo, pero necesita generar y guardar tokens. Hoy el backend no persiste nada.

## Consecuencias

- **Riesgo aceptado por el área de seguridad** (29/09/2026): quien conozca un DNI puede ver cuándo tiene turno esa persona y anulárselo.
- **Falta rate limiting** en las rutas públicas. Es lo primero a sumar si seguridad lo pide.
- **Tests:** `test/anular-turno.test.mjs` cubre las reglas de `puedeAnularse` y la validación de entrada.
