const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function normalizeLocalPath(repoUrl) {
    if (!repoUrl || typeof repoUrl !== 'string') return repoUrl;
    let normalized = repoUrl.trim();
    if (normalized.toLowerCase().startsWith('file:///')) {
        normalized = normalized.replace(/^file:\/\//i, '');
        if (normalized.startsWith('/')) {
            normalized = normalized.slice(1);
        }
    }
    return normalized;
}

async function crawlRepository(repoUrl) {
    const normalizedUrl = normalizeLocalPath(repoUrl);
    const localPath = fs.existsSync(normalizedUrl) ? normalizedUrl : fs.existsSync(path.resolve(normalizedUrl)) ? path.resolve(normalizedUrl) : null;

    if (localPath) {
        const stats = fs.statSync(localPath);
        if (stats.isDirectory()) {
            console.log(`📂 Local directory detected: ${localPath}`);
            return { path: localPath, isTemp: false };
        }
    }

    const tempRoot = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempRoot)) {
        fs.mkdirSync(tempRoot, { recursive: true });
    }

    const tempDir = path.join(tempRoot, `repo-${Date.now()}`);
    
    try {
        console.log(`🔃 Cloning ${repoUrl} ...`);
        execSync(`git clone --depth 1 "${repoUrl}" "${tempDir}"`, { 
            stdio: 'inherit',
            timeout: 120000 
        });
        console.log(`✅ Clone complete at: ${tempDir}`);
        return { path: tempDir, isTemp: true };
    } catch (err) {
        console.error(`❌ Cloning failed for ${repoUrl}: ${err.message}`);
        throw new Error(`Failed to clone repository. Please check the URL or your network connection.`);
    }
}

module.exports = { crawlRepository };