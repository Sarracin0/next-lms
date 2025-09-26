'use client'

import {
  Activity,
  Award,
  BookOpenCheck,
  CalendarClock,
  Compass,
  LayoutDashboard,
  KanbanSquare,
  ShieldQuestion,
  Users,
  Users2,
} from 'lucide-react'

import { useDashboardContext } from '@/components/providers/dashboard-provider'

import { SidebarItem } from './sidebar-item'

const learnerRoutes = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: BookOpenCheck, label: 'My Courses', href: '/courses' },
  { icon: Compass, label: 'Learning Library', href: '/library' },
  { icon: Users, label: 'Teams', href: '/teams' },
  { icon: CalendarClock, label: 'Live Sessions', href: '/live-sessions' },
  { icon: Award, label: 'Gamification', href: '/gamification' },
]

const managementRoutes = [
  { icon: KanbanSquare, label: 'Course Builder', href: '/manage/courses' },
  { icon: Users2, label: 'Team Management', href: '/manage/teams' },
  { icon: Activity, label: 'Engagement Analytics', href: '/manage/analytics' },
  { icon: ShieldQuestion, label: 'Badge Studio', href: '/manage/badges' },
]

export const SidebarRoutes = () => {
  const { profile } = useDashboardContext()

  const canManage = profile.role === 'HR_ADMIN' || profile.role === 'TRAINER'

  return (
    <div className="flex w-full flex-col gap-y-4">
      <div className="flex flex-col">
        <span className="px-6 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Learning
        </span>
        {learnerRoutes.map((route) => (
          <SidebarItem key={route.href} icon={route.icon} label={route.label} href={route.href} />
        ))}
      </div>
      {canManage ? (
        <div className="flex flex-col">
          <span className="px-6 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Manage
          </span>
          {managementRoutes.map((route) => (
            <SidebarItem key={route.href} icon={route.icon} label={route.label} href={route.href} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
