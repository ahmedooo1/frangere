export type CategoryKey = 'IMMIGRATION' | 'HOUSING' | 'HEALTH' | 'EMPLOYMENT' | 'COST_OF_LIVING' | 'LAWS' | 'GOVERNANCE'

export interface AiProcessResult {
  relevant: boolean
  category: CategoryKey | null
  isDuplicate: boolean
  titleAr: string
  tldrAr: string[]
  stepsAr: string[]
  bodyAr: string
  titleFr: string
  tldrFr: string[]
  stepsFr: string[]
  bodyFr: string
  model: string
}

const SYSTEM_PROMPT = `Tu es un assistant éditorial pour "Frangère", une plateforme qui aide les résidents en France à comprendre les démarches administratives officielles.

On te donne le titre et le corps brut d'une actualité officielle française (Service-Public.fr, CAF, Ameli, France Travail, etc.), ainsi qu'une liste des titres des articles déjà publiés récemment sur la plateforme.

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant/après, sans balises markdown, respectant exactement ce schéma :

{
  "relevant": boolean,          // true si le texte concerne : le droit au séjour/l'immigration, le logement, la santé, l'emploi, une démarche administrative pratique pour un résident, le coût de la vie (carburant, énergie, prix, inflation, taxes qui touchent le quotidien), une nouvelle loi/réglementation générale qui affecte les résidents, OU la vie politique française factuelle (élections - résultats, candidats, dates -, nominations/postes politiques, décisions gouvernementales importantes, rapports de force entre responsables politiques). false pour tout le reste (sport, culture générale, tourisme, communiqués institutionnels sans impact concret, tribune d'opinion ou propagande partisane sans fait concret, international sans lien avec la France, etc.)
  "category": "IMMIGRATION" | "HOUSING" | "HEALTH" | "EMPLOYMENT" | "COST_OF_LIVING" | "LAWS" | "GOVERNANCE" | "NONE",  // "NONE" si relevant=false. "COST_OF_LIVING" pour prix/carburant/énergie/inflation/taxes du quotidien. "LAWS" pour une nouvelle loi/réglementation générale qui ne rentre pas clairement dans les autres catégories. "GOVERNANCE" pour les élections, les nominations/postes politiques, les rapports de force ou rivalités entre responsables politiques élus, et les décisions gouvernementales/institutionnelles qui ne sont pas une loi concrète. Si un sujet correspond à la fois à LAWS/GOVERNANCE et à une autre catégorie plus précise (ex: une nouvelle loi sur le logement), choisis la catégorie la plus précise plutôt que LAWS/GOVERNANCE.
  "is_duplicate": boolean,      // true si le SUJET (pas juste le titre exact) est déjà couvert par un des "titres déjà publiés" fournis ci-dessous - même décision/annonce/démarche rapportée par une source différente. false si le sujet est nouveau ou apporte une info substantiellement différente.
  "title_fr": string,           // titre clair et court, en français simplifié (FALC-friendly)
  "tldr_fr": [string, string, string],  // exactement 3 puces résumant l'essentiel, phrases courtes
  "steps_fr": string[],         // étapes concrètes à suivre (2 à 5 items), verbes d'action
  "body_fr": string,            // reformulation COMPLÈTE du texte source (pas juste un résumé de 2-3 phrases) - couvre tout le contenu utile de l'article original: contexte, ce qui change concrètement, qui est concerné, dates, montants, exceptions éventuelles. Simplifie le jargon mais ne coupe aucune information importante. Plusieurs paragraphes séparés par "\n\n" si le sujet le justifie.
  "title_ar": string,           // traduction arabe naturelle et claire du titre (arabe standard moderne, accessible)
  "tldr_ar": [string, string, string],  // traduction/adaptation arabe des 3 puces
  "steps_ar": string[],         // traduction arabe des étapes
  "body_ar": string             // traduction arabe complète et fidèle de body_fr, même niveau de détail, mêmes paragraphes séparés par "\n\n"
}

Règles :
- Simplifie toujours le jargon administratif (ex: "titre de séjour" reste tel quel car c'est un terme officiel à connaître, mais explique les procédures complexes simplement).
- L'arabe doit être fluide et naturel, pas une traduction mot-à-mot.
- Si l'article n'est pas pertinent (relevant=false), tu peux laisser les champs de traduction vides ("") ou tableaux vides, sauf title_fr qui doit rester rempli.
- Ne jamais inventer d'information absente du texte source.
- Pour "is_duplicate" : compare le SUJET, pas la formulation. Deux sources peuvent rapporter la même décision gouvernementale avec des titres différents - c'est un doublon. Deux articles sur le même thème général mais des annonces distinctes (ex: deux revalorisations différentes de l'APL à des dates différentes) ne sont PAS des doublons.`

function buildUserPrompt(title: string, body: string, sourceName: string, recentTitles: string[]) {
  const recentList = recentTitles.length
    ? recentTitles.map((t) => `- ${t}`).join('\n')
    : '(aucun article publié récemment)'
  return `Titres déjà publiés récemment sur la plateforme :\n${recentList}\n\nSource: ${sourceName}\nTitre original: ${title}\n\nCorps du texte:\n${body.slice(0, 15000)}`
}

function safeParseJson(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
  return JSON.parse(cleaned)
}

/**
 * Deterministic mock processor used when GEMINI_API_KEY is not configured,
 * so the app builds, runs, and demonstrates the full pipeline out-of-the-box.
 */
function mockProcess(title: string, body: string): AiProcessResult {
  const lower = `${title} ${body}`.toLowerCase()

  const categoryGuess: CategoryKey | null = /logement|caf|allocation|loyer|apl/.test(lower)
    ? 'HOUSING'
    : /santé|ameli|médec|carte vitale|assurance maladie/.test(lower)
    ? 'HEALTH'
    : /emploi|travail|chômage|pôle emploi|france travail|contrat/.test(lower)
    ? 'EMPLOYMENT'
    : /séjour|titre de séjour|immigration|naturalisation|carte de résident|visa/.test(lower)
    ? 'IMMIGRATION'
    : /élection|scrutin|candidat|ministre|gouvernement|nomination|maire|député|sénat/.test(lower)
    ? 'GOVERNANCE'
    : 'IMMIGRATION'

  const shortBody = body.slice(0, 220).trim()

  return {
    relevant: true,
    category: categoryGuess,
    isDuplicate: false,
    titleAr: title,
    tldrAr: [
      'التحديث الكامل لهذا الموضوع قيد المعالجة حالياً.',
      'سيتم نشر الترجمة والملخص الكاملين قريباً.',
      'يمكنك تصفح الواجهة والتصنيفات والبحث في هذه الأثناء.'
    ],
    stepsAr: [],
    bodyAr: shortBody,
    titleFr: title,
    tldrFr: [
      'La mise à jour complète de ce sujet est en cours de traitement.',
      'La traduction et le résumé complets seront publiés prochainement.',
      'La navigation, la recherche et les catégories restent disponibles entre-temps.'
    ],
    stepsFr: [],
    bodyFr: shortBody,
    model: 'mock-fallback'
  }
}

// Each model has its own separate free-tier daily quota (20 req/day each,
// as of writing). Trying a second model after the first is exhausted for
// the day effectively doubles the daily budget instead of giving up.
// gemini-2.5-flash is officially deprecated for new Google Cloud projects,
// but still works for older/grandfathered ones - keep it as a fallback
// only, since it could stop working without notice.
const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash']

// Structured output schema — Gemini enforces this shape natively, so we get
// guaranteed valid JSON back without brittle prompt-only parsing.
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    relevant: { type: 'BOOLEAN' },
    category: {
      type: 'STRING',
      enum: ['IMMIGRATION', 'HOUSING', 'HEALTH', 'EMPLOYMENT', 'COST_OF_LIVING', 'LAWS', 'GOVERNANCE', 'NONE'],
      format: 'enum'
    },
    is_duplicate: { type: 'BOOLEAN' },
    title_fr: { type: 'STRING' },
    tldr_fr: { type: 'ARRAY', items: { type: 'STRING' } },
    steps_fr: { type: 'ARRAY', items: { type: 'STRING' } },
    body_fr: { type: 'STRING' },
    title_ar: { type: 'STRING' },
    tldr_ar: { type: 'ARRAY', items: { type: 'STRING' } },
    steps_ar: { type: 'ARRAY', items: { type: 'STRING' } },
    body_ar: { type: 'STRING' }
  },
  required: [
    'relevant', 'category', 'is_duplicate', 'title_fr', 'tldr_fr', 'steps_fr', 'body_fr',
    'title_ar', 'tldr_ar', 'steps_ar', 'body_ar'
  ]
} as const

// The @google/generative-ai SDK authenticates via the "x-goog-api-key" header,
// which gets silently dropped somewhere in Nitro's bundled server context
// (works standalone, fails only inside the built app — 401
// ACCESS_TOKEN_TYPE_UNSUPPORTED). Calling the REST endpoint directly with the
// key as a query param sidesteps that and is what Google's own curl examples use.
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

async function callGemini(apiKey: string, prompt: string, model: string) {
  const res = await fetch(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.3
      }
    })
  })

  if (!res.ok) {
    const errorBody = await res.text()
    const err: any = new Error(`[${res.status}] ${errorBody}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`Unexpected Gemini response shape: ${JSON.stringify(data)}`)
  }
  return text
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Free-tier quota errors include a suggested retryDelay in the message, e.g.
// `"retryDelay":"14s"` or, in the pretty-printed JSON body, `"retryDelay": "14s"`
// (note the space) - the pattern needs to tolerate both.
function parseRetryDelayMs(err: any): number | null {
  const match = String(err?.message ?? err).match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null
}

// A daily quota hit is pointless to retry within the same run - waiting a
// few seconds won't free it up, only the next calendar day (or a different
// model's separate quota) will.
function isDailyQuotaExhausted(err: any): boolean {
  return String(err?.message ?? err).includes('PerDay')
}

const MAX_RETRIES = 3

/**
 * Reads GEMINI_API_KEYS (comma-separated, for rotating across multiple free-
 * tier projects to multiply the effective daily quota) with a fallback to
 * the single GEMINI_API_KEY for backward compatibility.
 */
export function getGeminiApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS
  if (multi) {
    return multi.split(',').map((k) => k.trim()).filter(Boolean)
  }
  const single = process.env.GEMINI_API_KEY
  return single ? [single] : []
}

export async function processArticleWithAi(params: {
  title: string
  body: string
  sourceName: string
  apiKeys: string[]
  recentTitles?: string[]
}): Promise<AiProcessResult> {
  const { title, body, sourceName, recentTitles = [] } = params
  const apiKeys = params.apiKeys.filter(Boolean)

  if (apiKeys.length === 0) {
    return mockProcess(title, body)
  }

  const prompt = buildUserPrompt(title, body, sourceName, recentTitles)

  for (const [keyIndex, apiKey] of apiKeys.entries()) {
    for (const model of MODELS) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const text = await callGemini(apiKey, prompt, model)
          const parsed = safeParseJson(text)

          const category = parsed.category === 'NONE' ? null : parsed.category ?? null

          return {
            relevant: Boolean(parsed.relevant) && category !== null,
            category,
            isDuplicate: Boolean(parsed.is_duplicate),
            titleAr: parsed.title_ar ?? '',
            tldrAr: Array.isArray(parsed.tldr_ar) ? parsed.tldr_ar : [],
            stepsAr: Array.isArray(parsed.steps_ar) ? parsed.steps_ar : [],
            bodyAr: parsed.body_ar ?? '',
            titleFr: parsed.title_fr ?? title,
            tldrFr: Array.isArray(parsed.tldr_fr) ? parsed.tldr_fr : [],
            stepsFr: Array.isArray(parsed.steps_fr) ? parsed.steps_fr : [],
            bodyFr: parsed.body_fr ?? '',
            model
          }
        } catch (err: any) {
          if (isDailyQuotaExhausted(err)) {
            console.warn(`[ai] Daily quota exhausted for ${model} on key #${keyIndex + 1}, trying next model`)
            break
          }

          const retryDelayMs = parseRetryDelayMs(err)
          // 429 = rate limited, 503 = Google's model temporarily overloaded
          // ("usually temporary" per their own message) - both worth retrying.
          const isRetryable = err?.message?.includes('429') || err?.message?.includes('503') || retryDelayMs !== null

          if (isRetryable && attempt < MAX_RETRIES) {
            const delay = retryDelayMs ?? 2 ** attempt * 1000
            console.warn(`[ai] Retryable error on ${model} (key #${keyIndex + 1}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
            await sleep(delay)
            continue
          }

          console.error(`[ai] ${model} (key #${keyIndex + 1}) processing failed:`, err)
          break
        }
      }
    }
    console.warn(`[ai] All models exhausted on key #${keyIndex + 1}${keyIndex < apiKeys.length - 1 ? ', trying next key' : ''}`)
  }

  console.error('[ai] All keys and models exhausted, falling back to mock')
  return mockProcess(title, body)
}
