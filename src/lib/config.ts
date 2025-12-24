import { createClient } from '@vercel/edge-config';

// Only create client if EDGE_CONFIG is present to avoid build errors
export const configClient = process.env.EDGE_CONFIG 
  ? createClient(process.env.EDGE_CONFIG) 
  : null;

export type VideoReview = 
  | { provider: 'youtube'; id: string; thumbnailUrl?: string; title?: string };

export type SeoConfig = {
  title: string;
  description: string;
};

export type ProductConfig = {
  slug: string;
  name: string;
  category: string;
  language: string;
  platform: string;
  status: 'active' | 'paused'; // Added status
  official_url: string;
  affiliate_url: string;
  review_url?: string;
  hero_image?: string;
  product_image?: string;
  cta_text: string;
  presell_style: 'health_editorial' | 'diy_review' | string;
  seo: SeoConfig;
  
  // Content Sections
  heroHeadline: string;
  subHeadline: string;
  bullets: string[];
  badges: string[];
  
  whatIs: { title: string; content: string[] };
  howItWorks: { title: string; content: string[] };
  prosCons: { pros: string[]; cons: string[] };
  faqs: { q: string; a: string }[];
  reviews: { name: string; rating: number; date: string; text: string }[];
  
  // Optional sections
  ingredients?: { title: string; items: { name: string; description: string }[] };
  whatYouGet?: { title: string; items: string[] };
  whoFor?: { title: string; content: string[] };
  
  // Legacy/Compatibility
  youtube_review_id?: string;
  videoReview?: VideoReview;
};

export interface CampaignConfig {
  active_product_slug: string;
  products: Record<string, ProductConfig>;
}

export const defaultConfig: CampaignConfig = {
  active_product_slug: 'mitolyn',
  products: {
    mitolyn: {
      slug: 'mitolyn',
      name: 'Mitolyn',
      category: 'health',
      language: 'en',
      platform: 'clickbank',
      status: 'active',
      official_url: process.env.NEXT_PUBLIC_OFFICIAL_URL || 'https://mitolyn.com/welcome/?hop=zzzzz&hopId=689154d7-cdcb-4751-8970-bcbe6f44c1fc',
      affiliate_url: process.env.NEXT_PUBLIC_AFFILIATE_URL || 'https://22ce2d09wbexoq6fts-b0b7ufm.hop.clickbank.net',
      review_url: 'https://www.youtube.com/watch?v=PSd-VG31tcE',
      youtube_review_id: 'PSd-VG31tcE',
      hero_image: '/images/mitolyn.svg',
      product_image: '/images/mitolyn.svg',
      cta_text: 'Check Availability on Official Website',
      presell_style: 'health_editorial',
      seo: {
        title: 'Mitolyn Review – Does It Really Work?',
        description: 'An independent editorial review of Mitolyn based on public information.'
      },
      heroHeadline: 'Mitolyn Review: Does It Really Support Healthy Metabolism?',
      subHeadline: 'An independent analysis of the ingredients, benefits, and potential side effects.',
      bullets: [
        'Supports metabolic health',
        'Natural ingredients',
        'Manufactured in GMP facility',
        '60-Day Money Back Guarantee'
      ],
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
      ]
    },
    tedswoodworking: {
      slug: 'tedswoodworking',
      name: 'Ted’s Woodworking',
      category: 'woodworking',
      language: 'en',
      platform: 'clickbank',
      status: 'active',
      official_url: 'https://tedsplansdiy.com/?hopId=95ee49b9-fb7a-407b-b814-4e4258db7b55',
      affiliate_url: 'https://857bciyateqyis2sn9-go91gb2.hop.clickbank.net',
      review_url: '',
      cta_text: 'See All Plans on the Official Website',
      presell_style: 'diy_review',
      seo: {
        title: 'Ted’s Woodworking Review – Is It Worth It?',
        description: 'A practical editorial review of Ted’s Woodworking plans.'
      },
      heroHeadline: 'Ted’s Woodworking Review – Is It Worth It?',
      subHeadline: 'An independent analysis of the most popular woodworking plans collection online.',
      bullets: [
        'Over 16,000 done-for-you plans',
        'Suitable for beginners & professionals',
        'Detailed diagrams & instructions',
        'Instant digital access'
      ],
      badges: ['16,000+ Plans', 'Instant Access', 'Best Seller'],
      whatIs: {
        title: 'What Is Ted’s Woodworking?',
        content: [
          'Ted’s Woodworking is a comprehensive digital library created by Ted McGrath, a certified master woodworker, trainer, and author. It claims to be the world\'s largest database of woodworking projects, offering over 16,000 step-by-step plans.',
          'Unlike standard magazines or generic online guides, this collection is designed to cover virtually every type of project imaginable—from small crafts to large outdoor furniture—providing detailed blueprints that anyone can follow.'
        ]
      },
      howItWorks: {
        title: 'How It Works',
        content: [
          'Upon purchase, you gain instant digital access to the member\'s area where you can browse, search, and download plans.',
          'Each plan comes with a detailed bill of materials, step-by-step instructions, and 3D diagrams. This eliminates the guesswork often associated with DIY projects, allowing you to buy the exact materials needed and follow a clear path to completion.'
        ]
      },
      whatYouGet: {
        title: 'What You Get Inside',
        items: [
          '16,000+ Step-By-Step Woodworking Plans',
          'DWG/CAD File Viewer',
          '150 Premium Woodworking Videos',
          'How-To Guides for Beginners',
          'Lifetime Free Updates'
        ]
      },
      whoFor: {
        title: 'Who Is This For?',
        content: [
          'Ted’s Woodworking is ideal for hobbyists who want to save time on design and focus on building. It serves beginners who need clear guidance and professionals looking for inspiration or specific blueprints.',
          'However, it may not be for you if you prefer designing everything from scratch or if you are looking for a physical book (this is a digital product).'
        ]
      },
      prosCons: {
        pros: [
          'Massive variety of projects (16,000+ plans)',
          'Suitable for all skill levels',
          'Includes material lists to save money and waste',
          '60-day money-back guarantee'
        ],
        cons: [
          'The sheer volume of plans can be overwhelming at first',
          'Digital-only format (PDFs/Videos)',
          'Some older plans might have lower resolution scans'
        ]
      },
      faqs: [
        {
          q: 'Is this a physical book?',
          a: 'No, Ted’s Woodworking is a digital product. You get instant access to PDFs and videos that you can view on your computer, tablet, or phone, or print out as needed.'
        },
        {
          q: 'Do I need expensive tools?',
          a: 'Not necessarily. The collection includes projects for various skill levels and toolsets. Many small projects can be built with basic hand tools.'
        },
        {
          q: 'Is there a guarantee?',
          a: 'Yes, the product comes with a 60-day money-back guarantee. If you are not satisfied with the plans, you can request a full refund.'
        }
      ],
      reviews: [
        {
          name: 'John D.',
          rating: 5,
          date: 'Verified Buyer',
          text: 'I’ve built a shed and a coffee table using these plans. The instructions were clear and saved me a lot of frustration.'
        },
        {
          name: 'Robert M.',
          rating: 4.5,
          date: 'Verified Buyer',
          text: 'Great value for the price. Some plans are better than others, but the variety is unbeatable.'
        },
        {
          name: 'David K.',
          rating: 5,
          date: 'Verified Buyer',
          text: 'As a beginner, I found the step-by-step guides extremely helpful. Highly recommended.'
        }
      ]
    }
  }
};

export async function getCampaignConfig(): Promise<CampaignConfig> {
  if (!configClient) {
    return defaultConfig;
  }
  
  try {
    const config = await configClient.get<CampaignConfig>('campaign_config');
    
    // Merge with default config to ensure structure exists
    if (config) {
      if (!config.products) config.products = {};
      
      // Ensure default products exist if not present (fallback)
      if (!config.products.mitolyn) config.products.mitolyn = defaultConfig.products.mitolyn;
      if (!config.products.tedswoodworking) config.products.tedswoodworking = defaultConfig.products.tedswoodworking;
      
      // Ensure status exists (fallback for older configs)
      Object.values(config.products).forEach(p => {
        if (!p.status) p.status = 'active';
      });

      return config;
    }
    
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching Edge Config:', error);
    return defaultConfig;
  }
}

export async function updateCampaignConfig(newConfig: CampaignConfig): Promise<boolean> {
  if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
    console.error('Missing VERCEL_API_TOKEN or EDGE_CONFIG_ID');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: 'campaign_config',
              value: newConfig,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating Edge Config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating Edge Config:', error);
    return false;
  }
}
