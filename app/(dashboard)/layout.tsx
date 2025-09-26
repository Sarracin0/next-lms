import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { requireAuthContext } from '@/lib/current-profile'

import { Navbar } from './_components/navbar'
import Sidebar from './_components/sidebar'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const context = await requireAuthContext()

  const dashboardContextValue = {
    profile: {
      id: context.profile.id,
      role: context.profile.role,
      jobTitle: context.profile.jobTitle,
      department: context.profile.department,
      points: context.profile.points,
      streakCount: context.profile.streakCount,
      avatarUrl: context.profile.avatarUrl,
    },
    company: {
      id: context.company.id,
      name: context.company.name,
      slug: context.company.slug,
      logoUrl: context.company.logoUrl,
    },
    organizationId: context.organizationId,
  }

  return (
    <DashboardProvider value={dashboardContextValue}>
      <div className="h-full">
        <div className="fixed inset-y-0 z-50 h-[80px] w-full md:pl-64">
          <Navbar />
        </div>
        <div className="fixed inset-y-0 z-50 hidden h-full w-64 flex-col md:flex">
          <Sidebar />
        </div>
        <main className="h-full bg-muted/40 pt-[80px] md:pl-64">{children}</main>
      </div>
    </DashboardProvider>
  )
}

export default DashboardLayout
