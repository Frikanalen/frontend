import { createServer } from "node:http";

const port = Number(process.env.PLAYWRIGHT_BACKEND_PORT ?? 3200);
const thumbnail =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const organization = {
  id: 3,
  name: "Havneforeningen",
  description: "",
  editorId: null,
  editorName: "",
  editorEmail: null,
  editorMsisdn: null,
  fkmember: true,
};

const series = {
  id: 9001,
  name: "Havna vår",
  synopsis: "Historier fra kaia.",
  imageUrl: "",
  organization,
  episodeCount: 3,
};

const video = (id, name, episodeNumber) => ({
  id,
  name,
  files: {},
  creator: "editor@example.test",
  organization,
  series: {
    id: series.id,
    name: series.name,
    synopsis: series.synopsis,
    imageUrl: series.imageUrl,
  },
  episodeNumber,
  duration: "00:05:00",
  durationSec: 300,
  categories: [],
  framerate: 25,
  createdTime: "2026-08-21T10:00:00Z",
  updatedTime: "2026-08-21T10:00:00Z",
  uploadedTime: null,
  ogvUrl: null,
  largeThumbnailUrl: thumbnail,
});

const json = (response, status, body) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (url.pathname === "/health") return json(response, 200, { ok: true });
  if (url.pathname === `/api/series/${series.id}`)
    return json(response, 200, series);

  if (
    url.pathname === "/api/videos" &&
    url.searchParams.get("series") === String(series.id) &&
    url.searchParams.get("publish_on_web") === "true"
  ) {
    return json(response, 200, {
      count: 3,
      next: null,
      previous: null,
      results: [
        video(30, "Uten nummer", null),
        video(20, "Tredje episode", 3),
        video(10, "Første episode", 1),
      ],
    });
  }

  return json(response, 500, { detail: `No test fixture for ${url.pathname}` });
}).listen(port, "127.0.0.1");
