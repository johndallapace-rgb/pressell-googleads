const https = require('http'); // using http for localhost

const ADMIN_TOKEN = 'secure-token-123'; // Mock or env
const SLUG = process.argv[2] || 'advanced-amino-formula';

console.log(`\n🌍 Starting Global Validation for: ${SLUG}`);
console.log(`Connecting to Local Generator API...\n`);

const data = JSON.stringify({ slug: SLUG });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/generate-global',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (d) => {
    body += d;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
        const result = JSON.parse(body);
        console.log(`✅ Generation Complete!`);
        console.log(`\n----------------------------------------`);
        console.log(`🇪🇺 EUROPEAN PRODUCTION LINKS (Projected):`);
        console.log(`----------------------------------------`);
        
        result.generated.forEach(slug => {
            // Slug is like "amino-de"
            const parts = slug.split('-');
            const lang = parts.pop(); // "de"
            const base = parts.join('-'); // "amino" (simplified) or "advanced-amino-formula"
            
            // Reconstruct the clean URL based on middleware logic
            // amino-de -> /de/amino
            // But wait, slug was "advanced-amino-formula-de"
            const originalSlug = slug.substring(0, slug.lastIndexOf('-'));
            
            console.log(`🇩🇪/🇫🇷 [${lang.toUpperCase()}] https://health.topproductofficial.com/${lang}/${originalSlug}`);
        });

        console.log(`\n----------------------------------------`);
        console.log(`🔍 LOCAL PREVIEW LINKS:`);
        result.preview_links.forEach(link => {
             console.log(`👉 ${link}`);
        });
        
        console.log(`\n----------------------------------------`);
        console.log(`⚠️  Next Step: Run 'npm run ship' to deploy to Vercel.`);
    } else {
        console.error(`❌ Error: ${res.statusCode}`);
        console.error(body);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Connection Failed: ${error.message}`);
  console.log(`(Make sure 'npm run dev' is running in another terminal)`);
});

req.write(data);
req.end();
