import { createClient } from '@vercel/kv';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function deepCleanup() {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
        console.error('Missing KV credentials');
        process.exit(1);
    }

    const kv = createClient({ url, token });
    console.log('🧹 Starting Deep Cleanup (Untitled & Ghosts)...');

    try {
        const config: any = await kv.get('campaign_config') || {};
        if (!config.products) {
            console.log('No products found.');
            return;
        }

        let deletedCount = 0;
        const products = config.products;
        
        Object.keys(products).forEach(key => {
            const p = products[key];
            
            // Criteria for Deletion
            const name = p.name || '';
            const isUntitled = name === 'Untitled Product' || name === 'New Product' || name.includes('Product 17');
            const isGhost = key.startsWith('other:') || key.startsWith('undefined:');
            const isBadVertical = p.vertical === 'other' || p.vertical === 'general';
            
            // Delete if Untitled OR (Ghost AND Bad Vertical)
            if (isUntitled || (isGhost && isBadVertical)) {
                console.log(`❌ Deleting Garbage: ${key} (${p.name})`);
                delete products[key];
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            config.products = products;
            await kv.set('campaign_config', config);
            console.log(`✅ Saved config. Removed ${deletedCount} bad records.`);
        } else {
            console.log('✨ No garbage found. Database is clean.');
        }

    } catch (e) {
        console.error('Error during cleanup:', e);
    }
}

deepCleanup();
