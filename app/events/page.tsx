import { getPublicEventsList } from '@/lib/serverPublicData'
import EventsClientContainer from './events-client'

export const revalidate = 300 // Revalidate ISR every 5 minutes

export default async function EventsPage() {
  const initialEvents = await getPublicEventsList(100)
  return <EventsClientContainer initialEvents={initialEvents} />
}
