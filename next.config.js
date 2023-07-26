/** @type {import('next').NextConfig} */
const removeImports = require("next-remove-imports")()

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
]

module.exports = removeImports({
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, os: false, crypto: "crypto" }

    return config
  },
  publicRuntimeConfig: {
    FK_API: process.env.FK_API,
    FK_MEDIA: process.env.FK_MEDIA,
    FK_UPLOAD: process.env.FK_UPLOAD,
    FK_GRAPHQL: process.env.FK_GRAPHQL,
    FK_MEDIAPROC: process.env.FK_MEDIAPROC,
  },
  serverRuntimeConfig: {},
})
