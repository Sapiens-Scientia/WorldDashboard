import { apiMiddleware } from "../server/metrics.mjs";

export default function handler(request, response) {
  return apiMiddleware(request, response, () => {
    response.writeHead(404);
    response.end();
  });
}
