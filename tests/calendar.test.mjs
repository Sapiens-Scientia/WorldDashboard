import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarYear,
  dateKey,
  weekdayTrack,
  changeYear,
  civilDate,
  isoWeek,
  point,
} from "../src/calendar/calendar.js";
test("Imported calendar preserves every civil date through Gregorian century boundaries", () => {
  for (const year of [1900, 1999, 2000, 2024, 2026, 2100, 2200]) {
    const c = calendarYear(year),
      dates = c.weeks.flat().filter((d) => d.inYear);
    assert.equal(dates.length, c.dayCount);
    assert.equal(new Set(dates.map((d) => d.key)).size, c.dayCount);
    assert.equal(dates[0].key, `${year}-01-01`);
    assert.equal(dates.at(-1).key, `${year}-12-31`);
    for (let week = 0; week < c.weekCount; week++)
      for (const ccw of [true, false])
        assert.equal(
          new Set(
            Array.from({ length: 7 }, (_, d) =>
              weekdayTrack(d, week, c.weekCount, ccw),
            ),
          ).size,
          7,
        );
  }
});
test("Leap-day navigation and ISO week at the new year remain correct", () => {
  assert.equal(dateKey(changeYear(civilDate(2024, 1, 29), 2025)), "2025-02-28");
  assert.equal(isoWeek(civilDate(2021, 0, 1)), 53);
});

test("January flips between top and bottom while weekdays keep their reading order in both directions", () => {
  for (const weekCount of [53, 54]) {
    for (const counterclockwise of [false, true]) {
      for (const januaryAtBottom of [false, true]) {
        const step = ((counterclockwise ? -1 : 1) * Math.PI * 2) / weekCount;
        const offset = januaryAtBottom ? Math.PI : 0;
        const januaryY = point(190, offset + step / 2)[1];
        assert.equal(januaryY > 450, januaryAtBottom);
        for (let week = 0; week < weekCount; week++) {
          const angle = offset + (week + 0.5) * step;
          const rings = Array.from({ length: 7 }, (_, track) =>
            weekdayTrack(
              track,
              week,
              weekCount,
              counterclockwise,
              januaryAtBottom,
            ),
          );
          assert.equal(new Set(rings).size, 7);
          const xs = rings.map(
            (ring) => point(175 + 30 * (ring + 0.5), angle)[0],
          );
          for (let track = 1; track < 7; track++) {
            assert.ok(xs[track] >= xs[track - 1] - 1e-9);
          }
          for (let track = 0; track < 7; track++) {
            assert.equal(
              weekdayTrack(
                rings[track],
                week,
                weekCount,
                counterclockwise,
                januaryAtBottom,
              ),
              track,
            );
          }
        }
      }
    }
  }
});
