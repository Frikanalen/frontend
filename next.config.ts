import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    authInterrupts: true,
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
