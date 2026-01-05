const https = require('https');
const fs = require('fs');

const SITE_URL = process.argv[2] || 'http://localhost:3000';
const AFFILIATE_ID = process.argv[3] || 'JohnPace';

console.log(`\n🩺 Health Monitor Started`);
console.log(`Target: ${SITE_URL}`);
console.log(`Looking for Affiliate ID: ${AFFILIATE_ID}\n`);

// List of slugs to check (mocked for now, in real scenario fetch from API)
const slugsToCheck = ['advanced-amino-formula'];

async function checkUrl(slug) {
    const url = `${SITE_URL}/${slug}`;
    console.log(`Checking ${slug}...`);

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => { data += chunk; });
            
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.log(`❌ ${slug}: HTTP ${res.statusCode}`);
                    resolve(false);
                    return;
                }

                if (data.includes(AFFILIATE_ID)) {
                    console.log(`✅ ${slug}: Affiliate Link Verified!`);
                    resolve(true);
                } else {
                    console.error(`⚠️ ${slug}: Affiliate ID NOT FOUND in response!`);
                    // Check if there is any link at all
                    if (data.includes('digistore24.com') || data.includes('clickbank.net')) {
                         console.log(`   (Found generic affiliate links, but not matching ID)`);
                    } else {
                         console.log(`   (No affiliate links found)`);
                    }
                    resolve(false);
                }
            });

        }).on('error', (err) => {
            console.error(`❌ ${slug}: Network Error - ${err.message}`);
            resolve(false);
        });
    });
}

(async () => {
    let successCount = 0;
    for (const slug of slugsToCheck) {
        const passed = await checkUrl(slug);
        if (passed) successCount++;
    }

    console.log(`\nSummary: ${successCount}/${slugsToCheck.length} passed.`);
    
    if (successCount === slugsToCheck.length) {
        console.log(`🚀 All systems go! Ready for traffic.`);
        process.exit(0);
    } else {
        console.error(`⛔ Some checks failed. Do not scale ads.`);
        process.exit(1);
    }
})();
