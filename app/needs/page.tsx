import { getPublicNeedsList } from '@/lib/serverPublicData'
import NeedsClientContainer from './needs-client'

export const revalidate = 300 // Revalidate ISR every 5 minutes

export default async function NeedsPage() {
  const initialNeeds = await getPublicNeedsList(100)
  return <NeedsClientContainer initialNeeds={initialNeeds} />
}
