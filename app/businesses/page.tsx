import { getPublicBusinessesList } from '@/lib/serverPublicData'
import BusinessesClientContainer from './businesses-client'

export const revalidate = 300 // Revalidate ISR every 5 minutes

export default async function BusinessesPage() {
  const initialBusinesses = await getPublicBusinessesList(100)
  return <BusinessesClientContainer initialBusinesses={initialBusinesses} />
}
