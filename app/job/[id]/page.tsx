import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Briefcase, MapPin, Building, Clock, Banknote, Sparkles } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getPublicJob } from '@/lib/serverPublicData'

export const revalidate = 300 // Revalidate every 5 minutes

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await getPublicJob(id)

  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'The requested job opening is no longer available on Circular.',
      alternates: {
        canonical: `https://circularapp.in/job/${id}`,
      },
      openGraph: {
        title: 'Job Opening | Circular',
        description: 'The requested job opening is no longer available on Circular.',
        url: `https://circularapp.in/job/${id}`,
      },
    }
  }

  const title = `${job.title} at ${job.businessName} – ${job.area} | Circular`
  const description = job.description
    ? `${job.description.substring(0, 150)}... Apply on Circular.`
    : `Explore this ${job.jobType} opportunity for ${job.title} at ${job.businessName} in ${job.area} on Circular.`
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
      siteName: 'Circular – Local Social & Business Platform',
      type: 'article',
      images: [
        {
          url: '/circular-logo.png',
          width: 1200,
          height: 1200,
          alt: job.title,
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
  const job = await getPublicJob(id)

  if (!job) {
    const fallbackBreadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://circularapp.in',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Jobs',
          item: 'https://circularapp.in/jobs',
        },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(fallbackBreadcrumbs) }}
        />
        <CircularHeader />
        <main className="min-h-[70vh] bg-secondary/30 py-16 text-center">
          <div className="mx-auto max-w-md px-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <Briefcase className="size-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Job Opening Not Found</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              This job opening does not exist, has expired, or was removed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/jobs"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                Browse All Jobs
              </Link>
            </div>
          </div>
        </main>
        <CircularFooter />
      </>
    )
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} opening at ${job.businessName}.`,
    employmentType: job.jobType.toUpperCase().replace('-', '_'),
    datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
    url: `https://circularapp.in/job/${id}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.businessName,
      sameAs: 'https://circularapp.in',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.area,
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
    },
    ...(job.salary
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: {
              '@type': 'QuantitativeValue',
              value: job.salary,
            },
          },
        }
      : {}),
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://circularapp.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Jobs',
        item: 'https://circularapp.in/jobs',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: job.title,
        item: `https://circularapp.in/job/${id}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <CircularHeader />

      <main className="min-h-[80vh] bg-secondary/30 py-10 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/jobs" className="hover:text-primary">Jobs</Link>
            <span>/</span>
            <span className="text-foreground truncate">{job.title}</span>
          </nav>

          {/* Job Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <Briefcase className="size-3.5" />
                  <span>{job.jobType}</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="size-3.5 text-primary" />
                    <span className="font-semibold text-foreground">{job.businessName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{job.area}</span>
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Banknote className="size-3.5" />
                      <span>{job.salary}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Job Requirements &amp; Description</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base whitespace-pre-line">
                {job.description}
              </p>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/job/${id}`} title={job.title} />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
