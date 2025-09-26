import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  const { courseId } = await params

  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { url, name, type } = await request.json()

    if (!url) {
      return new NextResponse('Attachment url is required', { status: 400 })
    }

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const attachment = await db.attachment.create({
      data: {
        url,
        name: name ?? url.split('/').pop() ?? 'Attachment',
        type: type ?? null,
        courseId,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    logError('COURSE_ATTACHMENT_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
