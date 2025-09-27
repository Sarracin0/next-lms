import { NextResponse } from 'next/server'
import { createRouteHandler } from 'uploadthing/next'

import { ourFileRouter } from './core'

const handler = createRouteHandler({
  router: ourFileRouter,
})

export const GET = handler.GET

export async function POST(request: Request) {
  const hook = request.headers.get('uploadthing-hook')

  if (hook) {
    console.info('[UPLOADTHING] Hook received', hook)
    // Silently acknowledge UploadThing dev callbacks (callback/error)
    return new NextResponse('OK', { status: 200 })
  }

  return handler.POST(request)
}
