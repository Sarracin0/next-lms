import 'dotenv/config'
import { createClerkClient } from '@clerk/backend'
import { PrismaClient, UserRole } from '@prisma/client'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
const db = new PrismaClient()

const KIMPY_ORG_ID = 'org_33ExTkBBCUxlIl8397cUQAB8eU3'

const clerkRoleMap: Record<string, UserRole> = {
  admin: UserRole.HR_ADMIN,
  owner: UserRole.HR_ADMIN,
  'org:admin': UserRole.HR_ADMIN, // Admin dell'organizzazione
  manager: UserRole.TRAINER,
  basic_member: UserRole.LEARNER,
  'org:member': UserRole.LEARNER, // Default role per i membri
}

function mapClerkRoleToUserRole(role?: string | null): UserRole {
  if (!role) return UserRole.LEARNER
  return clerkRoleMap[role] ?? UserRole.LEARNER
}

async function syncClerkUsersToDatabase() {
  try {
    console.log('🔄 Sincronizzazione utenti Clerk con database locale...\n')

    // 1. Ottieni la company dal database
    let company = await db.company.findUnique({ 
      where: { clerkOrgId: KIMPY_ORG_ID } 
    })

    if (!company) {
      console.log('❌ Company non trovata nel database. Assicurati che almeno un admin abbia fatto login.')
      return
    }

    console.log(`✅ Company trovata: ${company.name} (ID: ${company.id})\n`)

    // 2. Ottieni tutti i membri dell'organizzazione da Clerk
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId: KIMPY_ORG_ID,
      limit: 100
    })

    console.log(`📋 Trovati ${memberships.totalCount} membri nell'organizzazione Clerk\n`)

    // 3. Per ogni membro, crea o aggiorna il profilo nel database
    for (const membership of memberships.data) {
      const userId = membership.publicUserData?.userId
      const email = membership.publicUserData?.identifier
      const firstName = membership.publicUserData?.firstName
      const lastName = membership.publicUserData?.lastName
      const imageUrl = membership.publicUserData?.imageUrl
      const role = membership.role

      if (!userId || !email) {
        console.log(`⚠️  Saltato membro senza userId o email`)
        continue
      }

      console.log(`👤 Processando: ${firstName} ${lastName} (${email})`)
      console.log(`   - Clerk Role: ${role}`)
      console.log(`   - User ID: ${userId}`)

      // Controlla se il profilo esiste già
      let profile = await db.userProfile.findUnique({ 
        where: { userId } 
      })

      const mappedRole = mapClerkRoleToUserRole(role)
      console.log(`   - Mapped Role: ${mappedRole}`)

      if (!profile) {
        // Crea nuovo profilo
        try {
          profile = await db.userProfile.create({
            data: {
              userId,
              companyId: company.id,
              role: mappedRole,
              avatarUrl: imageUrl || null,
            },
          })
          console.log(`   ✅ Profilo creato nel database`)
        } catch (error) {
          console.log(`   ❌ Errore nella creazione del profilo:`, error)
          continue
        }
      } else {
        // Aggiorna profilo esistente se necessario
        const updates: any = {}
        
        if (profile.companyId !== company.id) {
          updates.companyId = company.id
        }
        
        if (profile.role !== mappedRole) {
          updates.role = mappedRole
        }
        
        if (imageUrl && profile.avatarUrl !== imageUrl) {
          updates.avatarUrl = imageUrl
        }

        if (Object.keys(updates).length > 0) {
          await db.userProfile.update({
            where: { id: profile.id },
            data: updates,
          })
          console.log(`   🔄 Profilo aggiornato`)
        } else {
          console.log(`   ✅ Profilo già sincronizzato`)
        }
      }

      console.log('')
    }

    // 4. Mostra statistiche finali
    const totalProfiles = await db.userProfile.count({
      where: { companyId: company.id }
    })

    const profilesByRole = await db.userProfile.groupBy({
      by: ['role'],
      where: { companyId: company.id },
      _count: { role: true }
    })

    console.log('📊 STATISTICHE FINALI:')
    console.log(`   - Totale profili nel database: ${totalProfiles}`)
    profilesByRole.forEach(group => {
      console.log(`   - ${group.role}: ${group._count.role}`)
    })

    console.log('\n✨ Sincronizzazione completata!')

  } catch (error) {
    console.error('❌ Errore durante la sincronizzazione:', error)
  } finally {
    await db.$disconnect()
  }
}

syncClerkUsersToDatabase().catch(console.error)