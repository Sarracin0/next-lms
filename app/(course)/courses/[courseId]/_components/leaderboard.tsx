import Image from 'next/image'
import { Trophy } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { getCourseLeaderboard } from '@/actions/get-course-leaderboard'

export default async function CourseLeaderboard({
  courseId,
  currentUserProfileId,
  limit = 5,
}: {
  courseId: string
  currentUserProfileId: string
  limit?: number
}) {
  const entries = await getCourseLeaderboard(courseId)
  if (entries.length === 0) return null

  const top = entries.slice(0, limit)
  const meIndex = entries.findIndex((e) => e.userProfileId === currentUserProfileId)
  const me = meIndex >= 0 ? { rank: meIndex + 1, ...entries[meIndex] } : null

  return (
    <Card className="mx-auto mb-4 max-w-4xl border-border/60 bg-card/80 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>Leaderboard del corso</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {top.map((e, idx) => (
            <div key={e.userProfileId} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
              {e.avatarUrl ? (
                <Image src={e.avatarUrl} alt="avatar" width={20} height={20} className="h-5 w-5 rounded-full" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-muted" />)
              }
              <span className="text-xs font-medium">{e.points} pts</span>
            </div>
          ))}
        </div>
        {me && me.rank > limit ? (
          <div className="text-xs text-muted-foreground">Tu sei #{me.rank} con {me.points} pts</div>
        ) : null}
      </CardContent>
    </Card>
  )
}