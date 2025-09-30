# Course Builder Refactor - Nuova Struttura Gerarchica

## Panoramica

Il processo di creazione corsi è stato completamente refactorizzato per essere più snello e intuitivo, ispirato alla struttura di Moodle con una gerarchia: **Course → Module → Lesson → Blocks**.

## Struttura Database

### Nuova Gerarchia
```
Course
├── CourseModule (nuovo)
│   ├── Lesson (nuovo)
│   │   ├── LessonBlock (nuovo)
│   │   │   └── LessonBlockAttachment (nuovo)
│   │   └── UserLessonProgress (nuovo)
│   └── ...
└── ...
```

### Modelli Aggiunti

1. **CourseModule**: Raggruppa lezioni correlate
   - `id`, `courseId`, `title`, `description`, `position`, `isPublished`

2. **Lesson**: Unità di apprendimento individuali
   - `id`, `moduleId`, `title`, `description`, `position`, `estimatedDurationMinutes`, `isPublished`, `isPreview`

3. **LessonBlock**: Contenuti specifici all'interno di una lezione
   - `id`, `lessonId`, `type` (VIDEO_LESSON | RESOURCES), `title`, `content`, `videoUrl`, `contentUrl`, `position`, `isPublished`

4. **LessonBlockAttachment**: Allegati per i blocchi
   - `id`, `blockId`, `name`, `url`, `type`

5. **UserLessonProgress**: Progresso utente per lezioni
   - `id`, `userProfileId`, `lessonId`, `isCompleted`, `completedAt`, `pointsAwarded`

## Componenti UI

### 1. CourseBuilderWizard (Refactorizzato)
- **File**: `course-builder-wizard.tsx`
- **Funzione**: Wizard principale con 4 step (basics, curriculum, resources, launch)
- **Nuovo**: Integra `CurriculumManager` per la gestione della struttura gerarchica

### 2. CurriculumManager (Nuovo)
- **File**: `curriculum-manager.tsx`
- **Funzione**: Gestisce l'intera struttura moduli → lezioni → blocchi
- **Caratteristiche**:
  - Aggiunta moduli con titolo
  - Gestione accordion per moduli e lezioni
  - Aggiunta lezioni ai moduli
  - Aggiunta blocchi (Video/Resources) alle lezioni

### 3. ModuleAccordion (Nuovo)
- **File**: `module-accordion.tsx`
- **Funzione**: Componente accordion per singolo modulo
- **Caratteristiche**:
  - Editing inline per titoli e descrizioni
  - Gestione lezioni annidate
  - Gestione blocchi di contenuto
  - Azioni di aggiunta/eliminazione

## Flusso Utente

### 1. Creazione Corso (Invariato)
- L'utente inserisce nome e descrizione del corso nella sezione `/create`

### 2. Curriculum & Lessons (Completamente Rinnovato)
- **Aggiunta Modulo**: L'utente clicca "Create Module" e inserisce il nome
- **Gestione Modulo**: 
  - Click sul titolo per editare inline
  - Accordion per espandere/contrarre
  - Badge per stato (Published/Draft) e conteggio lezioni
- **Aggiunta Lezione**: Click su "+" nel modulo per aggiungere una lezione
- **Gestione Lezione**:
  - Click sul titolo per editare inline
  - Accordion annidato per espandere/contrarre
  - Badge per stato e conteggio blocchi
- **Aggiunta Blocchi**: 
  - Due pulsanti "+" per Video Lesson e Resources
  - Editing inline per contenuti
  - Gestione URL video e risorse

### 3. Struttura Accordion
```
📁 Module 1 (Accordion)
├── 📖 Lesson 1 (Accordion annidato)
│   ├── 🎥 Video Lesson Block
│   └── 📄 Resources Block
└── 📖 Lesson 2 (Accordion annidato)
    └── 🎥 Video Lesson Block
```

## Vantaggi della Nuova Struttura

### 1. **Organizzazione Migliore**
- Struttura gerarchica chiara: Moduli → Lezioni → Contenuti
- Facile navigazione con accordion
- Visualizzazione immediata della struttura

### 2. **UX Migliorata**
- Editing inline senza modali
- Azioni contestuali con pulsanti "+"
- Feedback visivo con badge e contatori
- Drag & drop ready (per future implementazioni)

### 3. **Flessibilità Contenuti**
- Supporto per diversi tipi di blocchi (Video, Resources)
- Facile aggiunta di nuovi tipi di contenuto
- Gestione separata di allegati per blocco

### 4. **Scalabilità**
- Struttura database ottimizzata per grandi corsi
- Relazioni ben definite
- Supporto per progresso utente granulare

## Migrazione Database

### File di Migrazione
- **File**: `prisma/migrations/20250115000000_course_modules_lessons_blocks/migration.sql`
- **Contenuto**: 
  - Creazione tabelle per la nuova struttura
  - Enum per BlockType
  - Indici per performance
  - Foreign keys per integrità

### Schema Prisma Aggiornato
- Aggiunto enum `BlockType`
- Aggiunto modello `CourseModule` con relazione a `Course`
- Aggiunto modello `Lesson` con relazione a `CourseModule`
- Aggiunto modello `LessonBlock` con relazione a `Lesson`
- Aggiunto modello `LessonBlockAttachment` con relazione a `LessonBlock`
- Aggiunto modello `UserLessonProgress` con relazioni a `UserProfile` e `Lesson`

## Componenti UI Aggiunti

### Accordion Component
- **File**: `components/ui/accordion.tsx`
- **Dipendenze**: `@radix-ui/react-accordion`
- **Animazioni**: Configurate in `tailwind.config.ts` e `globals.css`

## Note Tecniche

### State Management
- Stato locale con `useState` per moduli
- Props drilling per gestione eventi
- Futuro: Context API per gestione stato complessa

### Performance
- Rendering condizionale per accordion
- Lazy loading per contenuti pesanti (futuro)
- Memoizzazione per componenti complessi (futuro)

### Accessibilità
- Supporto keyboard navigation
- ARIA labels per screen readers
- Focus management per editing inline

## Persistenza e API

### Flusso Dati
1. **Client (CurriculumManager/ModuleAccordion)** aggiorna lo stato locale e chiama le API via `axios`.
2. **API Next.js** in `app/api/courses/[courseId]/modules/**` validano ruolo, proprietà del corso e orchestrano le mutazioni Prisma.
3. **Bridge legacy** sincronizza i blocchi video con la tabella `Chapter` per mantenere compatibile l'esperienza learner esistente.
4. **Learner UI** continua a leggere i `Chapter` pubblicati, trovando i dati duplicati automaticamente.

### Endpoints Principali
- `POST /api/courses/[courseId]/modules`
- `PATCH /api/courses/[courseId]/modules/[moduleId]`
- `DELETE /api/courses/[courseId]/modules/[moduleId]`
- `POST /api/courses/[courseId]/modules/[moduleId]/lessons`
- `PATCH /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]`
- `DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]`
- `POST /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/blocks`
- `PATCH /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/blocks/[blockId]`
- `DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/blocks/[blockId]`

Tutte richiedono ruolo `HR_ADMIN` o `TRAINER` e verificano che il trainer sia autore del corso.

### Bridge Legacy → Chapter
- **Schema**: campo opzionale `legacyChapterId` su `LessonBlock` (migrazione `20250116000000_sync_lesson_blocks_to_chapters`).
- **Helpers**: `lib/sync-legacy-chapter.ts` sincronizza singolo blocco, lezione, modulo o corso.
- **Trigger automatici**: ogni mutazione dei blocchi video e dei flag `isPublished` invoca la sincronizzazione.
- **Script di backfill**: `scripts/sync-legacy-chapters.ts` popola i capitoli esistenti.
- **Comandi operativi**:
  - `npx prisma migrate deploy`
  - `npx prisma generate`
  - `pnpm tsx scripts/sync-legacy-chapters.ts`
- **Logica publish**: un capitolo è pubblicato solo se corso, modulo, lezione e blocco sono tutti `isPublished = true`. I toggle UI propagano il valore tramite `PATCH`.

## Prossimi Passi

1. **Implementazione API**: Creare endpoint per CRUD operations
2. **Persistenza**: Integrare con database per salvataggio
3. **Validazione**: Aggiungere validazione form e business logic
4. **Drag & Drop**: Implementare riordinamento moduli/lezioni
5. **Preview**: Aggiungere anteprima corso per studenti
6. **Analytics**: Integrare tracking progresso utente

## Conclusione

La nuova struttura offre un'esperienza molto più intuitiva e organizzata per la creazione di corsi, eliminando la complessità dell'interfaccia precedente e fornendo una base solida per future espansioni.
