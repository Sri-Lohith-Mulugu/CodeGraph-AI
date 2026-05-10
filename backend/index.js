require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { crawlRepository } = require('./crawler');
const { runSecurityScan } = require('./securityScanner');
const { analyzeArchitecture } = require('./architectureAnalyzer');
const { generateGraph } = require('./graph');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/audit', async (req, res) => {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: "No URL provided." });

    let repoPath = "";
    let isTempRepo = false;
    try {
        // 1. Clone/Crawl the repository
        console.log(`🔃 Starting clone for: ${repoUrl}`);
        const repoInfo = await crawlRepository(repoUrl);
        repoPath = repoInfo?.path ? path.resolve(repoInfo.path) : '';
        isTempRepo = Boolean(repoInfo?.isTemp);
        
        if (!repoPath || repoPath === "undefined") {
            throw new Error("Failed to generate a valid repository path.");
        }
        console.log(`📂 Working Directory: ${repoPath}`);

        // 2. Run all analyses sequentially to avoid overloading local AI
        console.log("🔍 Analysis started...");
        
        let securityResults = { vulnerabilities: [] };
        try { securityResults = await runSecurityScan(repoPath); } catch (e) { console.error("❌ Security Error:", e.message); }
        
        let archResults = { techStack: ["Unknown"], analysis: "Analysis failed", structure: "" };
        try { archResults = await analyzeArchitecture(repoPath); } catch (e) { console.error("❌ Arch Error:", e.message); }
        
        let graphData = { nodes: [], links: [] };
        try { graphData = await generateGraph(repoPath); } catch (e) { console.error("❌ Graph Error:", e.message); }

        console.log("✅ All analyses complete.");
        console.log(`📊 Stats: ${securityResults.vulnerabilities?.length || 0} vulns, ${graphData?.nodes?.length || 0} nodes, ${archResults.structure?.length || 0} chars of architecture.`);

        // 3. Send combined results
        res.json({
            projectName: archResults.projectName || path.basename(repoUrl),
            techStack: archResults.techStack || ["Python", "JavaScript"],
            fileCount: graphData?.nodes?.length || 0,
            vulnerabilities: securityResults.vulnerabilities || [],
            severityCounts: {
                critical: securityResults.vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0,
                high: securityResults.vulnerabilities?.filter(v => v.severity === 'HIGH').length || 0,
                medium: securityResults.vulnerabilities?.filter(v => v.severity === 'MEDIUM').length || 0,
                low: securityResults.vulnerabilities?.filter(v => v.severity === 'LOW').length || 0,
            },
            projectSummary: archResults.analysis,
            architecture: archResults.structure,
            graph: graphData,
            lastScanned: new Date().toISOString()
        });

        // 4. Cleanup temp folder after successful audit
        try {
            if (isTempRepo && repoPath && fs.existsSync(repoPath)) {
                console.log(`🧹 Cleaning up temp folder: ${repoPath}`);
                fs.rmSync(repoPath, { recursive: true, force: true });
                console.log("✅ Temp folder cleaned up successfully.");
            }
        } catch (cleanupError) {
            console.warn("⚠️ Failed to cleanup temp folder:", cleanupError.message);
        }

    } catch (error) {
        console.error("❌ Audit Failed:", error.message);
        
        // Cleanup temp folder even on failure
        try {
            if (isTempRepo && repoPath && fs.existsSync(repoPath)) {
                console.log(`🧹 Cleaning up temp folder after failure: ${repoPath}`);
                fs.rmSync(repoPath, { recursive: true, force: true });
                console.log("✅ Temp folder cleaned up after failure.");
            }
        } catch (cleanupError) {
            console.warn("⚠️ Failed to cleanup temp folder after failure:", cleanupError.message);
        }
        
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Oracle Backend running on port ${PORT}`);
    console.log(`📡 Ready to audit repositories...`);
});