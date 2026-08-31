import type { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'User Profile',
    description: 'View user profile and community activity on Circular.',
    alternates: {
      canonical: `https://circularapp.in/user/${id}`,
    },
    openGraph: {
      title: 'User Profile | Circular',
      description: 'View user profile and community activity on Circular.',
      url: `https://circularapp.in/user/${id}`,
    },
  }
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}