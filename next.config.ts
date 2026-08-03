import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  // /line 曾是「加消費者 LINE OA」的公開落地頁（QR + @881zhkla + 加好友鈕）。
  // 2026-07-31 起消費者 OA 轉為內部帳號——只給拿到設計師連結／下過預約單的客人加，
  // 不再對外招攬，故整頁 301 導向招商頁。
  async redirects() {
    return [
      { source: '/line', destination: '/pro', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        // All routes EXCEPT /embed — keep X-Frame-Options SAMEORIGIN for security
        source: '/((?!embed/).*)',
        headers: securityHeaders,
      },
      {
        // Embed widget: allow iframe embedding from any origin (#30)
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ]
  },
};

export default nextConfig;
