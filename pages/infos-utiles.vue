<script setup lang="ts">
const { t, locale } = useLocale()
const isAr = computed(() => locale.value === 'ar')

interface EmergencyNumber {
  number: string
  labelAr: string
  labelFr: string
}

// Static, not sourced from the AI pipeline on purpose - these don't change,
// so there's nothing to translate or keep in sync, only to keep accurate.
const emergencyNumbers: EmergencyNumber[] = [
  { number: '112', labelAr: 'الرقم الأوروبي الموحّد للطوارئ', labelFr: 'Numéro d\'urgence européen unique' },
  { number: '15', labelAr: 'الإسعاف الطبي (SAMU)', labelFr: 'SAMU (urgence médicale)' },
  { number: '17', labelAr: 'الشرطة', labelFr: 'Police / Gendarmerie' },
  { number: '18', labelAr: 'الإطفاء ورجال الإنقاذ', labelFr: 'Pompiers' },
  { number: '114', labelAr: 'الطوارئ عبر الرسائل النصية (لضعاف السمع)', labelFr: 'Urgence par SMS (sourds/malentendants)' },
  { number: '3919', labelAr: 'خط العنف ضد النساء (مجاني وسرّي)', labelFr: 'Violences Femmes Info (gratuit, anonyme)' },
  { number: '119', labelAr: 'خط حماية الطفولة', labelFr: 'Enfance en danger' }
]

interface OfficialLink {
  url: string
  labelAr: string
  labelFr: string
}

const officialLinks: OfficialLink[] = [
  { url: 'https://www.service-public.gouv.fr', labelAr: 'البوابة الإدارية الرسمية الشاملة', labelFr: 'Portail administratif officiel (toutes démarches)' },
  { url: 'https://www.ameli.fr', labelAr: 'التأمين الصحي (Assurance Maladie)', labelFr: 'Assurance Maladie (Ameli)' },
  { url: 'https://www.caf.fr', labelAr: 'صندوق المساعدات العائلية (السكن، الأسرة)', labelFr: 'CAF (aides logement, famille)' },
  { url: 'https://www.francetravail.fr', labelAr: 'خدمات التوظيف والبحث عن عمل', labelFr: 'France Travail (emploi)' },
  { url: 'https://www.impots.gouv.fr', labelAr: 'الضرائب', labelFr: 'Impôts' },
  { url: 'https://www.franceconnect.gouv.fr', labelAr: 'تسجيل دخول موحّد لكل الخدمات الحكومية', labelFr: 'FranceConnect (connexion unique aux services publics)' }
]
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
    <div>
      <p class="ref-label mb-3">{{ t.usefulInfo }}</p>
      <h1 class="font-display text-3xl sm:text-4xl font-semibold text-ink-800 leading-tight">
        {{ isAr ? 'أرقام وروابط مهمة' : 'Numéros et liens importants' }}
      </h1>
      <p class="mt-3 text-base text-slate max-w-2xl leading-relaxed">
        {{ isAr
          ? 'معلومات ثابتة وموثوقة لا تتغيّر باستمرار، لذلك لا تمر عبر الترجمة الآلية - فقط تحديث يدوي عند الحاجة.'
          : 'Informations stables et fiables, qui ne changent pas souvent - donc pas de traduction automatique ici, juste une mise à jour manuelle si besoin.' }}
      </p>
    </div>

    <section>
      <h2 class="font-display text-xl font-semibold text-ink-800 mb-4">
        {{ isAr ? 'أرقام الطوارئ' : 'Numéros d\'urgence' }}
      </h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="item in emergencyNumbers"
          :key="item.number"
          class="dossier-card p-4 ps-7 flex items-center gap-4"
        >
          <span class="tampon tampon--health shrink-0 !text-base font-mono font-bold px-3">{{ item.number }}</span>
          <span class="text-sm text-ink-800 leading-relaxed">{{ isAr ? item.labelAr : item.labelFr }}</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="font-display text-xl font-semibold text-ink-800 mb-4">
        {{ isAr ? 'روابط رسمية' : 'Liens officiels' }}
      </h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <a
          v-for="item in officialLinks"
          :key="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="dossier-card p-4 ps-7 flex flex-col gap-1 hover:bg-paper-100 transition-colors"
        >
          <span class="text-sm font-semibold text-guichet-600">{{ item.url.replace('https://www.', '').replace('https://', '') }}</span>
          <span class="text-sm text-ink-800 leading-relaxed">{{ isAr ? item.labelAr : item.labelFr }}</span>
        </a>
      </div>
    </section>

    <p class="ref-label !normal-case !tracking-normal text-slate">
      {{ isAr
        ? 'لاحظت معلومة خاطئة أو قديمة؟ راسلنا لتصحيحها.'
        : 'Une information erronée ou obsolète ? Contactez-nous pour la corriger.' }}
    </p>
  </div>
</template>
