import type { NextConfig } from "next"

const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      `connect-src 'self'${
        process.env.NEXT_PUBLIC_API_URL
          ? ` ${new URL(process.env.NEXT_PUBLIC_API_URL).origin}`
          : ""
      }${
        process.env.NEXT_PUBLIC_WS_URL
          ? ` ${new URL(process.env.NEXT_PUBLIC_WS_URL).origin}`
          : ""
      }`,
    ].join("; ")

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  async rewrites() {
    return [
      {
        source: "/operators/:id/brain",
        destination: "/brain",
      },
      {
        source: "/operators/:id/conversations",
        destination: "/conversations",
      },
      {
        source: "/operators/:id/leads",
        destination: "/leads",
      },
    ]
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          ...(csp
            ? [
                {
                  key: "Content-Security-Policy",
                  value: csp,
                },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
