# Decisiones de arquitectura (ADRs)

Un archivo por decisión, numerado. Cada ADR está escrito para quien en seis meses se encuentre una línea rara y se pregunte por qué quedó así.

| ADR | Decisión | Fecha | Estado |
|---|---|---|---|
| [0001](./0001-rango-de-fechas-con-formatos-mezclados.md) | Los filtros sobre `TURNOS.U_Fecha` son rangos con borde superior exclusivo | 25/09/2026 | Aceptada |
| [0002](./0002-sucursales-derivadas-de-sap.md) | Las sucursales de la web se derivan de SAP, sin lista fija | 25/09/2026 | Aceptada |
| [0003](./0003-consulta-y-anulacion-por-dni.md) | El cliente consulta y anula sus turnos con el DNI | 25/09/2026 | Aceptada · pendiente de revisión de seguridad |
| [0004](./0004-anulados-ocultos-y-sin-deshacer.md) | Los anulados se ocultan en el panel y no se deshacen | 25/09/2026 | Aceptada |
| [0005](./0005-tokens-y-primitivas-en-css-plano.md) | Tokens en Tailwind y primitivas de componentes en CSS plano | 25/09/2026 | Aceptada |

## Proceso

1. **Cuándo escribir uno:** una decisión merece un ADR si alguien podría deshacerla razonablemente sin saber por qué está, o si el código quedó no obvio a propósito.
2. **Número:** se copia la plantilla de Turnos-Service (`docs/adr/README.md`) al siguiente número libre. Los números no se reutilizan.
3. **Cambios:** un ADR **no se edita** cuando la decisión cambia. Se escribe uno nuevo que lo reemplace, y el viejo pasa a `Reemplazada por ADR-XXXX`. Lo único que se corrige en el lugar es un error de hecho.
