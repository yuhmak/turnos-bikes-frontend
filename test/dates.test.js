import { test } from "node:test";
import assert from "node:assert/strict";
import { aISO, aDDMMAAAA, hoyISO } from "../src/utils/dates.js";
import { getDatesOfMonth } from "../src/controllers/datesManagement.js";

test("aISO acepta date-only y con hora", () => {
  assert.equal(aISO("2026-09-30"), "2026-09-30");
  assert.equal(aISO("2026-09-30T00:00:00Z"), "2026-09-30");
  assert.equal(aISO(""), "");
  assert.equal(aISO(null), "");
});

test("aDDMMAAAA", () => {
  assert.equal(aDDMMAAAA("2026-09-30T00:00:00Z"), "30/09/2026");
});

// toISOString() daria el 02/09 a las 23:30 en UTC-3.
test("hoyISO es hora local", () => {
  assert.equal(hoyISO(new Date(2026, 8, 1, 23, 30)), "2026-09-01");
});

test("getDatesOfMonth cubre el mes entero", () => {
  const sep = getDatesOfMonth("2026", 9, 62);
  assert.equal(sep.length, 30);
  assert.equal(sep[0].U_Fecha, "2026-09-01");
  assert.equal(sep.at(-1).U_Fecha, "2026-09-30");
  assert.equal(getDatesOfMonth(2028, 2, 62).at(-1).U_Fecha, "2028-02-29");
});

import { rangoDelMes, aDiaCorto } from "../src/utils/dates.js";
import { aCSV } from "../src/utils/csv.js";

test("rangoDelMes", () => {
  assert.deepEqual(rangoDelMes(2026, 9), { desde: "2026-09-01", hasta: "2026-09-30" });
  assert.deepEqual(rangoDelMes("2028", "2"), { desde: "2028-02-01", hasta: "2028-02-29" });
});

test("aDiaCorto", () => {
  assert.match(aDiaCorto("2026-09-01T00:00:00Z"), /01\/09$/);
});

test("aCSV escapa separador, comillas y saltos, con BOM", () => {
  const csv = aCSV([{ n: 'Pérez; "Juan"', t: "381\nX" }], [
    { titulo: "Nombre", valor: (f) => f.n },
    { titulo: "Tel", valor: (f) => f.t },
  ]);
  assert.ok(csv.startsWith("﻿Nombre;Tel\r\n"));
  assert.ok(csv.includes('"Pérez; ""Juan"""'));
  assert.ok(csv.includes('"381\nX"'));
});
