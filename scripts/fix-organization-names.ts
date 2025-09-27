// scripts/fix-organization-names.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function fixOrganizationNames() {
  try {
    console.log('🔄 Iniziando la migrazione dei nomi delle organizzazioni...')

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY non trovata nelle variabili d\'ambiente. Assicurati di avere il file .env con CLERK_SECRET_KEY configurata.')
    }

    // Ottieni tutte le company dal database
    const companies = await db.company.findMany({
      select: {
        id: true,
        clerkOrgId: true,
        name: true,
      },
    })

    console.log(`📊 Trovate ${companies.length} company nel database`)

    for (const company of companies) {
      try {
        console.log(`🔍 Verificando organizzazione: ${company.name} (ID: ${company.clerkOrgId})`)
        
        // Ottieni i dati aggiornati da Clerk usando l'API REST
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

        // Controlla se il nome è diverso
        if (clerkOrg.name !== company.name) {
          console.log(`🔧 Aggiornando "${company.name}" -> "${clerkOrg.name}"`)

          const updatedCompany = await db.company.update({
            where: { id: company.id },
            data: {
              name: clerkOrg.name,
              logoUrl: clerkOrg.image_url || null,
            },
          })

          console.log(`✅ Company ${company.id} aggiornata con successo`)
          console.log(`✅ Nuovo nome nel DB: "${updatedCompany.name}"`)
          
          // Verifica immediata che l'aggiornamento sia avvenuto
          const verification = await db.company.findUnique({
            where: { id: company.id },
            select: { name: true }
          })
          console.log(`🔍 Verifica DB immediata: "${verification?.name}"`)
          
        } else {
          console.log(`✅ Company "${company.name}" già aggiornata`)
        }
      } catch (orgError) {
        console.error(`❌ Errore nell'aggiornare la company ${company.id}:`, orgError)
      }
    }

    console.log('🎉 Migrazione completata!')
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error)
  } finally {
    await db.$disconnect()
  }
}

// Esegui la migrazione
fixOrganizationNames()