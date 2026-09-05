import { NextRequest, NextResponse } from 'next/server'
import { LinkPreviewData } from '@/lib/types'
import { getInstagramMediaInfo, buildWebLinkPreview } from '@/lib/linkPreview'

const LINK_PREVIEW_WORKER_URL =
  'https://circular-link-preview.vigneshtechnologyservice.workers.dev'

const REQUEST_TIMEOUT_MS = 8000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl || !targetUrl.trim()) {
    return NextResponse.json({ ok: false, error: 'URL is required' }, { status: 400 })
  }

  const cleanUrl = targetUrl.trim()
  const igInfo = getInstagramMediaInfo(cleanUrl)

  // 1. Fetch metadata from Cloudflare Worker with timeout
  let workerPreview: Partial<LinkPreviewData> | null = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const endpoint = `${LINK_PREVIEW_WORKER_URL.replace(/\/+$/, '')}/preview?url=${encodeURIComponent(cleanUrl)}`

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)

    if (response.ok) {
      const json = await response.json()
      if (json?.preview) {
        workerPreview = json.preview
      }
    }
  } catch (err) {
    // Timeout or worker error, fall back to buildWebLinkPreview
  }

  // 2. Build final LinkPreviewData matching Android's applyInstagramMetadata
  const preview = buildWebLinkPreview(cleanUrl, workerPreview || undefined)

  return NextResponse.json(
    { ok: true, preview },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
