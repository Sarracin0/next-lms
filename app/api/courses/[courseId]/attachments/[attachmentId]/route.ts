import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
  attachmentId: string
}>

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, attachmentId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const attachment = await db.attachment.findFirst({ where: { id: attachmentId, courseId } })

    if (!attachment) {
      return new NextResponse('Attachment not found', { status: 404 })
    }

    await db.attachment.delete({ where: { id: attachment.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_ATTACHMENT_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
