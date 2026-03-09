import { ProductConfig } from '@/lib/config';

// Define core intents for presell generation
export const PRESELL_INTENTS = [
    { slug: 'review', label: 'Review' },
    { slug: 'results', label: 'Results' },
    { slug: 'side-effects', label: 'Side Effects' },
    { slug: 'benefits', label: 'Benefits' },
    { slug: 'price', label: 'Price' },
    { slug: 'official-website', label: 'Official Website' },
    { slug: 'customer-reviews', label: 'Customer Reviews' },
    { slug: 'ingredients', label: 'Ingredients' },
    { slug: 'before-after', label: 'Before & After' },
    { slug: 'complaints', label: 'Complaints' }
];

export interface GeneratedPresell extends ProductConfig {
    is_generated: boolean;
    intent: string;
    base_slug: string;
}

export function generatePresellSlug(baseSlug: string, intent: string): string {
    return `${baseSlug}-${intent}`;
}

export function createPresellFromBase(
    baseProduct: ProductConfig, 
    intent: string, 
    customSlug?: string
): GeneratedPresell {
    const newSlug = customSlug || generatePresellSlug(baseProduct.slug, intent);
    
    // Clone base product to inherit settings
    const newPresell: GeneratedPresell = {
        ...JSON.parse(JSON.stringify(baseProduct)), // Deep clone
        slug: newSlug,
        name: `${baseProduct.name} - ${intent.charAt(0).toUpperCase() + intent.slice(1)}`,
        headline: `${baseProduct.name} ${intent.charAt(0).toUpperCase() + intent.slice(1)}: Everything You Need To Know`,
        is_generated: true,
        intent: intent,
        base_slug: baseProduct.slug,
        status: 'active', // Default to active? Or draft? Requirement says "active product entry"
        
        // IMPORTANT: Ensure tracking/affiliate settings are inherited
        // They are already inherited via deep clone, but we explicitly list them for clarity
        // affiliate_url, support_email, template, etc.
        
        // Reset specific fields that should be unique or re-generated
        // For phase 1, we just clone content. Later AI can rewrite it.
    };

    return newPresell;
}
