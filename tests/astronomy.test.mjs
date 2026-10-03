import test from "node:test";
import assert from "node:assert/strict";
import * as A from "astronomy-engine";
import {
  ephemeris,
  solarPosition,
  bodyBasis,
  latLonVector,
  normalizeDegrees,
} from "../src/lib/astronomy.js";
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
test("Solar declination follows the equinoxes and solstices", () => {
  const seasons = A.Seasons(2026);
  assert.ok(Math.abs(solarPosition(seasons.mar_equinox.date).latitude) < 0.02);
  assert.ok(Math.abs(solarPosition(seasons.sep_equinox.date).latitude) < 0.02);
  assert.ok(solarPosition(seasons.jun_solstice.date).latitude > 23.4);
  assert.ok(solarPosition(seasons.dec_solstice.date).latitude < -23.4);
});
test("Earth-fixed sunlight moves west by about 90 degrees in six hours", () => {
  const a = solarPosition(new Date("2026-03-20T12:00:00Z"));
  const b = solarPosition(new Date("2026-03-20T18:00:00Z"));
  assert.ok(Math.abs(normalizeDegrees(b.longitude - a.longitude) + 90) < 0.1);
  assert.ok(Math.abs(a.longitude) < 3);
});
test("Body bases are orthogonal and the Moon keeps its near side toward Earth", () => {
  for (const month of [0, 3, 6, 9]) {
    const e = ephemeris(new Date(Date.UTC(2026, month, 3, 12)));
    for (const basis of [e.earthBasis, e.moonBasis]) {
      assert.ok(Math.abs(dot(basis.prime, basis.north)) < 1e-10);
      assert.ok(Math.abs(Math.hypot(...basis.north) - 1) < 1e-10);
    }
    assert.ok(-dot(e.moonBasis.prime, e.moon) / Math.hypot(...e.moon) > 0.98);
    assert.ok(e.tilt > 23.3 && e.tilt < 23.5);
  }
});
test("Globe and orbital model agree on the direction to the Sun", () => {
  const e = ephemeris(new Date("2026-10-03T16:00:00Z"));
  const [x, y] = [e.earthBasis.prime, e.earthBasis.north];
  const z = [
    x[1] * y[2] - x[2] * y[1],
    x[2] * y[0] - x[0] * y[2],
    x[0] * y[1] - x[1] * y[0],
  ];
  const mapped = x.map(
    (_, i) =>
      x[i] * e.solar.vector[0] +
      y[i] * e.solar.vector[1] +
      z[i] * e.solar.vector[2],
  );
  assert.ok(-dot(mapped, e.earth) / Math.hypot(...e.earth) > 0.99999);
});
test("Distances and lunar phase match physical constraints and a known eclipse", () => {
  assert.ok(
    ephemeris(new Date("2026-01-03")).earthKm <
      ephemeris(new Date("2026-07-04")).earthKm,
  );
  const eclipse = ephemeris(new Date("2024-04-08T18:21:00Z"));
  assert.ok(eclipse.illumination < 0.001);
  assert.ok(eclipse.moonKm > 350000 && eclipse.moonKm < 410000);
  assert.ok(Math.abs(latLonVector(0, 0)[0] - 1) < 1e-12);
  assert.ok(Math.abs(latLonVector(0, 90)[2] + 1) < 1e-12);
});
