'use client'

import { CourseEnrollmentStatus } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type ManageCourseRow = {
  id: string
  title: string
  isPublished: boolean
  category?: { name: string | null } | null
  enrollments: { id: string; status: CourseEnrollmentStatus }[]
  teamAssignments: { id: string }[]
  updatedAt: Date
}

export const columns: ColumnDef<ManageCourseRow>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <span className="text-sm text-muted-foreground">{row.original.category?.name ?? 'Uncategorised'}</span>
    },
  },
  {
    accessorKey: 'enrollments',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Learners
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const count = row.original.enrollments.length
      const completed = row.original.enrollments.filter((item) => item.status === CourseEnrollmentStatus.COMPLETED).length

      return (
        <span className="text-sm font-medium text-foreground">
          {completed}/{count}
        </span>
      )
    },
  },
  {
    accessorKey: 'teamAssignments',
    header: 'Teams',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.teamAssignments.length}</span>,
  },
  {
    accessorKey: 'isPublished',
    header: 'Status',
    cell: ({ row }) => {
      const isPublished = row.original.isPublished

      return <Badge className={cn('bg-slate-500', isPublished && 'bg-sky-700')}>{isPublished ? 'Published' : 'Draft'}</Badge>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const { id } = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/manage/courses/${id}`}>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
