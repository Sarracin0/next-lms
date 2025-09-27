// scripts/debug-logo.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function debugLogo() {
  try {
    console.log('🔍 Debug del logo...')

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY non trovata')
    }

    const companies = await db.company.findMany({
      select: {
        id: true,
        clerkOrgId: true,
        name: true,
        logoUrl: true,
        updatedAt: true,
      },
    })

    for (const company of companies) {
      console.log('📊 Company nel DB:')
      console.log(`  - Nome: "${company.name}"`)
      console.log(`  - Logo URL: ${company.logoUrl}`)
      console.log(`  - Ultimo aggiornamento: ${company.updatedAt}`)

      // Ottieni i dati da Clerk
      const response = await fetch(`https://api.clerk.com/v1/organizations/${company.clerkOrgId}`, {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const clerkOrg = await response.json()
        
        console.log('📊 Dati Clerk:')
        console.log(`  - Nome: "${clerkOrg.name}"`)
        console.log(`  - Image URL: ${clerkOrg.image_url}`)
        console.log(`  - Has custom image: ${clerkOrg.has_image}`)
        
        // Verifica se serve aggiornare
        const needsUpdate = company.name !== clerkOrg.name || company.logoUrl !== clerkOrg.image_url
        console.log(`🔄 Serve aggiornamento: ${needsUpdate}`)
        
        if (needsUpdate) {
          console.log('🔧 Aggiornando...')
          const updated = await db.company.update({
            where: { id: company.id },
            data: {
              name: clerkOrg.name,
              logoUrl: clerkOrg.image_url || null,
            },
          })
          console.log(`✅ Aggiornato: nome="${updated.name}", logo="${updated.logoUrl}"`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await db.$disconnect()
  }
}

debugLogo()