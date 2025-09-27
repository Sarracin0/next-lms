import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Award,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  MoreHorizontal,
  Play,
  Star,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { it } from 'date-fns/locale'

import { getDashboardCourses } from '@/actions/get-dashboard-courses'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'
import { cn } from '@/lib/utils'

// Utility functions
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buongiorno'
  if (hour < 17) return 'Buon pomeriggio'
  return 'Buonasera'
}

function getStreakEmoji(count: number) {
  if (count >= 30) return '🔥'
  if (count >= 14) return '⚡'
  if (count >= 7) return '💪'
  if (count >= 3) return '🌟'
  return '✨'
}

// Modern Stats Card Component
interface StatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    positive: boolean
  }
  className?: string
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            <TrendingUp className={cn("h-3 w-3", trend.positive ? "text-emerald-500" : "text-red-500")} />
            <span className={cn("text-xs font-medium", trend.positive ? "text-emerald-600" : "text-red-600")}>
              {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">questo mese</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Modern Course Card Component
interface CourseCardProps {
  course: {
    id: string
    title: string
    description?: string | null
    imageUrl?: string | null
    category?: { name: string } | null
    progress?: number
    enrollmentStatus?: string
    estimatedDurationMinutes?: number | null
  }
  isEnrolled?: boolean
}

function CourseCard({ course, isEnrolled = false }: CourseCardProps) {
  const href = isEnrolled ? `/courses/${course.id}` : `/library/courses/${course.id}`
  
  return (
    <Card className="group relative overflow-hidden border-0 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <CardContent className="p-0">
        {/* Course Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {course.category && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {course.category.name}
                  </Badge>
                )}
                {course.estimatedDurationMinutes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {Math.round(course.estimatedDurationMinutes / 60)}h
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-base leading-tight">{course.title}</h3>
              
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>
            
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        {isEnrolled && typeof course.progress === 'number' && (
          <div className="px-6 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm font-bold">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="border-t bg-gray-50/50 px-6 py-4">
          <Button 
            size="sm" 
            className={cn(
              "w-full font-medium",
              isEnrolled ? "bg-primary hover:bg-primary/90" : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
            )}
            asChild
          >
            <Link href={href}>
              {isEnrolled ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Continua
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Inizia corso
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Modern Calendar Component
function ModernCalendar() {
  const today = new Date()
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i))
  
  const monthYear = format(today, 'MMMM yyyy', { locale: it })
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {monthYear}
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            Vedi tutto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Week View */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-xs font-medium text-muted-foreground mb-2">{day}</div>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isToday(weekDays[i])
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {format(weekDays[i], 'd')}
                </div>
              </div>
            ))}
          </div>
          
          <Separator />
          
          {/* Quick Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Questa settimana</span>
              <span className="font-medium">3 obiettivi</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Prossimo deadline</span>
              <span className="font-medium text-orange-600">2 giorni</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Achievement Card Component
interface AchievementCardProps {
  badges: Array<{
    id: string
    badge: {
      name: string
      description?: string | null
    }
    awardedAt: Date
  }>
}

function AchievementCard({ badges }: AchievementCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-4 w-4" />
            Ultimi Achievement
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            Vedi tutti
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {badges.length > 0 ? (
          <div className="space-y-3">
            {badges.slice(0, 3).map((userBadge, index) => (
              <div key={userBadge.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                  index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                  index === 1 ? "bg-gradient-to-br from-blue-400 to-purple-500" :
                  "bg-gradient-to-br from-green-400 to-teal-500"
                )}>
                  {index === 0 ? '🏆' : index === 1 ? '⭐' : '🎯'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{userBadge.badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(userBadge.awardedAt, 'd MMM yyyy', { locale: it })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground">Completa il tuo primo corso per sbloccare badge!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Progress Overview Component
interface ProgressOverviewProps {
  coursesInProgress: any[]
}

function ProgressOverview({ coursesInProgress }: ProgressOverviewProps) {
  if (coursesInProgress.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Progressi in corso</CardTitle>
        <CardDescription>I tuoi corsi attivi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {coursesInProgress.slice(0, 3).map((enrollment) => {
            const course = enrollment.course
            const progress = enrollment.progress
            
            return (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {progress}% completato
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function Dashboard() {
  const { profile, company, organizationId } = await requireAuthContext()

  if (!organizationId) {
    return redirect('/onboarding')
  }

  // Fetch all data
  const [
    { coursesInProgress, completedCourses },
    availableCourses,
    upcomingSessions,
    earnedBadges,
  ] = await Promise.all([
    getDashboardCourses(profile.id),
    db.course.findMany({
      where: {
        companyId: company.id,
        isPublished: true,
        enrollments: {
          none: {
            userProfileId: profile.id,
          },
        },
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    db.liveSession.findMany({
      where: { companyId: company.id, scheduledFor: { gte: new Date() } },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 3,
    }),
    db.userBadge.findMany({
      where: { userProfileId: profile.id },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
      take: 6,
    }),
  ])

  const inProgressCourses = coursesInProgress.map((enrollment) => ({
    ...enrollment.course,
    progress: enrollment.progress,
    enrollmentStatus: enrollment.status,
  }))

  const completedCoursesData = completedCourses.map((enrollment) => ({
    ...enrollment.course,
    progress: enrollment.progress,
    enrollmentStatus: enrollment.status,
  }))

  const userName = profile.userId.includes('_') 
    ? profile.userId.split('_')[1] 
    : profile.userId.split('@')[0] || 'Utente'

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        
        {/* Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {getGreeting()}, {userName}
            </h1>
            <span className="text-2xl">{getStreakEmoji(profile.streakCount)}</span>
          </div>
          <p className="text-lg text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: it })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Corsi Attivi"
            value={coursesInProgress.length}
            subtitle="In corso di completamento"
            icon={BookOpen}
            trend={{ value: "+2 questa settimana", positive: true }}
          />
          <StatsCard
            title="Completati"
            value={completedCourses.length}
            subtitle="Corsi terminati con successo"
            icon={GraduationCap}
            trend={{ value: "+1 questo mese", positive: true }}
          />
          <StatsCard
            title="Achievement"
            value={earnedBadges.length}
            subtitle="Badge sbloccati"
            icon={Award}
          />
          <StatsCard
            title="Streak"
            value={`${profile.streakCount} giorni`}
            subtitle="Consecutivi di attività"
            icon={Flame}
            className="bg-gradient-to-br from-orange-50 to-red-50"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* New Courses Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">Nuovi Corsi</h2>
                  <p className="text-muted-foreground">
                    Scopri i corsi appena aggiunti alla piattaforma
                  </p>
                </div>
                <Button variant="outline" className="font-medium" asChild>
                  <Link href="/library">
                    Esplora tutto
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {availableCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {availableCourses.slice(0, 4).map((course) => (
                    <CourseCard key={course.id} course={course} isEnrolled={false} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="py-12 text-center">
                    <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tutto aggiornato!</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Non ci sono nuovi corsi al momento. Controlla più tardi per nuovi contenuti.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* My Courses Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">I Miei Corsi</h2>
                  <p className="text-muted-foreground">
                    Continua il tuo percorso di apprendimento
                  </p>
                </div>
                <Button variant="outline" className="font-medium" asChild>
                  <Link href="/courses">
                    Gestisci corsi
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {inProgressCourses.length > 0 || completedCoursesData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[...inProgressCourses, ...completedCoursesData]
                    .slice(0, 4)
                    .map((course) => (
                      <CourseCard key={course.id} course={course} isEnrolled={true} />
                    ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Inizia il tuo percorso</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      Non sei ancora iscritto a nessun corso. Esplora la nostra libreria per iniziare!
                    </p>
                    <Button asChild>
                      <Link href="/library">
                        Esplora corsi
                        <BookOpen className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            
            {/* Profile Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                    <AvatarImage src={profile.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{userName}</h3>
                    {profile.jobTitle && (
                      <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium">{profile.points}</span>
                      </div>
                      {profile.department && (
                        <span className="text-muted-foreground">{profile.department}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <ModernCalendar />

            {/* Progress Overview */}
            <ProgressOverview coursesInProgress={coursesInProgress} />

            {/* Achievements */}
            <AchievementCard badges={earnedBadges} />

          </div>
        </div>
      </div>
    </div>
  )
}