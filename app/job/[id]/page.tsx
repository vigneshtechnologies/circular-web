import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Briefcase, MapPin, Building, Clock } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const title = `Local Job Opening | Circular`
  const description = `Explore this local job opportunity on Circular – Local Social & Business.`
  const canonicalUrl = `https://circularapp.in/job/${id}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Circular – Local Social & Business',
      type: 'article',
      images: [
        {
          url: '/circular-logo.png',
          width: 1200,
          height: 1200,
          alt: 'Circular Job Opening',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/circular-logo.png'],
    },
  }
}

export default async function PublicJobPage({ params }: Props) {
  const { id } = await params

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: `Local Job Opportunity #${id}`,
    description: 'Find local jobs, hiring alerts, and employment openings on Circular.',
    url: `https://circularapp.in/job/${id}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Circular Local Employer',
      sameAs: 'https://circularapp.in',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CircularHeader />

      <main className="min-h-[80vh] bg-secondary/30 py-10 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>

          {/* Job Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <Briefcase className="size-3.5" />
                  <span>Local Job Opportunity</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-navy">Job Opening on Circular</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="size-3.5 text-primary" />
                    <span>Local Business</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Nearby Location</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Job Details</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                This job posting is live on Circular. To view complete requirements, salary details, work timings, and contact the employer directly, open this listing in the Circular mobile app.
              </p>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/job/${id}`} title="Job Opening" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
