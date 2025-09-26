import { redirect } from 'next/navigation'

import { getCourses } from '@/actions/get-courses'
import CoursesList from '@/components/course-list'
import { SearchInput } from '@/components/search-input'
import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

import { Categories } from './_components/category'

type LibraryPageProps = {
  searchParams?: {
    title?: string
    categoryId?: string
  }
}

const LibraryPage = async ({ searchParams }: LibraryPageProps) => {
  const context = await requireAuthContext()

  if (!context.organizationId) {
    return redirect('/onboarding')
  }

  const categories = await db.category.findMany({
    where: {
      OR: [{ companyId: context.company.id }, { companyId: null }],
    },
    orderBy: { name: 'asc' },
  })

  const courses = await getCourses({
    userProfileId: context.profile.id,
    companyId: context.company.id,
    title: searchParams?.title,
    categoryId: searchParams?.categoryId,
  })

  return (
    <>
      <div className="block px-6 pt-6 md:hidden">
        <SearchInput />
      </div>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Learning library</h1>
          <p className="text-sm text-muted-foreground">
            Browse every course available for {context.company.name} and enroll instantly.
          </p>
        </div>
        <Categories items={categories} />
        <CoursesList
          items={courses}
          emptyState="No courses match your filters yet. Try adjusting the category or search query."
        />
      </div>
    </>
  )
}

export default LibraryPage
