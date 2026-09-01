'use client'

import { Smartphone, Download, ExternalLink } from 'lucide-react'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular'

export function OpenInCircularBanner({
  path,
  title,
}: {
  path: string
  title?: string
}) {
  const deepLink = `circular://${path.startsWith('/') ? path.slice(1) : path}`
  const webLink = `https://circularapp.in/${path.startsWith('/') ? path.slice(1) : path}`

  const handleOpenApp = () => {
    // Attempt deep link scheme first, with graceful fallback to web/Play Store
    window.location.href = deepLink
    setTimeout(() => {
      window.location.href = PLAY_STORE_URL
    }, 1200)
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 p-6 text-center shadow-md md:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
        <Smartphone className="size-6" />
      </div>

      <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900 dark:text-white md:text-2xl">
        {title ? `View ${title} in the Circular App` : 'Open in the Circular App'}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        For the full interactive experience — liking, commenting, direct messaging, real-time location mapping, and community updates — open this page in the Circular mobile app.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleOpenApp}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
        >
          <ExternalLink className="size-4" />
          <span>Open in Circular App</span>
        </button>

        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted"
        >
          <Download className="size-4 text-primary" />
          <span>Download on Google Play</span>
        </a>
      </div>
    </div>
  )
}
