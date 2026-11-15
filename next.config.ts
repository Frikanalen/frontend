import type { NextConfig } from "next";

// Everything the site loads comes from its own origin: /api, /media, /upload
// and MediaMTX's /contrib all sit behind the same ingress, next/font serves
// the fonts itself, and the player's dash.js and hls.js are bundled. The
// exception is Google Cast: vidstack fetches the Cast sender from gstatic
// when a viewer picks a Chromecast.
//
// Scripts must allow 'unsafe-inline'. Next streams the page's RSC payload as
// inline <script> tags, and the strict alternative (a nonce per request)
// forces every page to render per request, which would throw away the
// cached static shells. Even so, this keeps out scripts from anywhere else,
// plugins, framing by other sites and forms posting off-site.
//
// React's development build needs eval() for its error overlays.
const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Players build the stream in the page (MediaSource), so video comes from blob: URLs.
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// Report-only until it has been clicked through on staging; browsers then log
// what it would have blocked to the console instead of blocking it.
const cspHeader = "Content-Security-Policy-Report-Only";

const nextConfig: NextConfig = {
  // Playwright may run while a developer has `next dev` open for this same
  // checkout. A separate build directory gives the test server its own lock
  // and cache without disturbing that session.
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  output: "standalone",
  staticPageGenerationTimeout: 180,
  // Public pages share one static shell and cache what they ask Django for
  // ("use cache"); anything per visitor streams in behind <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    authInterrupts: true,
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: cspHeader, value: contentSecurityPolicy }] }];
  },
  // next/dist/shared/lib/constants.js requires "@swc/helpers/_/_interop_require_default".
  // That subpath's export map lists "module-sync" before "default", so Node >=22.10
  // resolves it to esm/*.js, while Next's file tracer resolves it as require ->
  // default -> cjs/*.cjs. The standalone output therefore ships only the cjs files
  // and the server crashes on boot with MODULE_NOT_FOUND. Locally this is masked by
  // the full node_modules tree. Force the esm files into the trace.
  // Both locations are listed because which copy yarn hoists to the top level
  // depends on the rest of the tree (React Aria pulls in its own @swc/helpers),
  // and a glob that matches nothing is silently ignored rather than an error.
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/next/node_modules/@swc/helpers/esm/**",
      "./node_modules/@swc/helpers/esm/**",
    ],
  },
  // Local-dev-only proxy so relative "/api" calls from the browser reach
  // Django on localhost. Deployed environments never hit this: the ingress
  // routes /api directly to the django-api service before it reaches this
  // app, and `next build` freezes this destination into a static manifest
  // (Next.js doesn't re-evaluate rewrites() at runtime), so it can't be
  // pointed at a per-environment backend the way serverFetch.ts is.
  // The /protest statement from the blackout was replaced by
  // /unntakstilstand. Not permanent: the state of exception is temporary.
  async redirects() {
    return [{ source: "/protest", destination: "/unntakstilstand", permanent: false }];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.DJANGO_URL ?? "http://localhost:8000/"}api/:path*`,
      },
      // The on-air graphics, which the poster editor previews. The ingress
      // routes /graphics/ to the graphics service in deployed environments.
      {
        source: "/graphics",
        destination: process.env.GRAPHICS_URL ?? "http://localhost:4175/graphics/",
      },
      {
        source: "/graphics/:path+",
        destination: `${process.env.GRAPHICS_URL ?? "http://localhost:4175/graphics/"}:path+`,
      },
      // MediaMTX's WebRTC (WHEP) endpoints, which the ingress likewise
      // routes straight to MediaMTX in deployed environments.
      {
        source: "/contrib/:path*",
        destination: `${process.env.MEDIAMTX_WEBRTC_URL ?? "http://localhost:8889/"}contrib/:path*`,
      },
    ];
  },
};

export default nextConfig;
