import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

export default async function TeamsPage() {
  const { profile, company } = await requireAuthContext()

  const teams = await db.companyTeam.findMany({
    where: {
      companyId: company.id,
      memberships: {
        some: { userProfileId: profile.id },
      },
    },
    include: {
      memberships: {
        include: {
          userProfile: {
            select: { id: true, userId: true, role: true, jobTitle: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">My teams</h1>
        <p className="text-sm text-muted-foreground">
          Collaborate with your peers and see who is learning alongside you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">{team.name}</h2>
            <p className="text-xs text-muted-foreground">{team.description ?? 'No description provided.'}</p>
            <div className="mt-4 space-y-2">
              {team.memberships.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between text-sm">
                  <span>{membership.userProfile.userId}</span>
                  <span className="text-xs text-muted-foreground">{membership.userProfile.jobTitle}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not part of any team yet. Ask your HR manager to add you to a team.
        </p>
      ) : null}
    </div>
  )
}
