import DependencyGraph from './components/DependencyGraph.jsx';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ShieldAlert, LayoutDashboard, GitBranch, Share2,
  Search, Loader2, CheckCircle2, XCircle, Clock,
  FileCode2, AlertTriangle, ChevronRight, Zap, Download,
} from 'lucide-react';

// ─── 1. Constants & Configurations (Must be at the top) ──────────────────────

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }
    return <code className={className} {...props}>{children}</code>;
  }
};

// ─── 2. Helpers ──────────────────────────────────────────────────────────────

function detectInputType(val) {
  if (!val) return 'empty';
  const trimmed = val.trim();
  try {
    const u = new URL(trimmed);
    if (u.hostname === 'github.com') return 'github';
    if (['http:', 'https:'].includes(u.protocol)) return 'url';
  } catch { }
  // Improved local path detection: drive letters, forward/back slashes, or relative paths like ./ or ../
  if (/^[a-zA-Z]:[\\\/]/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.includes('\\')) return 'local';
  return 'invalid';
}

function severityColor(s = '') {
  const m = { critical: 'vuln-critical', high: 'vuln-high', medium: 'vuln-medium', low: 'vuln-low' };
  return m[s.toLowerCase()] || 'vuln-low';
}

function badgeClass(s = '') {
  const m = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return m[s.toLowerCase()] || 'badge-low';
}

function severityIcon(s = '') {
  const lowS = s.toLowerCase();
  if (['critical', 'high'].includes(lowS)) return <ShieldAlert size={16} className="inline mr-1" />;
  if (lowS === 'medium') return <AlertTriangle size={16} className="inline mr-1" />;
  return <CheckCircle2 size={16} className="inline mr-1" />;
}

// ─── 3. Functional Components ────────────────────────────────────────────────

function Mermaid({ chart }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.mermaid && ref.current && chart) {
      try {
        setError(null);
        window.mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'dark', 
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif'
        });
        
        const cleanChart = chart
          .replace(/```mermaid/g, '')
          .replace(/```/g, '')
          .replace(/\\n/g, '\n')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\|(.+?)\|?>/g, '|$1|')
          .replace(/^(graph\s+[TDBRLR]{2})(\s*)(.*)/i, (match, head, space, body) => {
             return `${head}\n${body}`;
          })
          // Fix double bracket nodes: Frontend["Name"][Tech] -> Frontend["Name (Tech)"]
          .replace(/([A-Za-z0-9_]+)\["(.+?)"\]\[(.+?)\]/g, '$1["$2 ($3)"]')
          .replace(/([A-Za-z0-9_]+)\[(.+?)\]\[(.+?)\]/g, '$1["$2 ($3)"]')
          // Replace tabs with spaces
          .replace(/\t/g, ' ')
          // Attempt to fix malformed links like " ] o node[ "
          .replace(/\]\s+o\s+([A-Za-z0-9_]+)/gi, '] --> $1')
          .replace(/\]\s+-o\s+([A-Za-z0-9_]+)/gi, '] --> $1')
          .replace(/^"(.+?)"/gm, (match, label) => {
            const id = label.replace(/[^a-zA-Z0-9]/g, '');
            return `${id}["${label}"]`;
          })
          .replace(/-->\s*"(.+?)"/g, (match, label) => {
            const id = label.replace(/[^a-zA-Z0-9]/g, '');
            return `--> ${id}["${label}"]`;
          })
          .trim();

        if (!cleanChart || cleanChart.length < 10) {
           setError("Architecture diagram not available for this project.");
           return;
        }

        const id = `mermaid-${Math.floor(Math.random() * 100000)}`;
        window.mermaid.render(id, cleanChart).then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        }).catch(e => {
          console.error("Mermaid Render Error:", e);
          setError("Failed to render architecture diagram. The syntax might be invalid.");
        });
      } catch (err) { 
        console.error("Mermaid Init Error:", err);
        setError("Mermaid initialization failed.");
      }
    }
  }, [chart]);

  return (
    <div className="relative w-full py-4 overflow-x-auto bg-black/10 rounded-xl my-4 min-h-[200px] flex items-center justify-center">
      {error ? (
        <div className="text-xs text-red-400 font-mono p-4 border border-red-500/20 rounded-lg bg-red-500/5">
          {error}
        </div>
      ) : (
        <div ref={ref} className="w-full flex justify-center" />
      )}
    </div>
  );
}

function LoadingScreen() {
  const steps = [
    { label: 'Cloning repository', icon: <GitBranch size={14} /> },
    { label: 'Generating summary', icon: <FileCode2 size={14} /> },
    { label: 'Running security scan', icon: <ShieldAlert size={14} /> },
    { label: 'Analyzing architecture', icon: <LayoutDashboard size={14} /> },
    { label: 'Building dependency graph', icon: <Share2 size={14} /> },
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    // Slower transition (8 seconds) to be more realistic for local AI
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass rounded-2xl p-10 text-center animate-fade-up" style={{ border: '1px solid var(--border)' }}>
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full" style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', opacity: 0.15 }} />
          <Loader2 size={36} className="animate-spin-slow absolute inset-0 m-auto" style={{ color: '#6366f1' }} />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Oracle is Analyzing…</h3>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Local AI analysis can take 1–3 minutes depending on your hardware.</p>
      <div className="space-y-3 text-left max-w-xs mx-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`step-dot ${i < step ? 'done' : ''}`}
              style={{ background: i < step ? 'var(--accent-green)' : i === step ? 'var(--accent-blue)' : 'var(--border)' }} />
            <span className="text-xs flex items-center gap-1.5" style={{ color: i <= step ? 'var(--text-subtle)' : 'var(--text-muted)' }}>
              {s.icon} {s.label} {i < step && <CheckCircle2 size={12} style={{ color: 'var(--accent-green)' }} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Parse the summary into 4 sections by detecting headers
function parseSummaryParagraphs(summary) {
  if (!summary) return [];

  const sectionDefs = [
    { key: 'objective',    numPatterns: ['1.', '#1', 'THE CORE OBJECTIVE', 'Core Objective', 'CORE OBJECTIVE'], icon: '🎯', accent: '#6366f1', title: 'The Core Objective', subtitle: 'The "Why"' },
    { key: 'stack',        numPatterns: ['2.', '#2', 'THE ARCHITECTURAL STACK', 'Architectural Stack', 'ARCHITECTURAL STACK'], icon: '⚙️', accent: '#06b6d4', title: 'The Architectural Stack', subtitle: 'The "How"' },
    { key: 'dataflow',     numPatterns: ['3.', '#3', 'DATA FLOW AND FLUIDITY', 'Data Flow', 'DATA FLOW'], icon: '🌊', accent: '#10b981', title: 'Data Flow and Fluidity', subtitle: 'Request Lifecycle' },
    { key: 'impact',       numPatterns: ['4.', '#4', 'RESULTS AND IMPACT', 'Results and Impact', 'RESULTS AND IMPACT'], icon: '🚀', accent: '#f59e0b', title: 'Results and Impact', subtitle: 'Outcomes & Value' },
  ];

  // Split on blank lines or heading markers
  const rawParagraphs = summary
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  // Try to match numbered sections
  const sections = [];
  let i = 0;
  for (const def of sectionDefs) {
    // Find a paragraph that matches this section header
    let found = false;
    for (let j = 0; j < rawParagraphs.length; j++) {
      const p = rawParagraphs[j];
      const pUpper = p.toUpperCase();
      if (def.numPatterns.some(pat => pUpper.includes(pat.toUpperCase()))) {
        // Check if this paragraph IS the header (short) or contains the content
        const cleaned = p.replace(/\*\*/g, '').replace(/#/g, '').trim();
        // If paragraph is just the header, grab the next paragraph
        if (cleaned.length < 100 && j + 1 < rawParagraphs.length) {
          const content = rawParagraphs[j + 1].replace(/\*\*/g, '').trim();
          sections.push({ ...def, content });
        } else {
          // Strip the header portion from the content
          const lines = p.split('\n');
          const contentLines = lines.slice(1).join('\n').replace(/\*\*/g, '').trim();
          sections.push({ ...def, content: contentLines || cleaned });
        }
        found = true;
        break;
      }
    }
    if (!found && rawParagraphs[i]) {
      // Fallback: just use paragraphs in order
      sections.push({ ...def, content: rawParagraphs[i].replace(/\*\*/g, '').trim() });
      i++;
    } else {
      i++;
    }
  }

  return sections;
}

function SummaryTab({ summary }) {
  const sections = parseSummaryParagraphs(summary);
  const hasStructured = sections.length >= 4 && sections.every(s => s.content && s.content.length > 30);

  return (
    <div className="animate-fade-in p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div style={{ width: 4, height: 28, background: 'var(--accent-blue)', borderRadius: 99 }} />
          <div>
            <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Technical Executive Summary</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI-generated analysis · 4 dimensions of insight</p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-xs font-bold transition-all"
          onClick={() => {
            const blob = new Blob([summary], { type: 'text/markdown' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url; a.download = 'Project_Summary.md'; a.click();
          }}>
          <Download size={14} /> Download Report
        </button>
      </div>

      {hasStructured ? (
        /* ── Structured 4-card layout ── */
        <div className="grid grid-cols-1 gap-5">
          {sections.map((sec, idx) => (
            <div
              key={sec.key}
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${sec.accent}08 0%, rgba(0,0,0,0.35) 100%)`,
                border: `1px solid ${sec.accent}30`,
                boxShadow: `0 0 24px ${sec.accent}0a`
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl text-lg font-black"
                  style={{ background: `${sec.accent}22`, border: `1px solid ${sec.accent}44` }}>
                  {sec.icon}
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: sec.accent }}>
                    {idx + 1} of 4
                  </div>
                  <h4 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {sec.title} <span className="font-normal text-sm" style={{ color: 'var(--text-muted)' }}>— {sec.subtitle}</span>
                  </h4>
                </div>
                {/* Accent bar */}
                <div className="ml-auto h-1 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${sec.accent}, transparent)` }} />
              </div>

              {/* Content */}
              <p className="leading-7 text-sm" style={{ color: 'var(--text-subtle)', lineHeight: '1.85' }}>
                {sec.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* ── Fallback: raw markdown ── */
        <div className="md-body rounded-2xl p-8 leading-relaxed"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', fontSize: '15px' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function SecurityTab({ vulnerabilities = [], severityCounts = {} }) {
  const order = ['critical', 'high', 'medium', 'low'];
  const sorted = [...vulnerabilities].sort((a, b) => order.indexOf(a.severity?.toLowerCase()) - order.indexOf(b.severity?.toLowerCase()));
  return (
    <div className="animate-fade-in p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div style={{ width: 4, height: 28, background: '#ef4444', borderRadius: 99 }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Vulnerability Assessment</h3>
        </div>
        <div className="flex gap-2">
          {severityCounts.high > 0 && <span className="badge badge-high">{severityCounts.high} HIGH</span>}
          {severityCounts.medium > 0 && <span className="badge badge-medium">{severityCounts.medium} MEDIUM</span>}
          {severityCounts.low > 0 && <span className="badge badge-low">{severityCounts.low} LOW</span>}
        </div>
      </div>
      <div className="space-y-4">
        {sorted.map((v, i) => (
          <div key={i} className={`vuln-card ${severityColor(v.severity)}`}>
            <div className="flex justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${v.severity?.toLowerCase() === 'high' ? 'bg-red-500' : v.severity?.toLowerCase() === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                <h4 className="font-bold text-gray-100">{v.title}</h4>
              </div>
              <span className={`badge ${badgeClass(v.severity)}`}>{v.severity}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mb-4 text-gray-500 font-mono">
              <FileCode2 size={12} /> {v.file}
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-black text-green-400 uppercase tracking-tighter mb-2">
                <Zap size={14} fill="currentColor" /> FIX
              </div>
              <p className="text-sm text-green-200/80 leading-relaxed">
                {v.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureTab({ architecture }) {
  return (
    <div className="animate-fade-in p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <div style={{ width: 4, height: 28, background: 'var(--accent-green)', borderRadius: 99 }} />
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Architectural Analysis</h3>
      </div>
      <div className="md-body rounded-xl p-6" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{architecture}</ReactMarkdown>
      </div>
    </div>
  );
}

function GraphTab({ graph }) {
  return (
    <div className="animate-fade-in p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div style={{ width: 4, height: 28, background: 'var(--accent-cyan)', borderRadius: 99 }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dependency Topology</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold text-gray-400">
          <Share2 size={12} /> {graph?.nodes?.length || 0} nodes · {graph?.links?.length || 0} links
        </div>
      </div>
      <DependencyGraph data={graph} />
      <div className="mt-4 text-center text-[10px] text-gray-500">
        Nodes represent files · Lines represent imports · Drag nodes to interact with the physics
      </div>
    </div>
  );
}

// ─── 4. Main App Component ───────────────────────────────────────────────────

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState('');

  const inputType = detectInputType(repoUrl);

  const handleAudit = useCallback(async () => {
    if (!repoUrl.trim() || inputType === 'invalid') return;
    setLoading(true); setError(''); setAuditData(null);
    try {
      const res = await axios.post('http://localhost:5000/api/audit', { repoUrl: repoUrl.trim() });
      setAuditData(res.data);
      setActiveTab('summary');
    } catch (err) {
      setError(err.response?.data?.error || 'Backend Connection Failed');
    } finally { setLoading(false); }
  }, [repoUrl, inputType]);

  return (
    <div className="min-h-screen bg-animated p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex justify-center gap-3 mb-2">
            <Zap size={32} className="text-indigo-500" />
            <h1 className="text-4xl font-black gradient-text">CodeGraph AI</h1>
          </div>
          <p className="text-gray-400">Professional Repository Audit Oracle</p>
        </header>

        <div className="glass p-6 mb-8 rounded-2xl">
          <div className="flex gap-3">
            <input
              className="input-dark flex-1 rounded-xl p-4"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="Enter GitHub URL or Local Path..."
              onKeyDown={e => e.key === 'Enter' && handleAudit()}
            />
            <button onClick={handleAudit} disabled={loading} className="btn-glow px-8 rounded-xl font-bold">
              {loading ? 'Analyzing...' : 'Run Audit'}
            </button>
          </div>
        </div>

        {error && <div className="p-4 mb-6 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">{error}</div>}
        {loading && <LoadingScreen />}

        {auditData && !loading && (
          <div className="glass rounded-2xl overflow-hidden animate-fade-up">
            <div className="p-6 bg-white/5 border-b border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-1">Active Project</div>
                  <h2 className="text-3xl font-black text-white">{auditData.projectName}</h2>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <FileCode2 size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-gray-300">{auditData.fileCount} files</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <ShieldAlert size={14} className="text-red-400" />
                    <span className="text-xs font-bold text-gray-300">{auditData.vulnerabilities?.length} Issues</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <Clock size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-gray-300">{new Date(auditData.lastScanned).toLocaleTimeString()}</span>
                  </div>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-xs font-bold transition-all"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${auditData.projectName}_audit_report.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                    <Download size={14} /> Download JSON Report
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {auditData.techStack?.map(t => <span key={t} className="tech-pill">{t}</span>)}
              </div>
            </div>

            <div className="tab-bar">
              <button onClick={() => setActiveTab('summary')} className={`tab-btn ${activeTab === 'summary' ? 'active-summary' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <FileCode2 size={14} /> SUMMARY
                </div>
              </button>
              <button onClick={() => setActiveTab('security')} className={`tab-btn ${activeTab === 'security' ? 'active-security' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <ShieldAlert size={14} /> SECURITY ({auditData.vulnerabilities?.length})
                </div>
              </button>
              <button onClick={() => setActiveTab('arch')} className={`tab-btn ${activeTab === 'arch' ? 'active-arch' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <LayoutDashboard size={14} /> ARCHITECTURE
                </div>
              </button>
              <button onClick={() => setActiveTab('graph')} className={`tab-btn ${activeTab === 'graph' ? 'active-graph' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <Share2 size={14} /> FILE GRAPH
                </div>
              </button>
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'summary' && <SummaryTab summary={auditData.projectSummary} />}
              {activeTab === 'security' && <SecurityTab vulnerabilities={auditData.vulnerabilities} severityCounts={auditData.severityCounts} />}
              {activeTab === 'arch' && <ArchitectureTab architecture={auditData.architecture} />}
              {activeTab === 'graph' && <GraphTab key={auditData.lastScanned} graph={auditData.graph} />}
            </div>

            <div className="px-6 py-3 bg-black/40 border-t border-white/10 flex justify-between items-center">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                SCAN COMPLETED · {new Date(auditData.lastScanned).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                CodeGraph Oracle v2.0
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}