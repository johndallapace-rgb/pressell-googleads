export type VideoReview = 
  | { provider: 'youtube'; id: string; thumbnailUrl?: string; title?: string };

export type Product = {
  slug: string;
  name: string;
  officialUrl: string;
  heroHeadline: string;
  subHeadline: string;
  bullets: string[];
  ctaLabel: string;
  badges: string[];
  faqs: { q: string; a: string }[];
  reviews: { name: string; rating: number; date: string; text: string }[];
  videoReview?: VideoReview;
  
  // Editorial Content Sections
  whatIs: { title: string; content: string[] };
  howItWorks: { title: string; content: string[] };
  ingredients: { title: string; items: { name: string; description: string }[] };
  prosCons: { pros: string[]; cons: string[] };
};

export const mitolyn: Product = {
  slug: 'mitolyn',
  name: 'Mitolyn',
  officialUrl: '/api/out?slug=mitolyn',
  heroHeadline: 'Mitolyn Review: Does It Really Support Healthy Metabolism?',
  subHeadline: 'An independent analysis of the ingredients, benefits, and potential side effects.',
  bullets: [
    'Supports metabolic health',
    'Natural ingredients',
    'Manufactured in GMP facility',
    '60-Day Money Back Guarantee'
  ],
  ctaLabel: 'Check Availability',
  badges: ['Natural Formula', 'GMP Certified', 'Made in USA'],
  whatIs: {
    title: 'What Is Mitolyn?',
    content: [
      'Mitolyn is a dietary supplement marketed as a metabolic support formula. It is designed to target low inner body temperature, which recent research suggests may be a common factor in unexplained weight gain.',
      'The formula consists of a proprietary blend of natural ingredients, including alpine nutrients and plant extracts, intended to optimize metabolic function and support energy levels.'
    ]
  },
  howItWorks: {
    title: 'How Does Mitolyn Work?',
    content: [
      'Mitolyn works by addressing the underlying cause of slow metabolism: low inner body temperature. When inner body temperature is normal, calorie burning is fast and effortless.',
      'By supplying the body with specific nutrients known to support thermogenesis, Mitolyn aims to electrify your sleeping metabolism into full fat-burning, energy-boosting mode.'
    ]
  },
  ingredients: {
    title: 'Key Ingredients',
    items: [
      { name: 'Maqui Berry', description: 'Rich in antioxidants, supports heart health and healthy blood sugar levels.' },
      { name: 'Rhodiola', description: 'An adaptogen that helps reduce stress and supports brain health.' },
      { name: 'Haematococcus', description: 'Contains astaxanthin, supports immune function and joint health.' },
      { name: 'Amla', description: 'Supports digestion and healthy cholesterol levels.' },
      { name: 'Theobroma Cacao', description: 'Supports healthy blood flow and cardiovascular health.' },
      { name: 'Schisandra', description: 'Supports liver health and mental clarity.' }
    ]
  },
  prosCons: {
    pros: [
      'Natural, non-GMO ingredients',
      'No stimulants or habit-forming substances',
      'Manufactured in an FDA-registered, GMP-certified facility',
      'Backed by a 60-day money-back guarantee'
    ],
    cons: [
      'Only available for purchase online',
      'Results may vary from person to person',
      'Stock may be limited due to high demand'
    ]
  },
  faqs: [
    {
      q: 'Is Mitolyn safe?',
      a: 'Mitolyn is formulated with natural ingredients and is manufactured in a facility that follows GMP (Good Manufacturing Practice) guidelines. However, as with any supplement, it is recommended to consult with a healthcare professional before use.'
    },
    {
      q: 'How do I take it?',
      a: 'The recommended dosage is one capsule daily with a large glass of water. It is designed to work while you sleep.'
    },
    {
      q: 'What if it doesn’t work for me?',
      a: 'The manufacturer offers a 60-day money-back guarantee. If you are not satisfied, you can request a refund.'
    }
  ],
  reviews: [
    {
      name: 'Sarah J.',
      rating: 5,
      date: 'Verified Purchase',
      text: 'I was skeptical at first, but after a month, I feel more energetic and lighter. It fits easily into my routine.'
    },
    {
      name: 'Michael T.',
      rating: 4,
      date: 'Verified Purchase',
      text: 'Good product. Shipping was fast. I haven’t seen drastic changes yet, but I feel better overall.'
    },
    {
      name: 'Emily R.',
      rating: 5,
      date: 'Verified Purchase',
      text: 'Love that it is natural. No jitters or weird side effects. Highly recommend giving it a try.'
    }
  ],
  videoReview: {
    provider: 'youtube',
    id: 'PSd-VG31tcE',
    title: 'Mitolyn Independent Review'
  }
};

export const product = mitolyn; // Single product export
