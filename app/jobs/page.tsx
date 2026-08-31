import { getPublicJobsList } from '@/lib/serverPublicData'
import JobsClientContainer from './jobs-client'

export const revalidate = 300 // Revalidate ISR every 5 minutes

export default async function JobsPage() {
  const initialJobs = await getPublicJobsList(100)
  return <JobsClientContainer initialJobs={initialJobs} />
}
