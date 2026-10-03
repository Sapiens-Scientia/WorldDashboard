import { writeFile } from "node:fs/promises";
import { getMetrics } from "./metrics.mjs";
const data = await getMetrics(true);
await writeFile(
  new URL("../src/data/snapshot.json", import.meta.url),
  JSON.stringify(
    { ...data, snapshotDate: new Date().toISOString().slice(0, 10) },
    null,
    2,
  ) + "\n",
);
console.log(
  `Saved ${Object.keys(data.observations).length} observations. ${data.sources.filter((s) => s.ok).length}/${data.sources.length} feeds checked.`,
);
for (const source of data.sources.filter((s) => !s.ok))
  console.log(`${source.id}: ${source.error}`);
