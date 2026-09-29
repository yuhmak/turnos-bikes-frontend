# Turnos Bikes — Frontend

Landing pública para sacar, consultar y anular turnos de service de bicicletas, y panel privado para los asesores de Yuhmak.

- **Stack:** React 18 + Vite + Tailwind 3, react-hook-form, zustand, lucide-react.
- **Backend:** `turnos-bikes-backend`, en la carpeta hermana.
- **Arquitectura y decisiones:** [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) y [`docs/adr/`](./docs/adr/).

## Correr en local

```bash
npm install
npm run dev     # Vite
npm test        # helpers de fechas y CSV (node:test)
npm run lint    # sin warnings
```

La URL del backend está en `src/utils/clientAxios.js`. Para probar en local se cambia a `http://localhost:<PORT>/api/v1`, y **ese cambio no se commitea**.

Si tocás `tailwind.config.js`, reiniciá `npm run dev`.

## Deploy

Al pushear a `main` corre `.github/workflows/push.yml`, que buildea y despliega. Mergeá primero el backend.
