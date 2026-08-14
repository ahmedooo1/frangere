<script setup lang="ts">
const { t, locale } = useLocale()
const isAr = computed(() => locale.value === 'ar')

interface Guide {
  id: string
  titleAr: string
  titleFr: string
  pointsAr: string[]
  pointsFr: string[]
  officialUrl: string
  officialLabelAr: string
  officialLabelFr: string
  tampon: 'immigration' | 'housing' | 'health' | 'employment'
}

// General orientation only, deliberately conservative - exact documents/fees/
// timelines vary by situation and change over time, so each guide points to
// the official procedure for the actual up-to-date steps rather than trying
// to reproduce them here.
const guides: Guide[] = [
  {
    id: 'titre-sejour',
    titleAr: 'التصريح بالإقامة (Titre de séjour)',
    titleFr: 'Titre de séjour',
    pointsAr: [
      'مطلوب لغير مواطني الاتحاد الأوروبي المقيمين في فرنسا لأكثر من 90 يوماً.',
      'تقدَّم طلبات الحصول عليه أو تجديده إلكترونياً عبر منصة ANEF الرسمية التابعة لوزارة الداخلية.',
      'يُنصح ببدء إجراءات التجديد قبل عدة أشهر من تاريخ الانتهاء.',
      'احتفظ بالإيصال (récépissé) إن صدر لك أثناء دراسة الملف - فهو يثبت حقك في الإقامة والعمل مؤقتاً.'
    ],
    pointsFr: [
      'Obligatoire pour les non-ressortissants de l\'UE résidant en France plus de 90 jours.',
      'Demande et renouvellement se font en ligne sur la plateforme officielle ANEF (ministère de l\'Intérieur).',
      'Il est conseillé d\'entamer le renouvellement plusieurs mois avant l\'expiration.',
      'Conservez le récépissé remis pendant l\'instruction du dossier - il prouve vos droits de séjour et de travail temporaires.'
    ],
    officialUrl: 'https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/#/',
    officialLabelAr: 'منصة ANEF الرسمية',
    officialLabelFr: 'Plateforme officielle ANEF',
    tampon: 'immigration'
  },
  {
    id: 'compte-bancaire',
    titleAr: 'فتح حساب بنكي وأوراق أساسية',
    titleFr: 'Compte bancaire et documents de base',
    pointsAr: [
      'يحق لأي مقيم في فرنسا، فرنسياً كان أم أجنبياً، فتح حساب بنكي.',
      'تُطلب عادةً هوية سارية المفعول وإثبات عنوان.',
      'إذا رفض بنك فتح حساب لك، يحق لك اللجوء إلى «الحق في حساب» (droit au compte) عبر بنك فرنسا (Banque de France)، الذي يُلزم بنكاً بفتح حساب لك.'
    ],
    pointsFr: [
      'Toute personne résidant en France, française ou étrangère, peut ouvrir un compte bancaire.',
      'Une pièce d\'identité valide et un justificatif de domicile sont généralement demandés.',
      'En cas de refus d\'une banque, vous pouvez faire valoir votre « droit au compte » auprès de la Banque de France, qui désignera un établissement.'
    ],
    officialUrl: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R74226',
    officialLabelAr: 'الإجراء الرسمي (Service-Public)',
    officialLabelFr: 'Démarche officielle (Service-Public)',
    tampon: 'employment'
  },
  {
    id: 'assurance-maladie',
    titleAr: 'التسجيل بالضمان الصحي (Carte Vitale)',
    titleFr: 'Assurance Maladie (Carte Vitale)',
    pointsAr: [
      'يجب أولاً «الانتساب» (affiliation) إلى صندوق التأمين الصحي (CPAM) للحصول على رقم ضمان اجتماعي.',
      'بعد تفعيل الانتساب، يمكن طلب بطاقة Carte Vitale مباشرةً عبر حسابك على ameli.fr.',
      'إلى حين استلام البطاقة، تحصل عادةً على إفادة مؤقتة تكفي لتغطية العلاج.'
    ],
    pointsFr: [
      'Il faut d\'abord être « affilié » à l\'Assurance Maladie (CPAM) pour obtenir un numéro de sécurité sociale.',
      'Une fois l\'affiliation active, la carte Vitale se demande directement depuis votre compte ameli.fr.',
      'En attendant la carte, une attestation provisoire suffit généralement pour vos soins.'
    ],
    officialUrl: 'https://www.ameli.fr',
    officialLabelAr: 'الموقع الرسمي Ameli',
    officialLabelFr: 'Site officiel Ameli',
    tampon: 'health'
  },
  {
    id: 'caf-logement',
    titleAr: 'مساعدات السكن (CAF)',
    titleFr: 'Aides au logement (CAF)',
    pointsAr: [
      'صندوق CAF يتكفّل بمساعدات السكن والأسرة (مثل APL).',
      'يُقدَّم الطلب إلكترونياً عبر caf.fr.',
      'يُفضَّل تقديم الطلب فور الانتقال إلى السكن - فتاريخ تقديم الملف هو المعتمد لحساب المساعدة، وليس تاريخ الانتقال الفعلي.'
    ],
    pointsFr: [
      'La CAF gère les aides au logement et à la famille (comme l\'APL).',
      'La demande se fait en ligne sur caf.fr.',
      'Mieux vaut déposer le dossier dès l\'emménagement - c\'est la date de dépôt qui compte pour le calcul de l\'aide, pas la date d\'entrée dans le logement.'
    ],
    officialUrl: 'https://www.caf.fr',
    officialLabelAr: 'الموقع الرسمي CAF',
    officialLabelFr: 'Site officiel CAF',
    tampon: 'housing'
  },
  {
    id: 'france-travail',
    titleAr: 'التسجيل في فرانس ترافاي (بحث عن عمل)',
    titleFr: 'Inscription à France Travail',
    pointsAr: [
      'التسجيل يتم إلكترونياً عبر francetravail.fr - رابط «التسجيل / إعادة التسجيل» في الصفحة الرئيسية.',
      'يمنحك التسجيل صفة «باحث عن عمل» ويتيح لك المرافقة في مشروعك المهني.',
      'إذا كنت مؤهلاً، يفتح التسجيل الباب أيضاً أمام مخصصات البطالة.'
    ],
    pointsFr: [
      'L\'inscription se fait en ligne sur francetravail.fr - lien « S\'inscrire / se réinscrire » en page d\'accueil.',
      'Elle vous donne le statut de demandeur d\'emploi et un accompagnement dans votre projet.',
      'Si vous y avez droit, elle ouvre aussi l\'accès aux allocations chômage.'
    ],
    officialUrl: 'https://www.francetravail.fr',
    officialLabelAr: 'الموقع الرسمي France Travail',
    officialLabelFr: 'Site officiel France Travail',
    tampon: 'employment'
  },
  {
    id: 'impots',
    titleAr: 'الرقم الضريبي والتصريح الضريبي',
    titleFr: 'Numéro fiscal et déclaration d\'impôts',
    pointsAr: [
      'كل مقيم في فرنسا يحتاج عند وقت ما إلى رقم ضريبي (numéro fiscal)، يُستخرج عبر impots.gouv.fr.',
      'التصريح الضريبي السنوي مطلوب حتى لو كان الدخل منخفضاً أو معدوماً.'
    ],
    pointsFr: [
      'Toute personne résidant en France a besoin, à un moment donné, d\'un numéro fiscal, obtenu via impots.gouv.fr.',
      'La déclaration de revenus annuelle est requise même en l\'absence ou avec de faibles revenus.'
    ],
    officialUrl: 'https://www.impots.gouv.fr',
    officialLabelAr: 'الموقع الرسمي للضرائب',
    officialLabelFr: 'Site officiel des impôts',
    tampon: 'immigration'
  }
]
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
    <div>
      <p class="ref-label mb-3">{{ isAr ? 'أدلة عملية' : 'Guides pratiques' }}</p>
      <h1 class="font-display text-3xl sm:text-4xl font-semibold text-ink-800 leading-tight">
        {{ isAr ? 'أول خطواتك الإدارية في فرنسا' : 'Vos premières démarches en France' }}
      </h1>
      <p class="mt-3 text-base text-slate max-w-2xl leading-relaxed">
        {{ isAr
          ? 'نظرة عامة سريعة على كل موضوع، مع رابط مباشر للإجراء الرسمي الكامل والمحدَّث دائماً.'
          : 'Un aperçu rapide de chaque sujet, avec un lien direct vers la démarche officielle complète et toujours à jour.' }}
      </p>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <section
        v-for="guide in guides"
        :key="guide.id"
        class="dossier-card p-5 sm:p-6 ps-7 sm:ps-8 flex flex-col gap-4"
      >
        <span class="tampon shrink-0 self-start" :class="`tampon--${guide.tampon}`">
          {{ isAr ? guide.titleAr : guide.titleFr }}
        </span>

        <ul class="flex flex-col gap-2">
          <li
            v-for="(point, i) in (isAr ? guide.pointsAr : guide.pointsFr)"
            :key="i"
            class="text-sm text-ink-800 leading-relaxed flex gap-2"
          >
            <span class="opacity-60">-</span>
            <span>{{ point }}</span>
          </li>
        </ul>

        <a
          :href="guide.officialUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-guichet-600 hover:text-guichet-800 underline underline-offset-4 decoration-guichet-400/50 w-fit"
        >
          {{ isAr ? guide.officialLabelAr : guide.officialLabelFr }}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>
      </section>
    </div>

    <p class="ref-label !normal-case !tracking-normal text-slate">
      {{ isAr
        ? 'هذه لمحة عامة فقط - الوثائق والمهل الدقيقة تختلف حسب وضعك، فاعتمد دائماً على الموقع الرسمي المذكور للتفاصيل الكاملة.'
        : 'Ceci est un aperçu général - documents et délais exacts varient selon votre situation, référez-vous toujours au site officiel indiqué pour le détail complet.' }}
    </p>
  </div>
</template>
