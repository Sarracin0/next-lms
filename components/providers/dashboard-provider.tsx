'use client'

import { createContext, useContext } from 'react'
import type { UserRole } from '@prisma/client'

export type DashboardContextValue = {
  profile: {
    id: string
    role: UserRole
    jobTitle?: string | null
    department?: string | null
    points: number
    streakCount: number
    avatarUrl?: string | null
  }
  company: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
  }
  organizationId: string | null
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ value, children }: { value: DashboardContextValue; children: React.ReactNode }) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)

  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }

  return context
}
