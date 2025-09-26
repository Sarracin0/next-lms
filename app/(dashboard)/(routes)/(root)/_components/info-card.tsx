import { LucideIcon } from 'lucide-react'

import { IconBadge } from '@/components/icon-badge'

interface InfoCardProps {
  label: string
  value: string
  helper?: string
  variant?: 'default' | 'success'
  icon: LucideIcon
}

export const InfoCard = ({ label, value, helper, variant = 'default', icon: Icon }: InfoCardProps) => {
  return (
    <div className="flex items-center gap-x-3 rounded-lg border bg-white p-4 shadow-sm">
      <IconBadge variant={variant} icon={Icon} />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-xl font-semibold text-foreground">{value}</span>
        {helper ? <span className="text-xs text-muted-foreground/80">{helper}</span> : null}
      </div>
    </div>
  )
}
