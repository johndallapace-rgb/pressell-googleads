export type Lang = 'en';

export type VideoReview = 
  | { provider: 'youtube'; id: string; thumbnailUrl?: string; title?: string };

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
  officialUrl: string; // This will be used as fallback or initial value
  translations: Record<Lang, ProductTranslation>;
};

const commonQuiz = {
  questions: [
    {
      id: 'goal',
      question: 'What is your primary wellness goal?',
      options: [
        { id: 'weight', label: 'Healthy Metabolism Support' },
        { id: 'energy', label: 'All-Day Energy' },
        { id: 'health', label: 'General Vitality' }
      ]
    },
    {
      id: 'age',
      question: 'Select your age range:',
      options: [
        { id: '18-30', label: '18 - 30' },
        { id: '31-50', label: '31 - 50' },
        { id: '50+', label: '50+' }
      ]
    },
    {
      id: 'routine',
      question: 'How consistent are you with supplements?',
      options: [
        { id: 'daily', label: 'I take them daily' },
        { id: 'sometimes', label: 'I sometimes forget' },
        { id: 'rarely', label: 'I rarely take them' }
      ]
    }
  ],
  resultMap: [
    {
      title: 'Mitolyn may be right for you.',
      text: 'Based on your profile, Mitolyn’s blend of natural ingredients could support your metabolism and energy goals.',
      ctaText: 'Check Availability'
    }
  ]
};

const mitolynEn: ProductTranslation = {
  name: 'Mitolyn',
  heroHeadline: 'Discover Mitolyn: A Comprehensive Review',
  subHeadline: 'Exploring the ingredients, benefits, and user experiences of this metabolism support formula.',
  bullets: [
    'Supports healthy metabolism naturally',
    'Contains 6 clinically studied alpine nutrients',
    'Manufactured in an FDA-registered, GMP-certified facility',
    'Soy-free, dairy-free, and non-GMO',
    'Backed by a 60-day money-back guarantee'
  ],
  ctaLabel: 'Check Availability',
  badges: ['Natural Ingredients', 'GMP Certified', 'Made in USA'],
  faqs: [
    {
      q: 'What is Mitolyn?',
      a: 'Mitolyn is a dietary supplement designed to support healthy metabolism using a blend of natural ingredients. It is formulated to target low inner body temperature, a factor linked to unexplained weight gain.'
    },
    {
      q: 'Is Mitolyn safe?',
      a: 'Mitolyn contains 100% natural and safe ingredients. It is manufactured in the USA in an FDA-registered and GMP-certified facility. As with any supplement, consult your physician before use if you have a medical condition.'
    },
    {
      q: 'How should I take Mitolyn?',
      a: 'Take one capsule of Mitolyn with a big glass of water every day. Its bespoke proprietary blend of natural ingredients will get to work dissolving fat for you even when sleeping.'
    },
    {
      q: 'What if it doesn’t work for me?',
      a: 'Mitolyn comes with a 60-day money-back guarantee. If you are not satisfied with your results, you can request a full refund within 60 days of purchase.'
    }
  ],
  reviews: [
    {
      name: 'Eleanor J.',
      rating: 5,
      date: 'Verified Purchase',
      text: 'I’ve been taking Mitolyn for about 3 weeks now. I feel more energetic throughout the day and my clothes fit better. Very happy with the purchase.'
    },
    {
      name: 'Mark T.',
      rating: 4.5,
      date: 'Verified Purchase',
      text: 'Good product. Delivery was fast. It’s easy to take and I haven’t experienced any side effects. Seems to be helping with my metabolism.'
    },
    {
      name: 'Sarah L.',
      rating: 5,
      date: 'Verified Purchase',
      text: 'Finally found something that works for me. I love that it’s natural and non-GMO. Highly recommend trying it out.'
    }
  ],
  quiz: commonQuiz,
  videoReview: {
    provider: 'youtube',
    id: 'PSd-VG31tcE', // Default ID, will be overridden by Edge Config if implemented in component
    title: 'Mitolyn Independent Review'
  }
};

export const products: Product[] = [
  {
    slug: 'mitolyn',
    officialUrl: '/api/out?slug=mitolyn', // Point to internal redirect
    translations: {
      en: mitolynEn
    }
  }
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
