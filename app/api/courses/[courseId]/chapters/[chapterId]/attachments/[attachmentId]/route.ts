import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { logError } from '@/lib/logger'

type RouteParams = Promise<{
  courseId: string
  chapterId: string
  attachmentId: string
}>

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, chapterId, attachmentId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const chapter = await db.chapter.findFirst({
      where: { id: chapterId, courseId, course: { companyId: company.id } },
    })

    if (!chapter) {
      return new NextResponse('Chapter not found', { status: 404 })
    }

    const attachment = await db.attachment.findFirst({ where: { id: attachmentId, chapterId, courseId } })

    if (!attachment) {
      return new NextResponse('Attachment not found', { status: 404 })
    }

    await db.attachment.delete({ where: { id: attachment.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('CHAPTER_ATTACHMENT_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
