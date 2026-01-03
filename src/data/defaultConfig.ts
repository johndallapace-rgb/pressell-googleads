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
    }
  }
};
