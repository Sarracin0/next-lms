# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Start Next.js development server on port 3000
- **Build**: `npm run build` - Create production build
- **Production start**: `npm start` - Start production server
- **Linting**: `npm run lint` - Run ESLint
- **Database**: `npx prisma generate` - Generate Prisma client (runs automatically after install)

## Project Architecture

### Tech Stack
- **Framework**: Next.js 15.3.2 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (B2B multi-tenant setup)
- **UI**: Radix UI components with Tailwind CSS and shadcn/ui
- **File Upload**: UploadThing for video/document uploads
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation

### Database Architecture

The application uses a comprehensive multi-tenant LMS structure with gamification features:

**Core Entities:**
- `Company` - Multi-tenant organization model (linked to Clerk orgId)
- `UserProfile` - Extended user data with company context and role-based permissions
- `Course` → `Chapter` structure for content organization
- `CourseModule` → `Lesson` → `LessonBlock` hierarchical structure (new course builder)

**User Roles:**
- `HR_ADMIN` - Company administration and user management
- `TRAINER` - Course creation and management
- `LEARNER` - Course consumption

**Gamification System:**
- `UserPoints` with different point types (completion, streak, bonus, quest, manual)
- `Badge` system with company-specific and global badges
- `Quest` and `QuestMission` for guided learning paths
- `Leaderboard` with company/team/global scopes
- `CompanyTeam` structure with team-based assignments and competitions

### Directory Structure

**App Directory (`app/`):**
- Route groups: `(auth)`, `(course)`, `(dashboard)`
- API routes in `api/` for server actions
- Global styles in `globals.css`

**Core Directories:**
- `components/` - Reusable UI components with shadcn/ui base
- `lib/` - Utilities (db connection, formatters, auth helpers)
- `actions/` - Server actions for data fetching
- `hooks/` - Custom React hooks
- `prisma/` - Database schema and migrations

**Key Files:**
- `lib/current-profile.ts` - Authentication and profile management
- `lib/db.ts` - Prisma client setup
- `middleware.ts` - Clerk authentication middleware

### Course Content System

The application supports two content structures:
1. **Legacy**: Course → Chapter (for backward compatibility)
2. **New**: Course → Module → Lesson → Block (hierarchical course builder)

Block types include `VIDEO_LESSON` and `RESOURCES` with support for attachments.

### Multi-Tenant Features

- Company-scoped content and users
- Team-based course assignments
- Company-specific badges and leaderboards
- Role-based permissions within company context

### Development Notes

- Uses TypeScript throughout
- Prettier with Tailwind plugin for code formatting
- PostgreSQL database (configured via DATABASE_URL)
- Image domains configured for utfs.io and img.clerk.com
- No payment system (removed Stripe/Mux for MVP approach)