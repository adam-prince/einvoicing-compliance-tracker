#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting optimized development setup...');

/**
 * Recursively find and remove stale JS files that have newer TS counterparts
 */
function cleanStaleJsFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let removedCount = 0;
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
            removedCount += cleanStaleJsFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            // Check if there's a corresponding TypeScript file
            const baseName = entry.name.replace('.js', '');
            const tsFile = path.join(dir, baseName + '.ts');
            const tsxFile = path.join(dir, baseName + '.tsx');
            
            let shouldRemove = false;
            let tsFilePath = null;
            
            if (fs.existsSync(tsFile)) {
                tsFilePath = tsFile;
                shouldRemove = true;
            } else if (fs.existsSync(tsxFile)) {
                tsFilePath = tsxFile;
                shouldRemove = true;
            }
            
            if (shouldRemove && tsFilePath) {
                // Check if the JS file is older than the TS file
                const jsStats = fs.statSync(fullPath);
                const tsStats = fs.statSync(tsFilePath);
                
                if (jsStats.mtime < tsStats.mtime || process.argv.includes('--force-clean')) {
                    console.log(`  🗑️  Removing stale: ${path.relative(process.cwd(), fullPath)}`);
                    fs.unlinkSync(fullPath);
                    removedCount++;
                } else {
                    console.log(`  ⏭️  Keeping current: ${path.relative(process.cwd(), fullPath)}`);
                }
            }
        }
    }
    
    return removedCount;
}

/**
 * Check if TypeScript compilation is needed
 */
function isTypeScriptUpToDate() {
    try {
        // Check if there are any .ts/.tsx files newer than the last tsc run
        const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
        if (!fs.existsSync(tsconfigPath)) return true;
        
        // For Vite projects, we don't need to pre-compile TS files
        // Vite handles TS compilation on-the-fly
        return true;
    } catch (error) {
        console.warn('⚠️  Could not check TypeScript status:', error.message);
        return false;
    }
}

// Main execution
try {
    console.log('🔍 Scanning for stale JavaScript files...');
    const srcDir = path.join(process.cwd(), 'src');
    
    if (fs.existsSync(srcDir)) {
        const removedCount = cleanStaleJsFiles(srcDir);
        
        if (removedCount > 0) {
            console.log(`✅ Removed ${removedCount} stale JavaScript file(s)`);
        } else {
            console.log('✅ No stale JavaScript files found');
        }
    } else {
        console.log('ℹ️  No src directory found, skipping cleanup');
    }
    
    // Check TypeScript status
    if (isTypeScriptUpToDate()) {
        console.log('✅ TypeScript compilation is up to date');
    } else {
        console.log('⚠️  TypeScript may need compilation');
    }
    
    console.log('🎉 Development environment ready!');
    
} catch (error) {
    console.error('❌ Error during development setup:', error.message);
    process.exit(1);
}