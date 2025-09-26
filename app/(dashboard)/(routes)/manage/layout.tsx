import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

import { requireAuthContext } from '@/lib/current-profile'

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuthContext()

  if (profile.role === UserRole.LEARNER) {
    return redirect('/')
  }

  return <>{children}</>
}
