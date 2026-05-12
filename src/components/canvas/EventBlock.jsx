import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronsUpDown, Pencil, Check } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CATEGORY_META } from '../../data/decisionCards.js';
import { minutesToLabel } from '../../hooks/useTimeline.js';

const HOUR_HEIGHT = 80;
const SNAP = 15;
const MIN_DURATION = 15;

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

export function EventBlock({ event, onRemove, onClick, onUpdateDuration, onUpdateLabel, isSelected, prediction, isLoading, startHour = 5, fmtTime }) {
  const [editing, setEditing] = useState(() => event.card.id === 'act-hair-custom');
  const [editValue, setEditValue] = useState(event.card.label);
  const inputRef = useRef(null);

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: { type: 'event', eventId: event.id },
    disabled: editing,
  });

  const startEdit = useCallback((e) => {
    e.stopPropagation();
    setEditValue(event.card.label);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  }, [event.card.label]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) onUpdateLabel?.(event.id, trimmed);
    setEditing(false);
  }, [editValue, event.id, onUpdateLabel]);

  const handleEditKey = useCallback((e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
    e.stopPropagation();
  }, [commitEdit]);
  const meta = CATEGORY_META[event.card.category];
  const color = event.customColor || meta.color;
  const rgb = hexToRgb(color);

  const top = (event.startMinutes - startHour * 60) / 60 * HOUR_HEIGHT;
  const height = Math.max(MIN_DURATION / 60 * HOUR_HEIGHT, event.durationMinutes / 60 * HOUR_HEIGHT);

  const endMinutes = event.startMinutes + event.durationMinutes;
  const fmt = fmtTime || minutesToLabel;
  const timeLabel = `${fmt(event.startMinutes)} – ${fmt(endMinutes)}`;
  const durationLabel = event.durationMinutes < 60
    ? `${event.durationMinutes}m`
    : event.durationMinutes % 60 === 0
    ? `${event.durationMinutes / 60}h`
    : `${Math.floor(event.durationMinutes / 60)}h ${event.durationMinutes % 60}m`;

  // ── Resize via mouse drag on bottom handle ──
  const resizeRef = useRef({ active: false, startY: 0, startDuration: 0 });

  const onResizeStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDragging) return;
    resizeRef.current = { active: true, startY: e.clientY, startDuration: event.durationMinutes };

    const onMove = (moveEvt) => {
      if (!resizeRef.current.active) return;
      const deltaY = moveEvt.clientY - resizeRef.current.startY;
      const deltaMinutes = deltaY / HOUR_HEIGHT * 60;
      const raw = resizeRef.current.startDuration + deltaMinutes;
      const snapped = Math.max(MIN_DURATION, Math.round(raw / SNAP) * SNAP);
      onUpdateDuration?.(event.id, snapped);
    };

    const onUp = () => {
      resizeRef.current.active = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [event.id, event.durationMinutes, onUpdateDuration]);

  const compact = height < 48;
  const dragTransform = CSS.Translate.toString(transform);

  return (
    <motion.div
      ref={setDragRef}
      {...listeners}
      {...attributes}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.35 : 1, scale: isDragging ? 0.98 : 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => !isDragging && onClick?.(event.id)}
      style={{
        position: 'absolute',
        top,
        left: 4,
        right: 4,
        height,
        transform: dragTransform,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: isSelected ? 10 : 2,
        background: `linear-gradient(135deg, rgba(${rgb},0.22) 0%, rgba(${rgb},0.12) 100%)`,
        border: `1.5px solid rgba(${rgb}, ${isSelected ? 0.8 : 0.4})`,
        boxShadow: isSelected
          ? `0 0 0 2px rgba(${rgb},0.4), 0 4px 16px rgba(${rgb},0.25)`
          : `0 2px 8px rgba(0,0,0,0.3)`,
        userSelect: 'none',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Left accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: color,
        borderRadius: '10px 0 0 10px',
      }} />

      {/* Content */}
      <div style={{ paddingLeft: 12, paddingRight: 28, paddingTop: compact ? 4 : 7, paddingBottom: compact ? 4 : 6, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: compact ? 12 : 14, lineHeight: 1, flexShrink: 0 }}>{event.card.icon}</span>

          {editing ? (
            /* Inline edit input */
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }} onClick={e => e.stopPropagation()}>
              <input
                ref={inputRef}
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleEditKey}
                onBlur={commitEdit}
                style={{
                  flex: 1,
                  fontSize: compact ? 11 : 12,
                  fontWeight: 600,
                  color: '#f1f5f9',
                  fontFamily: 'Space Grotesk',
                  background: 'rgba(255,255,255,0.12)',
                  border: `1px solid rgba(${hexToRgb(color)},0.6)`,
                  borderRadius: 5,
                  padding: '2px 6px',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <motion.button
                onMouseDown={e => { e.stopPropagation(); commitEdit(); }}
                whileHover={{ scale: 1.15 }}
                style={{ color, cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', flexShrink: 0 }}
              >
                <Check size={12} />
              </motion.button>
            </div>
          ) : (
            /* Label + pencil edit button */
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }} className="group/label">
              <p style={{
                fontSize: compact ? 11 : 13,
                fontWeight: 700,
                color: '#f1f5f9',
                fontFamily: 'Space Grotesk',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
                flex: 1,
              }}>
                {event.card.label}
              </p>
              <motion.button
                onClick={startEdit}
                whileHover={{ scale: 1.2 }}
                title="Edit label"
                className="opacity-0 group-hover/label:opacity-100 transition-opacity"
                style={{ color: `rgba(${hexToRgb(color)},0.8)`, cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', flexShrink: 0 }}
              >
                <Pencil size={10} />
              </motion.button>
            </div>
          )}
        </div>
        {!compact && (
          <p style={{ fontSize: 11, color: `rgba(${rgb},0.9)`, marginTop: 3, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
            {timeLabel} · {durationLabel}
          </p>
        )}
        {!compact && event.location && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {event.location}
          </p>
        )}
        {!compact && event.description && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {event.description}
          </p>
        )}
        {isLoading && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ fontSize: 10, color: color, marginTop: 3 }}
          >
            Simulating...
          </motion.div>
        )}
        {prediction && !isLoading && (
          <div style={{
            marginTop: 4,
            fontSize: 10,
            color: 'rgba(255,255,255,0.5)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.35,
          }}>
            {prediction.scene?.slice(0, 80)}…
          </div>
        )}
      </div>

      {/* Remove button */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); onRemove?.(event.id); }}
        whileHover={{ scale: 1.2, background: 'rgba(248,113,113,0.3)' }}
        style={{
          position: 'absolute', top: 4, right: 4,
          width: 20, height: 20, borderRadius: 6,
          background: 'rgba(255,255,255,0.08)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <X size={10} />
      </motion.button>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        title="Drag to resize"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
          cursor: 'ns-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          borderRadius: '0 0 10px 10px',
          background: `linear-gradient(to top, rgba(${rgb},0.2), transparent)`,
        }}
        onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(to top, rgba(${rgb},0.4), transparent)`}
        onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(to top, rgba(${rgb},0.2), transparent)`}
      >
        <ChevronsUpDown size={11} color={color} style={{ opacity: 0.9 }} />
        <Clock size={10} color={color} style={{ opacity: 0.9 }} />
        <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: 'Space Grotesk', opacity: 0.9, letterSpacing: '0.03em' }}>
          ADJUST TIME
        </span>
      </div>
    </motion.div>
  );
}
