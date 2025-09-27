// scripts/debug-clerk-data.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function debugClerkData() {
  try {
    console.log('🔍 Debug dei dati Clerk e Database...')

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY non trovata nelle variabili d\'ambiente')
    }

    // Controlla i dati nel database
    const companies = await db.company.findMany({
      select: {
        id: true,
        clerkOrgId: true,
        name: true,
        slug: true,
        logoUrl: true,
        updatedAt: true,
      },
    })

    console.log('📊 Dati nel DATABASE:')
    companies.forEach(company => {
      console.log(`  - ID: ${company.id}`)
      console.log(`  - ClerkOrgId: ${company.clerkOrgId}`)
      console.log(`  - Nome: "${company.name}"`)
      console.log(`  - Slug: ${company.slug}`)
      console.log(`  - LogoUrl: ${company.logoUrl}`)
      console.log(`  - Ultimo aggiornamento: ${company.updatedAt}`)
      console.log('  ---')
    })

    // Controlla i dati in Clerk
    for (const company of companies) {
      console.log(`🔍 Controllo dati Clerk per organizzazione: ${company.clerkOrgId}`)
      
      try {
        const response = await fetch(`https://api.clerk.com/v1/organizations/${company.clerkOrgId}`, {
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const clerkOrg = await response.json()

        console.log('📊 Dati in CLERK:')
        console.log(`  - ID: ${clerkOrg.id}`)
        console.log(`  - Nome: "${clerkOrg.name}"`)
        console.log(`  - Slug: ${clerkOrg.slug}`)
        console.log(`  - Image URL: ${clerkOrg.image_url}`)
        console.log(`  - Created at: ${clerkOrg.created_at}`)
        console.log(`  - Updated at: ${clerkOrg.updated_at}`)
        
        // Confronta i dati
        console.log('🔄 CONFRONTO:')
        console.log(`  - Nome DB vs Clerk: "${company.name}" vs "${clerkOrg.name}" ${company.name === clerkOrg.name ? '✅' : '❌'}`)
        console.log(`  - Logo DB vs Clerk: "${company.logoUrl}" vs "${clerkOrg.image_url}" ${company.logoUrl === clerkOrg.image_url ? '✅' : '❌'}`)
        
      } catch (orgError) {
        console.error(`❌ Errore nel recuperare dati Clerk per ${company.clerkOrgId}:`, orgError)
      }
    }

  } catch (error) {
    console.error('❌ Errore durante il debug:', error)
  } finally {
    await db.$disconnect()
  }
}

// Esegui il debug
debugClerkData()