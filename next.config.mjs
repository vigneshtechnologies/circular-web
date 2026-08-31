/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Transparent reverse proxy for Firebase Auth helper endpoints.
  // Required for signInWithPopup to work when authDomain is set to a custom
  // domain (circularapp.in) that is NOT served by Firebase Hosting.
  // The browser sees circularapp.in/__/auth/* — Vercel/Next.js fetches from
  // buzzly-v.firebaseapp.com/__/auth/* server-side. No redirect is issued.
  // Covers: handler, handler.js, iframe, iframe.js, experiments.js, action
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://buzzly-v.firebaseapp.com/__/auth/:path*',
      },
    ]
  },
}

export default nextConfig
