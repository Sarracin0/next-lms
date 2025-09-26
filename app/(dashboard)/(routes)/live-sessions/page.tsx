import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default async function LiveSessionsPage() {
  const { company } = await requireAuthContext()

  const sessions = await db.liveSession.findMany({
    where: { companyId: company.id },
    include: {
      course: { select: { title: true } },
      host: { select: { userId: true } },
    },
    orderBy: { scheduledFor: 'asc' },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Live sessions</h1>
        <p className="text-sm text-muted-foreground">
          Join upcoming live classes and workshops organised for your company.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{session.title}</h2>
                <p className="text-xs text-muted-foreground">{session.course.title}</p>
              </div>
              <span className="text-xs text-muted-foreground">Hosted by {session.host.userId}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{formatDate(session.scheduledFor)}</p>
            {session.meetingUrl ? (
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
              >
                Join session
              </a>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">Meeting details will be shared soon.</p>
            )}
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No live sessions scheduled. Check back soon.</p>
      ) : null}
    </div>
  )
}
