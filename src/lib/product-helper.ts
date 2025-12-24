import { getCampaignConfig, ProductConfig } from '@/lib/config';

// Re-export type for compatibility
export type Product = ProductConfig;

export async function getProductWithConfig(slug: string): Promise<Product | undefined> {
  const config = await getCampaignConfig();
  
  // Directly return the product from config
  const productConfig = config.products[slug];
  
  if (!productConfig) return undefined;

  // Clone to avoid mutation issues (though less likely here)
  const product = JSON.parse(JSON.stringify(productConfig));

  // Ensure videoReview is populated if youtube_review_id is present but videoReview is missing
  if (product.youtube_review_id && !product.videoReview) {
    product.videoReview = {
      provider: 'youtube',
      id: product.youtube_review_id,
      title: `${product.name} Review`
    };
  }
  
  // If youtube_review_id is explicitly empty string, ensure videoReview is undefined
  if (product.youtube_review_id === '') {
    delete product.videoReview;
  }

  return product;
}
