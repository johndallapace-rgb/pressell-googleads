const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'debug');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ------------------------------------------------------------------
// AI Architect Report Generator
// ------------------------------------------------------------------
function generateArchitectReport() {
    console.log('Generating AI Architect Report...');
    const content = `# AI Architect Report
Generated: ${new Date().toISOString()}

## System Overview
- **Project**: Pressell Google Ads
- **Framework**: Next.js (App Router)
- **Database**: Vercel KV (Redis)
- **State Strategy**: Dual-Write (Canonical + Prefixed Keys)
- **Observability**: Local Structured Logging (JSON Lines)

## Major Modules
1. **Product Management**: 
   - CRUD via Admin Dashboard
   - Dual-write persistence in \`src/lib/config.ts\`
   - Fallback resolution in \`src/app/[...slug]/page.tsx\`
   
2. **Google Ads Integration**:
   - Ads Manager & Performance Dashboard
   - AI Optimization Architecture (Placeholder) in \`src/lib/ads-ai\`
   
3. **Diagnostics & Self-Healing**:
   - Admin Checker (\`check-links\`)
   - Automatic Self-Heal on Public Access
   - Manual Repair via Admin

## Architectural Risks
- **Concurrency**: High write contention on popular products (Mitigated by Distributed Locks).
- **Edge Consistency**: Vercel KV eventual consistency might lag (Mitigated by 'revalidate=0' and direct KV calls).
- **File System Usage**: Local logging relies on Node.js runtime; Edge functions cannot write logs (Mitigated by runtime detection).

## Future Extension Points
- **AI Ads Optimization**: Logic prepared in \`src/lib/ads-ai\`.
- **Global Scaling**: Multi-language variants via \`src/lib/host.ts\`.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'architecture-report.md'), content);
}

// ------------------------------------------------------------------
// AI Bug Hunter Report (Placeholder)
// ------------------------------------------------------------------
function generateBugHunterReport() {
    console.log('Generating AI Bug Hunter Report...');
    const content = `# AI Bug Hunter Report
Generated: ${new Date().toISOString()}

## Recent Suspicious Activity
- **Logs Analyzed**: Check \`logs/errors.log\` and \`logs/checker.log\`.
- **Common Issues**: 
  - 404 on Public Routes (Check Self-Heal logs).
  - Checker Offline (Check User-Agent blocking or timeouts).
  - Save Lock Contention (Check \`save-product.log\`).

## Observability Gaps
- Client-side errors (Browser console) are not yet collected centrally.
- API Route timeouts (Vercel logs) are external to this report.

## Recommended Actions
- Run "Repair Keys" if products are missing.
- Check "AI Debug Pack" for detailed logs.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'bug-hunter-report.md'), content);
}

// ------------------------------------------------------------------
// AI Performance Report (Placeholder)
// ------------------------------------------------------------------
function generatePerformanceReport() {
    console.log('Generating AI Performance Report...');
    const content = `# AI Performance Report
Generated: ${new Date().toISOString()}

## Hot Paths
1. **Public Product Route** (\`src/app/[...slug]/page.tsx\`):
   - **Criticality**: HIGH. Must render under 200ms.
   - **Risks**: KV Latency, synchronous Self-Heal (now async), large asset payloads.
   
2. **Admin Checker** (\`check-links\`):
   - **Criticality**: MEDIUM. Batch processing can timeout.
   - **Mitigation**: 10s timeout per link, parallel fetching.

## Scalability Notes
- **KV Storage**: Redis is fast but connection limits apply.
- **Logging**: Local file logging is safe for dev but disabled/ignored in Edge.
- **Static Generation**: Currently using \`force-dynamic\`. Consider ISR for stability.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'performance-report.md'), content);
}

// ------------------------------------------------------------------
// AI SEO Report (Placeholder)
// ------------------------------------------------------------------
function generateSeoReport() {
    console.log('Generating AI SEO Report...');
    const content = `# AI SEO Report
Generated: ${new Date().toISOString()}

## SEO Infrastructure
- **Metadata**: Generated via \`src/lib/seo.ts\`.
- **Sitemaps**: Dynamic \`sitemap.xml\` (if implemented).
- **Robots**: \`robots.txt\` controls indexing.

## Optimization Opportunities
- **Canonical Tags**: Ensure multi-language variants point to correct canonicals.
- **Structured Data**: JSON-LD for Products/Reviews is essential.
- **Performance Web Vitals**: LCP/CLS impact ranking (See Performance Report).

## Risks
- **Duplicate Content**: Fallback slugs might create duplicate URLs (Mitigated by Canonical tags).
- **404 Soft Errors**: Products offline should return 404 or 410 explicitly.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'seo-report.md'), content);
}

// ------------------------------------------------------------------
// AI System Health Monitor
// ------------------------------------------------------------------
function generateHealthReport() {
    console.log('Generating AI System Health Report...');
    const content = `# AI System Health Report
Generated: ${new Date().toISOString()}

## System Status
- **Overall Status**: CHECK_REQUIRED (Manual Review)
- **Environment**: ${process.env.NODE_ENV || 'development'}
- **Platform**: ${process.platform}

## Component Health
1. **KV Connection**:
   - Status: Active (Assumed if App is running)
   - Configuration: Vercel KV / Upstash
   
2. **Logging System**:
   - Location: ./logs/
   - Status: Active (Local Only)
   - Edge Safe: Yes

3. **Self-Healing**:
   - Status: Enabled
   - Mechanism: Dual-Write + Canonical Key Check

## Warnings
- If "KV Timeout" appears in logs, check network.
- If "Checker Offline" persists, verify User-Agent headers.

## Recommended Actions
- Run "Gemini Test" in Diagnostics to verify AI connectivity.
- Check "Debug Pack" for detailed error logs.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'system-health-report.md'), content);
}

// ------------------------------------------------------------------
// AI Log Analyzer
// ------------------------------------------------------------------
function generateLogAnalysisReport() {
    console.log('Generating AI Log Analysis Report...');
    const logsDir = path.resolve(process.cwd(), 'logs');
    let logStats = 'No logs found.';
    
    if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
        logStats = `Found ${files.length} log files.\n\n### Recent Files:\n` + 
                   files.slice(0, 10).map(f => `- ${f}`).join('\n');
    }

    const content = `# AI Log Analysis Report
Generated: ${new Date().toISOString()}

## Log Summary
${logStats}

## Suspicious Patterns (Heuristic)
- **404 Errors**: Check \`*-public-route.log\` for "PRODUCT_NOT_FOUND".
- **Save Failures**: Check \`*-save-product.log\` for "SAVE_LOCK_SKIPPED".
- **Checker Errors**: Check \`*-checker.log\` for "CHECKER_OFFLINE".

## Recommendations
- If 404s are high: Run "Repair Keys".
- If Save Locks are high: Reduce concurrency or check client network.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'log-analysis-report.md'), content);
}

// ------------------------------------------------------------------
// AI Fix Suggestions
// ------------------------------------------------------------------
function generateFixSuggestionsReport() {
    console.log('Generating AI Fix Suggestions Report...');
    const content = `# AI Fix Suggestions Report
Generated: ${new Date().toISOString()}

## Detected Scenarios & Fixes

### Scenario A: Product Online but Checker says Offline
- **Probable Cause**: Checker User-Agent blocked or Timeout too short.
- **Fix**: Already patched to use GET + 10s Timeout.
- **Action**: None needed if patched.

### Scenario B: Public 404 on Valid Product
- **Probable Cause**: Canonical Key missing (Ghost Key issue).
- **Fix**: Run "Repair Keys" in Admin.
- **Risk**: Low. Safe to run anytime.

### Scenario C: Save Button "Stuck"
- **Probable Cause**: Distributed Lock not released.
- **Fix**: Wait 15s (TTL) or restart server (if local).
- **Risk**: Low.

## Safe Operations
- **Repair Keys**: Safe.
- **Cleanup Ghost Keys**: Safe.
- **Generate Debug Pack**: Safe.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'fix-suggestions-report.md'), content);
}

// ------------------------------------------------------------------
// AI Product Inspector
// ------------------------------------------------------------------
function generateProductInspectorReport() {
    console.log('Generating AI Product Inspector Report...');
    // This is a placeholder. In a real scenario, we would accept args for slug.
    const content = `# AI Product Inspector Report
Generated: ${new Date().toISOString()}
Target: (Placeholder / Last Active)

## Inspection Checklist
1. **Config Entry**: [?] Check \`system-structure.json\`.
2. **Canonical Keys**: [?] Check via "Repair Keys".
3. **Route Resolution**: [?] Check via "Public Link".

## SEO Readiness
- **Title/Desc**: Ensure length is optimal.
- **Images**: Check for Alt Text.
- **Metadata**: Check OpenGraph tags.

## Next Steps
- Open product in "Edit" mode to see full details.
- Run "Checker" to verify reachability.
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'product-inspector-report.md'), content);
}

// ------------------------------------------------------------------
// Prompt Generator
// ------------------------------------------------------------------
function generateEngineerPrompt() {
    console.log('Generating AI Engineer Prompt...');
    const content = `Act as a Senior Software Architect and Debug Engineer.

I am providing an "AI Debug Pack" zip file containing:
- system-structure.json (Project Map)
- system-flows.md (Data Flow Documentation)
- logs/ (Recent Local Debug Logs)
- debug-pack.json (Manifest)

Your task:
1. Analyze the architecture to understand the system.
2. Identify routing or KV inconsistencies in the flows.
3. Detect potential causes of offline products or errors in logs.
4. Check for missing keys, ghost keys, or slug mismatches.
5. Suggest safe fixes without breaking the system.
6. Point to the exact files or flows involved.

Prioritize safe, minimal changes.
Avoid refactoring large parts of the system unless absolutely necessary.

## Bug Context Template
Bug: 
Tested slug: 
Does the URL open in browser: 
Did admin mark it offline: 
Was Repair Keys used: 
Environment: localhost or production
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'ai-chatgpt-analysis-prompt.txt'), content);
    
    // Also generate context file
    const contextContent = `Bug: 
Tested slug: 
Does the URL open in browser: 
Did admin mark it offline: 
Was Repair Keys used: 
Environment: localhost or production`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'ai-chatgpt-analysis-context.txt'), contextContent);
}

// ------------------------------------------------------------------
// Main Router
// ------------------------------------------------------------------
const mode = process.argv[2];

switch (mode) {
    case 'architect':
        generateArchitectReport();
        break;
    case 'bug-hunter':
        generateBugHunterReport();
        break;
    case 'performance':
        generatePerformanceReport();
        break;
    case 'seo':
        generateSeoReport();
        break;
    case 'health':
        generateHealthReport();
        break;
    case 'logs':
        generateLogAnalysisReport();
        break;
    case 'fix':
        generateFixSuggestionsReport();
        break;
    case 'inspector':
        generateProductInspectorReport();
        break;
    case 'prompt':
        generateEngineerPrompt();
        break;
    case 'all':
    default:
        generateArchitectReport();
        generateBugHunterReport();
        generatePerformanceReport();
        generateSeoReport();
        generateEngineerPrompt();
        generateHealthReport();
        generateLogAnalysisReport();
        generateFixSuggestionsReport();
        generateProductInspectorReport();
        break;
}
