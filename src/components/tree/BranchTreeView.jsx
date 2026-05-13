import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  addEdge, Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Zap, Trash2, GitBranch, X, GripHorizontal, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { DecisionNode } from './DecisionNode.jsx';
import { OutcomeEdge } from './OutcomeEdge.jsx';
import { getNodeColor } from '../../utils/scoreCalculator.js';
import { decisionCards, CATEGORY_META } from '../../data/decisionCards.js';
import { simulateDecisionTree } from '../../utils/claudeClient.js';
import { SimulationLoadingScreen } from '../simulation/SimulationLoadingScreen.jsx';

const nodeTypes = { decision: DecisionNode };
const edgeTypes = { outcome: OutcomeEdge };

// ── Helpers ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255';
}

function findAllPaths(nodes, edges) {
  const childMap = {};
  const parentSet = new Set();
  edges.forEach(e => {
    if (!childMap[e.source]) childMap[e.source] = [];
    childMap[e.source].push(e.target);
    parentSet.add(e.target);
  });
  const roots = nodes.filter(n => !parentSet.has(n.id));
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const paths = [];

  function dfs(nodeId, path) {
    path.push(nodeMap[nodeId]?.data?.label || nodeId);
    const children = childMap[nodeId] || [];
    if (!children.length) { paths.push([...path]); }
    else children.forEach(c => dfs(c, [...path]));
  }

  roots.forEach(r => dfs(r.id, []));
  return paths;
}

// ── Build initial graph from events/treeData ─────────────────────────
function buildChain(events, prediction, xOffset = 200, startY = 0, pathLabel = null, pathColor = null, onAddAfter = null) {
  const nodes = [], edges = [];
  const flowMap = {};
  prediction?.eventFlow?.forEach(ef => { flowMap[ef.label] = ef; });
  const overallScore = prediction?.scores?.overall;
  let prevId = null, y = startY;

  if (pathLabel) {
    const headId = `head-${xOffset}`;
    nodes.push({ id: headId, type: 'decision', position: { x: xOffset, y },
      data: { label: prediction?.dayTitle || pathLabel, time: pathLabel, score: overallScore, emoji: '🗓', color: pathColor, onAddAfter: onAddAfter ? () => onAddAfter(headId) : null } });
    prevId = headId; y += 150;
  }

  events.forEach((evt, i) => {
    const label = evt.label || evt.card?.label;
    const timeStr = evt.time || (evt.startMinutes != null
      ? `${String(Math.floor(evt.startMinutes/60)).padStart(2,'0')}:${String(evt.startMinutes%60).padStart(2,'0')}`
      : '');
    const icon = evt.icon || evt.card?.icon || '⚡';
    const flow = flowMap[label];
    const id = `node-${xOffset}-${i}`;
    nodes.push({ id, type: 'decision', position: { x: xOffset, y },
      data: { label: label || '?', time: timeStr, score: overallScore, emoji: icon, insight: flow?.insight, color: pathColor, onAddAfter: onAddAfter ? () => onAddAfter(id) : null } });
    if (prevId) edges.push({ id: `edge-${prevId}-${id}`, source: prevId, target: id, type: 'outcome', data: { score: overallScore, color: pathColor } });
    prevId = id; y += 140;
  });

  return { nodes, edges, lastId: prevId, endY: y };
}

function buildFromSlots(slots, predictions, onAddAfter) {
  const nodes = [], edges = [];
  let prevId = null, y = 0;
  Object.keys(slots).sort().forEach(timeKey => {
    const cards = slots[timeKey];
    if (!cards?.length) return;
    const pred = predictions[timeKey];
    const score = pred?.scores?.overall;
    const id = `node-${timeKey}`;
    nodes.push({ id, type: 'decision', position: { x: 200, y },
      data: { label: cards.map(c => c.label).join(' + '), time: timeKey, score, emoji: cards[0]?.icon, onAddAfter: onAddAfter ? () => onAddAfter(id) : null } });
    if (prevId) edges.push({ id: `edge-${prevId}-${id}`, source: prevId, target: id, type: 'outcome', data: { score } });
    prevId = id; y += 140;
  });
  return { nodes, edges, lastId: prevId };
}

function buildGraph(slots, predictions, events, dayPrediction, treeData, onAddAfter) {
  if (treeData?.paths?.length) {
    const COLUMN_WIDTH = 380;
    const totalWidth = treeData.paths.length * COLUMN_WIDTH;
    const startX = -(totalWidth / 2) + COLUMN_WIDTH / 2 + 200;
    let allNodes = [], allEdges = [];

    treeData.paths.forEach((path, i) => {
      const xOffset = startX + i * COLUMN_WIDTH;
      const { nodes, edges } = buildChain(path.events || [], path.prediction, xOffset, 0, path.label, path.color, onAddAfter);
      allNodes = [...allNodes, ...nodes];
      allEdges = [...allEdges, ...edges];
    });

    if (treeData.type === 'comparison' && treeData.paths.length === 2) {
      const rootId = 'root-comparison';
      allNodes.unshift({ id: rootId, type: 'decision', position: { x: startX + COLUMN_WIDTH / 2, y: -150 },
        data: { label: 'Day Comparison', time: 'Start', score: null, emoji: '⚡', onAddAfter: null } });
      treeData.paths.forEach((path, i) => {
        const firstNode = allNodes.find(n => n.id !== rootId && Math.abs(n.position.x - (startX + i * COLUMN_WIDTH)) < 10);
        if (firstNode) allEdges.unshift({ id: `edge-root-${i}`, source: rootId, target: firstNode.id, type: 'outcome', data: { color: path.color } });
      });
    }
    return { nodes: allNodes, edges: allEdges, lastId: allNodes[allNodes.length - 1]?.id };
  }

  if (events?.length) {
    const sorted = [...events].sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0));
    return buildChain(sorted, dayPrediction, 200, 0, null, null, onAddAfter);
  }

  if (slots && Object.keys(slots).length) {
    return buildFromSlots(slots, predictions, onAddAfter);
  }

  return { nodes: [], edges: [], lastId: null };
}

// ── Tree Simulation Result Panel (floating, draggable, resizable) ──────
function TreeSimResult({ result, onClose, inspectedLabel }) {
  if (!result) return null;

  const dragControls = useDragControls();
  const [size, setSize] = useState({ width: 360, height: 520 });
  const [minimized, setMinimized] = useState(false);
  const resizeRef = useRef({ active: false });
  const bestIdx = result.bestPathIndex ?? 0;
  const pathColors = ['#00d4b1', '#a78bfa', '#f59e0b', '#f87171'];

  const inspectedNode = inspectedLabel
    ? result.nodeInsights?.find(n => n.label === inspectedLabel)
    : null;

  const onResizeStart = (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = size.width, startH = size.height;
    resizeRef.current.active = true;
    const onMove = (me) => {
      if (!resizeRef.current.active) return;
      setSize({ width: Math.max(300, startW + me.clientX - startX), height: Math.max(280, startH + me.clientY - startY) });
    };
    const onUp = () => { resizeRef.current.active = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', right: 28, top: 90, zIndex: 9000,
        width: size.width,
        height: minimized ? 'auto' : size.height,
        background: 'rgba(9,9,15,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18,
        boxShadow: '0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Drag handle header */}
      <div
        onPointerDown={e => dragControls.start(e)}
        style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, cursor: 'grab', background: 'rgba(255,255,255,0.03)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GripHorizontal size={14} color="rgba(255,255,255,0.25)" />
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,rgba(0,212,177,0.25),rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={12} color="#00d4b1" />
          </div>
          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12, color: '#f1f5f9', lineHeight: 1.2, margin: 0 }}>Tree Analysis</p>
            <p style={{ fontSize: 9, color: '#475569', marginTop: 1, margin: 0 }}>{result.treeTitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setMinimized(m => !m)} title={minimized ? 'Expand' : 'Minimize'} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', color: '#94a3b8', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
            {minimized ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          <button onClick={onClose} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 6, cursor: 'pointer', color: '#f87171', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Inspected node highlight */}
      <AnimatePresence>
        {inspectedNode && !minimized && (
          <motion.div
            key={inspectedNode.label}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderBottom: '1px solid rgba(0,212,177,0.2)', overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{ padding: '12px 16px', background: 'rgba(0,212,177,0.08)' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(0,212,177,0.8)', fontFamily: 'Space Grotesk', marginBottom: 6 }}>
                📍 Selected Node Analysis
              </p>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#f1f5f9', marginBottom: 6 }}>
                {inspectedNode.label}
              </p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                {inspectedNode.insight}
              </p>
              {inspectedNode.score != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${inspectedNode.score * 10}%`, background: `linear-gradient(90deg, #00d4b188, #00d4b1)`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 13, color: '#00d4b1' }}>{inspectedNode.score}/10</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!minimized && <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Overall wisdom */}
        {result.overallWisdom && (
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(0,212,177,0.07)', border: '1px solid rgba(0,212,177,0.2)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(0,212,177,0.7)', fontFamily: 'Space Grotesk', marginBottom: 6 }}>✦ Big Picture</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{result.overallWisdom}</p>
          </div>
        )}

        {/* Best path */}
        {result.bestPathReason && (
          <div style={{ padding: '12px 14px', borderRadius: 14, background: `rgba(${hexToRgb(pathColors[bestIdx])},0.1)`, border: `1.5px solid rgba(${hexToRgb(pathColors[bestIdx])},0.35)` }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: pathColors[bestIdx], fontFamily: 'Space Grotesk', marginBottom: 6 }}>🏆 Best Path</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{result.bestPathReason}</p>
          </div>
        )}

        {/* Path analyses */}
        {result.pathAnalyses?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Grotesk', margin: 0 }}>Path Breakdown</p>
            {result.pathAnalyses.map((pa, i) => {
              const col = pathColors[i] || '#94a3b8';
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: col }}>{pa.pathLabel}</span>
                    {pa.scores?.overall != null && (
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 14, color: col }}>{pa.scores.overall}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>/10</span></span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 11, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', margin: '0 0 6px' }}>{pa.narrative}</p>
                  {pa.identity && <p style={{ fontFamily: 'DM Sans', fontSize: 11, lineHeight: 1.55, color: col, margin: 0, fontStyle: 'italic', opacity: 0.8 }}>"{pa.identity}"</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Activity insights — clickable */}
        {result.nodeInsights?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Grotesk', margin: 0 }}>
              🔍 Activity Insights <span style={{ color: '#334155', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(click a tree node to inspect)</span>
            </p>
            {result.nodeInsights.map((ni, i) => {
              const isInspected = inspectedLabel === ni.label;
              return (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: isInspected ? 'rgba(0,212,177,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isInspected ? 'rgba(0,212,177,0.4)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: isInspected ? '#00d4b1' : '#e2e8f0', margin: 0 }}>{ni.label}</p>
                    {ni.score != null && <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 11, color: isInspected ? '#00d4b1' : '#64748b' }}>{ni.score}/10</span>}
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 11, lineHeight: 1.6, color: isInspected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', margin: 0 }}>{ni.insight}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Grotesk', margin: 0 }}>💡 Suggestions</p>
            {result.suggestions.map((s, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{s.emoji || '✨'}</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: '#a78bfa' }}>After {s.afterLabel}: {s.suggestedActivity}</span>
                </div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{s.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Resize handle */}
      {!minimized && (
        <div
          onMouseDown={onResizeStart}
          style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 4 }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(255,255,255,0.2)">
            <path d="M 10 0 L 10 10 L 0 10 Z" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

// ── Card Picker Panel ─────────────────────────────────────────────────
const CATEGORIES_ORDER = ['personal', 'activity', 'fitness', 'study', 'location', 'transport', 'chores', 'social'];

function CardPickerPanel({ onSelectCard, onClose }) {
  const [search, setSearch] = useState('');
  const allCards = decisionCards.filter(c => c.category !== 'appearance' && c.category !== 'mood');
  const filtered = search
    ? allCards.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : allCards;

  // Group by category, sorted by CATEGORIES_ORDER (personal first)
  const grouped = {};
  filtered.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });
  const sortedCategories = [
    ...CATEGORIES_ORDER.filter(cat => grouped[cat]),
    ...Object.keys(grouped).filter(cat => !CATEGORIES_ORDER.includes(cat)),
  ];

  return (
    <div style={{ width: 220, height: '100%', background: 'rgba(9,9,15,0.97)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Add Activity</p>
          {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={13} /></button>}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search activities…"
          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 12, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }}
        />
        {/* Instruction */}
        <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(0,212,177,0.07)', border: '1px solid rgba(0,212,177,0.18)' }}>
          <p style={{ fontSize: 10, color: 'rgba(0,212,177,0.85)', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.55 }}>
            <strong>Click</strong> a card to add after the selected node,
            or <strong>drag & drop</strong> it anywhere onto the canvas.
          </p>
        </div>
      </div>

      {/* Card list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortedCategories.map(cat => {
          const cards = grouped[cat];
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat}>
              <div style={{ padding: '8px 14px 4px', position: 'sticky', top: 0, background: 'rgba(9,9,15,0.98)', zIndex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: meta?.color || '#475569', fontFamily: 'Space Grotesk' }}>{cat}</span>
              </div>
              {cards.map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/tree-card', JSON.stringify(card));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onSelectCard(card)}
                  style={{ width: '100%', padding: '7px 14px', background: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{card.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans', lineHeight: 1.3, flex: 1 }}>{card.label}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} title="Drag onto canvas">⠿</span>
                </div>
              ))}
            </div>
          );
        })}

      </div>
    </div>
  );
}

// ── Main BranchTreeView ───────────────────────────────────────────────
export function BranchTreeView({ slots = {}, predictions = {}, events = [], dayPrediction, treeData, onNodeClick, profile, mood, outfits }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [inspectedLabel, setInspectedLabel] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [pendingParentId, setPendingParentId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const nodeCountRef = useRef(1000);
  const rfInstanceRef = useRef(null);

  // Called when user clicks "+" on a node
  const handleAddAfter = useCallback((nodeId) => {
    setPendingParentId(nodeId);
    setSelectedNodeId(nodeId);
    setShowCardPicker(true);
  }, []);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(slots, predictions, events, dayPrediction, treeData, handleAddAfter),
    [slots, predictions, events, dayPrediction, treeData, handleAddAfter]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => {
    setNodes(prev => {
      // Re-inject onAddAfter callbacks since they reference the latest handleAddAfter
      return initNodes.map(n => ({
        ...n,
        data: { ...n.data, onAddAfter: () => handleAddAfter(n.id) },
      }));
    });
    setEdges(initEdges);
  }, [initNodes, initEdges, handleAddAfter, setNodes, setEdges]);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'outcome', data: {} }, eds));
  }, [setEdges]);

  const onNodeClickHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    // If a simulation has been run, inspect this node's analysis
    const label = node.data?.label;
    if (label) setInspectedLabel(label);
    const timeKey = node.id.replace(/^node-[^-]+-/, '').replace('node-', '');
    onNodeClick?.({ timeKey, prediction: predictions[timeKey] });
  }, [predictions, onNodeClick]);

  // Add a card as a new node after the selected/pending parent
  const handleCardSelected = useCallback((card) => {
    const parentId = pendingParentId || nodes[nodes.length - 1]?.id;
    const newId = `user-node-${nodeCountRef.current++}`;
    const parentNode = nodes.find(n => n.id === parentId);
    const newY = parentNode ? parentNode.position.y + 150 : nodes.length * 150;
    const newX = parentNode ? parentNode.position.x : 200;
    const meta = CATEGORY_META[card.category];

    const newNode = {
      id: newId, type: 'decision',
      position: { x: newX, y: newY },
      data: {
        label: card.label, time: '', score: null,
        emoji: card.icon, color: meta?.color || '#00d4b1',
        onAddAfter: () => handleAddAfter(newId),
      },
    };
    setNodes(ns => [...ns, newNode]);
    if (parentId) {
      setEdges(es => [...es, { id: `edge-${parentId}-${newId}`, source: parentId, target: newId, type: 'outcome', data: {} }]);
    }
    setPendingParentId(newId); // next card adds after this one
    setSelectedNodeId(newId);
  }, [pendingParentId, nodes, setNodes, setEdges, handleAddAfter]);

  // Delete selected node
  // Drop a card from the picker panel onto the canvas at a specific position
  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/tree-card');
    if (!raw || !rfInstanceRef.current) return;
    const card = JSON.parse(raw);
    const position = rfInstanceRef.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newId = `user-node-${nodeCountRef.current++}`;
    const meta = CATEGORY_META[card.category];
    const newNode = {
      id: newId, type: 'decision',
      position,
      data: { label: card.label, time: '', score: null, emoji: card.icon, color: meta?.color || '#00d4b1', onAddAfter: () => handleAddAfter(newId) },
    };
    setNodes(ns => [...ns, newNode]);
    // Auto-connect to selected node if one is selected
    if (selectedNodeId) {
      setEdges(es => [...es, { id: `edge-${selectedNodeId}-${newId}`, source: selectedNodeId, target: newId, type: 'outcome', data: {} }]);
    }
    setSelectedNodeId(newId);
    setPendingParentId(newId);
  }, [rfInstanceRef, selectedNodeId, setNodes, setEdges, handleAddAfter]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNodeId));
    setEdges(es => es.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  // Simulate the tree
  const handleSimulate = useCallback(async () => {
    if (nodes.length === 0) return;
    const paths = findAllPaths(nodes, edges);
    if (paths.length === 0) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const result = await simulateDecisionTree({
        paths,
        nodeLabels: nodes.map(n => n.data.label),
        profile, mood, outfits,
      });
      // Inject insights back into nodes
      if (result.nodeInsights?.length) {
        const insightMap = {};
        result.nodeInsights.forEach(ni => { insightMap[ni.label] = ni; });
        setNodes(ns => ns.map(n => {
          const ins = insightMap[n.data.label];
          if (!ins) return n;
          return { ...n, data: { ...n.data, insight: ins.insight, score: ins.score, onAddAfter: () => handleAddAfter(n.id) } };
        }));
      }
      setSimResult(result);
    } catch (err) {
      console.error('Tree simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  }, [nodes, edges, profile, mood, outfits, handleAddAfter]);

  const hasNodes = nodes.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Loading overlay */}
      <SimulationLoadingScreen active={simLoading} currentAction="your decision tree" />

      {/* Card picker panel */}
      {showCardPicker && (
        <CardPickerPanel
          onSelectCard={(card) => { handleCardSelected(card); }}
          onClose={() => setShowCardPicker(false)}
        />
      )}

      {/* Main ReactFlow canvas */}
      <div
        style={{ flex: 1, position: 'relative', minWidth: 0, border: isDragOver ? '2px dashed rgba(0,212,177,0.5)' : '2px solid transparent', borderRadius: 4, transition: 'border-color 0.15s' }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleCanvasDrop}
      >
        {isDragOver && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,212,177,0.04)', borderRadius: 4 }}>
            <div style={{ background: 'rgba(9,9,15,0.9)', border: '1.5px solid rgba(0,212,177,0.5)', borderRadius: 14, padding: '12px 24px', color: '#00d4b1', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, boxShadow: '0 0 20px rgba(0,212,177,0.3)' }}>
              Drop to add here
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes.map(n => ({ ...n, selected: n.id === selectedNodeId }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClickHandler}
          onPaneClick={() => setSelectedNodeId(null)}
          onInit={instance => { rfInstanceRef.current = instance; }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.35, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ background: 'transparent' }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'outcome', animated: false }}
        >
          {/* Ambient bg */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: '5%', left: '40%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(0,212,177,0.05) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: '10%', right: '20%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)' }} />
          </div>

          <Background variant="dots" color="rgba(255,255,255,0.04)" gap={28} size={1.5} />

          {/* Top-left toolbar */}
          <Panel position="top-left">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'rgba(9,9,15,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, backdropFilter: 'blur(16px)', boxShadow: '0 6px 28px rgba(0,0,0,0.5)', minWidth: 200 }}>

              {/* Section label */}
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', margin: 0 }}>🌿 Tree Builder</p>

              {/* Add Activity */}
              <motion.button
                onClick={() => { setPendingParentId(selectedNodeId || nodes[nodes.length-1]?.id || null); setShowCardPicker(s => !s); }}
                whileHover={{ scale: 1.02, background: 'rgba(0,212,177,0.2)', borderColor: 'rgba(0,212,177,0.6)' }}
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'rgba(0,212,177,0.1)', border: '1.5px solid rgba(0,212,177,0.35)', cursor: 'pointer', color: '#00d4b1', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, textAlign: 'left', width: '100%' }}
              >
                <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(0,212,177,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>＋</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Add Activity</div>
                  <div style={{ fontSize: 10, color: 'rgba(0,212,177,0.6)', fontWeight: 500, marginTop: 1 }}>Click to choose an activity</div>
                </div>
              </motion.button>

              {/* Remove Selected */}
              <motion.button
                onClick={handleDeleteSelected}
                disabled={!selectedNodeId}
                whileHover={selectedNodeId ? { scale: 1.02, background: 'rgba(248,113,113,0.18)', borderColor: 'rgba(248,113,113,0.6)' } : {}}
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: selectedNodeId ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${selectedNodeId ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: selectedNodeId ? 'pointer' : 'not-allowed', color: selectedNodeId ? '#f87171' : 'rgba(255,255,255,0.2)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, textAlign: 'left', width: '100%', opacity: selectedNodeId ? 1 : 0.5 }}
              >
                <span style={{ width: 26, height: 26, borderRadius: 8, background: selectedNodeId ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={13} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Remove Activity</div>
                  <div style={{ fontSize: 10, color: selectedNodeId ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)', fontWeight: 500, marginTop: 1 }}>
                    {selectedNodeId ? 'Click to delete selected node' : 'Select a node first'}
                  </div>
                </div>
              </motion.button>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 0' }} />

              {/* Simulate */}
              <motion.button
                onClick={handleSimulate}
                disabled={!hasNodes || simLoading}
                whileHover={hasNodes && !simLoading ? { scale: 1.02, boxShadow: '0 0 24px rgba(0,212,177,0.45)' } : {}}
                whileTap={{ scale: 0.97 }}
                style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: hasNodes ? 'linear-gradient(135deg, #00d4b1 0%, #00bfa0 40%, #a78bfa 100%)' : 'rgba(255,255,255,0.05)', border: hasNodes ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(255,255,255,0.08)', cursor: hasNodes && !simLoading ? 'pointer' : 'not-allowed', color: hasNodes ? '#000' : 'rgba(255,255,255,0.2)', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, textAlign: 'left', width: '100%', boxShadow: hasNodes ? '0 0 16px rgba(0,212,177,0.3), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none', opacity: !hasNodes || simLoading ? 0.5 : 1 }}
              >
                {hasNodes && (
                  <motion.div
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)', pointerEvents: 'none' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
                  />
                )}
                <span style={{ width: 26, height: 26, borderRadius: 8, background: hasNodes ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <Zap size={14} fill={hasNodes ? 'currentColor' : 'none'} />
                </span>
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>Simulate Tree</div>
                  <div style={{ fontSize: 10, fontWeight: 600, marginTop: 1, opacity: 0.75 }}>
                    {hasNodes ? `AI analysis of ${nodes.length} node${nodes.length !== 1 ? 's' : ''}` : 'Add activities first'}
                  </div>
                </div>
              </motion.button>

            </div>
          </Panel>

          {/* Empty state */}
          {!hasNodes && (
            <Panel position="top-center" style={{ marginTop: 80 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 360, padding: '24px 28px', background: 'rgba(14,14,22,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                <span style={{ fontSize: 44 }}>🌿</span>
                <p style={{ color: '#e2e8f0', fontSize: 15, fontFamily: 'Space Grotesk', fontWeight: 700, margin: 0 }}>Decision Tree</p>
                <p style={{ color: '#475569', fontSize: 12, fontFamily: 'DM Sans', lineHeight: 1.65, margin: 0 }}>The tree populates in three ways:</p>
                {[
                  { color: '#00d4b1', icon: '📅', title: 'Day Canvas', desc: 'Add events to the Day Canvas — they appear here automatically.' },
                  { color: '#a78bfa', icon: '⚡', title: 'Parallel Days', desc: 'Click Simulate or Simulate & Compare — the tree shows after AI returns.' },
                  { color: '#f59e0b', icon: '🌿', title: 'Build Your Own', desc: 'Click + Add Activity above to build a custom decision tree from scratch, then Simulate.' },
                ].map(({ color, icon, title, desc }) => (
                  <div key={title} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, textAlign: 'left', display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <div>
                      <p style={{ color, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, margin: '0 0 3px' }}>{title}</p>
                      <p style={{ color: '#475569', fontFamily: 'DM Sans', fontSize: 11, lineHeight: 1.55, margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Controls
            showZoom showFitView showInteractive={false}
            style={{ background: 'rgba(14,14,22,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          />
          <MiniMap
            nodeColor={n => { if (n.data?.color) return n.data.color + 'cc'; return n.data?.score ? getNodeColor(n.data.score) : '#1e293b'; }}
            maskColor="rgba(9,9,15,0.85)"
            style={{ background: 'rgba(14,14,22,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          />
        </ReactFlow>
      </div>

      {/* Simulation results panel */}
      <AnimatePresence>
        {simResult && (
          <TreeSimResult result={simResult} onClose={() => { setSimResult(null); setInspectedLabel(null); }} inspectedLabel={inspectedLabel} />
        )}
      </AnimatePresence>
    </div>
  );
}
