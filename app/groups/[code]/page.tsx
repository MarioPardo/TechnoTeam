import { notFound } from 'next/navigation'
import { getGroupWithEvent } from '@/app/actions/groups'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { getPlansForGroup } from '@/app/actions/plans'
import { GroupPlanningView } from '@/components/GroupPlanningView'

export default async function GroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const group = await getGroupWithEvent(code.toUpperCase())

  if (!group) notFound()

  const [stages, plans] = await Promise.all([
    getStagesWithPerformances((group as any).events.id),
    getPlansForGroup(group.id),
  ])

  return (
    <GroupPlanningView
      group={group as any}
      stages={stages as any}
      initialPlans={plans as any}
    />
  )
}
