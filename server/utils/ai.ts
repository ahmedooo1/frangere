export type CategoryKey = 'IMMIGRATION' | 'HOUSING' | 'HEALTH' | 'EMPLOYMENT'

export interface AiProcessResult {
  relevant: boolean
  category: CategoryKey | null
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

const SYSTEM_PROMPT = `Tu es un assistant éditorial pour "Frangère", une plateforme qui aide les nouveaux arrivants en France à comprendre les démarches administratives officielles.

On te donne le titre et le corps brut d'une actualité officielle française (Service-Public.fr, CAF, Ameli, France Travail, etc.).

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant/après, sans balises markdown, respectant exactement ce schéma :

{
  "relevant": boolean,          // true seulement si le texte concerne le droit au séjour/l'immigration, le logement, la santé, l'emploi, ou une démarche administrative pratique pour un résident. false pour tout le reste (sport, culture générale, tourisme, communiqués institutionnels sans démarche concrète, etc.)
  "category": "IMMIGRATION" | "HOUSING" | "HEALTH" | "EMPLOYMENT" | "NONE",  // "NONE" si relevant=false
  "title_fr": string,           // titre clair et court, en français simplifié (FALC-friendly)
  "tldr_fr": [string, string, string],  // exactement 3 puces résumant l'essentiel, phrases courtes
  "steps_fr": string[],         // étapes concrètes à suivre (2 à 5 items), verbes d'action
  "body_fr": string,            // reformulation simplifiée du texte en 2-4 phrases claires (pas de jargon)
  "title_ar": string,           // traduction arabe naturelle et claire du titre (arabe standard moderne, accessible)
  "tldr_ar": [string, string, string],  // traduction/adaptation arabe des 3 puces
  "steps_ar": string[],         // traduction arabe des étapes
  "body_ar": string             // traduction arabe du résumé simplifié
}

Règles :
- Simplifie toujours le jargon administratif (ex: "titre de séjour" reste tel quel car c'est un terme officiel à connaître, mais explique les procédures complexes simplement).
- L'arabe doit être fluide et naturel, pas une traduction mot-à-mot.
- Si l'article n'est pas pertinent (relevant=false), tu peux laisser les champs de traduction vides ("") ou tableaux vides, sauf title_fr qui doit rester rempli.
- Ne jamais inventer d'information absente du texte source.`

function buildUserPrompt(title: string, body: string, sourceName: string) {
  return `Source: ${sourceName}\nTitre original: ${title}\n\nCorps du texte:\n${body.slice(0, 6000)}`
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
    : 'IMMIGRATION'

  const shortBody = body.slice(0, 220).trim()

  return {
    relevant: true,
    category: categoryGuess,
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

const MODEL = 'gemini-flash-latest'

// Structured output schema — Gemini enforces this shape natively, so we get
// guaranteed valid JSON back without brittle prompt-only parsing.
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    relevant: { type: 'BOOLEAN' },
    category: {
      type: 'STRING',
      enum: ['IMMIGRATION', 'HOUSING', 'HEALTH', 'EMPLOYMENT', 'NONE'],
      format: 'enum'
    },
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
    'relevant', 'category', 'title_fr', 'tldr_fr', 'steps_fr', 'body_fr',
    'title_ar', 'tldr_ar', 'steps_ar', 'body_ar'
  ]
} as const

// The @google/generative-ai SDK authenticates via the "x-goog-api-key" header,
// which gets silently dropped somewhere in Nitro's bundled server context
// (works standalone, fails only inside the built app — 401
// ACCESS_TOKEN_TYPE_UNSUPPORTED). Calling the REST endpoint directly with the
// key as a query param sidesteps that and is what Google's own curl examples use.
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

async function callGemini(apiKey: string, prompt: string) {
  const res = await fetch(`${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`, {
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

// Free-tier quota errors include a suggested "retryDelay":"14s" in the message.
function parseRetryDelayMs(err: any): number | null {
  const match = String(err?.message ?? err).match(/"retryDelay":"(\d+(?:\.\d+)?)s"/)
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null
}

const MAX_RETRIES = 3

export async function processArticleWithAi(params: {
  title: string
  body: string
  sourceName: string
  apiKey: string
}): Promise<AiProcessResult> {
  const { title, body, sourceName, apiKey } = params

  if (!apiKey) {
    return mockProcess(title, body)
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await callGemini(apiKey, buildUserPrompt(title, body, sourceName))
      const parsed = safeParseJson(text)

      const category = parsed.category === 'NONE' ? null : parsed.category ?? null

      return {
        relevant: Boolean(parsed.relevant) && category !== null,
        category,
        titleAr: parsed.title_ar ?? '',
        tldrAr: Array.isArray(parsed.tldr_ar) ? parsed.tldr_ar : [],
        stepsAr: Array.isArray(parsed.steps_ar) ? parsed.steps_ar : [],
        bodyAr: parsed.body_ar ?? '',
        titleFr: parsed.title_fr ?? title,
        tldrFr: Array.isArray(parsed.tldr_fr) ? parsed.tldr_fr : [],
        stepsFr: Array.isArray(parsed.steps_fr) ? parsed.steps_fr : [],
        bodyFr: parsed.body_fr ?? '',
        model: MODEL
      }
    } catch (err: any) {
      const retryDelayMs = parseRetryDelayMs(err)
      const isRateLimit = err?.message?.includes('429') || retryDelayMs !== null

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = retryDelayMs ?? 2 ** attempt * 1000
        console.warn(`[ai] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        continue
      }

      console.error('[ai] Gemini processing failed, falling back to mock:', err)
      return mockProcess(title, body)
    }
  }

  return mockProcess(title, body)
}
