import Anthropic from '@anthropic-ai/sdk'

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
  "category": "IMMIGRATION" | "HOUSING" | "HEALTH" | "EMPLOYMENT" | null,  // null si relevant=false
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
 * Deterministic mock processor used when ANTHROPIC_API_KEY is not configured,
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
    titleAr: `[تجريبي] ${title}`,
    tldrAr: [
      'هذا محتوى تجريبي لأنّ مفتاح Claude API غير مُفعّل بعد.',
      'بمجرد إضافة ANTHROPIC_API_KEY، ستُترجم وتُلخّص المقالات الحقيقية تلقائياً.',
      'يمكنك تصفح الواجهة والتصنيفات والبحث بشكل كامل باستخدام هذه البيانات الوهمية.'
    ],
    stepsAr: [
      'أضف مفتاح ANTHROPIC_API_KEY في ملف .env',
      'أعد تشغيل مهمة الجلب التلقائي (cron) أو نفّذها يدوياً عبر /api/feed',
      'ستظهر المقالات الحقيقية المترجمة بدلاً من هذا النص التجريبي'
    ],
    bodyAr: `ملخص تجريبي: ${shortBody}`,
    titleFr: title,
    tldrFr: [
      'Contenu de démonstration — clé Anthropic API absente.',
      'Ajoutez ANTHROPIC_API_KEY pour activer la traduction et le résumé réels.',
      'Toute la navigation (recherche, filtres, catégories) fonctionne déjà avec ces données factices.'
    ],
    stepsFr: [
      'Ajouter ANTHROPIC_API_KEY dans le fichier .env',
      'Relancer la tâche planifiée ou déclencher /api/feed manuellement',
      'Les vrais articles traduits remplaceront ce texte de démonstration'
    ],
    bodyFr: `Résumé de démonstration : ${shortBody}`,
    model: 'mock-fallback'
  }
}

let client: Anthropic | null = null
function getClient(apiKey: string) {
  if (!client) client = new Anthropic({ apiKey })
  return client
}

const MODEL = 'claude-sonnet-4-6'

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

  try {
    const anthropic = getClient(apiKey)
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(title, body, sourceName) }]
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text block in AI response')

    const parsed = safeParseJson(textBlock.text)

    return {
      relevant: Boolean(parsed.relevant),
      category: parsed.category ?? null,
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
  } catch (err) {
    console.error('[ai] Claude processing failed, falling back to mock:', err)
    return mockProcess(title, body)
  }
}
