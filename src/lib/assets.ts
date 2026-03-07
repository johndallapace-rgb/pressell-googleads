import { kv } from './config';

export type AssetType = 'image' | 'video';

export interface Asset {
    id: string;
    productId: string; // Slug (e.g., 'mitolyn')
    productName: string; // Display Name (e.g., 'Mitolyn')
    type: AssetType;
    url: string;
    label: string; // e.g., 'White Background', 'Amazon Main'
    notes: string; // e.g., 'CTR 3%'
    createdAt: number;
}

const ASSETS_KEY = 'assets_library';

export async function getAssets(): Promise<Asset[]> {
    if (!kv) return [];
    try {
        const assets = await kv.get<Asset[]>(ASSETS_KEY);
        return assets || [];
    } catch (e) {
        console.error('Failed to fetch assets:', e);
        return [];
    }
}

export async function addAsset(asset: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset | null> {
    if (!kv) return null;
    try {
        const assets = await getAssets();
        
        // CHECK DUPLICATES: Same Product + Same URL
        const exists = assets.find(a => 
            a.productId === asset.productId && 
            a.url === asset.url
        );
        
        if (exists) {
            // Optional: Update last used or move to top?
            // For now, just return existing to avoid duplication
            return exists;
        }

        const newAsset: Asset = {
            ...asset,
            id: crypto.randomUUID(),
            createdAt: Date.now()
        };
        // Add to beginning
        const updated = [newAsset, ...assets];
        await kv.set(ASSETS_KEY, updated);
        return newAsset;
    } catch (e) {
        console.error('Failed to add asset:', e);
        return null;
    }
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<boolean> {
    if (!kv) return false;
    try {
        const assets = await getAssets();
        const index = assets.findIndex(a => a.id === id);
        if (index === -1) return false;

        assets[index] = { ...assets[index], ...updates };
        await kv.set(ASSETS_KEY, assets);
        return true;
    } catch (e) {
        console.error('Failed to update asset:', e);
        return false;
    }
}

export async function deleteAsset(id: string): Promise<boolean> {
    if (!kv) return false;
    try {
        const assets = await getAssets();
        const filtered = assets.filter(a => a.id !== id);
        await kv.set(ASSETS_KEY, filtered);
        return true;
    } catch (e) {
        console.error('Failed to delete asset:', e);
        return false;
    }
}
