import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

import { NewBadgeForm } from './_components/new-badge-form'
import { AwardBadgeForm } from './_components/award-badge-form'

export default async function ManageBadgesPage() {
  const { company } = await requireAuthContext()

  const [badges, members] = await Promise.all([
    db.badge.findMany({
      where: { OR: [{ companyId: company.id }, { companyId: null }] },
      orderBy: { createdAt: 'desc' },
    }),
    db.userProfile.findMany({
      where: { companyId: company.id },
      select: { id: true, userId: true },
      orderBy: { userId: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Badge studio</h1>
        <p className="text-sm text-muted-foreground">
          Create recognition badges and celebrate the achievements of your teams.
        </p>
      </div>

      <NewBadgeForm />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-foreground">{badge.name}</h3>
              <p className="text-xs text-muted-foreground">{badge.description ?? 'No description provided.'}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Type: {badge.type} • {badge.pointsReward} pts
              </p>
            </div>
            <AwardBadgeForm badgeId={badge.id} members={members} />
          </div>
        ))}
      </div>

      {badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No badges yet. Create your first badge above.</p>
      ) : null}
    </div>
  )
}
