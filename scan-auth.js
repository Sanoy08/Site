// scan-auth.js
const fs = require('fs');
const path = require('path');

// কোন ফোল্ডারগুলো স্কিপ করব
const IGNORE_DIRS = ['node_modules', '.next', '.git', 'android', 'public'];

// কী কী খুঁজব
const PATTERNS = [
    { key: 'localStorage', type: 'Frontend (Storage)' },
    { key: "headers.get('authorization')", type: 'Backend (Manual Auth Check)' },
    { key: "headers.get('Authorization')", type: 'Backend (Manual Auth Check)' },
    { key: 'Bearer ', type: 'Backend/Frontend (Token Passing)' }
];

function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            checkFile(fullPath);
        }
    });
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let found = false;

    PATTERNS.forEach(pattern => {
        if (content.includes(pattern.key)) {
            if (!found) {
                console.log(`\n📄 File: ${filePath}`);
                found = true;
            }
            console.log(`   ⚠️ Found: "${pattern.key}" -> [${pattern.type}]`);
        }
    });
}

console.log("🔍 Scanning for Auth issues...");
scanDir('./src');
console.log("\n✅ Scan Complete!");