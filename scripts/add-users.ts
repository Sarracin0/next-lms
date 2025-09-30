import 'dotenv/config'; // ← Aggiungi questa riga
import { createClerkClient } from '@clerk/backend';

// Inizializza il client Clerk con la secret key
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const newUsers = [
  { email: 'samuele@kimpy.it', firstName: 'Samuele', lastName: 'Scarpella' },
  { email: 'fabio@kimpy.it', firstName: 'Fabio', lastName: 'Croci' },
  { email: 'valentina@kimpy.it', firstName: 'Valentina', lastName: 'Messineo' }
];

const KIMPY_ORG_ID = 'org_33ExTkBBCUxlIl8397cUQAB8eU3'; // Metti l'ID completo dalla dashboard

async function addUsersToKimpy() {
  console.log('🚀 Creazione utenti su Clerk...\n');
  console.log(`🔑 CLERK_SECRET_KEY presente: ${process.env.CLERK_SECRET_KEY ? '✅ Sì' : '❌ No'}\n`);
  
  for (const userData of newUsers) {
    try {
      // 1. Crea l'utente su Clerk
      const user = await clerk.users.createUser({
        emailAddress: [userData.email],
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: 'Kimpy2025!',
        skipPasswordChecks: true,
      });

      console.log(`✅ Utente creato: ${userData.firstName} ${userData.lastName}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${userData.email}`);

      // 2. Aggiungi l'utente all'organizzazione Kimpy
      const membership = await clerk.organizations.createOrganizationMembership({
        organizationId: KIMPY_ORG_ID,
        userId: user.id,
        role: 'org:member',
      });

      console.log(`   ✅ Aggiunto a Kimpy con ruolo: ${membership.role}\n`);
      
    } catch (error: any) {
      if (error.errors?.[0]?.code === 'form_identifier_exists') {
        console.log(`⚠️  L'utente ${userData.email} esiste già\n`);
      } else {
        console.error(`❌ Errore per ${userData.email}:`, error.message);
        console.error('   Dettagli:', error.errors || error, '\n');
      }
    }
  }
  
  console.log('✨ Processo completato!');
  console.log('\n📧 Gli utenti riceveranno un\'email per verificare l\'account.');
  console.log('🔑 Password temporanea: Kimpy2025!');
}

addUsersToKimpy().catch(console.error);