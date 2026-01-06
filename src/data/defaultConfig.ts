import { CampaignConfig } from '@/lib/config';

// EMPTY DEFAULT CONFIG
// This ensures that when we switch to Vercel KV, we start with a clean slate.
// The hardcoded products (Mitolyn, Amino, Tube Mastery) are removed.

export const defaultConfig: CampaignConfig = {
  active_product_slug: '',
  default_lang: 'en',
  products: {} // Empty!
};
