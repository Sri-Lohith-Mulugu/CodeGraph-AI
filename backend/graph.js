const madge = require('madge');
const fs = require('fs');
const path = require('path');

function calculateComplexity(filePath) {
    try {
        if (!fs.existsSync(filePath)) return 1;
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        
        // Simple heuristic: count keywords that increase complexity
        const controlStructures = (content.match(/\b(if|for|while|switch|catch|function|async|def|class)\b/g) || []).length;
        
        // Base complexity + normalized line count + control structure weight
        return Math.min(10, Math.floor(1 + (lines / 100) + (controlStructures / 5)));
    } catch {
        return 1;
    }
}

async function generateGraph(repoPath) {
    try {
        const repoRoot = path.resolve(String(repoPath));
        if (!fs.existsSync(repoRoot) || !fs.statSync(repoRoot).isDirectory()) {
            throw new Error(`Invalid repository path: ${repoPath}`);
        }

        const res = await madge(repoRoot, {
            includeNpm: false,
            fileExtensions: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go'],
            excludeRegExp: [/node_modules/, /\.git/, /dist/, /build/, /temp/]
        });
        
        const dependencyObj = res.obj();
        const nodes = [];
        const links = [];
        
        const allFiles = Object.keys(dependencyObj).filter(file => {
            const resolved = path.resolve(repoRoot, file);
            return resolved.startsWith(repoRoot + path.sep) || resolved === repoRoot;
        });
        
        const adj = {};
        const inDegree = {};

        allFiles.forEach(file => {
            const deps = (dependencyObj[file] || []).filter(dep => {
                const resolved = path.resolve(repoRoot, dep);
                return resolved.startsWith(repoRoot + path.sep) || resolved === repoRoot;
            });
            adj[file] = deps;
            inDegree[file] = 0;
        });
        
        allFiles.forEach(file => {
            adj[file].forEach(dep => {
                if (inDegree[dep] !== undefined) inDegree[dep]++;
            });
        });
        
        // BFS for topological levels (Fluidity)
        const levels = {};
        const queue = allFiles.filter(f => inDegree[f] === 0);
        let currentLevel = 0;
        
        while (queue.length > 0) {
            const size = queue.length;
            for (let i = 0; i < size; i++) {
                const node = queue.shift();
                levels[node] = currentLevel;
                adj[node].forEach(dep => {
                    inDegree[dep]--;
                    if (inDegree[dep] === 0) queue.push(dep);
                });
            }
            currentLevel++;
        }

        allFiles.forEach(file => {
            const fullPath = path.join(repoRoot, file);
            nodes.push({ 
                id: file, 
                name: file,
                complexity: calculateComplexity(fullPath),
                level: levels[file] || 0, // Topological level for DAG layout
                size: fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0
            });
            
            adj[file].forEach(dep => {
                links.push({ source: file, target: dep });
            });
        });

        // Fallback for empty projects
        if (nodes.length === 0) {
            nodes.push({ id: "root", name: "Source", complexity: 1 });
        }

        return { nodes, links };
    } catch (err) {
        console.error("Graph Error:", err);
        return { nodes: [{ id: "error", name: "Error", complexity: 0 }], links: [] };
    }
}

module.exports = { generateGraph };