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
        'group mx-3 flex w-auto items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal transition-all duration-200',
        'hover:bg-accent/40',
        isActive && 'bg-accent font-semibold text-accent-foreground shadow-sm'
      )}
    >
      <Icon
        size={18}
        strokeWidth={1.5}
        className={cn(
          'shrink-0 text-muted-foreground/70 transition-colors duration-200',
          'group-hover:text-foreground/90',
          isActive && 'text-accent-foreground'
        )}
      />
      <span className="leading-relaxed tracking-wide">{label}</span>
    </button>
  )
}