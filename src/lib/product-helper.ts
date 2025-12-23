import { getProduct, Product } from '@/data/products';
import { getCampaignConfig } from '@/lib/config';

export async function getProductWithConfig(slug: string): Promise<Product | undefined> {
  const product = getProduct(slug);
  if (!product) return undefined;

  const config = await getCampaignConfig();
  const productConfig = config.products[slug];

  // Clone product to avoid mutating shared state
  const newProduct = JSON.parse(JSON.stringify(product));

  if (productConfig) {
    // Override fields
    // We only support 'en' for now as per requirements
    if (productConfig.youtube_review_id && newProduct.translations.en.videoReview) {
      newProduct.translations.en.videoReview.id = productConfig.youtube_review_id;
    }
  }
  return newProduct;
}
