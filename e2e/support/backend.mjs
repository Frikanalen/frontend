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
  files: {
    largeThumb: {
      url: thumbnail,
      mimeType: "image/jpeg",
    },
  },
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
  // Set so the series page can be checked for *not* printing it: every episode
  // of a series shares a category, so the list there leaves it out.
  categories: ["Kultur"],
  framerate: 25,
  createdTime: "2026-08-21T10:00:00Z",
  updatedTime: "2026-08-21T10:00:00Z",
  uploadedTime: null,
});

/**
 * The archive's facets. Beredskap carries no videos, so it also stands in for
 * the empty category the rail is expected to leave out.
 */
const categories = [
  { id: 114, name: "Kultur", desc: "", videocount: 243 },
  { id: 113, name: "Idrett", desc: "", videocount: 66 },
  { id: 112, name: "Beredskap", desc: "", videocount: 0 },
];

/** More than four pages of them, so the archive has pagination to draw. */
const ARCHIVE_COUNT = 100;

/**
 * A row of the archive listing, numbered by its position so a test can tell
 * which page it is looking at. Everything the result row draws is filled in:
 * a running time, a date and a category.
 */
const archiveVideo = (index) => ({
  ...video(1000 + index, `Arkivvideo ${index + 1}`, null),
  duration: "00:26:06",
  durationSec: 1566,
  categories: ["Kultur"],
  createdTime: "2011-03-09T10:00:00Z",
});

const json = (response, status, body) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (url.pathname === "/health") return json(response, 200, { ok: true });
  if (url.pathname === `/api/organization/${organization.id}`)
    return json(response, 200, organization);
  if (url.pathname === `/api/series/${series.id}`)
    return json(response, 200, series);

  if (
    url.pathname === "/api/series" &&
    url.searchParams.get("organization") === String(organization.id)
  ) {
    return json(response, 200, {
      count: 1,
      next: null,
      previous: null,
      results: [series],
    });
  }

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

  if (url.pathname === "/api/categories")
    return json(response, 200, {
      count: categories.length,
      next: null,
      previous: null,
      results: categories,
    });

  // The archive listing. The narrowings are not applied - which slice comes
  // back is not what these tests are about - but the window is, so a page
  // number in the URL produces the rows that page should hold.
  if (url.pathname === "/api/videos") {
    const limit = Number(url.searchParams.get("limit") ?? 24);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const size = Math.max(0, Math.min(limit, ARCHIVE_COUNT - offset));

    return json(response, 200, {
      count: ARCHIVE_COUNT,
      next: null,
      previous: null,
      results: Array.from({ length: size }, (_, index) =>
        archiveVideo(offset + index),
      ),
    });
  }

  return json(response, 500, { detail: `No test fixture for ${url.pathname}` });
}).listen(port, "127.0.0.1");
