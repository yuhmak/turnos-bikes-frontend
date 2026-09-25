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
