import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UserRole } from '@prisma/client'

import { assertRole, requireAuthContext } from '@/lib/current-profile'

const f = createUploadthing()

const handleAuth = async () => {
  const context = await requireAuthContext()
  assertRole(context.profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

  return { userId: context.userId, profileId: context.profile.id }
}

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  courseAttachment: f(['text', 'image', 'video', 'audio', 'pdf'])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: '512GB' } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
