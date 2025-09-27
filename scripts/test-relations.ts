// scripts/test-relations.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function testRelations() {
  try {
    console.log('🔍 Test delle relazioni UserProfile -> Company...')

    // Prendi tutti i profili con la company collegata
    const profiles = await db.userProfile.findMany({
      include: {
        company: true
      }
    })

    console.log('📊 Profili trovati con company:')
    profiles.forEach(profile => {
      console.log(`  - UserProfile ID: ${profile.id}`)
      console.log(`  - User ID: ${profile.userId}`)
      console.log(`  - Company ID (FK): ${profile.companyId}`)
      console.log(`  - Company Name (via relation): "${profile.company.name}"`)
      console.log(`  - Company Logo: ${profile.company.logoUrl}`)
      console.log('  ---')
    })

    // Controlla anche direttamente la tabella Company
    console.log('📊 Tabella Company diretta:')
    const companies = await db.company.findMany()
    companies.forEach(company => {
      console.log(`  - Company ID: ${company.id}`)
      console.log(`  - Company Name: "${company.name}"`)
      console.log(`  - Clerk Org ID: ${company.clerkOrgId}`)
      console.log('  ---')
    })

  } catch (error) {
    console.error('❌ Errore durante il test:', error)
  } finally {
    await db.$disconnect()
  }
}

// Esegui il test
testRelations()