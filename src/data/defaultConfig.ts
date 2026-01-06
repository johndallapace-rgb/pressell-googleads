import { CampaignConfig } from '@/lib/config';

export const defaultConfig: CampaignConfig = {
  active_product_slug: 'mitolyn',
  default_lang: 'en',
  products: {
    mitolyn: {
      slug: 'mitolyn',
      name: 'Mitolyn',
      platform: 'clickbank',
      language: 'en',
      status: 'active',
      vertical: 'health',
      template: 'editorial',
      official_url: 'https://mitolyn.com/welcome/?hop=zzzzz',
      affiliate_url: 'https://hop.clickbank.net/?vendor=mitolyn&affiliate=zzzzz',
      youtube_review_id: 'PSd-VG31tcE',
      image_url: '/images/mitolyn.svg',
      headline: 'Mitolyn Review: What it is, how it works, and who it may help',
      subheadline: 'Independent-style overview based on official info and user feedback.',
      cta_text: 'Check Availability',
      bullets: [
        'Supports metabolic health',
        'Natural ingredients',
        'Manufactured in GMP facility'
      ],
      faq: [
        { q: 'Is it safe?', a: 'Mitolyn is formulated with natural ingredients.' },
        { q: 'How to take?', a: 'One capsule daily with water.' }
      ],
      seo: {
        title: 'Mitolyn Review – Does It Really Work?',
        description: 'An independent editorial review of Mitolyn.'
      },
      whatIs: {
        title: 'What Is Mitolyn?',
        content: [
          'Mitolyn is a dietary supplement marketed as a metabolic support formula.',
          'The formula consists of a proprietary blend of natural ingredients.'
        ]
      },
      howItWorks: {
        title: 'How Does Mitolyn Work?',
        content: [
          'Mitolyn works by addressing the underlying cause of slow metabolism.',
          'By supplying the body with specific nutrients known to support thermogenesis.'
        ]
      },
      prosCons: {
        pros: ['Natural ingredients', '60-day money-back guarantee'],
        cons: ['Only available online', 'Stock may be limited']
      }
    },
    tedswoodworking: {
      slug: 'tedswoodworking',
      name: "Ted's Woodworking",
      platform: 'clickbank',
      language: 'en',
      status: 'active',
      vertical: 'diy',
      template: 'editorial',
      official_url: 'https://tedswoodworking.com?hop=zzzzz',
      affiliate_url: 'https://hop.clickbank.net/?vendor=tedswoodworking&affiliate=zzzzz',
      youtube_review_id: '',
      image_url: '/images/teds.svg',
      headline: "16,000 Woodworking Plans: Is Ted's Woodworking Legit?",
      subheadline: 'A comprehensive review of the largest woodworking plan database online.',
      cta_text: 'Get Instant Access',
      bullets: [
        '16,000+ step-by-step plans',
        'Suitable for beginners and pros',
        'Lifetime access with one payment'
      ],
      faq: [
        { q: 'Are the plans detailed?', a: 'Yes, each plan comes with detailed schematics and material lists.' },
        { q: 'Is it a monthly fee?', a: 'No, it is a one-time purchase for lifetime access.' }
      ],
      seo: {
        title: "Ted's Woodworking Review - 16,000 Plans Scam or Legit?",
        description: "In-depth review of Ted's Woodworking plans package."
      },
      whatIs: {
        title: "What Is Ted's Woodworking?",
        content: [
          "Ted's Woodworking is a digital archive of over 16,000 woodworking projects.",
          "It was created by Ted McGrath, a professional woodworker and educator."
        ]
      },
      howItWorks: {
        title: "How It Works",
        content: [
          "Upon purchase, you get instant login access to the members area.",
          "You can browse plans by category, download PDF guides, and watch video tutorials."
        ]
      },
      prosCons: {
        pros: ['Massive variety of projects', 'Detailed cutting lists', 'Beginner friendly'],
        cons: ['Overwhelming amount of content', 'Some older plans need updates']
      },
      testimonials: [
        { name: "John D.", age: 60, location: "Denver, CO", rating: 5, text: "I've built 5 projects so far. The plans are incredibly detailed." },
        { name: "Mark S.", age: 42, location: "Seattle, WA", rating: 5, text: "Worth every penny. The shed plans alone saved me thousands." },
        { name: "David L.", age: 55, location: "Miami, FL", rating: 4, text: "Great collection, though some videos could be updated. Still a bargain." }
      ]
    },
    "amino-de": {
      slug: "amino-de",
      name: "Advanced Amino Formula",
      platform: "digistore24",
      language: "de",
      status: "active",
      vertical: "health",
      template: "editorial",
      official_url: "https://advancedamino.com",
      affiliate_url: "https://www.digistore24.com/redir/[INSERT_PRODUCT_ID]/JohnPace",
      youtube_review_id: "dQw4w9WgXcQ", 
      image_url: "/images/amino.svg",
      google_ads_id: "AW-123456789", // Mock ID
      google_ads_label: "AbCdEfGhIjKlM",
      meta_pixel_id: "9876543210", // Mock ID
      headline: "Advanced Amino Formula: Der fehlende Schlüssel für Langlebigkeit?",
      subheadline: "Warum Biohacker auf diese essenziellen Aminosäuren schwören – Eine unabhängige Analyse.",
      cta_text: "Verfügbarkeit prüfen",
      bullets: [
        "Optimiert für maximale Bioverfügbarkeit (MAP-Formel)",
        "Unterstützt Muskelaufbau und Regeneration im Alter",
        "100% Vegan und frei von Zusatzstoffen"
      ],
      faq: [
        { q: "Ist es sicher?", a: "Ja, es besteht aus reinen, kristallinen Aminosäuren ohne Bindemittel." },
        { q: "Wie schnell wirkt es?", a: "Viele Anwender berichten von mehr Energie bereits nach wenigen Tagen." }
      ],
      seo: {
        title: "Advanced Amino Formula Erfahrungen - Betrug oder Seriös?",
        description: "Unabhängiger Testbericht zur Advanced Amino Formula von Dr. Minkoff."
      },
      whatIs: {
        title: "Was ist die Advanced Amino Formula?",
        content: [
          "Die Advanced Amino Formula ist eine patentierte Mischung aus 8 essenziellen Aminosäuren.",
          "Sie wurde entwickelt, um die körpereigene Proteinsynthese zu maximieren, ohne den Stoffwechsel mit Stickstoffabfällen zu belasten."
        ]
      },
      howItWorks: {
        title: "Wie funktioniert es?",
        content: [
          "Im Gegensatz zu herkömmlichem Protein wird diese Formel zu 99% vom Körper verwertet.",
          "Das bedeutet: Maximale Muskelunterstützung bei minimaler Kalorienlast."
        ]
      },
      prosCons: {
        pros: ['Höchste Reinheit', 'Perfektes Aminosäuren-Profil', 'Von Ärzten empfohlen'],
        cons: ['Premium-Preis', 'Nur online verfügbar']
      },
      testimonials: [
        { name: "Hans M.", age: 55, location: "München", rating: 5, text: "Endlich keine Müdigkeit mehr nach dem Sport. Ein Gamechanger für mich." },
        { name: "Sabine K.", age: 48, location: "Hamburg", rating: 5, text: "Ich fühle mich 10 Jahre jünger. Meine Haut und Haare danken es mir." }
      ]
    },
    "amino-uk": {
      slug: "amino-uk",
      name: "Advanced Amino Formula",
      platform: "digistore24",
      language: "en", // UK
      status: "active",
      vertical: "health",
      template: "editorial",
      official_url: "https://advancedamino.com",
      affiliate_url: "https://www.digistore24.com/redir/[INSERT_PRODUCT_ID]/JohnPace",
      youtube_review_id: "dQw4w9WgXcQ",
      image_url: "/images/amino.svg",
      headline: "Advanced Amino Formula Review: Is It The Key To Longevity?",
      subheadline: "Why biohackers in the UK are switching to this essential amino acid blend – An independent analysis.",
      cta_text: "Check Availability",
      bullets: [
        "Optimized for maximum bioavailability (MAP Formula)",
        "Supports muscle recovery and anti-aging",
        "100% Vegan and additive-free"
      ],
      faq: [
        { q: "Is it safe?", a: "Yes, it consists of pure, crystalline amino acids with no binders." },
        { q: "How fast does it work?", a: "Many users report increased energy levels within just a few days." }
      ],
      seo: {
        title: "Advanced Amino Formula Review - Scam or Legit?",
        description: "Independent review of Dr. Minkoff's Advanced Amino Formula for the UK market."
      },
      whatIs: {
        title: "What Is Advanced Amino Formula?",
        content: [
          "Advanced Amino Formula is a patented blend of 8 essential amino acids.",
          "It is designed to maximize the body's protein synthesis without burdening the metabolism with nitrogen waste."
        ]
      },
      howItWorks: {
        title: "How Does It Work?",
        content: [
          "Unlike conventional protein, this formula is 99% utilized by the body.",
          "This means: Maximum muscle support with minimal caloric load."
        ]
      },
      prosCons: {
        pros: ['Highest Purity', 'Perfect Amino Profile', 'Doctor Recommended'],
        cons: ['Premium Price', 'Online Only']
      },
      testimonials: [
        { name: "James B.", age: 52, location: "London", rating: 5, text: "Finally, no more fatigue after the gym. A game changer for me." },
        { name: "Sarah P.", age: 45, location: "Manchester", rating: 5, text: "I feel 10 years younger. My skin and hair are thanking me." }
      ]
    },
    "tube-mastery": {
      slug: "tube-mastery",
      name: "Tube Mastery and Monetization",
      platform: "digistore24",
      language: "en",
      status: "active",
      vertical: "finance",
      template: "editorial",
      official_url: "https://tubemastery.com",
      affiliate_url: "https://www.digistore24.com/redir/299134/JohnPace",
      youtube_review_id: "dQw4w9WgXcQ", // Placeholder
      image_url: "/images/tube.svg",
      headline: "Tube Mastery & Monetization: Can You Really Make Money on YouTube Without Showing Your Face?",
      subheadline: "Matt Par's controversial course explained. Is it a legit business model or just hype?",
      cta_text: "Watch Free Training",
      bullets: [
        "Proven system for faceless channels",
        "Updated for 2026 YouTube algorithm",
        "Includes list of profitable niches"
      ],
      faq: [
        { q: "Do I need a camera?", a: "No, the entire course focuses on 'faceless' content creation." },
        { q: "Is it suitable for beginners?", a: "Yes, it starts from setting up your Gmail account to advanced scaling." }
      ],
      seo: {
        title: "Tube Mastery Review 2026 - Matt Par Scam or Legit?",
        description: "Honest review of Tube Mastery and Monetization by Matt Par."
      },
      whatIs: {
        title: "What Is Tube Mastery?",
        content: [
          "Tube Mastery is a comprehensive training program by Matt Par.",
          "It teaches how to build profitable YouTube channels without recording videos yourself."
        ]
      },
      howItWorks: {
        title: "How It Works",
        content: [
          "You learn to identify high-CPM niches (like finance or health).",
          "Then, you outsource or create simple content using stock footage and voiceovers."
        ]
      },
      prosCons: {
        pros: ['Step-by-step blueprint', 'Active community support', 'Real case studies'],
        cons: ['Requires consistency', 'Not a get-rich-quick scheme']
      },
      testimonials: [
        { name: "Michael R.", age: 24, location: "New York", rating: 5, text: "I hit monetization in 3 months. The module on SEO is gold." },
        { name: "Lisa K.", age: 31, location: "Toronto", rating: 4, text: "Great content, but you have to put in the work. It's a real business." }
      ]
    },
    "tube-fr": {
      slug: "tube-fr",
      name: "Tube Mastery and Monetization",
      platform: "digistore24",
      language: "fr",
      status: "active",
      vertical: "finance",
      template: "editorial",
      official_url: "https://tubemastery.com",
      affiliate_url: "https://www.digistore24.com/redir/299134/JohnPace",
      youtube_review_id: "dQw4w9WgXcQ",
      image_url: "/images/tube.svg",
      google_ads_id: "AW-987654321", // Mock ID
      meta_pixel_id: "1234509876", // Mock ID
      headline: "Tube Mastery : Gagner sa vie sur YouTube sans montrer son visage ?",
      subheadline: "Analyse du système de Matt Par. Est-ce une opportunité réelle pour 2026 ?",
      cta_text: "Voir la Formation Gratuite",
      bullets: [
        "Système prouvé pour les chaînes sans visage",
        "Mis à jour pour l'algorithme YouTube 2026",
        "Liste des niches les plus rentables incluse"
      ],
      faq: [
        { q: "Faut-il une caméra ?", a: "Non, tout le cours se concentre sur la création de contenu 'anonyme'." },
        { q: "Est-ce adapté aux débutants ?", a: "Oui, cela commence par la création du compte Gmail jusqu'à l'automatisation." }
      ],
      seo: {
        title: "Avis Tube Mastery 2026 - Arnaque ou Opportunité ?",
        description: "Critique complète de la formation Tube Mastery de Matt Par pour le marché francophone."
      },
      whatIs: {
        title: "Qu'est-ce que Tube Mastery ?",
        content: [
          "Tube Mastery est un programme de formation complet créé par Matt Par.",
          "Il enseigne comment construire des chaînes YouTube rentables sans s'enregistrer soi-même."
        ]
      },
      howItWorks: {
        title: "Comment ça marche ?",
        content: [
          "Vous apprenez à identifier des niches à fort CPM (comme la finance ou la santé).",
          "Ensuite, vous externalisez ou créez du contenu simple en utilisant des vidéos libres de droits."
        ]
      },
      prosCons: {
        pros: ['Plan étape par étape', 'Communauté active', 'Études de cas réelles'],
        cons: ['Demande de la régularité', "Ce n'est pas une méthode miracle"]
      },
      testimonials: [
        { name: "Julien D.", age: 28, location: "Paris", rating: 5, text: "J'ai monétisé ma chaîne en 3 mois. Le module sur le SEO vaut de l'or." },
        { name: "Sophie M.", age: 34, location: "Lyon", rating: 4, text: "Très bon contenu, mais il faut bosser. C'est un vrai business." }
      ]
    }
  }
};
