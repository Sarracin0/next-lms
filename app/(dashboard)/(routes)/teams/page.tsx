import { UserRole } from '@prisma/client'
import { Users, Crown, GraduationCap, User } from 'lucide-react'

import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const roleIcons = {
  [UserRole.HR_ADMIN]: Crown,
  [UserRole.TRAINER]: GraduationCap,
  [UserRole.LEARNER]: User,
}

const roleLabels = {
  [UserRole.HR_ADMIN]: 'HR Admin',
  [UserRole.TRAINER]: 'Trainer',
  [UserRole.LEARNER]: 'Learner',
}

const roleColors = {
  [UserRole.HR_ADMIN]: 'bg-red-100 text-red-800 border-red-200',
  [UserRole.TRAINER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [UserRole.LEARNER]: 'bg-green-100 text-green-800 border-green-200',
}

export default async function TeamsPage() {
  const { profile, company } = await requireAuthContext()

  // Se l'utente è Admin/HR, mostra tutti gli utenti dell'organizzazione
  if (profile.role === UserRole.HR_ADMIN) {
    const allUsers = await db.userProfile.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        userId: true,
        role: true,
        jobTitle: true,
        department: true,
        avatarUrl: true,
        points: true,
        streakCount: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' }, // Prima gli admin, poi trainer, poi learner
        { userId: 'asc' },
      ],
    })

    const usersByRole = {
      [UserRole.HR_ADMIN]: allUsers.filter(user => user.role === UserRole.HR_ADMIN),
      [UserRole.TRAINER]: allUsers.filter(user => user.role === UserRole.TRAINER),
      [UserRole.LEARNER]: allUsers.filter(user => user.role === UserRole.LEARNER),
    }

    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Utenti Organizzazione
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestisci tutti gli utenti della tua organizzazione {company.name}
          </p>
        </div>

        <div className="grid gap-6">
          {Object.entries(usersByRole).map(([role, users]) => {
            if (users.length === 0) return null
            
            const RoleIcon = roleIcons[role as UserRole]
            const roleLabel = roleLabels[role as UserRole]
            
            return (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RoleIcon className="h-5 w-5" />
                    {roleLabel} ({users.length})
                  </CardTitle>
                  <CardDescription>
                    {role === UserRole.HR_ADMIN && 'Amministratori con accesso completo al sistema'}
                    {role === UserRole.TRAINER && 'Formatori che possono creare e gestire corsi'}
                    {role === UserRole.LEARNER && 'Studenti che seguono i corsi'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {user.userId.split('@')[0].slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.userId.split('@')[0]}
                            </p>
                            <Badge variant="outline" className={roleColors[user.role]}>
                              {roleLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.jobTitle || user.department || 'Nessun ruolo specificato'}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {user.points} punti
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Streak: {user.streakCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statistiche Organizzazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{allUsers.length}</div>
                <div className="text-xs text-muted-foreground">Utenti Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{usersByRole[UserRole.HR_ADMIN].length}</div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usersByRole[UserRole.TRAINER].length}</div>
                <div className="text-xs text-muted-foreground">Trainer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{usersByRole[UserRole.LEARNER].length}</div>
                <div className="text-xs text-muted-foreground">Learner</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Per utenti non-admin, mostra solo i team di cui fanno parte
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
            select: { id: true, userId: true, role: true, jobTitle: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">I miei team</h1>
        <p className="text-sm text-muted-foreground">
          Collabora con i tuoi colleghi e vedi chi sta imparando insieme a te.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="text-base">{team.name}</CardTitle>
              <CardDescription>
                {team.description || 'Nessuna descrizione fornita.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.memberships.map((membership) => (
                  <div key={membership.id} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={membership.userProfile.avatarUrl || undefined} />
                      <AvatarFallback>
                        {membership.userProfile.userId.split('@')[0].slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {membership.userProfile.userId.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {membership.userProfile.jobTitle || roleLabels[membership.userProfile.role]}
                      </p>
                    </div>
                    <Badge variant="outline" className={roleColors[membership.userProfile.role]}>
                      {roleLabels[membership.userProfile.role]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Non fai ancora parte di nessun team. Chiedi al tuo responsabile HR di aggiungerti a un team.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
