import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// Color palette for node types
function getNodeColor(node) {
  const id = (node.id || '').toLowerCase();
  const comp = node.complexity || 1;

  if (id.endsWith('.py'))   return '#a78bfa'; // violet – Python
  if (id.endsWith('.go'))   return '#34d399'; // emerald – Go
  if (id.endsWith('.java')) return '#fb923c'; // orange – Java
  if (id.endsWith('.tsx') || id.endsWith('.jsx')) return '#38bdf8'; // sky – React
  if (id.endsWith('.ts'))   return '#60a5fa'; // blue – TypeScript
  if (id.endsWith('.js'))   return '#facc15'; // yellow – JavaScript
  if (comp > 7)             return '#f87171'; // red – high complexity
  if (comp > 4)             return '#fb923c'; // orange – medium
  return '#818cf8';                           // indigo – default
}

function getGlowColor(node) {
  const c = getNodeColor(node);
  return c;
}

// Draw a glowing circle node with label
function drawNode(node, ctx, globalScale, hoveredId) {
  if (!node || typeof node.x !== 'number') return;

  const isHovered = node.id === hoveredId;
  const label = (node.id || '').split('/').pop() || node.id;
  const radius  = Math.max(4, (node.complexity || 1) * 2);
  const color   = getNodeColor(node);
  const fontSize = Math.max(8, 11 / globalScale);

  // --- Glow halo ---
  const glowRadius = isHovered ? radius * 3.5 : radius * 2.2;
  const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
  grd.addColorStop(0, color + 'cc');
  grd.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
  ctx.fillStyle = grd;
  ctx.fill();

  // --- Core circle ---
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.shadowBlur = isHovered ? 24 : 12;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;

  // --- Ring on hover ---
  if (isHovered) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI, false);
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();
  }

  // --- Label ---
  ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // subtle background for readability
  const tw = ctx.measureText(label).width;
  const pad = 2 / globalScale;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(node.x - tw / 2 - pad, node.y + radius + 4 / globalScale, tw + pad * 2, fontSize + pad * 2);
  ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(255,255,255,0.82)';
  ctx.fillText(label, node.x, node.y + radius + 4 / globalScale + pad);
}

// ─── Legend Component ─────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { color: '#38bdf8', label: 'React / JSX' },
    { color: '#facc15', label: 'JavaScript' },
    { color: '#60a5fa', label: 'TypeScript' },
    { color: '#a78bfa', label: 'Python' },
    { color: '#34d399', label: 'Go' },
    { color: '#fb923c', label: 'Java / Complex' },
    { color: '#f87171', label: 'High Complexity' },
    { color: '#818cf8', label: 'Other' },
  ];
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', zIndex: 10, backdropFilter: 'blur(8px)'
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase' }}>Node Types</div>
      {items.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ fontSize: 10, color: '#aaa' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DependencyGraph = ({ data }) => {
  const fgRef   = useRef();
  const wrapRef = useRef();
  const [dims, setDims]     = useState({ w: 700, h: 500 });
  const [hoveredId, setHoveredId] = useState(null);

  // Measure container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Configure forces once graph mounts
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !data?.nodes?.length) return;

    // Longer charge for more natural spread
    if (typeof fg.d3Force === 'function') {
      fg.d3Force('charge').strength(-500).distanceMax(400);
      fg.d3Force('link').distance(80).strength(0.5);

      // Add collision detection to prevent overlap
      try {
        const d3 = window.d3;
        if (d3 && d3.forceCollide) {
          fg.d3Force('collide', d3.forceCollide(node => Math.max(8, (node.complexity || 1) * 2.5)));
        }
      } catch (_) {}

      // Reheat on mount for dramatic entrance animation
      fg.d3ReheatSimulation?.();
    }
  }, [data]);

  // Auto-fit to screen after warm-up
  const handleEngineStop = useCallback(() => {
    fgRef.current?.zoomToFit(600, 60);
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHoveredId(node ? node.id : null);
    document.body.style.cursor = node ? 'grab' : 'default';
  }, []);

  const handleNodeDrag = useCallback((node) => {
    // Re-heat simulation when dragging so other nodes react
    fgRef.current?.d3ReheatSimulation?.();
  }, []);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#020617', border: '1px solid #1e293b', borderRadius: 12, color: '#475569', fontSize: 14 }}>
        No dependency data available for this project.
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: 520, borderRadius: 12, overflow: 'hidden',
      border: '1px solid #1e293b', background: 'radial-gradient(ellipse at 50% 30%, #0d1225 0%, #020617 100%)' }}>

      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <Legend />

      <ForceGraph2D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={data}

        // Physics
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        warmupTicks={120}
        cooldownTicks={300}
        cooldownTime={8000}

        // Aesthetics
        backgroundColor="transparent"

        // Links
        linkCurvature={0.25}
        linkColor={() => 'rgba(99,102,241,0.20)'}
        linkWidth={1.2}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={0.88}
        linkDirectionalArrowColor={() => 'rgba(99,102,241,0.55)'}

        // Particles — "data flowing through the codebase"
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleSpeed={node => Math.max(0.003, (node?.source?.complexity || 1) * 0.0025)}
        linkDirectionalParticleColor={link => getNodeColor(link.source)}

        // Nodes
        nodeRelSize={6}
        nodeCanvasObject={(node, ctx, gs) => drawNode(node, ctx, gs, hoveredId)}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          const r = Math.max(4, (node.complexity || 1) * 2) + 6;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fill();
        }}

        // Interactions
        onNodeHover={handleNodeHover}
        onNodeDrag={handleNodeDrag}
        onEngineStop={handleEngineStop}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}

        // Tooltip
        nodeLabel={node => {
          const comp = node.complexity || 1;
          const level = node.level ?? '—';
          return `<div style="
            background:#1e1e2e; border:1px solid #6366f1; border-radius:8px;
            padding:8px 12px; font-size:12px; color:#e2e8f0; max-width:220px;
            font-family:Inter,sans-serif; box-shadow:0 4px 20px rgba(99,102,241,0.3)
          ">
            <div style="font-weight:700;color:#a5b4fc;margin-bottom:4px;">${(node.id || '').split('/').pop()}</div>
            <div style="color:#94a3b8;font-size:11px;">${node.id}</div>
            <div style="margin-top:6px;display:flex;gap:10px;">
              <span>Complexity: <b style="color:#f472b6">${comp}</b></span>
              <span>Level: <b style="color:#34d399">${level}</b></span>
            </div>
          </div>`;
        }}
      />
    </div>
  );
};

export default DependencyGraph;
