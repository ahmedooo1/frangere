import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { key: 'IMMIGRATION' as const, labelFr: 'Immigration & Séjour', labelAr: 'الإقامة والهجرة' },
  { key: 'HOUSING' as const, labelFr: 'Logement', labelAr: 'السكن' },
  { key: 'HEALTH' as const, labelFr: 'Santé', labelAr: 'الصحة' },
  { key: 'EMPLOYMENT' as const, labelFr: 'Emploi', labelAr: 'العمل' }
]

const feedSources = [
  {
    name: 'Service-Public.fr — Particuliers',
    organization: 'Direction de l\'information légale et administrative',
    url: 'https://www.service-public.fr/particuliers/actualites/rss'
  },
  {
    name: 'CAF — Actualités allocataires',
    organization: 'Caisse d\'Allocations Familiales',
    url: 'https://www.caf.fr/actualites/rss.xml'
  },
  {
    name: 'Ameli — Actualités Assurance Maladie',
    organization: 'Assurance Maladie',
    url: 'https://www.ameli.fr/rss/actualites.rss'
  },
  {
    name: 'France Travail — Actualités',
    organization: 'France Travail (ex Pôle emploi)',
    url: 'https://www.francetravail.fr/actualites/rss.xml'
  },
  {
    name: 'Service-Public.fr — Droit des étrangers',
    organization: 'Direction de l\'information légale et administrative',
    url: 'https://www.service-public.fr/particuliers/actualites/droit-etrangers/rss'
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
      update: { name: f.name, organization: f.organization },
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
