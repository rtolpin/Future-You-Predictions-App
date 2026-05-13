import { useState, useCallback, useRef, useEffect } from 'react';

// Returns props for a button that fires rapidly when held down
function useHoldButton(action, delay = 120) {
  const interval = useRef(null);
  const start = () => {
    action();
    interval.current = setInterval(action, delay);
  };
  const stop = () => { clearInterval(interval.current); interval.current = null; };
  useEffect(() => () => stop(), []);
  return { onMouseDown: start, onMouseUp: stop, onMouseLeave: stop };
}
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDroppable, closestCenter,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Clock, Maximize2, Minimize2, ChevronLeft, ChevronRight, LayoutList } from 'lucide-react';
import { DecisionCard } from './DecisionCard.jsx';
import { CardLibrary } from './CardLibrary.jsx';
import { EventBlock } from './EventBlock.jsx';
import { AppearanceSelector } from './AppearanceSelector.jsx';
import { MoodStarterSelector } from './MoodStarterSelector.jsx';
import { CATEGORY_META } from '../../data/decisionCards.js';
import { EventDetailModal } from './EventDetailModal.jsx';

const HOUR_HEIGHT = 80;
const SNAP = 15;


const SLOT_HEIGHT = HOUR_HEIGHT / 2; // 40px per 15-min slot — large target area

function SlotDropZone({ minutes, isDraggingAny, startHour, idPrefix = '', fmtTime }) {
  const { isOver, setNodeRef } = useDroppable({ id: `${idPrefix}slot-${minutes}` });
  const top = (minutes - startHour * 60) / 60 * HOUR_HEIGHT;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: SLOT_HEIGHT,
        zIndex: isOver ? 4 : 1,
      }}
    >
      {/* Drop line — only shown when actively hovering this slot */}
      {isOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}>
          {/* Horizontal line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, rgba(0,212,177,0.9), rgba(167,139,250,0.8))', boxShadow: '0 0 10px rgba(0,212,177,0.6)', borderRadius: 2 }} />
          {/* Time badge */}
          <div style={{
            position: 'absolute', top: 3, left: 60,
            background: 'linear-gradient(135deg,#00d4b1,#00bfa0)',
            color: '#000', fontSize: 10, fontWeight: 900,
            fontFamily: 'JetBrains Mono', padding: '2px 8px',
            borderRadius: 99, boxShadow: '0 0 10px rgba(0,212,177,0.5)',
            whiteSpace: 'nowrap',
          }}>
            {fmtTime ? fmtTime(minutes) : `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`}
          </div>
          {/* Subtle bg highlight */}
          <div style={{ position: 'absolute', top: 2, left: 0, right: 0, height: SLOT_HEIGHT - 2, background: 'rgba(0,212,177,0.07)', borderRadius: '0 0 4px 4px' }} />
        </div>
      )}
      {/* Faint grid lines while any drag is active */}
      {isDraggingAny && !isOver && minutes % 60 === 0 && (
        <div style={{ position: 'absolute', top: 0, left: 48, right: 0, height: 1, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      )}
    </div>
  );
}

function PanelStrip({ label, isOpen, onToggle, summary, accentColor, children }) {
  const rgb = hexToRgbStr(accentColor);
  return (
    <div className="shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Toggle bar — always visible */}
      <motion.button
        onClick={onToggle}
        whileHover={{ background: `rgba(${rgb},0.06)` }}
        className="w-full flex items-center justify-between cursor-pointer transition-all"
        style={{ padding: '5px 14px', background: isOpen ? 'rgba(0,0,0,0.12)' : `rgba(${rgb},0.04)` }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={{ fontSize: 11 }}>{label}</span>
          {!isOpen && (
            <span style={{ fontSize: 10, color: accentColor, fontFamily: 'Space Grotesk', fontWeight: 600 }}>
              {summary}
            </span>
          )}
        </div>
        <span style={{ fontSize: 9, color: accentColor, fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.04em' }}>
          {isOpen ? 'HIDE ▲' : 'SHOW ▼'}
        </span>
      </motion.button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hexToRgbStr(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

export function DayCanvas({ timeline, onSimulate, onSimulateAll, onSelectEvent, selectedEventId, dayLabel = 'My Day', dayColor = '#00d4b1', selectedOutfits = [], onOutfitsChange, selectedMood, onMoodChange, defaultPanelsOpen = true, compact = false, noOwnContext = false, slotIdPrefix = '', isDraggingExternal = false }) {
  const [activeCard, setActiveCard] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(defaultPanelsOpen);
  const [outfitOpen, setOutfitOpen] = useState(defaultPanelsOpen);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [startHour, setStartHour] = useState(5);
  const [endHour, setEndHour] = useState(24);
  const [use24, setUse24] = useState(false);

  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dropSlots = Array.from(
    { length: (endHour - startHour) * 4 },
    (_, i) => startHour * 60 + i * SNAP
  );

  const fmtHour = (h) => {
    const real = h === 24 ? 0 : h;
    if (use24) return `${String(real).padStart(2, '0')}:00`;
    if (real === 0) return '12AM';
    if (real === 12) return '12PM';
    return real < 12 ? `${real}AM` : `${real - 12}PM`;
  };

  const fmtTime = (totalMins) => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const mm = String(m).padStart(2, '0');
    if (use24) return `${String(h).padStart(2, '0')}:${mm}`;
    const period = h < 12 ? 'AM' : 'PM';
    const disp = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${disp}:${mm} ${period}`;
  };
  const gridRef = useRef(null);
  const scrollRef = useRef(null);

  const handleScroll = useCallback((e) => {
    setScrolled(e.currentTarget.scrollTop > 40);
  }, []);

  const [overSlotMinutes, setOverSlotMinutes] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } })
  );

  const handleDragStart = useCallback((event) => {
    const data = event.active.data.current;
    if (data?.card) setActiveCard(data.card);
    else if (data?.type === 'event') setActiveCard({ _isEvent: true, eventId: data.eventId });
  }, []);

  // Parse slot minutes from an id like "slot-300" or "p0-slot-300"
  const parseSlotMinutes = useCallback((id) => {
    if (!id) return null;
    const str = id.toString();
    const match = str.match(/slot-(\d+)$/);
    if (!match) return null;
    const mins = parseInt(match[1], 10);
    return isNaN(mins) ? null : mins;
  }, []);

  const handleDragOver = useCallback((event) => {
    const mins = parseSlotMinutes(event.over?.id);
    setOverSlotMinutes(mins);
  }, [parseSlotMinutes]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveCard(null);
    setOverSlotMinutes(null);

    const startMinutes = parseSlotMinutes(over?.id);
    if (startMinutes === null) return;

    const data = active.data.current;
    if (data?.type === 'event') {
      timeline.moveEvent(data.eventId, startMinutes);
    } else if (data?.card) {
      timeline.addEvent(startMinutes, data.card, 60);
    }
  }, [timeline, parseSlotMinutes]);

  const filledCount = timeline.events.length;

  const outerClass = fullscreen
    ? 'fixed inset-0 z-50 flex overflow-hidden'
    : 'h-full flex overflow-hidden';

  const inner = (
    <>
      <div className={outerClass} style={{ background: '#09090f' }}>

        {/* Card Library — hidden in fullscreen, in noOwnContext mode, or collapsible */}
        {!fullscreen && !noOwnContext && (
          <motion.div
            animate={{ width: libraryOpen ? 256 : 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="shrink-0 overflow-hidden flex flex-col"
            style={{
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.25)',
              minWidth: 0,
            }}
          >
            {libraryOpen ? (
              /* ── Expanded library ── */
              <div
                className="flex flex-col h-full"
                style={{ width: 256, overflowY: activeCard ? 'hidden' : 'auto' }}
              >
                {/* Library header with collapse button */}
                <div
                  className="flex items-center justify-between shrink-0"
                  style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Card Library
                  </span>
                  <button
                    onClick={() => setLibraryOpen(false)}
                    title="Collapse library"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '3px 6px',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                </div>
                <CardLibrary />
              </div>
            ) : (
              /* ── Collapsed slim rail ── */
              <div className="flex flex-col items-center h-full" style={{ width: 40, paddingTop: 12, gap: 0 }}>
                <button
                  onClick={() => setLibraryOpen(true)}
                  title="Expand library"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 7px',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <ChevronRight size={13} />
                </button>
                {/* Rotated label */}
                <div
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.2)',
                    userSelect: 'none',
                    marginTop: 4,
                  }}
                >
                  Cards
                </div>
                <LayoutList size={14} style={{ color: 'rgba(255,255,255,0.15)', marginTop: 10 }} />
              </div>
            )}
          </motion.div>
        )}

        {/* Calendar timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header bar */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{ padding: compact ? '10px 14px' : '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', flexWrap: compact ? 'wrap' : 'nowrap', gap: compact ? 8 : 0 }}
          >
            <div className="flex items-center" style={{ gap: 12 }}>
              <div className="relative">
                <div className="w-3 h-3 rounded-full" style={{ background: dayColor, boxShadow: `0 0 8px ${dayColor}` }} />
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: dayColor, opacity: 0.3 }} />
              </div>
              <div>
                <h3 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk', fontSize: compact ? 13 : 15, lineHeight: 1.3 }}>{dayLabel}</h3>
                {!compact && <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  marginTop: 6, padding: '6px 10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>⏱ Day Duration</span>
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
                  {/* Start hour */}
                  {(() => {
                    const decStart = useHoldButton(() => setStartHour(h => Math.max(0, h - 1)));
                    const incStart = useHoldButton(() => {
                      setStartHour(h => {
                        const next = Math.min(endHour - 1, h + 1);
                        // If bumping start would equal end, push end up too
                        if (next >= endHour) setEndHour(e => Math.min(24, e + 1));
                        return next;
                      });
                    });
                    return (
                      <div className="flex items-center" style={{ gap: 4 }}>
                        <button {...decStart} style={{ fontSize: 13, color: '#00d4b1', cursor: 'pointer', background: 'rgba(0,212,177,0.15)', border: '1px solid rgba(0,212,177,0.3)', borderRadius: 6, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, userSelect: 'none' }}>−</button>
                        <span style={{ fontSize: 12, color: '#00d4b1', fontFamily: 'JetBrains Mono', fontWeight: 700, minWidth: 38, textAlign: 'center' }}>{fmtHour(startHour)}</span>
                        <button {...incStart} style={{ fontSize: 13, color: '#00d4b1', cursor: 'pointer', background: 'rgba(0,212,177,0.15)', border: '1px solid rgba(0,212,177,0.3)', borderRadius: 6, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, userSelect: 'none' }}>+</button>
                      </div>
                    );
                  })()}
                  <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 900, lineHeight: 1 }}>➔</span>
                  {/* End hour */}
                  {(() => {
                    const decEnd = useHoldButton(() => setEndHour(h => Math.max(startHour + 1, h - 1)));
                    const incEnd = useHoldButton(() => setEndHour(h => Math.min(24, h + 1)));
                    return (
                      <div className="flex items-center" style={{ gap: 4 }}>
                        <button {...decEnd} style={{ fontSize: 13, color: '#f59e0b', cursor: 'pointer', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, userSelect: 'none' }}>−</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'JetBrains Mono', fontWeight: 700, minWidth: 38, textAlign: 'center' }}>{fmtHour(endHour)}</span>
                            </div>
                        <button {...incEnd} style={{ fontSize: 13, color: '#f59e0b', cursor: 'pointer', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, userSelect: 'none' }}>+</button>
                      </div>
                    );
                  })()}
                  {filledCount > 0 && (
                    <>
                      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#e2e8f0', fontFamily: 'Space Grotesk' }}>
                        {filledCount} event{filledCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>}
                {compact && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {(() => {
                      const decStart = useHoldButton(() => setStartHour(h => Math.max(0, h - 1)));
                      const incStart = useHoldButton(() => setStartHour(h => { const n = Math.min(endHour - 1, h + 1); if (n >= endHour) setEndHour(e => Math.min(24, e + 1)); return n; }));
                      const decEnd = useHoldButton(() => setEndHour(h => Math.max(startHour + 1, h - 1)));
                      const incEnd = useHoldButton(() => setEndHour(h => Math.min(24, h + 1)));
                      const btnStyle = (col) => ({ fontSize: 11, color: col, cursor: 'pointer', background: `rgba(${col === '#00d4b1' ? '0,212,177' : '245,158,11'},0.15)`, border: `1px solid ${col}44`, borderRadius: 5, width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, userSelect: 'none' });
                      return (<>
                        <button {...decStart} style={btnStyle('#00d4b1')}>−</button>
                        <span style={{ fontSize: 10, color: '#00d4b1', fontFamily: 'JetBrains Mono', fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{fmtHour(startHour)}</span>
                        <button {...incStart} style={btnStyle('#00d4b1')}>+</button>
                        <span style={{ fontSize: 11, color: '#475569' }}>→</span>
                        <button {...decEnd} style={btnStyle('#f59e0b')}>−</button>
                        <span style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'JetBrains Mono', fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{fmtHour(endHour)}</span>
                        <button {...incEnd} style={btnStyle('#f59e0b')}>+</button>
                      </>);
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
              {/* AM/PM ↔ 24h toggle — hidden in compact mode */}
              {!compact && (
                <motion.button
                  onClick={() => setUse24(u => !u)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Switch time format"
                  className="flex items-center cursor-pointer font-bold transition-all"
                  style={{
                    gap: 0, padding: '5px 0', borderRadius: 10, overflow: 'hidden',
                    border: '1px solid rgba(167,139,250,0.3)',
                    fontSize: 11, fontFamily: 'JetBrains Mono',
                  }}
                >
                  <span style={{ padding: '4px 9px', background: !use24 ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)', color: !use24 ? '#a78bfa' : '#475569', fontWeight: !use24 ? 800 : 500 }}>AM/PM</span>
                  <span style={{ padding: '4px 9px', background: use24 ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)', color: use24 ? '#a78bfa' : '#475569', fontWeight: use24 ? 800 : 500 }}>24h</span>
                </motion.button>
              )}

              {/* Fullscreen toggle — hidden in compact mode */}
              {!compact && (
                <motion.button
                  onClick={() => setFullscreen(f => !f)}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.95 }}
                  title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                  style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                >
                  {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </motion.button>
              )}

              <motion.button
                onClick={() => timeline.reset()}
                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center text-slate-400 transition-all cursor-pointer"
                style={{ gap: 6, padding: compact ? '6px 10px' : '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
              >
                <RotateCcw size={12} /> {!compact && 'Reset'}
              </motion.button>

              <motion.button
                onClick={() => onSimulateAll?.()}
                disabled={filledCount === 0}
                whileHover={filledCount > 0 ? { scale: 1.04, boxShadow: `0 0 24px ${dayColor}88` } : {}}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden flex items-center font-bold text-black disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  gap: 7, padding: compact ? '8px 14px' : '9px 20px',
                  background: filledCount > 0
                    ? `linear-gradient(135deg, ${dayColor} 0%, ${dayColor}cc 100%)`
                    : `${dayColor}44`,
                  boxShadow: filledCount > 0 ? `0 0 14px ${dayColor}66, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
                  borderRadius: 14, fontSize: compact ? 12 : 13,
                  border: '1px solid rgba(255,255,255,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {filledCount > 0 && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                  />
                )}
                <Play size={12} fill="currentColor" style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>Simulate</span>
                {filledCount > 0 && (
                  <span style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 5, padding: '1px 5px', fontSize: 10, fontWeight: 900 }}>{filledCount}</span>
                )}
              </motion.button>
            </div>
          </div>

          {/* ── Hide All / Show All control bar — hidden in compact mode ── */}
          {!compact && (() => {
            const allOpen = moodOpen && outfitOpen;
            const allClosed = !moodOpen && !outfitOpen;
            return (
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', padding: '6px 16px', gap: 8 }}
              >
                <motion.button
                  onClick={() => { setMoodOpen(true); setOutfitOpen(true); }}
                  whileHover={{ scale: 1.04, background: 'rgba(0,212,177,0.15)', borderColor: 'rgba(0,212,177,0.5)' }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center cursor-pointer font-bold transition-all"
                  style={{
                    gap: 6, padding: '6px 18px', borderRadius: 20, fontSize: 12,
                    fontFamily: 'Space Grotesk',
                    background: allOpen ? 'rgba(0,212,177,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${allOpen ? 'rgba(0,212,177,0.45)' : 'rgba(255,255,255,0.12)'}`,
                    color: allOpen ? '#00d4b1' : '#94a3b8',
                  }}
                >
                  ▼ Show Top Panels
                </motion.button>

                <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />

                <motion.button
                  onClick={() => { setMoodOpen(false); setOutfitOpen(false); }}
                  whileHover={{ scale: 1.04, background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.4)' }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center cursor-pointer font-bold transition-all"
                  style={{
                    gap: 6, padding: '6px 18px', borderRadius: 20, fontSize: 12,
                    fontFamily: 'Space Grotesk',
                    background: allClosed ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${allClosed ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: allClosed ? '#f87171' : '#94a3b8',
                  }}
                >
                  ▲ Hide Top Panels
                </motion.button>
              </div>
            );
          })()}

          {!compact && (
            <>
          <PanelStrip
            label="🎭 Starting Mood"
            isOpen={moodOpen && !scrolled}
            onToggle={() => setMoodOpen(o => !o)}
            summary={selectedMood ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} selected` : 'None selected'}
            accentColor="#f59e0b"
          >
            <MoodStarterSelector selected={selectedMood} onChange={onMoodChange} />
          </PanelStrip>
          <PanelStrip
            label="👗 Today's Look"
            isOpen={outfitOpen && !scrolled}
            onToggle={() => setOutfitOpen(o => !o)}
            summary={selectedOutfits.length > 0 ? `${selectedOutfits.length} outfit${selectedOutfits.length !== 1 ? 's' : ''} selected` : 'None selected'}
            accentColor="#a78bfa"
          >
            <AppearanceSelector selected={selectedOutfits} onChange={onOutfitsChange} />
          </PanelStrip>
            </>
          )}

          {/* Calendar grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }} onScroll={handleScroll}>
            <div className="flex" style={{ minHeight: totalHeight + 48, paddingTop: 16 }}>

              {/* Time labels column */}
              <div style={{ width: 56, flexShrink: 0, position: 'relative', height: totalHeight, marginTop: 8 }}>
                {hours.map(h => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute',
                      top: (h - startHour) * HOUR_HEIGHT - 8,
                      right: 8,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#334155',
                      fontWeight: 600,
                      lineHeight: 1,
                      userSelect: 'none',
                    }}
                  >
                    {fmtHour(h)}
                  </div>
                ))}
              </div>

              {/* Event grid area */}
              <div ref={gridRef} style={{ flex: 1, position: 'relative', height: totalHeight, marginRight: 12, marginTop: 8 }}>

                {/* Hour lines */}
                {hours.map(h => (
                  <div key={h} style={{
                    position: 'absolute',
                    top: (h - startHour) * HOUR_HEIGHT,
                    left: 0, right: 0,
                    height: 1,
                    background: h % 6 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                    zIndex: 0,
                  }} />
                ))}

                {/* 30-min tick lines */}
                {hours.map(h => (
                  <div key={`half-${h}`} style={{
                    position: 'absolute',
                    top: (h - startHour) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                    left: 0, right: 0,
                    height: 1,
                    background: 'rgba(255,255,255,0.025)',
                    zIndex: 0,
                  }} />
                ))}

                {/* Drop zones — one per 15 min */}
                {dropSlots.map(m => (
                  <SlotDropZone key={m} minutes={m} isDraggingAny={!!activeCard || isDraggingExternal} startHour={startHour} idPrefix={slotIdPrefix} fmtTime={fmtTime} />
                ))}

                {/* Empty-state drop hint */}
                {timeline.events.length === 0 && !activeCard && (
                  <div style={{
                    position: 'absolute', top: HOUR_HEIGHT * 2.5, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    pointerEvents: 'none', width: '85%',
                  }}>
                    {/* Step instructions */}
                    {[
                      { icon: '👈', color: '#00d4b1', text: 'Grab any card from the left panel' },
                      { icon: '📅', color: '#a78bfa', text: 'Drag it onto a time slot on the calendar' },
                      { icon: '⚡', color: '#f59e0b', text: 'Click "Simulate Day" to get your AI prediction' },
                    ].map(({ icon, color, text }, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', borderRadius: 12, width: '100%',
                        background: `rgba(${color === '#00d4b1' ? '0,212,177' : color === '#a78bfa' ? '167,139,250' : '245,158,11'},0.07)`,
                        border: `1px solid rgba(${color === '#00d4b1' ? '0,212,177' : color === '#a78bfa' ? '167,139,250' : '245,158,11'},0.2)`,
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'Space Grotesk', lineHeight: 1.4 }}>
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Events */}
                <AnimatePresence>
                  {timeline.events.map(evt => (
                    <EventBlock
                      key={evt.id}
                      event={evt}
                      onRemove={timeline.removeEvent}
                      onClick={(id) => {
                        const evt = timeline.events.find(e => e.id === id);
                        if (evt) setEditingEvent(evt);
                        onSelectEvent?.(id);
                      }}
                      onUpdateDuration={timeline.updateDuration}
                      onUpdateLabel={timeline.updateLabel}
                      startHour={startHour}
                      fmtTime={fmtTime}
                      isSelected={selectedEventId === evt.id}
                      prediction={timeline.predictions[evt.id]}
                      isLoading={timeline.loading[evt.id]}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );

  const dragOverlay = (
    <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
      {activeCard && !activeCard._isEvent && (
        <div className="pointer-events-none" style={{ width: 210, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>
          <div style={{ transform: 'rotate(1.5deg) scale(1.05)' }}>
            <DecisionCard card={activeCard} compact />
          </div>
          {overSlotMinutes != null ? (
            <div style={{ textAlign: 'center', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ background: 'linear-gradient(135deg,#00d4b1,#00bfa0)', color: '#000', fontSize: 11, fontWeight: 900, fontFamily: 'JetBrains Mono', padding: '3px 10px', borderRadius: 99, boxShadow: '0 0 10px rgba(0,212,177,0.5)' }}>
                → {fmtTime(overSlotMinutes)}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk' }}>Drag to a time slot</div>
          )}
        </div>
      )}
      {activeCard?._isEvent && (() => {
        const evt = timeline.events.find(e => e.id === activeCard.eventId);
        if (!evt) return null;
        const meta = CATEGORY_META[evt.card.category];
        const color = evt.customColor || meta.color;
        const endMins = overSlotMinutes != null ? overSlotMinutes + evt.durationMinutes : null;
        return (
          <div className="pointer-events-none" style={{ width: 220, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))' }}>
            <div style={{ transform: 'rotate(1deg) scale(1.03)', borderRadius: 12, overflow: 'hidden', background: 'rgba(15,15,22,0.95)', border: `2px solid ${color}`, backdropFilter: 'blur(12px)' }}>
              <div style={{ height: 3, background: color }} />
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{evt.card.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>{evt.card.label}</div>
                  {overSlotMinutes != null && (
                    <div style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono', fontWeight: 700, marginTop: 2 }}>
                      {fmtTime(overSlotMinutes)} – {fmtTime(endMins % (24*60))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: overSlotMinutes != null ? color : 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', fontWeight: overSlotMinutes != null ? 700 : 400 }}>
              {overSlotMinutes != null ? `Drop to move here` : 'Drag to new time'}
            </div>
          </div>
        );
      })()}
    </DragOverlay>
  );

  return (
    <>
    {noOwnContext ? inner : (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {inner}
        {dragOverlay}
      </DndContext>
    )}

    {/* Event detail modal */}
    <AnimatePresence>
      {editingEvent && (
        <EventDetailModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={(eventId, details) => timeline.updateDetails(eventId, details)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
