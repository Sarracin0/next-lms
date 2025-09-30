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
  moduleId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId } = await params
    const moduleRecord = await db.courseModule.findFirst({
      where: { id: moduleId, courseId, course: { companyId: company.id } },
      include: { course: true },
    })

    if (!moduleRecord) {
      return new NextResponse('Module not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER) {
      if (!moduleRecord.course || moduleRecord.course.createdByProfileId !== profile.id) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (!title) {
        return new NextResponse('Module title is required', { status: 400 })
      }
      data.title = title
    }

    if (typeof body.description === 'string') {
      data.description = body.description.trim() || null
    } else if (body.description === null) {
      data.description = null
    }

    if (typeof body.isPublished === 'boolean') {
      data.isPublished = body.isPublished
    }

    if (typeof body.position === 'number' && Number.isInteger(body.position)) {
      data.position = body.position
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(moduleRecord)
    }

    const module = await db.courseModule.update({
      where: { id: moduleId },
      data,
      include: moduleInclude,
    })

    return NextResponse.json(module)
  } catch (error) {
    logError('COURSE_MODULE_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId } = await params

    const moduleRecord = await db.courseModule.findFirst({
      where: { id: moduleId, courseId, course: { companyId: company.id } },
      include: { course: true },
    })

    if (!moduleRecord) {
      return new NextResponse('Module not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER) {
      if (!moduleRecord.course || moduleRecord.course.createdByProfileId !== profile.id) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    await db.courseModule.delete({ where: { id: moduleId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_MODULE_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
