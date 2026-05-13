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
  useSensor, useSensors, useDroppable,
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


function SlotDropZone({ minutes, isDraggingAny, startHour }) {
  const { isOver, setNodeRef } = useDroppable({ id: `slot-${minutes}` });
  const top = (minutes - startHour * 60) / 60 * HOUR_HEIGHT;
  const isHour = minutes % 60 === 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: HOUR_HEIGHT / 2, // 30-min zones — easier to target
        zIndex: 1,
        borderRadius: 6,
        transition: 'all 0.1s',
        background: isOver
          ? 'rgba(0,212,177,0.18)'
          : isDraggingAny && isHour
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: isOver
          ? '2px dashed rgba(0,212,177,0.7)'
          : isDraggingAny
          ? '1px dashed rgba(255,255,255,0.1)'
          : '1px solid transparent',
        boxShadow: isOver ? '0 0 12px rgba(0,212,177,0.2)' : 'none',
      }}
    />
  );
}

function PanelStrip({ label, isOpen, onToggle, summary, accentColor, children }) {
  const rgb = hexToRgbStr(accentColor);
  return (
    <div className="shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Toggle bar — always visible */}
      <motion.button
        onClick={onToggle}
        whileHover={{ background: `rgba(${rgb},0.07)` }}
        className="w-full flex items-center justify-between cursor-pointer transition-all"
        style={{ padding: '7px 16px', background: isOpen ? 'rgba(0,0,0,0.15)' : `rgba(${rgb},0.05)` }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{ fontSize: 13 }}>{label}</span>
          {!isOpen && (
            <span style={{ fontSize: 11, color: accentColor, fontFamily: 'Space Grotesk', fontWeight: 600 }}>
              {summary}
            </span>
          )}
        </div>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={{ fontSize: 10, color: accentColor, fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.04em' }}>
            {isOpen ? 'HIDE ▲' : 'SHOW ▼'}
          </span>
        </div>
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

export function DayCanvas({ timeline, onSimulate, onSimulateAll, onSelectEvent, selectedEventId, dayLabel = 'My Day', dayColor = '#00d4b1', selectedOutfits = [], onOutfitsChange, selectedMood, onMoodChange, defaultPanelsOpen = true }) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragStart = useCallback((event) => {
    if (event.active.data.current?.card) setActiveCard(event.active.data.current.card);
    if (event.active.data.current?.type === 'event') setActiveCard({ _isEvent: true, eventId: event.active.data.current.eventId });
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over?.id?.toString().startsWith('slot-')) return;
    const startMinutes = parseInt(over.id.toString().replace('slot-', ''), 10);

    if (active.data.current?.type === 'event') {
      timeline.moveEvent(active.data.current.eventId, startMinutes);
    } else {
      const card = active.data.current?.card;
      if (!card) return;
      timeline.addEvent(startMinutes, card, 60);
    }
  }, [timeline]);

  const filledCount = timeline.events.length;

  const outerClass = fullscreen
    ? 'fixed inset-0 z-50 flex overflow-hidden'
    : 'h-full flex overflow-hidden';

  return (
    <>
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={outerClass} style={{ background: '#09090f' }}>

        {/* Card Library — hidden in fullscreen, collapsible */}
        {!fullscreen && (
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
            style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center" style={{ gap: 12 }}>
              <div className="relative">
                <div className="w-3 h-3 rounded-full" style={{ background: dayColor, boxShadow: `0 0 8px ${dayColor}` }} />
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: dayColor, opacity: 0.3 }} />
              </div>
              <div>
                <h3 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk', fontSize: 15, lineHeight: 1.3 }}>{dayLabel}</h3>
                {/* Day Duration control — highlighted box */}
                <div style={{
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
                </div>
              </div>
            </div>

            <div className="flex items-center" style={{ gap: 8 }}>
              {/* AM/PM ↔ 24h toggle */}
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

              {/* Fullscreen toggle */}
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

              <motion.button
                onClick={() => timeline.reset()}
                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center text-slate-400 transition-all cursor-pointer"
                style={{ gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
              >
                <RotateCcw size={12} /> Reset
              </motion.button>

              <motion.button
                onClick={() => onSimulateAll?.()}
                disabled={filledCount === 0}
                whileHover={filledCount > 0 ? { scale: 1.04, boxShadow: '0 0 28px rgba(0,212,177,0.55), 0 0 60px rgba(0,212,177,0.2)' } : {}}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden flex items-center font-bold text-black disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  gap: 8, padding: '9px 20px',
                  background: filledCount > 0
                    ? 'linear-gradient(135deg, #00d4b1 0%, #00bfa0 40%, #34d399 100%)'
                    : 'rgba(0,212,177,0.3)',
                  boxShadow: filledCount > 0 ? '0 0 16px rgba(0,212,177,0.5), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none',
                  borderRadius: 14, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {/* Shimmer */}
                {filledCount > 0 && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                  />
                )}
                <motion.span
                  animate={filledCount > 0 ? { rotate: [0, 0, 360] } : {}}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                >
                  <Play size={13} fill="currentColor" />
                </motion.span>
                <span style={{ position: 'relative', zIndex: 1, letterSpacing: '0.02em' }}>Simulate Day</span>
                {filledCount > 0 && (
                  <span style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 900 }}>{filledCount}</span>
                )}
              </motion.button>
            </div>
          </div>

          {/* ── Hide All / Show All control bar ── */}
          {(() => {
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

          {/* ── Starting Mood strip ── */}
          <PanelStrip
            label="🎭 Starting Mood"
            isOpen={moodOpen && !scrolled}
            onToggle={() => setMoodOpen(o => !o)}
            summary={selectedMood ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} selected` : 'None selected'}
            accentColor="#f59e0b"
          >
            <MoodStarterSelector selected={selectedMood} onChange={onMoodChange} />
          </PanelStrip>

          {/* ── Today's Look strip ── */}
          <PanelStrip
            label="👗 Today's Look"
            isOpen={outfitOpen && !scrolled}
            onToggle={() => setOutfitOpen(o => !o)}
            summary={selectedOutfits.length > 0 ? `${selectedOutfits.length} outfit${selectedOutfits.length !== 1 ? 's' : ''} selected` : 'None selected'}
            accentColor="#a78bfa"
          >
            <AppearanceSelector selected={selectedOutfits} onChange={onOutfitsChange} />
          </PanelStrip>

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
                  <SlotDropZone key={m} minutes={m} isDraggingAny={!!activeCard} startHour={startHour} />
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

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeCard && !activeCard._isEvent && (
          <div className="pointer-events-none" style={{ transform: 'rotate(2deg) scale(1.08)', width: 220, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.5))' }}>
            <DecisionCard card={activeCard} compact />
            <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, fontWeight: 700, color: '#00d4b1', fontFamily: 'Space Grotesk', letterSpacing: '0.05em' }}>
              ↓ Drop on a time slot
            </div>
          </div>
        )}
        {activeCard?._isEvent && (() => {
          const evt = timeline.events.find(e => e.id === activeCard.eventId);
          if (!evt) return null;
          const meta = CATEGORY_META[evt.card.category];
          return (
            <div className="pointer-events-none" style={{ transform: 'rotate(1.5deg) scale(1.05)', width: 240, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.6))' }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', background: `rgba(255,255,255,0.1)`, border: `2px solid ${meta.color}`, padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{evt.card.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Space Grotesk' }}>{evt.card.label}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, fontWeight: 700, color: meta.color, fontFamily: 'Space Grotesk', letterSpacing: '0.05em' }}>
                ↓ Drop to move event
              </div>
            </div>
          );
        })()}
      </DragOverlay>

    </DndContext>

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
