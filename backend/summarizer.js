const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Priority files to read for project understanding
const PRIORITY_FILES = [
    'README.md', 'readme.md', 'README.txt',
    'package.json', 'requirements.txt', 'Pipfile',
    'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
    'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    '.env.example', 'config.js', 'config.ts',
    'app.js', 'app.ts', 'main.py', 'main.go',
    'index.js', 'index.ts', 'server.js', 'server.ts',
];

function collectContext(repoPath, maxChars = 10000) {
    let context = '';
    let charsUsed = 0;

    for (const file of PRIORITY_FILES) {
        if (charsUsed >= maxChars) break;
        const fullPath = path.join(repoPath, file);
        if (fs.existsSync(fullPath)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const chunk = `\n\n--- ${file} ---\n${content}`;
                const allowed = chunk.substring(0, maxChars - charsUsed);
                context += allowed;
                charsUsed += allowed.length;
            } catch { /* skip unreadable files */ }
        }
    }
    return context || 'No standard project files found.';
}

async function generateSummary(repoPath) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const context = collectContext(repoPath);

        // Replace the 'prompt' constant in summarizer.js with this:

const prompt = `
Analyze the following project files and produce a high-fidelity Technical Executive Summary.
Provide exactly four paragraphs, each with 5-8 sentences, using a professional "Expert AI" tone.

STRUCTURE:
**1. The Core Objective (The "Why")**: [4-6 sentences explaining the problem and goal.]
**2. The Architectural Stack (The "How")**: [4-6 sentences detailing the tech stack and integration.]
**3. Data Flow and Fluidity**: [4-6 sentences tracing the request lifecycle.]
**4. Results and Impact**: [4-6 sentences on value, performance, and readiness.]

Constraint: Total word count must be under 400 words.

Project Files Context:
${context}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Summarizer Error:', error.message);
        return `## Summary Unavailable\n\nCould not generate summary: ${error.message}`;
    }
}

module.exports = { generateSummary };