import { env } from "@/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    authInterrupts: true,
  },
  trailingSlash: true,
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/api/:path*",
        destination: `${env.DJANGO_URL}/:path*`,
      },
    ],
  }),
};

export default nextConfig;
