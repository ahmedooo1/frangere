import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { key: 'IMMIGRATION' as const, labelFr: 'Immigration & Séjour', labelAr: 'الإقامة والهجرة' },
  { key: 'HOUSING' as const, labelFr: 'Logement', labelAr: 'السكن' },
  { key: 'HEALTH' as const, labelFr: 'Santé', labelAr: 'الصحة' },
  { key: 'EMPLOYMENT' as const, labelFr: 'Emploi', labelAr: 'العمل' },
  { key: 'COST_OF_LIVING' as const, labelFr: 'Coût de la vie', labelAr: 'غلاء المعيشة' },
  { key: 'LAWS' as const, labelFr: 'Lois & réglementation', labelAr: 'القوانين والتشريعات' }
]

const feedSources = [
  {
    name: 'Service-Public.fr - Particuliers',
    organization: 'Direction de l\'information légale et administrative',
    url: 'https://www.service-public.gouv.fr/abonnements/rss/actu-actualites-particuliers.rss',
    isActive: true
  },
  // Broad-scope ministry feed (transport, écologie, industrie, etc. alongside
  // logement) - low relevance yield, but the AI filter + RejectedItem dedup
  // mean it costs nothing to leave running for the occasional housing item.
  {
    name: 'Ministère de la Transition écologique et du Logement',
    organization: 'Ministères Transition écologique, Aménagement du Territoire, Transports, Ville et Logement',
    url: 'https://ecologie.gouv.fr/rss-actualites.xml',
    isActive: true
  },
  // Verified 2026-08-22: real, working RSS feed. Mainly feeds COST_OF_LIVING
  // (taxes, prices, financial aid) and occasionally LAWS.
  {
    name: 'Ministère de l\'Économie et des Finances',
    organization: 'Ministère de l\'Économie, des Finances et de la Souveraineté industrielle et numérique',
    url: 'https://www.economie.gouv.fr/rss/toutesactualites',
    isActive: true
  },
  // These organizations no longer publish a public RSS feed (verified 2026-08-14 -
  // all return 404). Kept inactive rather than removed so they're easy to
  // re-enable if they add one back; the pipeline skips inactive sources entirely,
  // so no mock/placeholder content is generated in their place.
  {
    name: 'CAF - Actualités allocataires',
    organization: 'Caisse d\'Allocations Familiales',
    url: 'https://www.caf.fr/actualites/rss.xml',
    isActive: false
  },
  {
    name: 'Ameli - Actualités Assurance Maladie',
    organization: 'Assurance Maladie',
    url: 'https://www.ameli.fr/rss/actualites.rss',
    isActive: false
  },
  {
    name: 'France Travail - Actualités',
    organization: 'France Travail (ex Pôle emploi)',
    url: 'https://www.francetravail.fr/actualites/rss.xml',
    isActive: false
  }
]

async function main() {
  console.log('Seeding categories...')
  for (const c of categories) {
    await prisma.category.upsert({
      where: { key: c.key },
      update: { labelFr: c.labelFr, labelAr: c.labelAr },
      create: c
    })
  }

  console.log('Seeding default feed sources...')
  for (const f of feedSources) {
    await prisma.feedSource.upsert({
      where: { url: f.url },
      update: { name: f.name, organization: f.organization, isActive: f.isActive },
      create: f
    })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
