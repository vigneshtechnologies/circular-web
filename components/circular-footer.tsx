import Link from 'next/link'
import Image from 'next/image'
import { Smartphone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular'
const PRIVACY_POLICY_URL =
  'https://sites.google.com/view/circular-privacy-policy/home'
const COMMUNITY_GUIDELINES_URL =
  'https://sites.google.com/view/circular-privacy-policy/community-guidelines'
const ACCOUNT_DELETION_URL =
  'https://sites.google.com/view/circular-privacy-policy/account-deletion'

export function CircularFooter() {
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-xl bg-background/10 ring-1 ring-white/20">
                <Image
                  src="/circular-logo.png"
                  alt="Circular Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  Circular
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-navy-foreground/70">
                  Local Social &amp; Business
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-navy-foreground/70">
              Discover nearby shops, events, jobs, offers, and connect with your neighborhood on Circular.
            </p>
            <div className="mt-6">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-primary/90"
              >
                <Smartphone className="size-4" />
                <span>Get on Google Play</span>
              </a>
            </div>
          </div>

          {/* Discovery Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Discovery</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-navy-foreground/70">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/businesses" className="transition-colors hover:text-white">
                  Local Businesses
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="transition-colors hover:text-white">
                  Jobs &amp; Openings
                </Link>
              </li>
              <li>
                <Link href="/events" className="transition-colors hover:text-white">
                  Community Events
                </Link>
              </li>
              <li>
                <Link href="/needs" className="transition-colors hover:text-white">
                  Need Board
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Legal &amp; Safety</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-navy-foreground/70">
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href={COMMUNITY_GUIDELINES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Community Guidelines
                </a>
              </li>
              <li>
                <a
                  href={ACCOUNT_DELETION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Account Deletion
                </a>
              </li>
              <li>
                <a
                  href="/.well-known/assetlinks.json"
                  target="_blank"
                  className="text-xs text-navy-foreground/50 hover:text-white"
                >
                  Digital Asset Links
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Contact &amp; Support</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-navy-foreground/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Rajapalayam, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" />
                <a
                  href="mailto:vigneshtechnologyservice@gmail.com"
                  className="transition-colors hover:text-white"
                >
                  vigneshtechnologyservice@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <span>Developed by Vignesh Technologies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-navy-foreground/10 pt-6 text-xs text-navy-foreground/60 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Circular • Vignesh Technologies. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="size-3 text-red-500 fill-red-500" />
            <span>for local communities across India</span>
          </div>
        </div>
      </div>
    </footer>
  )
}