import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    authInterrupts: true,
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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.DJANGO_URL ?? "http://localhost:8000/"}api/:path*`,
      },
    ];
  },
};

export default nextConfig;
