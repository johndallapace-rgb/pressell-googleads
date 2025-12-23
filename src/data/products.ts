export type Lang = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';

export type VideoReview = 
  | { provider: 'youtube'; id: string; thumbnailUrl?: string; title?: string }
  | { provider: 'vimeo'; id: string; thumbnailUrl?: string; title?: string }
  | { provider: 'mp4'; url: string; thumbnailUrl?: string; title?: string };

export type QuizOption = { id: string; label: string; scoreTags?: string[] };
export type QuizQuestion = { id: string; question: string; options: QuizOption[] };
export type QuizResult = { matchTags?: string[]; title: string; text: string; ctaText: string };

export type ProductTranslation = {
  name: string;
  heroHeadline: string;
  subHeadline: string;
  bullets: string[];
  ctaLabel: string;
  badges: string[];
  faqs: { q: string; a: string }[];
  reviews: { name: string; rating: number; date: string; text: string }[];
  quiz: { questions: QuizQuestion[]; resultMap: QuizResult[] };
  videoReview?: VideoReview;
};

export type Product = {
  slug: string;
  officialUrl: string;
  translations: Record<Lang, ProductTranslation>;
};

// Mock translations helper for existing data to fit new structure
// In a real app, you would translate these. 
// For this task, I will provide English content for 'en' and placeholders for others
// or duplicate English if translation is not provided to ensure type safety.

const commonQuiz = {
  questions: [
    {
      id: 'goal',
      question: 'What is your primary wellness goal?',
      options: [
        { id: 'weight', label: 'Weight Management' },
        { id: 'energy', label: 'Daily Energy' },
        { id: 'health', label: 'General Health' }
      ]
    }
  ],
  resultMap: [
    {
      title: 'This product might be suitable for you.',
      text: 'Based on your answers, this formula aligns with your wellness goals.',
      ctaText: 'Visit Official Website'
    }
  ]
};

const mitolynEn: ProductTranslation = {
  name: 'Mitolyn',
  heroHeadline: 'Mitolyn – Product Information & Customer Reviews',
  subHeadline: 'An independent overview with publicly available information and user feedback.',
  bullets: [
    'May help support healthy metabolism',
    'Contains natural ingredients',
    'Manufactured in a GMP Certified Facility',
    'Includes 60-Day Money Back Guarantee',
    'Designed to be stimulant-free'
  ],
  ctaLabel: 'Visit Official Website',
  badges: ['GMP Certified', 'Made in USA', 'Natural Ingredients'],
  faqs: [
    {
      q: 'How do I take Mitolyn?',
      a: 'The recommended usage is two capsules daily with a glass of water, preferably with a meal.'
    },
    {
      q: 'Is it safe?',
      a: 'Mitolyn is manufactured in a facility following GMP guidelines. Always consult your doctor.'
    }
  ],
  reviews: [
    {
      name: 'Sarah J.',
      rating: 5,
      date: '2 days ago',
      text: 'Mitolyn has been a helpful addition to my routine.'
    }
  ],
  quiz: commonQuiz,
  videoReview: {
    provider: 'youtube',
    id: 'dQw4w9WgXcQ', // Placeholder ID
    title: 'Mitolyn Review Video'
  }
};

const brainsongEn: ProductTranslation = {
  name: 'BrainSong',
  heroHeadline: 'BrainSong – Product Information & Customer Reviews',
  subHeadline: 'An independent overview with publicly available information and user feedback.',
  bullets: [
    'Designed to support focus and clarity',
    'Ingredients may support memory retention',
    'Formulated with studied ingredients',
    'Non-GMO and Gluten Free',
    'Designed for daily use'
  ],
  ctaLabel: 'Visit Official Website',
  badges: ['Cognitive Support', 'Non-GMO', 'Gluten Free'],
  faqs: [
    {
      q: 'Who is BrainSong for?',
      a: 'BrainSong is for adults looking to support their cognitive health and focus.'
    }
  ],
  reviews: [
    {
      name: 'David K.',
      rating: 5,
      date: 'Yesterday',
      text: 'My focus at work seems better. I feel less distracted.'
    }
  ],
  quiz: commonQuiz,
  videoReview: {
    provider: 'youtube',
    id: 'dQw4w9WgXcQ', // Placeholder ID
    title: 'BrainSong Review Video'
  }
};

// Helper to duplicate for other languages (in a real scenario, use real translations)
function duplicateForLangs(content: ProductTranslation): Record<Lang, ProductTranslation> {
  return {
    en: content,
    es: { ...content, heroHeadline: content.heroHeadline + ' [ES]' }, // Marking as translated for demo
    fr: { ...content, heroHeadline: content.heroHeadline + ' [FR]' },
    de: { ...content, heroHeadline: content.heroHeadline + ' [DE]' },
    it: { ...content, heroHeadline: content.heroHeadline + ' [IT]' },
    pt: { ...content, heroHeadline: content.heroHeadline + ' [PT]' },
  };
}

export const products: Product[] = [
  {
    slug: 'mitolyn',
    officialUrl: 'https://example.com/mitolyn-offer',
    translations: duplicateForLangs(mitolynEn)
  },
  {
    slug: 'brainsong',
    officialUrl: 'https://example.com/brainsong-offer',
    translations: duplicateForLangs(brainsongEn)
  }
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
