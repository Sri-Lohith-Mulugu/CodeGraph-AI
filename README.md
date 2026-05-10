\# ⚡ CodeGraph AI

\### \*Professional Repository Audit Oracle\*



CodeGraph AI is a sophisticated full-stack repository auditing platform that provides deep, AI-powered insights into codebase health. It functions as an intelligent bridge between raw source code and actionable analytics — combining a Node.js backend, React frontend, Python analysis engine and local LLM inference via Ollama to deliver a complete developer intelligence suite.



\---



\## 🖥️ Demo



\### 📋 Summary — AI-Generated Technical Executive Summary

![Summary Tab](https://github.com/Sri-Lohith-Mulugu/CodeGraph-AI/blob/main/screenshots/summary.png?raw=true)



\### 🔒 Security — Vulnerability Assessment with Severity Ratings

![Security Tab](https://github.com/Sri-Lohith-Mulugu/CodeGraph-AI/blob/main/screenshots/security.png?raw=true)



\### 🏗️ Architecture — Full Architectural Analysis \& Data Flow

![Architecture Tab](https://github.com/Sri-Lohith-Mulugu/CodeGraph-AI/blob/main/screenshots/architecture.png?raw=true)



\### 🕸️ File Graph — Interactive Dependency Topology

![File Graph Tab](https://github.com/Sri-Lohith-Mulugu/CodeGraph-AI/blob/main/screenshots/filegraph.png?raw=true)



\---



\## 🚀 Key Features



\### 📋 Summary Tab

\- AI-generated \*\*Technical Executive Summary\*\* across 4 dimensions of insight

\- Core Objective analysis — "The Why"

\- Architectural Stack breakdown — "The How"

\- Data Flow \& Request Lifecycle mapping

\- Results \& Impact assessment

\- Downloadable PDF report



\### 🔒 Security Tab — SAST Engine

\- Automated vulnerability detection with \*\*HIGH / MEDIUM / CRITICAL\*\* severity ratings

\- Detects: `eval()` usage, unsafe model deserialization, debug mode exposure, GPU memory leaks, tensor shape issues

\- Provides specific \*\*FIX recommendations\*\* for each vulnerability

\- File-level attribution — knows exactly which file contains each issue



\### 🏗️ Architecture Tab

\- Full \*\*Architectural Analysis\*\* with visual tier diagram

\- Maps: Server Tier, Client Tier, Network Layer, Data Persistence Tier, Response \& Output Tier

\- Shows HTTP request lifecycle, JSON serialization flow and cache strategy

\- Identifies separation of concerns and modular service boundaries



\### 🕸️ File Graph Tab

\- \*\*Interactive Dependency Topology\*\* — drag nodes to explore

\- 24 nodes × 22 links visualization

\- Color-coded by language: React/JSX, JavaScript, Python, TypeScript

\- Identifies high-complexity files and circular dependencies



\---



\## 🛠️ Tech Stack



| Layer | Technology |

|-------|-----------|

| Frontend | React.js, Tailwind CSS, Vite |

| Backend | Node.js, Express.js |

| AI Engine | Python, Flask, Ollama (local LLM) |

| Database | MongoDB |

| Protocol | Model Context Protocol (MCP) |

| Analysis | Custom AST crawler, Security rule engine |

| Visualization | Interactive dependency graph (physics-based) |



\---



\## 🧠 AI \& Analysis Pipeline



```

User submits GitHub repo URL

&#x20;       ↓

Node.js backend crawls repository structure

&#x20;       ↓

Python analysis engine runs security scan + architecture mapping

&#x20;       ↓

Ollama (local LLM) generates AI-powered executive summary

&#x20;       ↓

Dependency graph built from import/export relationships

&#x20;       ↓

React frontend renders 4-tab interactive dashboard

&#x20;       ↓

JSON report available for download

```



\---



\## 📁 Project Structure



```

CodeGraph-AI/

│

├── backend/                    # Node.js + Express backend

│   ├── index.js                # Server entry point \& API routes

│   ├── crawler.js              # Repository file system crawler

│   ├── architectureAnalyzer.js # Architecture tier mapping

│   ├── securityScanner.js      # SAST vulnerability detection

│   ├── securityRules.js        # Security rule definitions

│   ├── summarizer.js           # AI summary generation (Ollama)

│   ├── graph.js                # Dependency graph builder

│   └── package.json

│

├── frontend/                   # React.js + Tailwind CSS frontend

│   ├── src/

│   │   ├── App.jsx             # Main dashboard component

│   │   ├── components/

│   │   │   └── DependencyGraph.jsx  # Interactive file graph

│   │   └── index.css

│   ├── public/

│   └── package.json

│

├── screenshots/                # Demo output screenshots

│   ├── summary.png

│   ├── security.png

│   ├── architecture.png

│   └── filegraph.png

│

└── .gitignore

```



\---



\## ⚙️ Installation \& Setup



\### Prerequisites

\- Node.js v18+

\- Python 3.8+

\- MongoDB

\- Ollama (for local LLM inference)



\### 1. Clone the repository

```bash

git clone https://github.com/Sri-Lohith-Mulugu/CodeGraph-AI.git

cd CodeGraph-AI

```



\### 2. Install Ollama \& pull a model

```bash

\# Install from https://ollama.com

ollama pull llama3

```



\### 3. Start the backend

```bash

cd backend

npm install

npm start

```



\### 4. Start the frontend

```bash

cd frontend

npm install

npm run dev

```



\### 5. Open in browser

```

http://localhost:5173

```



\---



\## 🔌 How to Use



1\. Open the app in your browser

2\. Paste any \*\*GitHub repository URL\*\* in the input field

3\. Click \*\*"Run Audit"\*\*

4\. Navigate through the 4 tabs:

&#x20;  - \*\*Summary\*\* — AI executive analysis

&#x20;  - \*\*Security\*\* — vulnerability findings with fixes

&#x20;  - \*\*Architecture\*\* — system design diagram

&#x20;  - \*\*File Graph\*\* — interactive dependency map

5\. Download the \*\*JSON Report\*\* for detailed findings



\---



\## ⚡ Performance Optimization



The primary technical challenge was handling large repositories without hitting timeout bottlenecks. This was solved using \*\*optimized directory traversal logic\*\* that:

\- Skips non-essential directories (`node\_modules`, `.git`, `dist`)

\- Processes files in parallel where possible

\- Streams results to the frontend in real-time



Additionally, \*\*real-time state synchronization\*\* between the Python analysis engine and the MERN frontend was managed through careful event-driven architecture.



\---



\## 🌍 Real-World Applications



\- 🔍 \*\*Code Review Automation\*\* — AI-powered pre-review analysis

\- 🔒 \*\*Security Auditing\*\* — catch vulnerabilities before production

\- 🏗️ \*\*Architecture Documentation\*\* — auto-generate system diagrams

\- 📊 \*\*Technical Debt Assessment\*\* — measure codebase health over time

\- 🧠 \*\*Onboarding Tool\*\* — help new developers understand unfamiliar codebases instantly



\---



\## 🧠 What I Learned



\- Building a full-stack AI auditing platform with MERN + Python + Ollama

\- Integrating local LLM inference using Ollama for private, offline code analysis

\- Implementing SAST (Static Analysis Security Testing) rules from scratch

\- Building interactive physics-based dependency graph visualizations

\- Managing real-time data synchronization between multiple backend services

\- Applying Model Context Protocol (MCP) for structured AI-to-filesystem communication



\---



\## 📄 License



This project is for educational and personal use.



