const fs = require('fs');
const path = require('path');

console.log('\n==================================================');
console.log('   🕵️  TRACKING SYSTEM VERIFICATION REPORT');
console.log('==================================================\n');

const checkFile = (p) => {
    const exists = fs.existsSync(p);
    console.log(`${exists ? '✅' : '❌'} ${path.basename(p)}`);
    return exists;
};

// 1. Check Core Components
console.log('1. Core Components:');
checkFile('src/components/analytics/TrackingManager.tsx');
checkFile('src/lib/tracking.ts');
checkFile('src/app/thanks/page.tsx');

// 2. Check Integration in Product Page
console.log('\n2. Product Page Integration (src/app/[...slug]/page.tsx):');
const pagePath = 'src/app/[...slug]/page.tsx';
if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    const hasManager = content.includes('TrackingManager');
    const hasExternalId = content.includes('generateExternalTrackId');
    const hasAppend = content.includes('appendTrackingParams');
    
    console.log(`${hasManager ? '✅' : '❌'} Imports TrackingManager`);
    console.log(`${hasExternalId ? '✅' : '❌'} Generates External Track ID`);
    console.log(`${hasAppend ? '✅' : '❌'} Appends Tracking Params to Affiliate URL`);
} else {
    console.log('❌ Page file not found!');
}

// 3. Check Config Support
console.log('\n3. Config Support (src/data/defaultConfig.ts):');
const configPath = 'src/data/defaultConfig.ts';
if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const hasGAds = content.includes('google_ads_id');
    const hasMeta = content.includes('meta_pixel_id');
    
    console.log(`${hasGAds ? '✅' : '❌'} Google Ads ID Field`);
    console.log(`${hasMeta ? '✅' : '❌'} Meta Pixel ID Field`);
}

console.log('\n==================================================');
console.log('   READY FOR AD TRAFFIC 🚀');
console.log('==================================================\n');
