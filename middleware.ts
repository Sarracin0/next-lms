import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const publicRoutes = ['/sign-in(.*)', '/sign-up(.*)']
const isPublicRoute = createRouteMatcher(publicRoutes)

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
