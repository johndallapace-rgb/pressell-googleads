import { product, Product } from '@/data/products';
import { getCampaignConfig } from '@/lib/config';

export async function getProductWithConfig(slug: string): Promise<Product | undefined> {
  // Since we are single product mode, verify slug matches
  if (slug !== 'mitolyn') return undefined;

  const config = await getCampaignConfig();
  const productConfig = config.products[slug];

  // Clone product to avoid mutating shared state
  const newProduct: Product = JSON.parse(JSON.stringify(product));

  if (productConfig) {
    // Override fields
    if (productConfig.youtube_review_id && newProduct.videoReview) {
      newProduct.videoReview.id = productConfig.youtube_review_id;
    }
    // Also override affiliate/official URLs if present in config, 
    // though the component usually reads from config or uses the API route.
    // The API route reads from config, so `officialUrl` in the object 
    // pointing to `/api/out` is correct.
  }
  return newProduct;
}
