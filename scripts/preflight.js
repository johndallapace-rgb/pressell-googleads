const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('✈️  INITIATING PRE-FLIGHT VERIFICATION PROTOCOL...');

const build = spawn('npm', ['run', 'build'], { shell: true });

let stdout = '';
let stderr = '';

build.stdout.on('data', (data) => {
  const str = data.toString();
  stdout += str;
  // Live feedback for long builds
  if (str.includes('Linting') || str.includes('Compiled') || str.includes('Generating')) {
      process.stdout.write('.'); 
  }
});

build.stderr.on('data', (data) => {
  stderr += data.toString();
});

build.on('close', (code) => {
  console.log('\n'); // New line after dots

  if (code === 0) {
    console.log('✅ PRE-FLIGHT CHECK PASSED: Structure is Stable.');
    process.exit(0);
  } else {
    console.log('🚨 [ALERTA DE ESTRUTURA BLOQUEADA]');
    console.log('---------------------------------------------------');
    
    const combinedOutput = stdout + stderr;
    const errorLines = combinedOutput.split('\n').filter(line => 
        line.includes('Error:') || 
        line.includes('Failed') ||
        line.trim().startsWith('./src')
    );

    // Extract file info
    const fileRegex = /\.\/src\/[^:]+:(\d+):(\d+)/g;
    let match;
    const filesAffected = new Set();
    
    while ((match = fileRegex.exec(combinedOutput)) !== null) {
        filesAffected.add(match[0]);
    }

    console.log('CRITICAL ERRORS DETECTED:');
    errorLines.slice(0, 10).forEach(line => console.log(`> ${line.trim()}`));
    
    if (filesAffected.size > 0) {
        console.log('\nAFFECTED FILES:');
        filesAffected.forEach(f => console.log(`- ${f}`));
    }

    console.log('---------------------------------------------------');
    console.log('Auto-Correction Analysis: Pending...');
    process.exit(1);
  }
});
