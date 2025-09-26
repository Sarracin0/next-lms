import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

export default async function GamificationPage() {
  const { profile } = await requireAuthContext()

  const [badges, pointsLog] = await Promise.all([
    db.userBadge.findMany({
      where: { userProfileId: profile.id },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    }),
    db.userPoints.findMany({
      where: { userProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          Keep track of the badges collected and the points you&apos;ve earned through learning.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Points history</h2>
        <p className="text-xs text-muted-foreground">Total points: {profile.points}</p>
        <div className="mt-3 space-y-2">
          {pointsLog.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{entry.reason ?? entry.type}</span>
              <span className="text-xs font-medium text-foreground">+{entry.delta}</span>
            </div>
          ))}
        </div>
        {pointsLog.length === 0 ? <p className="text-sm text-muted-foreground">No points awarded yet.</p> : null}
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Badges earned</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((userBadge) => (
            <div key={userBadge.id} className="rounded-md border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{userBadge.badge.name}</p>
              <p className="text-xs text-muted-foreground">{userBadge.badge.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Awarded on {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(userBadge.awardedAt)}
              </p>
            </div>
          ))}
        </div>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Complete courses and live sessions to unlock badges.</p>
        ) : null}
      </div>
    </div>
  )
}
