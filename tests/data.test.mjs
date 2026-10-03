import test from "node:test";
import assert from "node:assert/strict";
import { parseWorldBank, parseCO2, parseQuakes } from "../server/metrics.mjs";
test("World Bank parser picks a real latest observation and retains its period", () => {
  const rows = [
    { indicator: { id: "X" }, date: "2026", value: null },
    { indicator: { id: "X" }, date: "2024", value: 7 },
    { indicator: { id: "X" }, date: "2025", value: 0 },
  ];
  const result = parseWorldBank([{}, rows], "X", new Date("2026-10-03"));
  assert.equal(result.value, 0);
  assert.equal(result.period, "2025");
  assert.throws(() => parseWorldBank([{}, []], "X"));
});
test("NOAA parser skips comments and missing-value sentinels", () => {
  const result = parseCO2(
    "# header\n 2026 5 2026.375 428.59 0.1\n 2026 6 2026.458 427.62 0.1\n 2026 7 2026.5 -99.99 0.1",
  );
  assert.equal(result.value, 427.62);
  assert.equal(result.period, "2026-06");
  assert.throws(() => parseCO2("Unavailable"));
});
test("USGS rejects stale data and counts only M4.5+ within the actual rolling day", () => {
  const now = new Date("2026-10-03T16:00:00Z");
  const item = (mag, time) => ({
    properties: { mag, time, place: "Test location" },
    geometry: { coordinates: [15, 30, 10] },
  });
  const feed = {
    metadata: { generated: +now },
    features: [
      item(5, +now - 10000),
      item(4.4, +now - 10000),
      item(6, +now - 90000000),
      item(5, +now + 10000),
    ],
  };
  assert.equal(parseQuakes(feed, now).value, 1);
  assert.deepEqual(parseQuakes(feed, now).points[0], {
    lat: 30,
    lon: 15,
    magnitude: 5,
    label: "Test location",
    time: +now - 10000,
  });
  assert.throws(() =>
    parseQuakes({ ...feed, metadata: { generated: +now - 3 * 3600000 } }, now),
  );
});
