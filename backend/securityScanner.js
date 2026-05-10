const axios = require('axios');
const fs = require('fs');
const path = require('path');
const securityRules = require('./securityRules');

const severityRank = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
};

function dedupeVulnerabilities(vulnerabilities) {
    const seen = new Set();
    return vulnerabilities.filter(vuln => {
        const key = vuln.ruleId
            ? `${vuln.ruleId}|${vuln.file || ''}`
            : `${vuln.severity}|${vuln.title}|${vuln.file || ''}|${vuln.category || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function consolidateVulnerabilities(vulnerabilities) {
    const grouped = new Map();
    vulnerabilities.forEach(vuln => {
        const key = vuln.ruleId ? vuln.ruleId : `${vuln.severity}|${vuln.title}`;
        if (!grouped.has(key)) {
            grouped.set(key, {
                ...vuln,
                occurrences: 1,
                files: vuln.file ? [vuln.file] : []
            });
        } else {
            const existing = grouped.get(key);
            existing.occurrences += 1;
            if (vuln.file && !existing.files.includes(vuln.file)) {
                existing.files.push(vuln.file);
            }
        }
    });

    return Array.from(grouped.values()).map(item => {
        if (item.files.length > 1) {
            item.file = item.files[0];
            item.summary = `${item.title} (${item.occurrences} occurrences across ${item.files.length} files)`;
        }
        return item;
    });
}

function filterTopVulnerabilities(vulnerabilities, maxResults = 8) {
    const ranked = consolidateVulnerabilities(dedupeVulnerabilities(vulnerabilities));
    const buckets = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: [],
        LOW: []
    };

    ranked.forEach(vuln => {
        const severity = (vuln.severity || 'LOW').toUpperCase();
        if (!buckets[severity]) buckets.LOW.push(vuln);
        else buckets[severity].push(vuln);
    });

    Object.values(buckets).forEach(bucket => {
        bucket.sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
    });

    const selected = [
        ...buckets.CRITICAL.slice(0, 5),
        ...buckets.HIGH.slice(0, 5),
        ...buckets.MEDIUM.slice(0, 3),
        ...buckets.LOW.slice(0, 1)
    ];

    return selected.slice(0, maxResults);
}

async function runSecurityScan(repoPath) {
    const vulnerabilities = [];
    try {
        const cleanPath = String(repoPath);
        
        // 1. Rule-based scan (Fast)
        const filesToScan = [];
        const getAllFiles = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const p = path.join(dir, file);
                if (fs.statSync(p).isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build', 'temp', '.venv', 'venv'].includes(file)) getAllFiles(p);
                } else if (['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.jsx'].includes(path.extname(p))) {
                    filesToScan.push(p);
                }
            });
        };
        
        getAllFiles(cleanPath);

        filesToScan.slice(0, 20).forEach(filePath => { // Increased to 20 files for better coverage
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                securityRules.forEach(rule => {
                    if (rule.pattern.global) {
                        rule.pattern.lastIndex = 0;
                    }
                    if (rule.pattern.test(content)) {
                        vulnerabilities.push({
                            ruleId: rule.id,
                            severity: rule.severity,
                            title: rule.description,
                            file: path.relative(cleanPath, filePath),
                            recommendation: rule.fix,
                            category: rule.category
                        });
                    }
                });
            } catch (err) {
                // Skip files that can't be read
            }
        });

        // 2. AI-based scan (Deep context) - More comprehensive
        let context = "Analyze these files for complex architectural and ML security risks:\n";
        const priorityFiles = ['package.json', 'requirements.txt', 'server.js', 'app.js', 'index.js', 'auth.js', 'app.py', 'main.py', 'model.py'];
        priorityFiles.forEach(f => {
            const p = path.join(cleanPath, f);
            if (fs.existsSync(p)) {
                try {
                    context += `\n--- ${f} ---\n${fs.readFileSync(p, 'utf8').substring(0, 1500)}`;
                } catch { }
            }
        });

        try {
            const response = await axios.post('http://localhost:11434/api/generate', {
                model: "llama3",
                prompt: `${context}\n\nAct as a security architect. Identify 3-5 logical, architectural, or ML-specific security vulnerabilities (model loading, tensor operations, input validation, ML data pipeline security). Return ONLY JSON: {"vulnerabilities": [{"severity": "HIGH|MEDIUM|LOW", "title": "...", "file": "...", "recommendation": "...", "category": "..."}]}`,
                stream: false,
                format: "json"
            }, { timeout: 25000 });

            const responseText = response.data.response;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiVulns = JSON.parse(jsonMatch[0]).vulnerabilities || [];
                vulnerabilities.push(...aiVulns);
            }
        } catch (aiErr) {
            console.warn("AI scan skipped:", aiErr.message);
        }

        return { vulnerabilities: filterTopVulnerabilities(vulnerabilities) };
    } catch (err) {
        console.error("Scanner Error:", err.message);
        const finalVulns = filterTopVulnerabilities(vulnerabilities);
        return { vulnerabilities: finalVulns.length > 0 ? finalVulns : [{ severity: "LOW", title: "Basic Scan Completed", file: "N/A", recommendation: "Run with Ollama for AI-powered security analysis." }] };
    }
}

module.exports = { runSecurityScan };