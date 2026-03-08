const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Trae Architecture Snapshot Generator
 * 
 * Purpose: Automatically scan the project structure and generate a comprehensive
 * snapshot of routes, APIs, flows, and key files for debugging and sharing.
 */

const OUTPUT_DIR = path.resolve(process.cwd(), 'debug');
const LOG_DIR = path.resolve(process.cwd(), 'logs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ------------------------------------------------------------------
// 1. Structure Scanner
// ------------------------------------------------------------------

function scanDirectory(dir, pattern = null) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(scanDirectory(filePath, pattern));
        } else {
            if (!pattern || pattern.test(file)) {
                results.push(filePath);
            }
        }
    });
    return results;
}

function getRoutes() {
    const appDir = path.resolve(process.cwd(), 'src/app');
    const files = scanDirectory(appDir, /(page|route)\.(tsx|ts)$/);
    
    return files.map(f => {
        const rel = path.relative(appDir, f).replace(/\\/g, '/');
        const type = rel.endsWith('page.tsx') ? 'PAGE' : 'API';
        const route = '/' + rel.replace(/\/(page|route)\.(tsx|ts)$/, '').replace(/\[([^\]]+)\]/g, ':$1');
        return { type, route, file: 'src/app/' + rel };
    });
}

function detectFlows(files) {
    const flows = {};
    const keywords = [
        'saveProduct', 'ensureCanonicalKeys', 'checkLinks', 
        'cleanupGhostKeys', 'scale', 'auto-create', 'generate-global',
        'updateCampaignConfig', 'kv.set', 'dual-write'
    ];

    files.forEach(f => {
        try {
            const content = fs.readFileSync(f, 'utf-8');
            keywords.forEach(k => {
                if (content.includes(k)) {
                    if (!flows[k]) flows[k] = [];
                    flows[k].push(path.relative(process.cwd(), f).replace(/\\/g, '/'));
                }
            });
        } catch (e) {
            // ignore
        }
    });
    return flows;
}

// ------------------------------------------------------------------
// 2. Generators
// ------------------------------------------------------------------

function generateSystemStructure() {
    console.log('Generating system-structure.json...');
    
    const routes = getRoutes();
    const libFiles = scanDirectory(path.resolve(process.cwd(), 'src/lib'), /\.(ts|tsx)$/);
    const componentFiles = scanDirectory(path.resolve(process.cwd(), 'src/components'), /\.(ts|tsx)$/);
    
    const allFiles = [...routes.map(r => path.resolve(process.cwd(), r.file)), ...libFiles, ...componentFiles];
    const flowMap = detectFlows(allFiles);

    const structure = {
        meta: {
            generatedAt: new Date().toISOString(),
            projectName: 'pressell-googleads',
            nodeVersion: process.version,
        },
        git: {
            commit: getGitCommit(),
            branch: getGitBranch()
        },
        routes: {
            admin: routes.filter(r => r.route.includes('/admin')),
            api: routes.filter(r => r.type === 'API'),
            public: routes.filter(r => !r.route.includes('/admin') && r.type === 'PAGE')
        },
        persistence: {
            strategy: 'Vercel KV (Redis) + Dual-Write (Canonical + Prefixed)',
            canonicalSave: 'src/lib/config.ts -> saveProduct',
            indexUpdate: 'src/lib/config.ts -> updateCampaignConfig',
            selfHeal: 'src/lib/config.ts -> ensureCanonicalKeys'
        },
        ads_ai: {
            module: fs.existsSync(path.resolve(process.cwd(), 'src/lib/ads-ai')),
            functions: [
                'analyzeCampaignPerformance',
                'generateImprovedAds',
                'suggestNegativeKeywords',
                'suggestNewKeywords',
                'suggestTargetingImprovements'
            ]
        },
        flows: flowMap,
        envVars: getEnvVarNames(),
        logging: {
            location: './logs/',
            strategy: 'Local JSON Lines (Dev) / Console (Prod)',
            categories: [
                'admin-actions', 'save-product', 'public-route', 
                'checker', 'self-heal', 'repair', 'global-scale', 'errors'
            ]
        }
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, 'system-structure.json'), JSON.stringify(structure, null, 2));
}

function generateSystemFlows() {
    console.log('Generating system-flows.md...');
    
    const content = `# System Flow Map
Generated: ${new Date().toISOString()}

## Core Data Flows

### 1. Product Creation (Canonical Save)
All creation entry points (Manual, Auto-Pilot, Scale) converge to a single persistence layer.
- **Function**: \`saveProduct(product, source)\` in \`src/lib/config.ts\`
- **Persistence**: 
  - Writes \`<vertical>:<slug>\` (Primary)
  - Writes \`<slug>\` (Canonical Fallback)
  - Updates \`campaign_config\` (Index)
- **Safety**: Uses distributed locking (\`lock:save:...\`) to prevent race conditions.

### 2. Public Resolution & Self-Healing
- **Route**: \`src/app/[...slug]/page.tsx\`
- **Logic**:
  1. Detects vertical via Host/Subdomain
  2. Tries KV lookup (Primary -> Canonical -> Index)
  3. If found but canonical keys missing -> **Triggers Self-Heal**
  4. Renders template (Editorial, Story, etc.)

### 3. Admin & Diagnostics
- **Dashboard**: Lists products from \`campaign_config\` index.
- **Checker**: \`check-links\` API pings public URLs.
- **Repair**: \`cleanup\` API scans index and ensures canonical keys exist.

### 4. AI Ads Optimization (Planned)
- **Module**: \`src/lib/ads-ai/index.ts\`
- **Status**: Architecture Ready / Logic Disabled
- **Entry Point**: Admin -> Ads Performance Manager -> "Analyze Performance" (Coming Soon)

## Entry Points Map

| Feature | Entry Route | Logic Handler | Save Source |
| :--- | :--- | :--- | :--- |
| **Market Trends** | \`/admin/trends\` | \`auto-create/route.ts\` | 'Auto-Pilot' |
| **New Pre-Sell** | \`/admin/products/new\` | \`products/route.ts\` | 'Manual-Create' |
| **Edit Product** | \`/admin/products/[slug]\` | \`products/save/route.ts\` | 'Admin-Save' |
| **Global Scale** | \`/admin/scale\` | \`scale/route.ts\` | 'Global-Scale' |
| **Repair Keys** | \`/admin/products\` | \`cleanup/route.ts\` | 'Admin-Repair-All' |

## Debugging Guide

- **404 on Public URL**: Check \`logs/*-public-route.log\` and \`logs/*-self-heal.log\`.
- **Save Failed**: Check \`logs/*-save-product.log\` for lock contention or KV errors.
- **Checker Mismatch**: Run "Repair Keys" in Admin to sync Index with KV.
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'system-flows.md'), content);
}

function generateDebugPack() {
    console.log('Generating debug-pack.json...');
    
    const pack = {
        meta: {
            generatedAt: new Date().toISOString(),
            docs: 'Share system-structure.json and system-flows.md for context.'
        },
        logs: {
            location: LOG_DIR,
            files: fs.existsSync(LOG_DIR) ? fs.readdirSync(LOG_DIR) : []
        },
        scenarios: {
            "public_404": {
                description: "Product not found on public URL",
                files: ["public-route.log", "save-product.log", "self-heal.log"],
                action: "Check if canonical key exists in save log. Check if self-heal triggered."
            },
            "save_error": {
                description: "Product not saving or updating",
                files: ["save-product.log", "errors.log"],
                action: "Check for lock contention or KV connection errors."
            },
            "checker_mismatch": {
                description: "Admin says Online, Public says 404",
                files: ["checker.log", "repair.log"],
                action: "Run Repair Keys in Admin."
            }
        }
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, 'debug-pack.json'), JSON.stringify(pack, null, 2));
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function getGitCommit() {
    try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch (e) { return 'unknown'; }
}

function getGitBranch() {
    try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim(); } catch (e) { return 'unknown'; }
}

function getEnvVarNames() {
    // Scan config.ts or .env.local (if readable) for process.env usage
    // Here we just return known keys relevant to the system
    return [
        'KV_REST_API_URL', 'KV_REST_API_TOKEN', 
        'REDIS_URL', 'REDIS_TOKEN', 
        'GEMINI_API_KEY', 'ADMIN_TOKEN',
        'ENABLE_LOCAL_LOGS', 'RESCUE_MODE'
    ];
}

// ------------------------------------------------------------------
// Main Execution
// ------------------------------------------------------------------

function run() {
    console.log('Starting Architecture Snapshot...');
    try {
        generateSystemStructure();
        generateSystemFlows();
        generateDebugPack();
        console.log(`\nSnapshot complete! Files generated in: ${OUTPUT_DIR}`);
        console.log(`- system-structure.json`);
        console.log(`- system-flows.md`);
        console.log(`- debug-pack.json`);
    } catch (e) {
        console.error('Snapshot generation failed:', e);
        process.exit(1);
    }
}

run();
