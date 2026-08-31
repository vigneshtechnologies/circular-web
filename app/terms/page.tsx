import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText, Mail, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service and User Agreement for Circular – Local Social & Business platform, operated by Vignesh Technologies.',
  alternates: {
    canonical: 'https://circularapp.in/terms',
  },
  openGraph: {
    title: 'Terms of Service | Circular',
    description:
      'Terms of Service and User Agreement for Circular – Local Social & Business platform, operated by Vignesh Technologies.',
    url: 'https://circularapp.in/terms',
  },
}

export default function TermsOfServicePage() {
  const lastUpdated = 'August 29, 2026'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-bold tracking-tight text-navy">
              Circular <span className="text-primary">Legal</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        {/* Title Section */}
        <div className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <FileText className="size-3.5" />
            Official Agreement
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Circular – Local Social &amp; Business Platform • Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Legal Text Sections */}
        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground md:text-base">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">1. Acceptance of Terms</h2>
            <p className="mt-3">
              Welcome to <strong>Circular – Local Social &amp; Business</strong> (“Circular”, “the Application”, “we”, “us”, or “our”), operated by <strong>Vignesh Technologies</strong>, located in Rajapalayam, Tamil Nadu, India.
            </p>
            <p className="mt-2">
              By creating an account, downloading, accessing, or using Circular, you agree to comply with and be bound by these Terms of Service (“Terms”), our Privacy Policy, and our Community Guidelines. If you do not agree with these Terms, please do not use the Application.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">2. Eligibility &amp; Account Registration</h2>
            <p className="mt-3">
              To use Circular, you must be at least 13 years of age (or the minimum legal age required in your region). By registering an account:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>You agree to provide accurate, current, and complete registration information.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You accept full responsibility for all activities that take place under your account.</li>
              <li>You agree to notify us immediately if you suspect unauthorized access or security breaches.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">3. User Responsibilities &amp; User-Generated Content</h2>
            <p className="mt-3">
              Circular enables users to publish content, including posts, text, photos, reviews, comments, listings, and messages (“User Content”).
            </p>
            <p className="mt-2">
              You retain ownership of the User Content you create and share. By posting content on Circular, you grant Circular and Vignesh Technologies a non-exclusive, worldwide, royalty-free license to host, display, adapt, and distribute your content solely for the operation, improvement, and promotion of the Circular platform.
            </p>
            <p className="mt-2">
              You represent and warrant that you hold all necessary rights and authorizations to share your User Content, and that your content does not violate any third-party rights, copyrights, or laws.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">4. Posts, Comments &amp; Community Interactions</h2>
            <p className="mt-3">
              Circular provides community feeds to discover local updates, news, and events. When interacting on Circular:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>All comments and discussions must remain respectful, constructive, and free of abuse.</li>
              <li>Spamming, repetitive posting, automated bot submissions, and manipulative engagement are strictly prohibited.</li>
              <li>Authors may edit or delete their own posts and comments at any time.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">5. Local Business Profiles, Ratings &amp; Reviews</h2>
            <p className="mt-3">
              Local business owners and service providers may create and manage Business Profiles to connect with local customers.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Accuracy:</strong> Business owners must ensure their business name, category, description, photos, operating hours, and location coordinates are authentic and accurate.</li>
              <li><strong>Fair Ratings:</strong> Users may provide honest 1 to 5 star ratings and reviews based on genuine customer experiences. Our platform strictly enforces <em>one rating per user per business</em>.</li>
              <li><strong>Owner Restriction:</strong> Business owners and administrators are strictly prohibited from submitting ratings or reviews for their own businesses.</li>
              <li><strong>No Paid/Manipulated Reviews:</strong> Offering incentives, compensation, or coercion for positive reviews, or posting fake negative reviews against competitors, is strictly prohibited and grounds for business restriction.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">6. Local Jobs, Need Board &amp; Community Events</h2>
            <p className="mt-3">
              Circular offers community discovery tools for local opportunities:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Local Jobs:</strong> Job postings must represent lawful employment or freelance opportunities. Postings asking for upfront processing fees, fraudulent schemes, or deceptive recruitment are strictly banned.</li>
              <li><strong>Need Board:</strong> Community requests for goods, assistance, or services must be genuine and compliant with local laws.</li>
              <li><strong>Events:</strong> Event creators are solely responsible for event organization, safety, ticketing, and compliance with local municipal permits.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">7. Messaging &amp; In-App Communications</h2>
            <p className="mt-3">
              Circular offers direct messaging for community and business communication. Direct messaging must not be used for harassment, transmission of unauthorized advertisements, fraud, or offensive materials.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">8. Prohibited Activities</h2>
            <p className="mt-3">When using Circular, you agree NOT to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Post content that is illegal, defamatory, hateful, threatening, sexually explicit, fraudulent, or harmful.</li>
              <li>Impersonate any person, business, public entity, or organization.</li>
              <li>Engage in cyberbullying, harassment, stalking, or doxxing.</li>
              <li>Attempt to reverse engineer, decompile, or access non-public APIs of Circular.</li>
              <li>Scrape, crawl, or harvest user data or database contents using automated means.</li>
              <li>Distribute malware, viruses, or interfere with server infrastructure.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">9. Reporting, Moderation &amp; Account Suspension</h2>
            <p className="mt-3">
              Circular provides built-in reporting tools allowing community members to report inappropriate posts, comments, businesses, jobs, and accounts.
            </p>
            <p className="mt-2">
              We reserve the right to review reported content, remove violating materials, issue warnings, apply business restrictions, or suspend and permanently terminate accounts that violate these Terms or our Community Guidelines without prior liability.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">10. Account Deletion &amp; Data Removal</h2>
            <p className="mt-3">
              Users may request full account deletion at any time directly in the mobile app under <strong>Settings &gt; Account Privacy &gt; Delete Account</strong>.
            </p>
            <p className="mt-2">
              Upon account deletion, your user profile, authentication record, and associated personal data are permanently deleted from our database in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">11. Disclaimers &amp; Limitation of Liability</h2>
            <p className="mt-3">
              Circular is provided on an “AS IS” and “AS AVAILABLE” basis without warranties of any kind, whether express or implied.
            </p>
            <p className="mt-2">
              Vignesh Technologies does not guarantee uninterrupted or error-free service. We are not responsible or liable for any user-generated content, goods or services provided by third-party local businesses, or offline transactions and interactions between community members.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">12. Privacy Policy Reference</h2>
            <p className="mt-3">
              Your privacy is important to us. Please review our official{' '}
              <a
                href="https://sites.google.com/view/circular-privacy-policy/home"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://sites.google.com/view/circular-privacy-policy/community-guidelines"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Community Guidelines
              </a>{' '}
              to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">13. Modifications to Terms</h2>
            <p className="mt-3">
              We may revise these Terms of Service periodically. When revisions occur, the “Last Updated” date at the top of this document will be updated. Your continued use of Circular following the posting of revised Terms constitutes your acceptance of the changes.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-navy">14. Contact Information</h2>
            <p className="mt-3">
              For any questions, legal notices, or feedback regarding these Terms of Service, please contact us:
            </p>
            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-muted/50 p-4 text-navy">
              <div className="font-semibold">Vignesh Technologies</div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span>Rajapalayam, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0 text-primary" />
                <a
                  href="mailto:vigneshtechnologyservice@gmail.com"
                  className="text-primary hover:underline"
                >
                  vigneshtechnologyservice@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-4xl px-4 space-y-3">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/terms" className="text-primary font-medium hover:underline">Terms of Service</Link>
            <a
              href="https://sites.google.com/view/circular-privacy-policy/home"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Privacy Policy
            </a>
            <a
              href="https://sites.google.com/view/circular-privacy-policy/community-guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Community Guidelines
            </a>
          </div>
          <p>&copy; {new Date().getFullYear()} Vignesh Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
