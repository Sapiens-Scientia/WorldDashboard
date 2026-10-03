import https from "node:https";
import { readFile } from "node:fs/promises";
import { metrics } from "../src/data/metrics.js";

export const fetchPublic = (url) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        family: 4,
        headers: {
          "User-Agent": "WorldDashboard/0.1 (personal public-data reader)",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        let length = 0;
        res.on("data", (chunk) => {
          length += chunk.length;
          if (length > 8e6) req.destroy(new Error("Response too large"));
          else chunks.push(chunk);
        });
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      },
    );
    const timeout = setTimeout(
      () => req.destroy(new Error("Source timed out")),
      14000,
    );
    req.on("close", () => clearTimeout(timeout));
    req.on("error", reject);
  });

export function parseWorldBank(payload, code, now = new Date()) {
  if (!Array.isArray(payload?.[1]))
    throw new Error("Invalid World Bank response");
  const rows = payload[1]
    .filter(
      (r) =>
        r.indicator?.id === code &&
        Number.isFinite(r.value) &&
        Number(r.date) <= now.getUTCFullYear(),
    )
    .sort((a, b) => Number(b.date) - Number(a.date));
  if (!rows.length) throw new Error("No published observations");
  return {
    value: rows[0].value,
    period: rows[0].date,
    history: rows
      .slice(0, 8)
      .reverse()
      .map((r) => ({ year: r.date, value: r.value })),
  };
}
export function parseCO2(text) {
  const rows = text
    .split("\n")
    .filter((line) => /^\s*\d{4}\s/.test(line))
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter((r) => r.length >= 4 && r[3] > 0);
  if (!rows.length) throw new Error("No valid CO₂ measurements");
  const latest = rows.at(-1);
  return {
    value: latest[3],
    period: `${latest[0]}-${String(latest[1]).padStart(2, "0")}`,
    history: rows
      .slice(-24)
      .map((r) => ({
        year: `${r[0]}-${String(r[1]).padStart(2, "0")}`,
        value: r[3],
      })),
  };
}
export function parseQuakes(data, now = new Date()) {
  if (
    !Array.isArray(data.features) ||
    !Number.isFinite(data.metadata?.generated)
  )
    throw new Error("Invalid earthquake feed");
  if (
    +now - data.metadata.generated > 2 * 3600000 ||
    data.metadata.generated - +now > 300000
  )
    throw new Error("Earthquake feed is out of date");
  const points = data.features
    .filter(
      (f) =>
        Number.isFinite(f.properties?.mag) &&
        f.properties.mag >= 4.5 &&
        +now - f.properties.time <= 86400000 &&
        f.properties.time <= +now &&
        Array.isArray(f.geometry?.coordinates),
    )
    .map((f) => ({
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      magnitude: f.properties.mag,
      label: f.properties.place,
      time: f.properties.time,
    }));
  return {
    value: points.length,
    period: "Past 24 hours",
    points,
    generatedAt: new Date(data.metadata.generated).toISOString(),
  };
}

let cache,
  inFlight,
  lastAttempt = 0;
export async function getMetrics(force = false) {
  if (cache && Date.now() - lastAttempt < (force ? 15000 : 15 * 60000))
    return cache;
  if (inFlight) return inFlight;
  inFlight = refresh().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}
async function refresh() {
  lastAttempt = Date.now();
  const seed = JSON.parse(
    await readFile(
      new URL("../src/data/snapshot.json", import.meta.url),
      "utf8",
    ),
  );
  const observations = structuredClone({
    ...seed.observations,
    ...cache?.observations,
  });
  // Every failed refresh is explicitly distinguishable from a successful one.
  for (const observation of Object.values(observations))
    observation.status = "snapshot";
  const sources = [];
  const tasks = metrics
    .filter((m) => m.code)
    .map((m) => ({
      id: m.id,
      provider: "World Bank",
      run: async () =>
        parseWorldBank(
          JSON.parse(
            await fetchPublic(
              `https://api.worldbank.org/v2/country/WLD/indicator/${m.code}?format=json&per_page=5`,
            ),
          ),
          m.code,
        ),
    }));
  tasks.push({
    id: "co2",
    provider: "NOAA",
    run: async () =>
      parseCO2(
        await fetchPublic(
          "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_gl.txt",
        ),
      ),
  });
  tasks.push({
    id: "quakes",
    provider: "USGS",
    run: async () =>
      parseQuakes(
        JSON.parse(
          await fetchPublic(
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
          ),
        ),
      ),
  });
  await Promise.all(
    tasks.map(async (task) => {
      try {
        const observation = await task.run();
        // A delayed upstream response must not overwrite a newer saved observation.
        if (
          task.id !== "quakes" &&
          observations[task.id]?.period > observation.period
        )
          throw new Error("Source returned an older period");
        observations[task.id] = {
          ...observation,
          checkedAt: new Date().toISOString(),
          status: "checked",
        };
        sources.push({ id: task.id, provider: task.provider, ok: true });
      } catch (error) {
        sources.push({
          id: task.id,
          provider: task.provider,
          ok: false,
          error: error.message,
        });
      }
    }),
  );
  cache = {
    observations,
    sources,
    checkedAt: new Date().toISOString(),
    snapshotDate: seed.snapshotDate,
    referenceReviewed: seed.referenceReviewed || "2026-10-03",
  };
  return cache;
}
export async function apiMiddleware(req, res, next) {
  if (!req.url?.startsWith("/api/metrics")) return next();
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const result = await getMetrics(
      new URL(req.url, "http://localhost").searchParams.get("refresh") === "1",
    );
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(result));
  } catch {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Data sources temporarily unavailable" }));
  }
}
