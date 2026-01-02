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
    }
  }
};
