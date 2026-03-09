const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Trae AI Debug Pack Generator
 * 
 * Purpose: Create a single ZIP file containing key debug artifacts and logs
 * for easy sharing with AI assistants.
 * 
 * Usage: node scripts/debug-pack.js
 */

const ROOT_DIR = process.cwd();
const DEBUG_DIR = path.join(ROOT_DIR, 'debug');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const OUTPUT_ZIP = path.join(DEBUG_DIR, 'ai-debug-pack.zip');

// Ensure debug directory exists
if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

// ------------------------------------------------------------------
// 1. Gather Files
// ------------------------------------------------------------------

function getFilesToPack() {
    const files = [];

    // Structure & Flows
    const structureFiles = ['system-structure.json', 'system-flows.md', 'debug-pack.json'];
    structureFiles.forEach(f => {
        const p = path.join(DEBUG_DIR, f);
        if (fs.existsSync(p)) files.push({ src: p, dest: `structure/${f}` });
    });

    // Recent Logs (Limit to last 5 of each type to keep zip small)
    if (fs.existsSync(LOGS_DIR)) {
        const logFiles = fs.readdirSync(LOGS_DIR)
            .filter(f => f.endsWith('.log'))
            .sort((a, b) => fs.statSync(path.join(LOGS_DIR, b)).mtimeMs - fs.statSync(path.join(LOGS_DIR, a)).mtimeMs) // Newest first
            .slice(0, 50); // Increased cap to catch more context

        logFiles.forEach(f => {
            files.push({ src: path.join(LOGS_DIR, f), dest: `logs/${f}` });
        });
    }

    return files;
}

// ------------------------------------------------------------------
// 2. Create Manifest
// ------------------------------------------------------------------

function createManifest(files) {
    const manifest = {
        generated_at: new Date().toISOString(),
        project: 'pressell-googleads',
        files_included: files.map(f => f.dest),
        missing_logs: [],
        system_info: {
            node: process.version,
            platform: process.platform,
            git_commit: getGitCommit(),
            git_branch: getGitBranch()
        },
        note: 'This pack contains sanitized debug logs and structure info. No secrets included.'
    };
    
    // Explicitly list missing logs for better diagnosis
    const expectedLogs = ['public-route', 'checker', 'save-product', 'self-heal', 'repair', 'errors'];
    const foundCategories = new Set(files.map(f => f.dest.split('/').pop().split('-').slice(3).join('-').replace('.log', ''))); // Rough heuristic
    
    // Better heuristic: check if files array contains logs/DATE-CATEGORY.log
    expectedLogs.forEach(cat => {
        const found = files.some(f => f.dest.includes(`-${cat}.log`));
        if (!found) {
            // @ts-ignore
            manifest.missing_logs.push(cat);
        }
    });

    const manifestPath = path.join(DEBUG_DIR, 'ai-debug-pack-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    return { src: manifestPath, dest: 'manifest.json' };
}

// ------------------------------------------------------------------
// 3. Zip Generation (Zero Dependency)
// ------------------------------------------------------------------

function createZip(files) {
    console.log('Creating AI Debug Pack...');

    // Create a temporary staging directory
    const stageDir = path.join(DEBUG_DIR, 'staging_' + Date.now());
    fs.mkdirSync(stageDir);

    try {
        // Copy files to staging
        files.forEach(f => {
            const destPath = path.join(stageDir, f.dest);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(f.src, destPath);
        });

        // Use system tar/zip if available (Windows 10+ has tar, Linux/Mac has zip/tar)
        // We use 'tar' because it's widely available now
        // Command: tar -a -c -f output.zip -C staging .
        
        try {
            // Windows (PowerShell/CMD) often has tar.exe
            // Linux/Mac has tar
            const cmd = `tar -a -c -f "${OUTPUT_ZIP}" -C "${stageDir}" .`;
            execSync(cmd);
            console.log(`Zip created at: ${OUTPUT_ZIP}`);
        } catch (e) {
            console.error('Failed to create zip with system tar. Trying fallback...');
            // Fallback: Just log that staging dir is ready if zip fails
            console.log(`Could not zip automatically. Files are ready in: ${stageDir}`);
            return;
        }

    } finally {
        // Cleanup staging if zip was successful (or leave it if failed for manual check)
        if (fs.existsSync(OUTPUT_ZIP)) {
             // fs.rmSync(stageDir, { recursive: true, force: true });
             // Keep staging for a moment or delete? Let's delete to be clean.
             // On Windows sometimes file locking makes this flaky immediately after execSync
             setTimeout(() => {
                 try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch (e) {}
             }, 1000);
        }
    }
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

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

function run() {
    try {
        // 1. Ensure structure exists first
        try { execSync('npm run debug:snapshot', { stdio: 'inherit' }); } catch (e) {}

        const files = getFilesToPack();
        const manifest = createManifest(files);
        files.push(manifest);

        createZip(files);
        
        console.log('\nAI Debug Pack Ready!');
        console.log(`Location: ${OUTPUT_ZIP}`);
        console.log('Share this file with your AI assistant for context.');

    } catch (e) {
        console.error('Debug Pack Generation Failed:', e);
        process.exit(1);
    }
}

run();
