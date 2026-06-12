import { notFound } from 'next/navigation'
import { getGroupWithEvent } from '@/app/actions/groups'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { getPlansForGroup } from '@/app/actions/plans'
import { GroupPlanningView } from '@/components/GroupPlanningView'
import { fetchSunTimes } from '@/lib/sun-times'

export default async function GroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const group = await getGroupWithEvent(code.toUpperCase())

  if (!group) notFound()

  const ev = (group as any).events
  const [stages, plans, sunTimes] = await Promise.all([
    getStagesWithPerformances(ev.id),
    getPlansForGroup(group.id),
    fetchSunTimes(ev.location, ev.date_start, ev.date_end, ev.timezone),
  ])

  return (
    <GroupPlanningView
      group={group as any}
      stages={stages as any}
      initialPlans={plans as any}
      sunTimes={sunTimes}
    />
  )
}
