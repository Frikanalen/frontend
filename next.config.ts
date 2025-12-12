import { env } from "@/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    authInterrupts: true,
  },
  trailingSlash: true,
  rewrites: !env.DJANGO_URL
    ? undefined
    : async () => ({
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: `${env.DJANGO_URL}/:path*`,
          },
        ],
      }),
};

export default nextConfig;
