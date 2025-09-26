import { redirect } from 'next/navigation'
import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  Flame,
} from 'lucide-react'

import { getDashboardCourses } from '@/actions/get-dashboard-courses'
import CoursesList from '@/components/course-list'
import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'
import { InfoCard } from './_components/info-card'

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export default async function Dashboard() {
  const { profile, company, organizationId } = await requireAuthContext()

  if (!organizationId) {
    return redirect('/onboarding')
  }

  const [{ coursesInProgress, completedCourses }, upcomingSessions, earnedBadges] = await Promise.all([
    getDashboardCourses(profile.id),
    db.liveSession.findMany({
      where: { companyId: company.id, scheduledFor: { gte: new Date() } },
      include: {
        course: { select: { id: true, title: true } },
        host: { select: { id: true, userId: true } },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 3,
    }),
    db.userBadge.findMany({
      where: { userProfileId: profile.id },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
      take: 6,
    }),
  ])

  const inProgressCourses = coursesInProgress.map((item) => ({
    ...item.course,
    progress: item.progress,
    enrollmentStatus: item.status,
  }))

  const completedCourseCards = completedCourses.map((item) => ({
    ...item.course,
    progress: item.progress,
    enrollmentStatus: item.status,
  }))

  return (
    <div className="space-y-8 p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={BookOpenCheck}
          label="Active Courses"
          value={`${coursesInProgress.length}`}
          helper="Continue where you left off"
        />
        <InfoCard
          icon={BadgeCheck}
          label="Completed"
          value={`${completedCourses.length}`}
          helper="Great job finishing your tracks"
          variant="success"
        />
        <InfoCard
          icon={Award}
          label="Badges Earned"
          value={`${earnedBadges.length}`}
          helper="Collect achievements as you learn"
        />
        <InfoCard
          icon={Flame}
          label="Learning Streak"
          value={`${profile.streakCount} days`}
          helper="Consistency unlocks recognition"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Continue learning</h2>
        </div>
        <CoursesList items={[...inProgressCourses, ...completedCourseCards]} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Upcoming live sessions</h3>
            <span className="text-xs text-muted-foreground">Synced across your company</span>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No live sessions scheduled yet.</p>
            ) : (
              upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{session.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {session.course.title} • {formatDate(session.scheduledFor)}
                    </span>
                  </div>
                  <CalendarClock className="h-4 w-4 text-primary" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Recent badges</h3>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-3">
            {earnedBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Start your learning path to earn badges.</p>
            ) : (
              earnedBadges.map((entry) => (
                <div key={entry.id} className="rounded-lg border px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{entry.badge.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.context ?? entry.badge.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
