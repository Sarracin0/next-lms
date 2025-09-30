import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { logError } from '@/lib/logger'

const moduleInclude = {
  lessons: {
    orderBy: { position: 'asc' as const },
    include: {
      blocks: {
        orderBy: { position: 'asc' as const },
      },
    },
  },
}

type RouteParams = Promise<{
  courseId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId } = await params
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : undefined

    if (!title) {
      return new NextResponse('Module title is required', { status: 400 })
    }

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const lastModule = await db.courseModule.findFirst({
      where: { courseId },
      orderBy: { position: 'desc' },
    })

    const position = lastModule ? lastModule.position + 1 : 1

    const module = await db.courseModule.create({
      data: {
        courseId,
        title,
        description: description ?? null,
        position,
      },
      include: moduleInclude,
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    logError('COURSE_MODULE_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
