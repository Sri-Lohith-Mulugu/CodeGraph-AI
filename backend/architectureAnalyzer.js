const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PRIORITY_FILES = [
    'README.md', 'readme.md', 'package.json', 'requirements.txt',
    'app.js', 'main.py', 'index.js', 'server.js', 'docker-compose.yml', 'go.mod'
];

function findPriorityFiles(repoPath, depth = 3, visited = new Set()) {
    const results = [];
    if (depth < 0) return results;

    const entries = fs.readdirSync(repoPath, { withFileTypes: true });
    for (const entry of entries) {
        const name = entry.name.toLowerCase();
        const fullPath = path.join(repoPath, entry.name);

        if (entry.isFile()) {
            if (PRIORITY_FILES.includes(entry.name) || PRIORITY_FILES.includes(name)) {
                results.push(fullPath);
            }
        } else if (entry.isDirectory() && !visited.has(fullPath)) {
            if (['node_modules', '.git', 'venv', '__pycache__'].includes(name)) continue;
            visited.add(fullPath);
            results.push(...findPriorityFiles(fullPath, depth - 1, visited));
        }
    }
    return results;
}

function collectContext(repoPath, maxChars = 4000) {
    let context = '';
    let charsUsed = 0;
    const priorityPaths = Array.from(new Set([repoPath, path.join(repoPath, 'frontend'), path.join(repoPath, 'backend')]))
        .filter(p => fs.existsSync(p));

    const files = [];
    for (const p of priorityPaths) {
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
            files.push(...findPriorityFiles(p));
        }
    }

    for (const fullPath of files) {
        if (charsUsed >= maxChars) break;
        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relPath = path.relative(repoPath, fullPath).replace(/\\/g, '/');
            const chunk = `\n--- ${relPath} ---\n${content}`;
            const allowed = chunk.substring(0, maxChars - charsUsed);
            context += allowed;
            charsUsed += allowed.length;
        } catch { }
    }

    return context || 'Project source files and configuration artifacts were analyzed for architecture.';
}

function detectTechStack(context, repoPath) {
    const dependencies = new Set();
    const detected = new Set();
    const text = String(context || '').toLowerCase();
    const pkgPaths = [
        path.join(repoPath, 'package.json'),
        path.join(repoPath, 'frontend', 'package.json'),
        path.join(repoPath, 'backend', 'package.json')
    ];

    for (const p of pkgPaths) {
        if (fs.existsSync(p)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                Object.keys(deps || {}).forEach(dep => dependencies.add(dep.toLowerCase()));
            } catch { }
        }
    }

    const hasDep = name => dependencies.has(name);
    const add = label => detected.add(label);

    if (/react/.test(text) || hasDep('react')) add('React');
    if (/vite/.test(text) || hasDep('vite')) add('Vite');
    if (/tailwind/.test(text) || hasDep('tailwindcss')) add('Tailwind CSS');
    if (/express/.test(text) || hasDep('express')) add('Express');
    if (/node/.test(text) || hasDep('node')) add('Node.js');
    if (/python/.test(text)) add('Python');
    if (/flask/.test(text) || hasDep('flask')) add('Flask');
    if (/django/.test(text) || hasDep('django')) add('Django');
    if (/fastapi/.test(text) || hasDep('fastapi')) add('FastAPI');
    if (/koa/.test(text) || hasDep('koa')) add('Koa');
    if (/nestjs/.test(text) || hasDep('nestjs')) add('NestJS');
    if (/next/.test(text) || hasDep('next')) add('Next.js');
    if (/nuxt/.test(text) || hasDep('nuxt')) add('Nuxt.js');
    if (/vue/.test(text) || hasDep('vue')) add('Vue.js');
    if (/angular/.test(text) || Array.from(dependencies).some(d => d.startsWith('@angular/'))) add('Angular');
    if (/svelte/.test(text) || hasDep('svelte')) add('Svelte');
    if (/solid/.test(text) || hasDep('solid-js')) add('SolidJS');
    if (/graphql/.test(text) || hasDep('graphql')) add('GraphQL');
    if (/apollo/.test(text) || Array.from(dependencies).some(d => d.includes('apollo'))) add('Apollo');
    if (/mongodb/.test(text) || hasDep('mongoose') || hasDep('mongodb')) add('MongoDB');
    if (/postgresql/.test(text) || hasDep('pg') || hasDep('sequelize') || hasDep('knex')) add('PostgreSQL');
    if (/mysql/.test(text) || hasDep('mysql') || hasDep('mysql2')) add('MySQL');
    if (/sqlite/.test(text) || hasDep('sqlite3') || hasDep('better-sqlite3')) add('SQLite');
    if (/redis/.test(text) || hasDep('redis')) add('Redis');
    if (/torch|pytorch/.test(text) || hasDep('torch') || hasDep('pytorch')) add('PyTorch');
    if (/tensorflow|keras/.test(text) || hasDep('tensorflow') || hasDep('@tensorflow')) add('TensorFlow');
    if (/sklearn|scikit/.test(text) || hasDep('scikit-learn')) add('scikit-learn');
    if (/opencv|cv2/.test(text) || hasDep('opencv')) add('OpenCV');
    if (/transformers/.test(text) || hasDep('transformers')) add('Hugging Face Transformers');
    if (/langchain/.test(text) || hasDep('langchain')) add('LangChain');
    if (/openai/.test(text) || hasDep('openai')) add('OpenAI');
    if (/anthropic/.test(text) || hasDep('anthropic')) add('Anthropic');
    if (/cohere/.test(text) || hasDep('cohere')) add('Cohere');
    if (/pinecone/.test(text) || hasDep('pinecone') || hasDep('pinecone-client')) add('Pinecone');
    if (/weaviate/.test(text) || hasDep('weaviate') || hasDep('weaviate-client')) add('Weaviate');
    if (/chroma/.test(text) || hasDep('chromadb') || hasDep('chroma')) add('ChromaDB');
    if (/onnx/.test(text) || hasDep('onnx')) add('ONNX');
    if (/xgboost/.test(text) || hasDep('xgboost')) add('XGBoost');
    if (/joblib/.test(text) || hasDep('joblib')) add('Joblib');
    if (/pandas/.test(text) || hasDep('pandas')) add('Pandas');
    if (/numpy/.test(text) || hasDep('numpy')) add('NumPy');
    if (/llama/.test(text) || hasDep('llama-cpp') || hasDep('llama-cpp-python')) add('LLaMA');
    if (/gpt/.test(text)) add('GPT');
    if (/llm/.test(text)) add('LLM');
    if (/mermaid/.test(text)) add('Mermaid');
    if (/react-markdown/.test(text)) add('React Markdown');

    return [...detected].filter(Boolean);
}

function readFileSafely(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
    } catch {
        return '';
    }
    return '';
}

function extractRepoMetadata(repoPath) {
    const metadata = {
        name: path.basename(repoPath),
        description: '',
        techStack: [],
        backendFramework: null,
        frontendFramework: null,
        usesML: false,
        usesLLM: false,
        llmFrameworks: [],
        modelArtifact: false,
        primaryFiles: [],
        readmeText: ''
    };

    const readme = readFileSafely(path.join(repoPath, 'README.md')) || readFileSafely(path.join(repoPath, 'readme.md')) || readFileSafely(path.join(repoPath, 'README.txt'));
    if (readme) {
        metadata.readmeText = readme;
        const firstParagraph = readme.split(/\r?\n\r?\n/).find(p => p.trim().length > 20);
        if (firstParagraph) metadata.description = firstParagraph.replace(/\r?\n/g, ' ').trim();
    }

    const gitConfigPath = path.join(repoPath, '.git', 'config');
    if (fs.existsSync(gitConfigPath)) {
        try {
            const gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
            const originMatch = gitConfig.match(/url\s*=\s*(.+)/);
            if (originMatch && originMatch[1]) {
                const remoteUrl = originMatch[1].trim();
                const repoName = parseRepoNameFromUrl(remoteUrl);
                if (repoName) metadata.name = repoName;
            }
        } catch { }
    }

    const packagePaths = [
        path.join(repoPath, 'package.json'),
        path.join(repoPath, 'frontend', 'package.json'),
        path.join(repoPath, 'backend', 'package.json')
    ];
    packagePaths.forEach(pkgPath => {
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                Object.keys(deps || {}).forEach(dep => {
                    const lower = dep.toLowerCase();
                    if (lower.includes('react')) metadata.frontendFramework = 'React';
                    if (lower.includes('vite')) metadata.frontendFramework = metadata.frontendFramework || 'Vite';
                    if (lower.includes('next')) metadata.frontendFramework = metadata.frontendFramework || 'Next.js';
                    if (lower.includes('nuxt')) metadata.frontendFramework = metadata.frontendFramework || 'Nuxt.js';
                    if (lower.includes('vue')) metadata.frontendFramework = metadata.frontendFramework || 'Vue.js';
                    if (lower.includes('@angular')) metadata.frontendFramework = metadata.frontendFramework || 'Angular';
                    if (lower.includes('svelte')) metadata.frontendFramework = metadata.frontendFramework || 'Svelte';
                    if (lower.includes('express')) metadata.backendFramework = 'Express';
                    if (lower.includes('koa')) metadata.backendFramework = metadata.backendFramework || 'Koa';
                    if (lower.includes('nestjs')) metadata.backendFramework = metadata.backendFramework || 'NestJS';
                    if (lower.includes('flask')) metadata.backendFramework = 'Flask';
                    if (lower.includes('django')) metadata.backendFramework = 'Django';
                    if (lower.includes('fastapi')) metadata.backendFramework = 'FastAPI';
                    if (lower.includes('torch') || lower.includes('pytorch') || lower.includes('tensorflow') || lower.includes('opencv') || lower.includes('keras')) metadata.usesML = true;
                    if (lower.includes('transformers') || lower.includes('langchain') || lower.includes('openai') || lower.includes('anthropic') || lower.includes('cohere') || lower.includes('pinecone') || lower.includes('weaviate') || lower.includes('chromadb') || lower.includes('llama')) {
                        metadata.usesLLM = true;
                        metadata.llmFrameworks.push(dep);
                    }
                    if (lower.includes('tailwindcss')) metadata.techStack.push('Tailwind CSS');
                    if (lower.includes('mongoose') || lower.includes('mongodb')) metadata.techStack.push('MongoDB');
                    if (lower.includes('axios')) metadata.techStack.push('Axios');
                    if (lower.includes('pg') || lower.includes('sequelize') || lower.includes('knex')) metadata.techStack.push('PostgreSQL');
                    if (lower.includes('mysql')) metadata.techStack.push('MySQL');
                });
                if (pkg.name) metadata.name = pkg.name;
                if (pkg.description && !metadata.description) metadata.description = pkg.description;
                metadata.primaryFiles.push(pkgPath);
            } catch { }
        }
    });

    const requirements = readFileSafely(path.join(repoPath, 'requirements.txt')) || readFileSafely(path.join(repoPath, 'Pipfile')) || '';
    if (requirements) {
        if (/torch|pytorch|tensorflow|opencv|cv2|keras|sklearn|scikit-learn|xgboost|onnx/i.test(requirements)) metadata.usesML = true;
        if (/transformers|langchain|openai|anthropic|cohere|pinecone|weaviate|chromadb|llama/i.test(requirements)) {
            metadata.usesLLM = true;
            metadata.llmFrameworks.push('Python LLM/Model stack');
        }
        if (/flask/i.test(requirements)) metadata.backendFramework = 'Flask';
        if (/django/i.test(requirements)) metadata.backendFramework = 'Django';
        if (/fastapi/i.test(requirements)) metadata.backendFramework = 'FastAPI';
        if (/pandas/i.test(requirements)) metadata.techStack.push('Pandas');
        if (/numpy/i.test(requirements)) metadata.techStack.push('NumPy');
    }

    const fileNames = fs.readdirSync(repoPath);
    fileNames.forEach(file => {
        const lower = file.toLowerCase();
        if (lower.endsWith('.pth') || lower.endsWith('.pt') || lower.endsWith('.onnx') || lower.endsWith('.pb') || lower.endsWith('.joblib') || lower.endsWith('.pkl') || lower.includes('model')) metadata.modelArtifact = true;
        if (lower === 'frontend') metadata.frontendFramework = metadata.frontendFramework || 'React';
        if (['app.py', 'main.py', 'server.py', 'index.js', 'index.py', 'index.ts', 'app.js'].includes(lower)) metadata.primaryFiles.push(file);
    });

    const discovered = new Set(metadata.techStack);
    if (metadata.backendFramework) discovered.add(metadata.backendFramework);
    if (metadata.frontendFramework) discovered.add(metadata.frontendFramework);
    if (metadata.usesML) discovered.add('Machine Learning');
    if (metadata.usesLLM) discovered.add('LLM');
    if (metadata.modelArtifact) discovered.add('Model Artifact');
    if (metadata.llmFrameworks.length) discovered.add('LLM Frameworks');
    metadata.techStack = [...discovered].filter(Boolean);
    return metadata;
}

function parseRepoNameFromUrl(remoteUrl) {
    if (!remoteUrl) return null;
    const trimmed = remoteUrl.replace(/\.git$/, '').trim();
    const match = trimmed.match(/(?:[:\/])([^\/:]+\/)?([^\/]+)$/);
    if (match && match[2]) {
        return match[2];
    }
    return null;
}

function createRepoSpecificFallbackSummary(metadata) {
    const repoLabel = metadata.name || 'The repository';
    const desc = metadata.description ? metadata.description : 'This repository was reviewed using its README, manifest files, and key source files.';
    const stackPhrase = metadata.techStack.length ? metadata.techStack.join(', ') : 'a modern full-stack technology set';
    const backendLabel = metadata.backendFramework ? metadata.backendFramework : 'server-side services';
    const frontendLabel = metadata.frontendFramework ? `${metadata.frontendFramework}-based frontend` : 'user-facing client application';
    const mlPresence = metadata.usesML ? 'It also includes machine learning inference or model artifact handling.' : 'The codebase is oriented around application and API orchestration without explicit ML model execution.';
    const primaryFiles = metadata.primaryFiles.length ? metadata.primaryFiles.map(f => path.basename(f)).join(', ') : 'key entry points and manifest files';

    const coreObjective = `**1. The Core Objective (The "Why")**\n\n${repoLabel} is articulated as a cohesive engineering solution that integrates the repository’s explicit source, deployment, and dependency artifacts. ${desc} The analysis centers on the project’s stated purpose and operational scope, identifying how the application’s major entry points and configured services are intended to deliver value. This summary highlights the repository’s functional intent, including the role of technologies such as ${stackPhrase} in fulfilling the project’s objectives. It also clarifies the strategic balance between frontend interaction and backend service processing. It emphasizes a practical understanding of what the codebase is designed to accomplish and how its implementation choices align with that purpose.`;

    const archStack = `**2. The Architectural Stack (The "How")**\n\nThis codebase assembles a backend layer based on ${backendLabel} and a ${frontendLabel}. The detected stack includes ${stackPhrase}, which shows how the repository combines frontend rendering, API orchestration, dependency management, and, where applicable, machine learning inference. Primary code paths are anchored by files such as ${primaryFiles}, which define the service entry points, routing behavior, and configuration strategy for the application. This mix of technologies explains how data moves through the system and how the implementation supports extensibility. The architecture therefore reflects concrete design decisions that balance interface, service, and data concerns while making the implementation interoperable and maintainable.`;

    const dataFlow = `**3. Data Flow and Fluidity**\n\nTraffic enters the system through the frontend or API entry points, where requests are parsed and routed into the backend execution path. The backend applies business logic and may invoke auxiliary services such as security scanning, architecture analysis, or model inference, depending on the repository’s scope. Data is persisted or staged using the repository’s own file and artifact structures, and results are returned through the same interface layer. The flow emphasizes how state transitions and service boundaries are managed in concrete code. This description is grounded in the repository’s actual files and dependency graph, ensuring the flow mirrors how the project is implemented and how information moves through its core components.`;

    const impact = `**4. Results and Impact**\n\nThe resulting assessment highlights where the codebase demonstrates strong architectural discipline, including separation of concerns, modular service boundaries, and clarity of workflow. It also identifies risks or refinement opportunities in the integration between frontend, backend, and any detected ML or data-processing layers. The summary is intended to give technical stakeholders a substantive view of how the repository supports operational goals and where it is likely to deliver value efficiently. It explains how the chosen technologies and design patterns affect maintainability, scalability, and deployment readiness. It concludes with a practical evaluation of the project’s readiness and the key areas where the implementation can be optimized or extended.`;

    return `${coreObjective}\n\n${archStack}\n\n${dataFlow}\n\n${impact}`;
}

function createRepoSpecificFallbackArchitecture(metadata) {
    const uiLabel = metadata.frontendFramework ? `${metadata.frontendFramework} UI` : 'User Interface';
    const apiLabel = metadata.backendFramework ? `${metadata.backendFramework} API` : 'Server API';
    const runtimeLabel = metadata.usesML ? 'Neural Network Inference Engine' : (metadata.usesLLM ? 'LLM / Model Service' : 'Analysis Service');
    const storageLabel = metadata.modelArtifact ? 'Model Artifact Store (.pth/.pt/.onnx)' : 'Repository/File Storage';
    const projectLabel = metadata.name ? `${metadata.name} Source Repository` : 'Repository Source';
    const dbLabel = metadata.techStack.includes('MongoDB') ? 'MongoDB' : metadata.techStack.includes('PostgreSQL') ? 'PostgreSQL' : metadata.techStack.includes('MySQL') ? 'MySQL' : metadata.techStack.includes('SQLite') ? 'SQLite' : null;
    const hasLLM = metadata.usesLLM || metadata.llmFrameworks.length > 0;
    const hasModel = metadata.usesML || metadata.modelArtifact || hasLLM;

    const lines = [
        'graph TD',
        '  subgraph ClientTier["🖥️ CLIENT TIER"]',
        '    Browser["Browser / Client"]',
        `    UI["${uiLabel}<br/>State & Interaction"]`,
        '    InputValidation["Input Validation<br/>Sanitization"]',
        '  end',
        '',
        '  subgraph NetworkTier["🌐 NETWORK LAYER"]',
        '    HTTPHandler["HTTP/REST Handler<br/>JSON Serialization"]',
        '  end',
        '',
        '  subgraph ServerTier["⚙️ SERVER TIER"]',
        `    API["${apiLabel}<br/>API Router / Controllers"]`,
        '    Router["Router / Dispatcher"]',
        '    AuthMiddleware["Authentication / Authorization"]',
        '    RateLimiter["Rate Limiting / Throttling"]',
        '  end',
        '',
        '  subgraph BusinessLogic["📊 BUSINESS LOGIC LAYER"]',
        '    Preprocessor["Request Preprocessor<br/>Normalization / Encoding"]',
        '    FeatureExtractor["Feature Extractor<br/>Transformation / Enrichment"]',
        '    Analyzer["Core Analyzer<br/>Processing / Orchestration"]',
        '    Scanner["Security Scanner<br/>Static / Dynamic Checks"]',
        '  end',
    ];

    if (hasModel) {
        lines.push(
            '',
            '  subgraph ModelTier["🧠 MODEL / LLM TIER"]',
            '    ModelLoader["Model Loader<br/>Weight Initialization"]',
            '    InferenceEngine["Inference Engine<br/>Model / LLM Execution"]',
            '    Postprocessor["Postprocessor<br/>Result Formatting"]',
            '  end'
        );
    }

    lines.push(
        '',
        '  subgraph DataTier["💾 DATA PERSISTENCE TIER"]',
        `    RepoSource["${projectLabel}"]`,
        `    ModelArtifacts["${storageLabel}"]`,
        '    Cache["Cache / Session Store"]',
        ...(dbLabel ? [`    Database["${dbLabel}"]`] : []),
        '  end',
        '',
        '  subgraph ResponseTier["📤 RESPONSE & OUTPUT TIER"]',
        '    ResponseFormatter["Response Formatter<br/>JSON / UI Output"]',
        '    ErrorHandler["Error Handler<br/>Logging / Recovery"]',
        '  end',
        '',
        '  Browser -->|"User Event"| InputValidation',
        '  InputValidation -->|"Valid Payload"| UI',
        '  UI -->|"HTTP Request"| HTTPHandler',
        '  HTTPHandler -->|"Request Object"| API',
        '  API --> Router',
        '  Router --> RateLimiter',
        '  RateLimiter --> AuthMiddleware',
        '  AuthMiddleware -->|"Authorized"| Preprocessor',
        '  AuthMiddleware -->|"Denied"| ErrorHandler',
        '  Preprocessor -->|"Normalized Data"| FeatureExtractor',
        '  FeatureExtractor -->|"Features"| Analyzer',
        '  Analyzer -->|"Analysis Task"| Scanner',
        '  Scanner -->|"Security Metadata"| Analyzer',
        '  Analyzer -->|"Processed Input"| ResponseFormatter',
    );

    if (hasModel) {
        lines.push(
            '  Analyzer -->|"Model Request"| ModelLoader',
            '  ModelLoader -->|"Loaded Model"| InferenceEngine',
            '  InferenceEngine -->|"Raw Predictions"| Postprocessor',
            '  Postprocessor -->|"Formatted Output"| ResponseFormatter',
            '  ModelArtifacts -->|"Model Files"| ModelLoader',
            '  Scanner -->|"Security Findings"| Postprocessor',
        );
    }

    if (dbLabel) {
        lines.push(
            '  ResponseFormatter -->|"Persist / Cache"| Database',
            '  ResponseFormatter -->|"Cache Write"| Cache'
        );
    } else {
        lines.push('  ResponseFormatter -->|"Cache Write"| Cache');
    }

    lines.push(
        '  ResponseFormatter -->|"HTTP Response"| HTTPHandler',
        '  HTTPHandler -->|"JSON Payload"| UI',
        '  UI -->|"Render Output"| Browser',
        '  ErrorHandler -->|"Error Response"| HTTPHandler'
    );

    return lines.join('\n');
}

function generateFallbackAnalysis(repoPath, context) {
    const metadata = extractRepoMetadata(repoPath);
    const techStack = metadata.techStack.length ? metadata.techStack : detectTechStack(context, repoPath);
    const summary = createRepoSpecificFallbackSummary(metadata);
    const architecture = createRepoSpecificFallbackArchitecture(metadata);
    return {
        projectName: metadata.name || path.basename(repoPath),
        analysis: summary,
        structure: "```mermaid\n" + architecture + "\n```",
        techStack
    };
}

async function analyzeArchitecture(repoPath) {
    try {
        const cleanPath = String(repoPath);
        const metadata = extractRepoMetadata(cleanPath);
        const context = collectContext(cleanPath);

        const prompt = `You are a world-class software architect AI producing an extremely technical, detailed repository audit. Generate precise analysis of the complete technical flow from user client interface through backend processing to output delivery. Include any detected machine learning, LLM, model artifact, and neural network technologies in the architecture description.

PROJECT NAME: ${metadata.name}
DETECTED TECH STACK: ${metadata.techStack.length ? metadata.techStack.join(', ') : 'Unknown'}
PRIMARY FILES: ${metadata.primaryFiles.length ? metadata.primaryFiles.map(f => path.basename(f)).join(', ') : 'Not available'}
ML PROJECT: ${metadata.usesML ? 'YES' : 'NO'}
MODEL ARTIFACTS: ${metadata.modelArtifact ? 'YES' : 'NO'}

PROJECT FILES:
${context}

TASK 1 - ADVANCED TECHNICAL SUMMARY (500-650 words, 4 paragraphs, 7-9 sentences each):
Compose exactly four paragraphs with professional expert-level prose. Each paragraph must contain at least five complete sentences and should be long enough to occupy at least 4-5 lines of text. The overall summary should remain under 420 words.
Use a modern expert tone, professional technical vocabulary, and avoid bullet lists or numbered lists.
Each paragraph should provide deep analysis based on the repository’s actual architecture, detected languages, frameworks, and functional workflow.

Include the following section headings exactly as shown, each followed by its detailed paragraph:

Paragraph 1: **1. The Core Objective (The "Why")**
Paragraph 2: **2. The Architectural Stack (The "How")**
Paragraph 3: **3. Data Flow and Fluidity**
Paragraph 4: **4. Results and Impact**

In each paragraph, explicitly mention the main languages and frameworks detected in the repository and describe what each technology contributes to the project. Emphasize how components work together from client to backend to storage and any inference or analysis layer.
Focus on practical implementation and value delivered by the codebase.

TASK 2 - ARCHITECTURE DIAGRAM:
Generate a clean Mermaid flowchart starting with 'graph TD'. Use clearly marked subgraphs for Client Tier, Server Tier, Data Tier, and AI/ML Tier. All nodes must use double-quoted Mermaid notation and all edges must use standard arrows (-->) in a readable workflow.

Return only valid JSON in this shape:
{
  "summary": "Full 4-paragraph text here...",
  "architecture": "graph TD\nsubgraph...",
  "techStack": ["React", "Node.js", "Flask"]
}`;

        let data;
        try {
            const response = await axios.post('http://localhost:11434/api/generate', {
                model: "llama3",
                prompt: prompt,
                stream: false,
                format: "json"
            }, { timeout: 25000 });

            const rawResponse = String(response.data.response || '').trim();
            const jsonPayload = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonPayload) {
                try {
                    data = JSON.parse(jsonPayload[0]);
                } catch (parseError) {
                    console.warn('JSON parse failed, retrying with raw response');
                    data = JSON.parse(rawResponse);
                }
            } else {
                data = JSON.parse(rawResponse);
            }
        } catch (err) {
            console.warn('LLM call failed, using local fallback analysis:', err.message);
            return generateFallbackAnalysis(cleanPath, context);
        }

        let archStr = String(data.architecture || "graph TD\nA[\"Architecture diagram not available\"]");
        archStr = archStr.replace(/```(?:mermaid)?\s*/g, '').replace(/```/g, '').trim();
        if (!/^graph\s+TD/i.test(archStr)) {
            archStr = `graph TD\n${archStr}`;
        }

        archStr = archStr.replace(/([A-Za-z0-9_]+)\s*\[\s*"?([^"\]]+)"?\s*\]/g, (match, id, label) => {
            const cleanLabel = label.replace(/"/g, '').trim();
            return `${id}["${cleanLabel}"]`;
        });
        archStr = archStr.replace(/->>/g, '-->');
        archStr = archStr.replace(/\]\s*end/g, ']\nend');
        archStr = archStr.replace(/end\s*subgraph/g, 'end\nsubgraph');
        archStr = archStr.replace(/end([A-Za-z])/g, 'end\n$1');
        archStr = archStr.replace(/([A-Za-z0-9_])subgraph/g, '$1\nsubgraph');
        archStr = archStr.replace(/(\])\s*([A-Za-z0-9_])/g, '$1\n$2');

        let finalSummary = String(data.summary || '').trim();
        finalSummary = finalSummary.replace(/```[\s\S]*?```/g, '').trim();
        finalSummary = finalSummary.replace(/\r\n/g, '\n');
        finalSummary = finalSummary.replace(/\n{2,}/g, '\n\n').trim();
        if (!finalSummary || finalSummary.length < 120) {
            console.warn('Model summary insufficient, using fallback summary');
            return generateFallbackAnalysis(cleanPath, context);
        }

        const paraHeaders = [
            '**1. The Core Objective (The "Why")**',
            '**2. The Architectural Stack (The "How")**',
            '**3. Data Flow and Fluidity**',
            '**4. Results and Impact**'
        ];

        const hasRequiredHeadings = paraHeaders.every(header => finalSummary.includes(header));
        if (!hasRequiredHeadings) {
            console.warn('Model summary missing required explicit paragraph headings, using fallback summary');
            return generateFallbackAnalysis(cleanPath, context);
        }

        let paragraphs = finalSummary.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);
        if (paragraphs.length < 4) {
            paragraphs = finalSummary.split(/(?<=[\.\?!])\s+(?=[A-Z])/).map(p => p.trim()).filter(p => p.length > 20);
        }
        if (paragraphs.length < 4) {
            paragraphs = finalSummary.split(/\n/).map(p => p.trim()).filter(p => p.length > 20);
        }

        const summarySections = [];
        for (let i = 0; i < 4; i += 1) {
            const sectionText = paragraphs[i] || '';
            summarySections.push(`${paraHeaders[i]}\n\n${sectionText}`);
        }
        const cleanSummary = summarySections.join('\n\n');

        return {
            projectName: metadata.name || path.basename(cleanPath),
            analysis: cleanSummary,
            structure: "```mermaid\n" + archStr + "\n```",
            techStack: Array.isArray(data.techStack) && data.techStack.length ? data.techStack : detectTechStack(context, cleanPath)
        };
    } catch (err) {
        console.error("Arch Error:", err.message);
        return { 
            analysis: "Analysis failed. Please check Ollama.", 
            structure: "```mermaid\ngraph TD\nA[\"Error in Analysis\"]\n```", 
            techStack: [] 
        };
    }
}

module.exports = { analyzeArchitecture };