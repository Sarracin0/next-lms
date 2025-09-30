'use client'

import { LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  href: string
}

export const SidebarItem = ({ icon: Icon, label, href }: SidebarItemProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const isActive =
    (pathname === '/' && href === '/') ||
    pathname === href ||
    pathname?.startsWith(`${href}/`)

  const onClick = () => {
    router.push(href)
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-6 py-3 text-sm font-normal transition-all',
        'hover:bg-accent/50',
        isActive && 'bg-accent font-semibold text-accent-foreground'
      )}
    >
      <Icon
        size={18}
        strokeWidth={1.5}
        className={cn(
          'shrink-0 text-muted-foreground transition-colors',
          'group-hover:text-foreground',
          isActive && 'text-accent-foreground'
        )}
      />
      <span className="leading-relaxed">{label}</span>
    </button>
  )
}