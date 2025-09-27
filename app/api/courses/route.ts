import { NextRequest, NextResponse } from 'next/server'
import { CourseEnrollmentSource, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

export async function POST(request: NextRequest) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { title, categoryId } = await request.json()

    if (!title) {
      return new NextResponse('Title is required', { status: 400 })
    }

    const course = await db.course.create({
      data: {
        title,
        companyId: company.id,
        createdByProfileId: profile.id,
        categoryId: categoryId ?? null,
        enrollments: {
          create: {
            userProfileId: profile.id,
            assignedById: profile.id,
            source: CourseEnrollmentSource.MANUAL,
          },
        },
      },
      include: {
        enrollments: true,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    logError('COURSES_POST', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
