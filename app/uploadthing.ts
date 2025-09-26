import { createUploadthing } from 'uploadthing/next'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

const ut = createUploadthing<OurFileRouter>()

export default ut
