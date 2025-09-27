'use client'

import Image from 'next/image'

import { useDashboardContext } from '@/components/providers/dashboard-provider'

const Logo = () => {
  const { company } = useDashboardContext()

  return (
    <div className="flex items-center gap-3">
      {company.logoUrl ? (
        <Image
          src={company.logoUrl}
          alt={`${company.name} logo`}
          width={44}
          height={44}
          className="rounded-md border"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-lg font-semibold text-primary">
          {company.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{company.name}</span>
        <span className="text-xs text-muted-foreground">Relax and follow the flow</span>
      </div>
    </div>
  )
}

export default Logo
