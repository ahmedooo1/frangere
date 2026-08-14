export type Locale = 'ar' | 'fr'

const dict = {
  ar: {
    appName: 'فرانجير',
    tagline: 'دليلك الإداري المبسّط في فرنسا',
    searchPlaceholder: 'ابحث عن موضوع… (السكن، الصحة، الإقامة)',
    allCategories: 'الكل',
    tldr: 'ملخص سريع',
    steps: 'الخطوات العملية',
    source: 'المصدر الرسمي',
    readOriginal: 'عرض المصدر الأصلي',
    disclaimer:
      'محتوى موثق مترجم ومُلخص من المصادر الرسمية، يُحدَّث بشكل دوري.',
    noResults: 'لا توجد نتائج مطابقة لبحثك حالياً.',
    noResultsHint: 'جرّب كلمة أخرى أو غيّر التصنيف.',
    loadMore: 'عرض المزيد',
    loading: 'جارٍ التحميل…',
    heroKicker: 'خدمة إخبارية إدارية',
    heroTitle: 'الإجراءات الفرنسية، بلغتك، بلا تعقيد',
    heroBody:
      'نتابع مصادر رسمية مثل Service-Public وCAF وAmeli وFrance Travail، ونترجم ونلخّص كل تحديث يهمّ الوافدين الجدد - تلقائياً كل 6 ساعات.',
    switchLang: 'Français',
    updated: 'آخر تحديث',
    backHome: 'العودة إلى القائمة',
    usefulInfo: 'معلومات مفيدة',
    guides: 'أدلة عملية',
    share: 'مشاركة',
    categories: {
      IMMIGRATION: 'الإقامة والهجرة',
      HOUSING: 'السكن',
      HEALTH: 'الصحة',
      EMPLOYMENT: 'العمل'
    } as Record<string, string>
  },
  fr: {
    appName: 'Frangère',
    tagline: 'Votre guide administratif simplifié en France',
    searchPlaceholder: 'Rechercher un sujet… (logement, santé, séjour)',
    allCategories: 'Tout',
    tldr: 'Résumé rapide',
    steps: 'Étapes à suivre',
    source: 'Source officielle',
    readOriginal: 'Voir la source originale',
    disclaimer:
      'Contenu vérifié, traduit et résumé à partir de sources officielles, mis à jour régulièrement.',
    noResults: 'Aucun résultat pour votre recherche.',
    noResultsHint: 'Essayez un autre mot-clé ou une autre catégorie.',
    loadMore: 'Voir plus',
    loading: 'Chargement…',
    heroKicker: 'Veille administrative',
    heroTitle: 'Les démarches françaises, sans jargon',
    heroBody:
      'Nous suivons Service-Public, la CAF, Ameli et France Travail, puis traduisons et résumons chaque mise à jour utile aux nouveaux arrivants - automatiquement toutes les 6 heures.',
    switchLang: 'العربية',
    updated: 'Mis à jour',
    backHome: 'Retour à la liste',
    usefulInfo: 'Infos utiles',
    guides: 'Guides pratiques',
    share: 'Partager',
    categories: {
      IMMIGRATION: 'Immigration & Séjour',
      HOUSING: 'Logement',
      HEALTH: 'Santé',
      EMPLOYMENT: 'Emploi'
    } as Record<string, string>
  }
}

export function useLocale() {
  const locale = useState<Locale>('locale', () => 'ar')

  const t = computed(() => dict[locale.value])
  const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))

  function setLocale(l: Locale) {
    locale.value = l
    if (import.meta.client) {
      localStorage.setItem('frangere-locale', l)
      document.documentElement.setAttribute('lang', l)
      document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr')
    }
  }

  function toggleLocale() {
    setLocale(locale.value === 'ar' ? 'fr' : 'ar')
  }

  function initLocale() {
    if (import.meta.client) {
      const saved = localStorage.getItem('frangere-locale') as Locale | null
      if (saved === 'ar' || saved === 'fr') setLocale(saved)
    }
  }

  return { locale, t, dir, setLocale, toggleLocale, initLocale }
}
