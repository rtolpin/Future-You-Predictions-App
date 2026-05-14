import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { DayCanvas } from './DayCanvas.jsx';
import { CardLibrary } from './CardLibrary.jsx';
import { DecisionCard } from './DecisionCard.jsx';
import { CATEGORY_META } from '../../data/decisionCards.js';
import { useTimeline, minutesToLabel } from '../../hooks/useTimeline.js';
import { simulateDayFlow, compareDays } from '../../utils/claudeClient.js';
import { SimulationLoadingScreen } from '../simulation/SimulationLoadingScreen.jsx';

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

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ height: '100%', display: 'flex', minHeight: 0 }}>

          {/* Shared card library — full height, unaffected by compare bar */}
          <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)', overflowY: activeCard ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
            <CardLibrary />
          </div>

          {/* Right side: compare bar + path canvases */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* Compare button bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}>
              {!canCompare && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk' }}>
                  Add events to both paths to enable comparison
                </p>
              )}
              <motion.button
                onClick={handleCompare}
                disabled={!canCompare}
                whileHover={canCompare ? { scale: 1.04, boxShadow: '0 0 32px rgba(0,212,177,0.5), 0 0 64px rgba(167,139,250,0.25)' } : {}}
                whileTap={{ scale: 0.96 }}
                style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 28px', borderRadius: 16, background: canCompare ? 'linear-gradient(135deg, #00d4b1 0%, #00bfa0 35%, #a78bfa 100%)' : 'rgba(255,255,255,0.06)', color: canCompare ? '#000' : 'rgba(255,255,255,0.25)', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14, border: canCompare ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)', boxShadow: canCompare ? '0 0 20px rgba(0,212,177,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' : 'none', cursor: canCompare ? 'pointer' : 'not-allowed', opacity: canCompare ? 1 : 0.5 }}
              >
                {canCompare && (
                  <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)', pointerEvents: 'none' }} animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }} />
                )}
                <Zap size={16} fill={canCompare ? 'currentColor' : 'none'} style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>Simulate &amp; Compare Days</span>
                {canCompare && (
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 4 }}>
                    {timelines.slice(0, count).map((tl, i) => (
                      <span key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 900, color: DAY_CONFIGS[i].color }}>
                        {DAY_CONFIGS[i].label} {tl.events.length}
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            </div>

            {/* Path canvases */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
              {timelines.map((timeline, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, overflow: 'hidden', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <DayCanvas
                    timeline={timeline}
                    dayLabel={DAY_CONFIGS[i].label}
                    dayColor={DAY_CONFIGS[i].color}
                    onSimulateAll={handleSimulateAll(i)}
                    defaultPanelsOpen={false}
                    compact={true}
                    noOwnContext={true}
                    slotIdPrefix={`p${i}-`}
                    isDraggingExternal={!!activeCard}
                  />
                </div>
              ))}
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
      <SimulationLoadingScreen active={simProgress.active} currentAction={simProgress.currentAction} />
    </>
  );
}
