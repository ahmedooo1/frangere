import Parser from 'rss-parser'

export interface FeedItem {
  guid: string
  title: string
  link: string
  content: string
  isoDate?: string
}

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'FrangereBot/1.0 (+https://frangere.fr)' }
})

/**
 * Mock feed items used as a safety net when a real feed URL is unreachable
 * (offline dev environment, network restrictions, etc.) so the pipeline
 * always has something to process end-to-end.
 */
export function getMockFeedItems(sourceName: string): FeedItem[] {
  const now = new Date().toISOString()
  return [
    {
      guid: `mock-${sourceName}-titre-de-sejour-renouvellement`,
      title: 'Renouvellement du titre de séjour : ce qui change',
      link: 'https://www.service-public.fr/particuliers/vosdroits/exemple-1',
      content:
        "À compter de cette année, la demande de renouvellement du titre de séjour peut être effectuée en ligne via l'ANEF, entre 4 et 2 mois avant l'expiration du titre actuel. Un récépissé est délivré automatiquement pendant l'instruction du dossier, permettant de continuer à travailler et voyager dans l'espace Schengen.",
      isoDate: now
    },
    {
      guid: `mock-${sourceName}-caf-apl-2026`,
      title: 'Aide personnalisée au logement (APL) : revalorisation 2026',
      link: 'https://www.caf.fr/allocataires/exemple-2',
      content:
        "Les montants de l'aide personnalisée au logement (APL) sont revalorisés à partir du 1er octobre. La simulation en ligne permet d'estimer le nouveau montant avant de déposer une demande sur le site de la CAF.",
      isoDate: now
    },
    {
      guid: `mock-${sourceName}-ameli-carte-vitale`,
      title: 'Carte Vitale : comment l’obtenir après une première affiliation',
      link: 'https://www.ameli.fr/assure/exemple-3',
      content:
        "Après votre première affiliation à l'Assurance Maladie, une carte Vitale provisoire (attestation) vous est remise. La carte physique définitive est envoyée par courrier sous quelques semaines. Elle doit être mise à jour dans les bornes en pharmacie au moins une fois par an.",
      isoDate: now
    }
  ]
}

export async function fetchFeedItems(url: string, sourceName: string): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url)
    return (feed.items || []).map((item) => ({
      guid: item.guid || item.link || `${sourceName}-${item.title}`,
      title: item.title || 'Sans titre',
      link: item.link || url,
      content: (item as any).contentSnippet || item.content || item.title || '',
      isoDate: item.isoDate
    }))
  } catch (err) {
    console.warn(`[rss] Failed to fetch "${sourceName}" (${url}), using mock items:`, (err as Error).message)
    return getMockFeedItems(sourceName)
  }
}
