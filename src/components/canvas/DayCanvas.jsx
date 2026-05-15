import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../../hooks/useIsMobile.js';

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
import { Play, RotateCcw, Clock, Maximize2, Minimize2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LayoutList, GripVertical } from 'lucide-react';
import { DecisionCard } from './DecisionCard.jsx';
import { CardLibrary } from './CardLibrary.jsx';
import { EventBlock } from './EventBlock.jsx';
import { CATEGORY_META } from '../../data/decisionCards.js';
import { EventDetailModal } from './EventDetailModal.jsx';
import { MoodPickerModal, MOODS } from './MoodPickerModal.jsx';
import { OutfitPickerModal, OUTFIT_GROUPS, isCustomOutfit, customOutfitLabel } from './OutfitPickerModal.jsx';

const HOUR_HEIGHT = 80;
const SNAP = 15;


const SLOT_HEIGHT = HOUR_HEIGHT / 4; // 20px per 15-min slot — matches visual grid exactly

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
  const isMobile = useIsMobile();
  const [showMobileLibrary, setShowMobileLibrary] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [scrolled, setScrolled]         = useState(false);
  const [panelsHidden, setPanelsHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const [showMoodModal, setShowMoodModal]     = useState(false);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [libraryWidth, setLibraryWidth] = useState(256);
  const libraryResizeRef = useRef(null);

  const handleLibraryResizeStart = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = libraryWidth;
    const onMove = (mv) => setLibraryWidth(Math.min(480, Math.max(180, startW + mv.clientX - startX)));
    const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [libraryWidth]);
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
    const top = e.currentTarget.scrollTop;
    setScrolled(top > 40);
    setPanelsHidden(top > 80);
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
    ? 'flex overflow-hidden'
    : 'h-full flex overflow-hidden';

  const inner = (
    <>
      <div className={outerClass} style={{ background: '#09090f', ...(fullscreen ? { position: 'fixed', inset: 0, zIndex: 9990 } : {}) }}>

        {/* Card Library — desktop: collapsible sidebar | mobile: bottom drawer */}
        {!fullscreen && !noOwnContext && !isMobile && (
          <motion.div
            animate={{ width: libraryOpen ? libraryWidth : 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="shrink-0 flex flex-col relative"
            style={{
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.25)',
              minWidth: 0, zIndex: 10, overflow: 'visible',
            }}
          >
            {libraryOpen ? (
              <>
                {/* Drag-to-resize handle — straddles the right border */}
                <div
                  onMouseDown={handleLibraryResizeStart}
                  style={{ position: 'absolute', right: -12, top: 0, bottom: 0, width: 24, cursor: 'col-resize', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => {
                    e.currentTarget.querySelector('.lib-resize-line').style.background = '#00d4b1';
                    e.currentTarget.querySelector('.lib-resize-line').style.boxShadow = '0 0 8px rgba(0,212,177,0.6)';
                    e.currentTarget.querySelector('.lib-resize-arrows').style.borderColor = 'rgba(0,212,177,0.7)';
                    e.currentTarget.querySelector('.lib-resize-arrows').style.boxShadow = '0 0 12px rgba(0,212,177,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.querySelector('.lib-resize-line').style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.querySelector('.lib-resize-line').style.boxShadow = 'none';
                    e.currentTarget.querySelector('.lib-resize-arrows').style.borderColor = 'rgba(0,212,177,0.35)';
                    e.currentTarget.querySelector('.lib-resize-arrows').style.boxShadow = '0 0 6px rgba(0,212,177,0.12)';
                  }}
                >
                  <div className="lib-resize-line" style={{ width: 2, height: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, transition: 'all 0.15s' }} />
                  <div className="lib-resize-arrows" style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex', alignItems: 'center', gap: 1,
                    background: 'rgba(9,9,15,0.95)',
                    border: '1px solid rgba(0,212,177,0.35)',
                    borderRadius: 8, padding: '5px 6px',
                    color: '#00d4b1', fontSize: 12, fontWeight: 900,
                    opacity: 1, transition: 'all 0.15s',
                    userSelect: 'none', pointerEvents: 'none',
                    whiteSpace: 'nowrap', lineHeight: 1,
                    boxShadow: '0 0 8px rgba(0,212,177,0.12)',
                  }}>
                    ‹ ›
                  </div>
                </div>

                {/* Expanded library content */}
                <div className="flex flex-col h-full" style={{ overflow: 'hidden', overflowY: activeCard ? 'hidden' : 'auto' }}>
                  {/* Header */}
                  <div className="flex items-center shrink-0" style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: 'Space Grotesk', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Card Library
                    </span>
                    <motion.button
                      onClick={() => setLibraryOpen(false)}
                      title="Collapse library"
                      whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.14)', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }}
                      whileTap={{ scale: 0.92 }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.18)', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                    >
                      <ChevronsLeft size={13} />
                    </motion.button>
                  </div>
                  <CardLibrary />
                </div>
              </>
            ) : (
              /* ── Collapsed rail — entire strip is one big click target ── */
              <motion.button
                onClick={() => setLibraryOpen(true)}
                title="Expand library"
                whileHover={{ background: 'rgba(0,212,177,0.08)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: 40, height: '100%', cursor: 'pointer', border: 'none',
                  background: 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: 14, gap: 12,
                  borderRight: '2px solid rgba(0,212,177,0.15)',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderRightColor = 'rgba(0,212,177,0.45)'}
                onMouseLeave={e => e.currentTarget.style.borderRightColor = 'rgba(0,212,177,0.15)'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(0,212,177,0.14)',
                  border: '1.5px solid rgba(0,212,177,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#00d4b1', flexShrink: 0,
                  boxShadow: '0 0 10px rgba(0,212,177,0.15)',
                }}>
                  <ChevronsRight size={16} />
                </div>
                <div style={{
                  writingMode: 'vertical-rl',
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(0,212,177,0.6)',
                  fontFamily: 'Space Grotesk', userSelect: 'none',
                }}>
                  Card Library
                </div>
                <LayoutList size={14} color="rgba(0,212,177,0.4)" />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Mobile: floating "Add Card" button */}
        {!fullscreen && !noOwnContext && isMobile && (
          <>
            <motion.button
              onClick={() => setShowMobileLibrary(true)}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute', bottom: 80, right: 20, zIndex: 30,
                width: 52, height: 52, borderRadius: '50%',
                background: `linear-gradient(135deg, ${dayColor}, ${dayColor}cc)`,
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: `0 4px 20px ${dayColor}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 24,
              }}
            >+</motion.button>

            {/* Mobile card library drawer */}
            <AnimatePresence>
              {showMobileLibrary && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
                    height: '70vh', background: 'rgba(9,9,15,0.98)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px 20px 0 0',
                    display: 'flex', flexDirection: 'column',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#f1f5f9', margin: 0 }}>Add Activity</p>
                    <button onClick={() => setShowMobileLibrary(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13 }}>Done</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <CardLibrary />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {showMobileLibrary && (
              <div onClick={() => setShowMobileLibrary(false)} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.5)' }} />
            )}
          </>
        )}

        {/* Calendar timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header bar */}
          <div className="shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>

            {/* Row 1: My Day centered + right controls */}
            <div className="flex items-center" style={{ padding: compact ? '10px 14px 6px' : '14px 20px 8px', gap: 8 }}>
              {/* My Day title — centered within remaining space */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 10 }}>
                <div className="relative" style={{ width: 18, height: 18, flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#00d4b1', boxShadow: '0 0 12px rgba(0,212,177,0.8), 0 0 24px rgba(0,212,177,0.4)' }} />
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: '#00d4b1', opacity: 0.35 }} />
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: compact ? 14 : 20, lineHeight: 1.2, background: 'linear-gradient(135deg, #00d4b1 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', whiteSpace: 'nowrap' }}>{dayLabel}</h3>
              </div>

            <div className="flex items-center" style={{ gap: 8, flexWrap: 'nowrap', flexShrink: 1, minWidth: 0, overflow: 'hidden', paddingRight: 6 }}>
              {/* AM/PM ↔ 24h toggle — hidden in compact mode */}
              {!compact && (
                <div
                  title="Switch time format"
                  style={{
                    display: 'flex', alignItems: 'center',
                    borderRadius: 12,
                    border: '1px solid rgba(167,139,250,0.35)',
                    background: 'rgba(167,139,250,0.06)',
                    padding: 4, gap: 3,
                    boxShadow: '0 0 10px rgba(167,139,250,0.08)',
                  }}
                >
                  {[{ label: 'AM/PM', val: false }, { label: '24h', val: true }].map(({ label, val }) => {
                    const active = use24 === val;
                    return (
                      <motion.button
                        key={label}
                        onClick={() => setUse24(val)}
                        whileHover={!active ? { background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', scale: 1.04 } : {}}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '7px 14px', borderRadius: 9, cursor: 'pointer', border: 'none',
                          fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 800,
                          background: active
                            ? 'linear-gradient(135deg, rgba(167,139,250,0.35), rgba(139,92,246,0.25))'
                            : 'transparent',
                          color: active ? '#c4b5fd' : '#64748b',
                          boxShadow: active ? '0 0 14px rgba(167,139,250,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
                          border: active ? '1px solid rgba(167,139,250,0.4)' : '1px solid transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Fullscreen toggle — hidden in compact mode */}
              {!compact && (
                <motion.button
                  onClick={() => setFullscreen(f => !f)}
                  whileHover={{ scale: 1.05, background: 'rgba(0,212,177,0.18)', borderColor: 'rgba(0,212,177,0.6)', boxShadow: '0 0 16px rgba(0,212,177,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="flex items-center cursor-pointer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px', borderRadius: 10,
                    background: 'rgba(0,212,177,0.08)',
                    border: '1.5px solid rgba(0,212,177,0.35)',
                    color: '#00d4b1',
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  {fullscreen ? 'Exit' : 'Full Screen'}
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
                title="Simulate Day"
                whileHover={filledCount > 0 ? { scale: 1.06, boxShadow: `0 0 32px ${dayColor}aa, 0 0 60px ${dayColor}44` } : {}}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden flex items-center font-bold text-black disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  gap: compact ? 5 : 8,
                  padding: compact ? '5px 10px' : '11px 26px',
                  background: filledCount > 0
                    ? `linear-gradient(135deg, ${dayColor} 0%, ${dayColor}cc 100%)`
                    : `${dayColor}44`,
                  boxShadow: filledCount > 0 ? `0 0 ${compact ? 10 : 20}px ${dayColor}77, inset 0 1px 0 rgba(255,255,255,0.3)` : 'none',
                  borderRadius: compact ? 10 : 16,
                  fontSize: compact ? 11 : 15, fontFamily: 'Space Grotesk',
                  border: '1px solid rgba(255,255,255,0.25)',
                  flexShrink: 1, minWidth: 0, opacity: compact && filledCount === 0 ? 0.4 : undefined,
                }}
                animate={!compact && filledCount > 0 ? { boxShadow: [`0 0 16px ${dayColor}55`, `0 0 28px ${dayColor}99`, `0 0 16px ${dayColor}55`] } : {}}
                transition={filledCount > 0 ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                {!compact && filledCount > 0 && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
                  />
                )}
                <Play size={compact ? 11 : 15} fill="currentColor" style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} />
                {compact ? (
                  <>
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap', flexShrink: 1 }}>Simulate Only</span>
                    <span style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{dayLabel}</span>
                  </>
                ) : (
                  <>
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1 }}>Simulate Day</span>
                    {filledCount > 0 && (
                      <span style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{filledCount}</span>
                    )}
                  </>
                )}
              </motion.button>
            </div>
            </div>{/* end Row 1 */}

            {/* Row 2: Day Duration — professional redesign */}
            {(() => {
              const decStart = useHoldButton(() => setStartHour(h => Math.max(0, h - 1)));
              const incStart = useHoldButton(() => { setStartHour(h => { const next = Math.min(endHour - 1, h + 1); if (next >= endHour) setEndHour(e => Math.min(24, e + 1)); return next; }); });
              const decEnd   = useHoldButton(() => setEndHour(h => Math.max(startHour + 1, h - 1)));
              const incEnd   = useHoldButton(() => setEndHour(h => Math.min(24, h + 1)));
              const totalHrs     = endHour - startHour;
              const barLeft      = (startHour / 24) * 100;
              const barWidth     = (totalHrs / 24) * 100;
              const fmtEnd       = endHour === 24 ? 'Midnight' : fmtHour(endHour);

              const HourBtn = ({ col, children, ...props }) => (
                <motion.button
                  {...props}
                  whileHover={{ scale: 1.15, background: `rgba(${col},0.3)` }}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: compact ? 22 : 26, height: compact ? 22 : 26,
                    borderRadius: '50%', cursor: 'pointer', userSelect: 'none',
                    background: `rgba(${col},0.12)`,
                    border: `1.5px solid rgba(${col},0.4)`,
                    color: `rgb(${col})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: compact ? 14 : 16, fontWeight: 900, lineHeight: 1,
                    flexShrink: 0,
                  }}
                >{children}</motion.button>
              );

              const TimeDisplay = ({ value, col }) => (
                <div style={{
                  minWidth: compact ? 44 : 56, textAlign: 'center',
                  padding: compact ? '3px 8px' : '5px 10px',
                  borderRadius: 8,
                  background: `rgba(${col},0.08)`,
                  border: `1px solid rgba(${col},0.2)`,
                }}>
                  <span style={{
                    fontSize: compact ? 11 : 13, fontWeight: 800,
                    color: `rgb(${col})`,
                    fontFamily: 'JetBrains Mono',
                    letterSpacing: '0.02em',
                  }}>{value}</span>
                </div>
              );

              return (
                <div style={{ padding: compact ? '0 14px 8px' : '0 20px 12px', display: 'flex', alignItems: 'center', gap: compact ? 8 : 12 }}>
                  {/* Label */}
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ⏱ Range
                  </span>

                  {/* Start hour */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 5 : 7, flexShrink: 0 }}>
                    <HourBtn {...decStart} col="0,212,177">−</HourBtn>
                    <TimeDisplay value={fmtHour(startHour)} col="0,212,177" />
                    <HourBtn {...incStart} col="0,212,177">+</HourBtn>
                  </div>

                  {/* Visual range bar — CSS transition avoids Framer Motion left+right glitch */}
                  <div style={{ width: compact ? 80 : 120, flexShrink: 1, minWidth: 40, position: 'relative', height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0,
                      marginLeft: `${barLeft}%`,
                      width: `${barWidth}%`,
                      background: 'linear-gradient(90deg, #00d4b1, #f59e0b)',
                      borderRadius: 99,
                      boxShadow: '0 0 6px rgba(0,212,177,0.35)',
                      transition: 'margin-left 0.2s ease, width 0.2s ease',
                    }} />
                  </div>

                  {/* End hour */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 5 : 7, flexShrink: 0 }}>
                    <HourBtn {...decEnd} col="245,158,11">−</HourBtn>
                    <TimeDisplay value={fmtEnd} col="245,158,11" />
                    <HourBtn {...incEnd} col="245,158,11">+</HourBtn>
                  </div>

                  {/* Total hours badge */}
                  <div style={{
                    flexShrink: 0,
                    padding: compact ? '3px 8px' : '4px 10px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <span style={{ fontSize: compact ? 10 : 12, fontWeight: 800, color: '#e2e8f0', fontFamily: 'JetBrains Mono' }}>
                      {totalHrs}h
                    </span>
                  </div>

                  {/* Event count */}
                  {filledCount > 0 && (
                    <div style={{
                      flexShrink: 0,
                      padding: compact ? '1px 7px' : '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(0,212,177,0.1)',
                      border: '1px solid rgba(0,212,177,0.25)',
                    }}>
                      <span style={{ fontSize: compact ? 9 : 12, fontWeight: 700, color: '#00d4b1', fontFamily: 'Space Grotesk' }}>
                        {filledCount} event{filledCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>{/* end header bar */}


          {!compact && !fullscreen && (
            <div
              style={{
                overflow: 'hidden',
                flexShrink: 0,
                maxHeight: panelsHidden ? 0 : 200,
                opacity: panelsHidden ? 0 : 1,
                pointerEvents: panelsHidden ? 'none' : 'auto',
                transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
              }}
            >
              {/* ── Mood picker bar ── */}
              {(() => {
                const moodEntry = MOODS.find(m => m.id === selectedMood);
                const isCustomMood = selectedMood && !moodEntry;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', flexShrink: 0, minHeight: 38 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Grotesk', whiteSpace: 'nowrap', letterSpacing: '0.02em', textShadow: '0 0 10px rgba(245,158,11,0.5)' }}>🎭 Mood</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {selectedMood ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: moodEntry ? `rgba(${moodEntry.rgb},0.15)` : 'rgba(167,139,250,0.15)', border: `1px solid ${moodEntry ? `rgba(${moodEntry.rgb},0.4)` : 'rgba(167,139,250,0.4)'}` }}>
                          <span style={{ fontSize: 13 }}>{moodEntry?.icon ?? '🎨'}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: moodEntry?.color ?? '#a78bfa', fontFamily: 'Space Grotesk' }}>{moodEntry?.label ?? selectedMood}</span>
                          <button onClick={() => onMoodChange(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: moodEntry?.color ?? '#a78bfa', display: 'flex', alignItems: 'center', padding: 0, fontSize: 11, lineHeight: 1 }}>×</button>
                        </motion.div>
                      ) : null}
                    </div>
                    <motion.button onClick={() => setShowMoodModal(true)}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 18px rgba(245,158,11,0.55)', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#000' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 800, fontFamily: 'Space Grotesk', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', background: selectedMood ? 'rgba(245,158,11,0.12)' : 'linear-gradient(135deg, rgba(245,158,11,0.35), rgba(249,115,22,0.25))', border: `1.5px solid ${selectedMood ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.7)'}`, color: '#f59e0b', boxShadow: selectedMood ? 'none' : '0 0 12px rgba(245,158,11,0.3)' }}>
                      {selectedMood ? 'Change' : '+ Add Mood'}
                    </motion.button>
                  </div>
                );
              })()}

              {/* ── Outfit picker bar ── */}
              {(() => {
                const allItems = OUTFIT_GROUPS.flatMap(g => g.items);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', flexShrink: 0, minHeight: 38 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#a78bfa', fontFamily: 'Space Grotesk', whiteSpace: 'nowrap', letterSpacing: '0.02em', textShadow: '0 0 10px rgba(167,139,250,0.5)' }}>👗 Today's Outfit</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden' }}>
                      {selectedOutfits.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                          {selectedOutfits.slice(0, 3).map(id => {
                            const item = allItems.find(o => o.id === id);
                            const label = item ? item.label : isCustomOutfit(id) ? customOutfitLabel(id) : null;
                            const icon  = item ? item.icon : isCustomOutfit(id) ? '✏️' : null;
                            return label ? (
                              <motion.span key={id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                                title={label}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, color: '#a78bfa', fontFamily: 'Space Grotesk', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: 13 }}>{icon}</span>
                                <span>{label}</span>
                              </motion.span>
                            ) : null;
                          })}
                          {selectedOutfits.length > 3 && (
                            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'Space Grotesk' }}>+{selectedOutfits.length - 3}</span>
                          )}
                          <button onClick={() => onOutfitsChange([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 11, padding: '0 4px' }}
                            onMouseEnter={e => e.target.style.color = '#94a3b8'} onMouseLeave={e => e.target.style.color = '#475569'}>
                            ×
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <motion.button onClick={() => setShowOutfitModal(true)}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 18px rgba(167,139,250,0.55)', background: 'linear-gradient(135deg,#a78bfa,#9061f9)', color: '#fff' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 800, fontFamily: 'Space Grotesk', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', background: selectedOutfits.length > 0 ? 'rgba(167,139,250,0.12)' : 'linear-gradient(135deg, rgba(167,139,250,0.35), rgba(144,97,249,0.25))', border: `1.5px solid ${selectedOutfits.length > 0 ? 'rgba(167,139,250,0.35)' : 'rgba(167,139,250,0.7)'}`, color: '#c4b5fd', boxShadow: selectedOutfits.length > 0 ? 'none' : '0 0 12px rgba(167,139,250,0.3)' }}>
                      {selectedOutfits.length > 0 ? 'Change' : '+ Add Outfit'}
                    </motion.button>
                  </div>
                );
              })()}
            </div>
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

  const canvas = noOwnContext ? inner : (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      {inner}
      {dragOverlay}
    </DndContext>
  );

  return (
    <>
    {fullscreen ? createPortal(canvas, document.body) : canvas}

    {/* Fullscreen exit button — rendered via portal so it's always above everything */}
    {fullscreen && createPortal(
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        onClick={() => setFullscreen(false)}
        whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(0,212,177,0.5)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 22px', borderRadius: 24,
          background: 'rgba(9,9,15,0.95)',
          border: '1.5px solid rgba(0,212,177,0.5)',
          color: '#00d4b1', cursor: 'pointer',
          fontSize: 13, fontWeight: 800, fontFamily: 'Space Grotesk',
          boxShadow: '0 0 18px rgba(0,212,177,0.25), 0 4px 16px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Minimize2 size={14} />
        Exit Fullscreen
        <span style={{ fontSize: 10, color: 'rgba(0,212,177,0.5)', fontFamily: 'Space Grotesk', marginLeft: 4 }}>esc</span>
      </motion.button>,
      document.body
    )}

    {/* Event detail modal — portal so it escapes main's z-10 stacking context */}
    {createPortal(
      <AnimatePresence>
        {editingEvent && (
          <EventDetailModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onSave={(eventId, details) => timeline.updateDetails(eventId, details)}
            onRemove={(eventId) => { timeline.removeEvent(eventId); setEditingEvent(null); }}
          />
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* Mood picker modal */}
    <AnimatePresence>
      {showMoodModal && (
        <MoodPickerModal
          current={selectedMood}
          onConfirm={(mood) => onMoodChange(mood)}
          onClose={() => setShowMoodModal(false)}
        />
      )}
    </AnimatePresence>

    {/* Outfit picker modal */}
    <AnimatePresence>
      {showOutfitModal && (
        <OutfitPickerModal
          current={selectedOutfits}
          onConfirm={(outfits) => onOutfitsChange(outfits)}
          onClose={() => setShowOutfitModal(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
