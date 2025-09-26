import { getAnalytics } from '@/actions/get-analytics'
import { requireAuthContext } from '@/lib/current-profile'

export default async function AnalyticsPage() {
  const { company } = await requireAuthContext()
  const analytics = await getAnalytics(company.id)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Engagement analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor how learners interact with your academy across courses and teams.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Active learners</p>
          <p className="text-2xl font-semibold text-foreground">{analytics.totalLearners}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Completed enrolments</p>
          <p className="text-2xl font-semibold text-foreground">{analytics.completedEnrollments}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">In progress</p>
          <p className="text-2xl font-semibold text-foreground">{analytics.inProgressEnrollments}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Average completion rate</p>
          <p className="text-2xl font-semibold text-foreground">{analytics.averageCompletionRate}%</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Course performance</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Completed vs in-progress enrolments per course.
        </p>
        <div className="space-y-3">
          {analytics.data.map((item) => (
            <div key={item.name} className="flex flex-col gap-1 rounded-md border px-4 py-3">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.completed} completed • {item.inProgress} in progress
              </span>
            </div>
          ))}
        </div>
        {analytics.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No course engagement data yet.</p>
        ) : null}
      </div>
    </div>
  )
}
