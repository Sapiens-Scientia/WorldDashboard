import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { apiMiddleware } from "./metrics.mjs";
const root = resolve(new URL("../dist", import.meta.url).pathname);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) =>
  apiMiddleware(req, res, async () => {
    try {
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
      if (!file.startsWith(`${root}/`)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const content = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }),
);
server.listen(
  Number(process.env.PORT || 4173),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `World Dashboard: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 4173}`,
    ),
);
