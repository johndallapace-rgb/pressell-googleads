import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCampaignConfig } from '@/lib/config';
import { GoogleAds } from '@/lib/googleAds';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const token = request.cookies.get('admin_token')?.value;
        const authHeader = request.headers.get('Authorization');
        if ((!token || !(await verifyToken(token))) && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productSlug, customerId, adsData } = body;

        if (!customerId) {
            return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
        }

        // 2. Fetch Product Data
        let productData;
        let finalUrl;
        let productKey: string | undefined;
        
        if (productSlug) {
            const config = await getCampaignConfig();
            // Search in all products
            productKey = Object.keys(config.products || {}).find(k => k.endsWith(`:${productSlug}`) || k === productSlug);
            
            if (!productKey) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            
            productData = config.products![productKey];
            
            // Construct Final URL (Presell Page)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://topproductofficial.com';
            const subdomain = productData.subdomain || 'health';
            finalUrl = `https://${subdomain}.topproductofficial.com/${productData.slug}`;
        } else {
             // Allow passing direct ad data in body later if needed
             return NextResponse.json({ error: 'Direct ad data not supported yet, provide productSlug' }, { status: 400 });
        }

        // 3. Prepare Ad Data
        const campaignName = `[AUTO] ${productData.name} - ${new Date().toISOString().split('T')[0]}`;
        const adGroupName = 'General Interest';
        const budgetAmount = 50000000; // 50.00 standard daily budget (micros)
        const cpcBid = 2000000; // 2.00 max CPC (micros)

        // Validate Headlines/Descriptions Length
        // PRIORITY: Use passed adsData if available (Real-time generated)
        const sourceHeadlines = adsData?.headlines || productData.ads?.campaigns?.[0]?.adGroups?.[0]?.ads?.[0]?.headlines || [];
        const sourceDescriptions = adsData?.descriptions || productData.ads?.campaigns?.[0]?.adGroups?.[0]?.ads?.[0]?.descriptions || [];

        // Helper to sanitize and trim
        const sanitize = (text: string, maxLen: number) => {
            let clean = text.replace(/[!.]+$/, '').trim(); // Remove trailing punctuation
            if (clean.length > maxLen) {
                clean = clean.substring(0, maxLen).trim();
            }
            return clean;
        };

        const validHeadlines = sourceHeadlines
            .map((h: string) => sanitize(h, 30))
            .filter((h: string) => h.length > 0 && h.length <= 30)
            .slice(0, 15);
            
        const validDescriptions = sourceDescriptions
            .map((d: string) => sanitize(d, 90))
            .filter((d: string) => d.length > 0 && d.length <= 90)
            .slice(0, 4);

        // Emergency Injection if still insufficient
        if (validHeadlines.length < 3) {
            console.warn('[GoogleAds] Injecting emergency headlines...');
            validHeadlines.push('Official Site', 'Check Availability', 'Limited Offer');
            // Ensure we don't exceed 15
            while(validHeadlines.length > 15) validHeadlines.pop();
        }

        if (validHeadlines.length < 3 || validDescriptions.length < 2) {
            return NextResponse.json({ 
                error: 'Insufficient valid ad copy even after sanitization.',
                details: { h: validHeadlines.length, d: validDescriptions.length }
            }, { status: 400 });
        }

        // AUTO-SAVE: If adsData was provided (new generation), save back to product config
        if (adsData && productKey) {
            try {
                // We update the product's ads structure
                if (!productData.ads) productData.ads = { status: 'ready', campaigns: [] };
                
                // Ensure deep structure exists
                // Simplified overwrite for MVP
                productData.ads = {
                    status: 'ready',
                    campaigns: [{
                        campaignName: campaignName,
                        adGroups: [{
                            name: adGroupName,
                            keywords: [`${productData.name} reviews`, `buy ${productData.name}`], // Keep default keywords
                            ads: [{
                                headlines: validHeadlines,
                                descriptions: validDescriptions,
                                finalUrl: finalUrl
                            }]
                        }]
                    }]
                };

                const { saveProduct } = await import('@/lib/config');
                await saveProduct(productData, 'Google-Ads-AutoSave');
                console.log(`[GoogleAds] Auto-saved generated ads for ${productData.slug}`);
            } catch (saveErr) {
                console.warn('[GoogleAds] Failed to auto-save generated ads', saveErr);
            }
        }


        const keywords = productData.ads?.campaigns?.[0]?.adGroups?.[0]?.keywords || [`${productData.name} reviews`, `buy ${productData.name}`];

        console.log(`[GoogleAds] Creating Campaign: ${campaignName} for ${finalUrl}`);

        // 4. Execution Pipeline
        // 4.1 Create Budget
        const budgetResource = await GoogleAds.createBudget(customerId, `Budget - ${campaignName}`, budgetAmount);
        console.log(`[GoogleAds] Budget Created: ${budgetResource}`);

        // 4.2 Create Campaign
        const campaignResource = await GoogleAds.createCampaign(customerId, budgetResource, campaignName);
        console.log(`[GoogleAds] Campaign Created: ${campaignResource}`);

        // 4.3 Create AdGroup
        const adGroupResource = await GoogleAds.createAdGroup(customerId, campaignResource, adGroupName, cpcBid);
        console.log(`[GoogleAds] AdGroup Created: ${adGroupResource}`);

        // 4.4 Add Keywords
        await GoogleAds.addKeywords(customerId, adGroupResource, keywords);
        console.log(`[GoogleAds] Keywords Added: ${keywords.length}`);

        // 4.5 Publish Ad
        const adResource = await GoogleAds.publishAd(customerId, adGroupResource.split('/').pop()!, { // extract ID from resource name
            headlines: validHeadlines,
            descriptions: validDescriptions,
            finalUrl: finalUrl
        });
        console.log(`[GoogleAds] Ad Published: ${adResource}`);

        return NextResponse.json({
            success: true,
            campaign: campaignResource,
            adGroup: adGroupResource,
            ad: adResource,
            url: finalUrl
        });

    } catch (error: any) {
        console.error('[GoogleAds] Creation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
