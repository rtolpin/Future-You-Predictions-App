import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Play, Plus, X, Clock, Sparkles } from 'lucide-react';
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { DayCanvas } from './DayCanvas.jsx';
import { DecisionCard } from './DecisionCard.jsx';
import { CATEGORY_META, decisionCards } from '../../data/decisionCards.js';
import { useTimeline, minutesToLabel } from '../../hooks/useTimeline.js';
import { simulateDayFlow, compareDays } from '../../utils/claudeClient.js';
import { SimulationLoadingScreen } from '../simulation/SimulationLoadingScreen.jsx';

const QUICK_TIMES = Array.from({ length: 19 }, (_, i) => {
  const totalMins = (6 + Math.floor(i / 2)) * 60 + (i % 2 === 0 ? 0 : 30);
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { label: `${h12}:${String(m).padStart(2,'0')} ${period}`, value: totalMins };
});

function nextAvailableTime(events) {
  if (!events.length) return 540; // 9:00 AM
  const lastEnd = Math.max(...events.map(e => e.startMinutes + e.durationMinutes));
  const rounded = Math.ceil(lastEnd / 30) * 30;
  const clamped = Math.min(Math.max(rounded, 360), 1290);
  return QUICK_TIMES.reduce((best, t) =>
    Math.abs(t.value - clamped) < Math.abs(best.value - clamped) ? t : best
  ).value;
}

function QuickAddModal({ pathIdx, pathConfig, timeline, onClose }) {
  const [selectedTime, setSelectedTime] = useState(() => nextAvailableTime(timeline.events));
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => [
    { id: 'all', label: 'All' },
    ...Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, label: meta.label.split(' ').slice(1).join(' ') })),
  ], []);

  const filtered = useMemo(() => decisionCards.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false;
    if (search && !c.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [activeCategory, search]);

  const handleAdd = (card) => {
    timeline.addEvent(selectedTime, card, 60);
    onClose();
  };

  const color = pathConfig.color;
  const rgb = color.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #0d0d1a 0%, #09090f 100%)', border: `1.5px solid rgba(${rgb},0.35)`, borderRadius: 22, boxShadow: `0 0 60px rgba(${rgb},0.18), 0 32px 64px rgba(0,0,0,0.6)`, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: `1px solid rgba(${rgb},0.15)`, background: `rgba(${rgb},0.07)`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${rgb},0.2)`, border: `1.5px solid rgba(${rgb},0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} color={color} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>Quick Add</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', marginTop: 3, lineHeight: 1 }}>Add to {pathConfig.label}</p>
          </div>
          {/* Time picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} color={`rgba(${rgb},0.7)`} />
            <select
              value={selectedTime}
              onChange={e => setSelectedTime(Number(e.target.value))}
              style={{ background: `rgba(${rgb},0.1)`, border: `1.5px solid rgba(${rgb},0.35)`, borderRadius: 10, color: '#f1f5f9', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, padding: '7px 12px', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
            >
              {QUICK_TIMES.map(t => <option key={t.value} value={t.value} style={{ background: '#0d0d1a' }}>{t.label}</option>)}
            </select>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={14} />
          </motion.button>
        </div>

        {/* Search + category filters */}
        <div style={{ padding: '12px 24px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <input
            type="text" placeholder="Search activities…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontFamily: 'DM Sans', fontSize: 13, padding: '8px 14px', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {categories.map(cat => (
              <motion.button
                key={cat.id} onClick={() => setActiveCategory(cat.id)}
                whileTap={{ scale: 0.94 }}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Space Grotesk', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: activeCategory === cat.id ? `rgba(${rgb},0.2)` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeCategory === cat.id ? `rgba(${rgb},0.5)` : 'rgba(255,255,255,0.1)'}`,
                  color: activeCategory === cat.id ? color : '#64748b',
                }}
              >{cat.label}</motion.button>
            ))}
          </div>
        </div>

        {/* Card grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, alignContent: 'start' }}>
          {filtered.map(card => {
            const meta = CATEGORY_META[card.category];
            const cRgb = meta.color.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',');
            return (
              <motion.button
                key={card.id}
                onClick={() => handleAdd(card)}
                whileHover={{ scale: 1.03, y: -2, boxShadow: `0 6px 20px rgba(${cRgb},0.25)` }}
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: `rgba(${cRgb},0.07)`, border: `1px solid rgba(${cRgb},0.2)`,
                  transition: 'box-shadow 0.15s',
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{card.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.label}</p>
                  <p style={{ fontSize: 10, color: '#475569', fontFamily: 'DM Sans', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.description}</p>
                </div>
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#334155', fontFamily: 'DM Sans', fontSize: 13 }}>No activities match your search.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

const DAY_CONFIGS = [
  { label: 'Path A', color: '#00d4b1' },
  { label: 'Path B', color: '#a78bfa' },
  { label: 'Path C', color: '#f59e0b' },
];

function useParallelTimelines(count) {
  const t0 = useTimeline();
  const t1 = useTimeline();
  const t2 = useTimeline();
  return [t0, t1, t2].slice(0, count);
}

function toEventPayload(timeline) {
  return [...timeline.events]
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map(e => ({ label: e.card.label, time: minutesToLabel(e.startMinutes), duration: e.durationMinutes }));
}

export function ParallelDaysView({ profile, count = 2, mood, outfits, onTreeData, onShowFullscreen }) {
  const timelines = useParallelTimelines(count);
  const [activeCard, setActiveCard] = useState(null);

  // Shared DndContext sensors
  const [overSlotMinutes, setOverSlotMinutes] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } }),
  );

  const handleDragStart = useCallback((event) => {
    const data = event.active.data.current;
    if (data?.card) setActiveCard(data.card);
    else if (data?.type === 'event') setActiveCard({ _isEvent: true, eventId: data.eventId });
  }, []);

  // Parse "p{idx}-slot-{mins}" → { pathIdx, startMinutes }
  const parseParallelSlot = useCallback((id) => {
    if (!id) return null;
    const m = id.toString().match(/^p(\d+)-slot-(\d+)$/);
    if (!m) return null;
    return { pathIdx: parseInt(m[1], 10), startMinutes: parseInt(m[2], 10) };
  }, []);

  const handleDragOver = useCallback((event) => {
    const parsed = parseParallelSlot(event.over?.id);
    setOverSlotMinutes(parsed ? parsed.startMinutes : null);
  }, [parseParallelSlot]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveCard(null);
    setOverSlotMinutes(null);

    const parsed = parseParallelSlot(over?.id);
    if (!parsed) return;

    const { pathIdx, startMinutes } = parsed;
    const tl = timelines[pathIdx];
    if (!tl) return;

    const data = active.data.current;
    if (data?.type === 'event') {
      const eventId = data.eventId;
      timelines.forEach(t => {
        if (t.events.find(e => e.id === eventId)) t.moveEvent(eventId, startMinutes);
      });
      return;
    }

    if (data?.card) tl.addEvent(startMinutes, data.card, 60);
  }, [timelines]);

  // Simulate / compare
  const [simProgress, setSimProgress] = useState({ active: false, currentAction: '' });
  const [dayPredictions, setDayPredictions] = useState([null, null, null]);
  const [comparisonResult, setComparisonResult] = useState(null);

  const handleSimulateAll = useCallback((pathIndex) => async () => {
    const events = toEventPayload(timelines[pathIndex]);
    if (!events.length) return;
    setSimProgress({ active: true, currentAction: DAY_CONFIGS[pathIndex].label });
    try {
      const result = await simulateDayFlow({ events, profile, mood, outfits });
      setDayPredictions(prev => { const n = [...prev]; n[pathIndex] = result; return n; });
      onTreeData?.({ type: 'single', paths: [{ label: DAY_CONFIGS[pathIndex].label, color: DAY_CONFIGS[pathIndex].color, events: toEventPayload(timelines[pathIndex]), prediction: result }] });
      onShowFullscreen?.({ type: 'single', data: { prediction: result, eventCount: timelines[pathIndex].events.length } });
    } catch (err) {
      console.error('Simulate error:', err);
    } finally {
      setSimProgress({ active: false, currentAction: '' });
    }
  }, [timelines, profile, mood, outfits]);

  const handleCompare = useCallback(async () => {
    const paths = timelines.slice(0, count).map((tl, i) => ({
      label: DAY_CONFIGS[i].label,
      events: toEventPayload(tl),
    }));
    if (paths.filter(p => p.events.length > 0).length < 2) return;
    setSimProgress({ active: true, currentAction: 'both paths — comparing your days' });
    try {
      const result = await compareDays({ pathA: paths[0], pathB: paths[1], profile, mood, outfits });
      setComparisonResult(result);
      onTreeData?.({ type: 'comparison', paths: [
        { label: DAY_CONFIGS[0].label, color: DAY_CONFIGS[0].color, events: toEventPayload(timelines[0]), prediction: result.pathA },
        { label: DAY_CONFIGS[1].label, color: DAY_CONFIGS[1].color, events: toEventPayload(timelines[1]), prediction: result.pathB },
      ]});
      onShowFullscreen?.({ type: 'compare', data: {
        result, pathALabel: DAY_CONFIGS[0].label, pathBLabel: DAY_CONFIGS[1].label,
        colorA: DAY_CONFIGS[0].color, colorB: DAY_CONFIGS[1].color,
      } });
    } catch (err) {
      console.error('Compare error:', err);
    } finally {
      setSimProgress({ active: false, currentAction: '' });
    }
  }, [timelines, count, profile, mood, outfits]);

  const canCompare = timelines.slice(0, Math.min(count, 2)).every(tl => tl.events.length > 0);
  const [quickAddPath, setQuickAddPath] = useState(null); // pathIdx or null

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ height: '100%', display: 'flex', minHeight: 0 }}>

          {/* Right side: compare bar + path canvases */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* Compare button bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}>
              {!canCompare && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 20, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.35)' }}>
                  <span style={{ fontSize: 14 }}>💡</span>
                  <p style={{ fontSize: 13, color: '#93c5fd', fontFamily: 'Space Grotesk', fontWeight: 700, margin: 0 }}>
                    Add events to both paths to enable comparison
                  </p>
                </div>
              )}
              <motion.button
                onClick={handleCompare}
                disabled={!canCompare}
                whileHover={canCompare ? { scale: 1.05, boxShadow: '0 0 48px rgba(244,63,94,0.7), 0 0 80px rgba(245,158,11,0.4)' } : {}}
                whileTap={{ scale: 0.96 }}
                animate={canCompare ? { boxShadow: [
                  '0 0 20px rgba(244,63,94,0.4), 0 0 40px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.25)',
                  '0 0 36px rgba(244,63,94,0.65), 0 0 64px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                  '0 0 20px rgba(244,63,94,0.4), 0 0 40px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.25)',
                ] } : {}}
                transition={canCompare ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : {}}
                style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 32px', borderRadius: 18, background: canCompare ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 60%, #f43f5e 100%)' : 'rgba(255,255,255,0.06)', color: canCompare ? '#fff' : 'rgba(255,255,255,0.25)', fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 15, border: canCompare ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)', cursor: canCompare ? 'pointer' : 'not-allowed', opacity: canCompare ? 1 : 0.5 }}
              >
                {canCompare && (
                  <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)', pointerEvents: 'none' }} animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }} />
                )}
                <Play size={15} fill={canCompare ? 'currentColor' : 'none'} style={{ position: 'relative', zIndex: 1 }} />
                <Zap size={16} fill={canCompare ? 'currentColor' : 'none'} style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>Simulate &amp; Compare Days</span>
                {canCompare && (
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 4 }}>
                    {timelines.slice(0, count).map((tl, i) => (
                      <span key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 900, color: '#fff' }}>
                        {DAY_CONFIGS[i].label}
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            </div>

            {/* Quick Add strip */}
            <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
              {timelines.map((timeline, i) => {
                const cfg = DAY_CONFIGS[i];
                const rgb = cfg.color.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',');
                const hasPrediction = !!dayPredictions[i];
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 12px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                      <div style={{ position: 'relative', width: 16, height: 16, flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 12px ${cfg.color}, 0 0 24px ${cfg.color}88` }} />
                        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: cfg.color, opacity: 0.35 }} />
                      </div>
                      <span style={{
                        fontSize: 18, fontWeight: 900, fontFamily: 'Space Grotesk',
                        background: `linear-gradient(135deg, ${cfg.color} 0%, #fff 150%)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        letterSpacing: '0.03em',
                      }}>{cfg.label}</span>
                    </div>
                    <motion.button
                      onClick={() => setQuickAddPath(i)}
                      whileHover={{ scale: 1.05, boxShadow: `0 0 18px rgba(${rgb},0.5)` }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 20px', borderRadius: 99,
                        background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                        border: '1px solid rgba(255,255,255,0.25)',
                        boxShadow: `0 0 12px rgba(${rgb},0.35), 0 3px 12px rgba(0,0,0,0.35)`,
                        color: '#000', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      <Plus size={13} />
                      Quick Add
                    </motion.button>

                    {/* View AI Insights — shown once this path has been simulated */}
                    <AnimatePresence>
                      {hasPrediction && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          onClick={() => onShowFullscreen?.({ type: 'single', data: { prediction: dayPredictions[i], eventCount: timeline.events.length } })}
                          whileHover={{ scale: 1.05, background: `rgba(${rgb},0.25)`, boxShadow: `0 0 16px rgba(${rgb},0.45)` }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 99,
                            background: `rgba(${rgb},0.1)`,
                            border: `1.5px solid rgba(${rgb},0.4)`,
                            color: cfg.color, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          <Sparkles size={12} />
                          AI Insights
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* AI Insights banner — visible once comparison is generated */}
            <AnimatePresence>
              {comparisonResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', flexShrink: 0 }}
                >
                  <div style={{ padding: '1px 12px 6px' }}>
                    <motion.button
                      onClick={() => onShowFullscreen?.({ type: 'compare', data: {
                        result: comparisonResult,
                        pathALabel: DAY_CONFIGS[0].label,
                        pathBLabel: DAY_CONFIGS[1].label,
                        colorA: DAY_CONFIGS[0].color,
                        colorB: DAY_CONFIGS[1].color,
                      }})}
                      whileHover={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', boxShadow: '0 0 32px rgba(167,139,250,0.65), 0 0 60px rgba(139,92,246,0.3)', borderColor: 'rgba(167,139,250,0.9)', color: '#fff', scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        padding: '10px 20px', borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.14), rgba(139,92,246,0.09))',
                        border: 'none',
                        color: '#c4b5fd', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>✨ AI Insights Ready — View Compare Paths AI Insights</span>
                      <Sparkles size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Path canvases */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
              {timelines.map((timeline, i) => {
                const cfg = DAY_CONFIGS[i];
                return (
                  <div key={i} style={{ flex: 1, minWidth: 0, overflow: 'hidden', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <DayCanvas
                      timeline={timeline}
                      dayLabel={cfg.label}
                      dayColor={cfg.color}
                      onSimulateAll={handleSimulateAll(i)}
                      defaultPanelsOpen={false}
                      compact={true}
                      noOwnContext={true}
                      slotIdPrefix={`p${i}-`}
                      isDraggingExternal={!!activeCard}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shared drag overlay */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard && !activeCard._isEvent && (
            <div className="pointer-events-none" style={{ width: 200, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>
              <div style={{ transform: 'rotate(1.5deg) scale(1.05)' }}>
                <DecisionCard card={activeCard} compact />
              </div>
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                {overSlotMinutes != null ? (
                  <span style={{ background: 'linear-gradient(135deg,#00d4b1,#00bfa0)', color: '#000', fontSize: 11, fontWeight: 900, fontFamily: 'JetBrains Mono', padding: '3px 10px', borderRadius: 99, boxShadow: '0 0 10px rgba(0,212,177,0.5)' }}>
                    → {`${String(Math.floor(overSlotMinutes/60)).padStart(2,'0')}:${String(overSlotMinutes%60).padStart(2,'0')}`}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk' }}>Drop on Path A or B</span>
                )}
              </div>
            </div>
          )}
          {activeCard?._isEvent && (() => {
            const evt = timelines.flatMap(tl => tl.events).find(e => e.id === activeCard.eventId);
            if (!evt) return null;
            const meta = CATEGORY_META[evt.card.category];
            const color = evt.customColor || meta.color;
            const endMins = overSlotMinutes != null ? overSlotMinutes + evt.durationMinutes : null;
            const fmt = (m) => `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
            return (
              <div className="pointer-events-none" style={{ width: 220, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))' }}>
                <div style={{ transform: 'rotate(1deg) scale(1.03)', borderRadius: 12, background: 'rgba(15,15,22,0.95)', border: `2px solid ${color}`, backdropFilter: 'blur(12px)' }}>
                  <div style={{ height: 3, background: color }} />
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{evt.card.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Space Grotesk' }}>{evt.card.label}</div>
                      {overSlotMinutes != null && <div style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono', fontWeight: 700, marginTop: 2 }}>{fmt(overSlotMinutes)} – {fmt(endMins % 1440)}</div>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: overSlotMinutes != null ? color : 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', fontWeight: overSlotMinutes != null ? 700 : 400 }}>
                  {overSlotMinutes != null ? 'Drop to move here' : 'Drag to a time slot'}
                </div>
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>

      {/* Loading overlay */}
      <SimulationLoadingScreen active={simProgress.active} currentAction={simProgress.currentAction} title={simProgress.currentAction?.includes('comparing') ? 'Comparing Your Days' : 'Simulating Your Day'} />

      {/* Quick Add modal */}
      <AnimatePresence>
        {quickAddPath !== null && (
          <QuickAddModal
            pathIdx={quickAddPath}
            pathConfig={DAY_CONFIGS[quickAddPath]}
            timeline={timelines[quickAddPath]}
            onClose={() => setQuickAddPath(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
