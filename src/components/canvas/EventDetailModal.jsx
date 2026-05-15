import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, AlignLeft, Clock, Save, Sun, Check, Trash2 } from 'lucide-react';
import { CATEGORY_META } from '../../data/decisionCards.js';
import { minutesToLabel } from '../../hooks/useTimeline.js';

const PALETTE = [
  { label: 'Teal',    value: '#00d4b1' },
  { label: 'Purple',  value: '#a78bfa' },
  { label: 'Amber',   value: '#f59e0b' },
  { label: 'Rose',    value: '#f43f5e' },
  { label: 'Blue',    value: '#3b82f6' },
  { label: 'Green',   value: '#22c55e' },
  { label: 'Orange',  value: '#f97316' },
  { label: 'Pink',    value: '#ec4899' },
  { label: 'Cyan',    value: '#06b6d4' },
  { label: 'Lime',    value: '#84cc16' },
  { label: 'Indigo',  value: '#6366f1' },
  { label: 'Red',     value: '#ef4444' },
  { label: 'Yellow',  value: '#eab308' },
  { label: 'Sky',     value: '#38bdf8' },
  { label: 'Fuchsia', value: '#d946ef' },
  { label: 'White',   value: '#e2e8f0' },
];

function pad(n) { return String(n).padStart(2, '0'); }

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

function formatDuration(mins) {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function minsToTimeValue(totalMinutes) {
  const safe = totalMinutes || 0;
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${pad(h)}:${pad(m)}`;
}

function TimePicker({ label, totalMinutes, onChange, color, rgb }) {
  const [inputVal, setInputVal] = useState(minsToTimeValue(totalMinutes));

  useEffect(() => {
    setInputVal(minsToTimeValue(totalMinutes));
  }, [totalMinutes]);

  const handleChange = (e) => {
    setInputVal(e.target.value);
    if (e.target.value) {
      const [h, m] = e.target.value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) onChange(h * 60 + m);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      <input
        type="time"
        value={inputVal}
        step={900}
        onChange={handleChange}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.06)',
          border: `1.5px solid rgba(${rgb},0.35)`,
          borderRadius: 12,
          color: '#f1f5f9',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 16,
          fontWeight: 700,
          padding: '12px 14px',
          outline: 'none',
          cursor: 'pointer',
          colorScheme: 'dark',
          boxSizing: 'border-box',
          boxShadow: `inset 0 0 0 1px rgba(${rgb},0.08)`,
        }}
      />
    </div>
  );
}

export function EventDetailModal({ event, onSave, onClose, onRemove }) {
  // State must be declared before any derived values that reference them
  const [label,       setLabel]       = useState(event.card.label);
  const [description, setDescription] = useState(event.description || '');
  const [location,    setLocation]    = useState(event.location || '');
  const [startMins,   setStartMins]   = useState(event.startMinutes);
  const [endMins,     setEndMins]     = useState(event.startMinutes + event.durationMinutes);
  const [allDay,      setAllDay]      = useState(event.allDay || false);
  const [customColor, setCustomColor] = useState(event.customColor || null);

  const meta  = CATEGORY_META[event.card.category];
  const color = customColor || meta.color;
  const rgb   = hexToRgb(color);

  const duration = Math.max(0, endMins - startMins);
  const endBeforeStart = endMins <= startMins;

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14,
    color: '#f1f5f9', fontFamily: 'DM Sans', fontSize: 15,
    padding: '13px 16px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const focus = (e) => { e.target.style.borderColor = `rgba(${rgb},0.6)`; e.target.style.boxShadow = `0 0 0 3px rgba(${rgb},0.12)`; };
  const blur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

  const handleSave = () => {
    onSave(event.id, {
      card: { ...event.card, label },
      description,
      location,
      startMinutes: allDay ? event.startMinutes : startMins,
      durationMinutes: allDay ? 24 * 60 : Math.max(15, duration),
      allDay,
      customColor,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: 24 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          width: '100%', maxWidth: 720,
          background: 'linear-gradient(160deg, #0d0d1a 0%, #09090f 100%)',
          border: `1.5px solid rgba(${rgb},0.35)`,
          borderRadius: 24,
          boxShadow: `0 0 60px rgba(${rgb},0.18), 0 32px 64px rgba(0,0,0,0.6)`,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: `rgba(${rgb},0.08)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `rgba(${rgb},0.2)`, border: `1.5px solid rgba(${rgb},0.4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {event.card.icon}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>Edit Event</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Space Grotesk', marginTop: 3, lineHeight: 1 }}>{event.card.label}</p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
          >
            <X size={15} />
          </motion.button>
        </div>

        {/* Scrollable form — 2-column grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 32px' }}>

          {/* Activity Name — full width on top */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Activity Name</p>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT COLUMN — color, toggles, time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Event Color */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Event Color
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {/* Default (category color) */}
              <motion.button
                onClick={() => setCustomColor(null)}
                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                title="Default (category color)"
                style={{
                  width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
                  background: `conic-gradient(${meta.color}, #a78bfa, #f59e0b, #f43f5e, ${meta.color})`,
                  border: `2.5px solid ${customColor === null ? '#fff' : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: customColor === null ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                  flexShrink: 0,
                }}
              >
                {customColor === null && <Check size={12} color="#fff" strokeWidth={3} />}
              </motion.button>
              {PALETTE.map(c => {
                const active = customColor === c.value;
                return (
                  <motion.button
                    key={c.value}
                    onClick={() => setCustomColor(c.value)}
                    whileHover={{ scale: 1.18, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    title={c.label}
                    style={{
                      width: 26, height: 26, borderRadius: 7, cursor: 'pointer',
                      background: c.value,
                      border: `2.5px solid ${active ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: active ? `0 0 12px ${c.value}` : 'none',
                      flexShrink: 0,
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {active && <Check size={11} color={c.value === '#e2e8f0' ? '#000' : '#fff'} strokeWidth={3} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* All Day toggle */}
          <motion.button
            onClick={() => setAllDay(a => !a)}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700,
              background: allDay ? `rgba(${rgb},0.2)` : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${allDay ? color : 'rgba(255,255,255,0.1)'}`,
              color: allDay ? color : '#64748b',
              boxShadow: allDay ? `0 0 14px rgba(${rgb},0.25)` : 'none',
            }}
          >
            <Sun size={14} /> All Day
            <div style={{
              width: 34, height: 18, borderRadius: 9,
              background: allDay ? color : 'rgba(255,255,255,0.12)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <motion.div animate={{ left: allDay ? 18 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff' }}
              />
            </div>
          </motion.button>

          {/* Time pickers — CSS transition avoids Framer Motion height:auto measurement failures */}
          <div style={{
            overflow: 'hidden',
            maxHeight: allDay ? 0 : 400,
            opacity: allDay ? 0 : 1,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
              <TimePicker label="Start Time" totalMinutes={startMins} onChange={setStartMins} color={color} rgb={rgb} />
              <div style={{ paddingBottom: 10, fontSize: 20, color: '#475569', fontWeight: 900, textAlign: 'center' }}>➔</div>
              <TimePicker label="End Time"   totalMinutes={endMins}   onChange={setEndMins}   color={color} rgb={rgb} />
            </div>

            {/* Duration summary */}
            <div style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 12,
              background: endBeforeStart ? 'rgba(248,113,113,0.1)' : `rgba(${rgb},0.08)`,
              border: `1px solid ${endBeforeStart ? 'rgba(248,113,113,0.3)' : `rgba(${rgb},0.2)`}`,
            }}>
              <Clock size={13} color={endBeforeStart ? '#f87171' : color} />
              {endBeforeStart ? (
                <span style={{ fontSize: 12, color: '#f87171', fontFamily: 'DM Sans' }}>End time must be after start time</span>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Sans' }}>Duration:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{formatDuration(duration)}</span>
                  <span style={{ fontSize: 12, color: '#475569', fontFamily: 'DM Sans', marginLeft: 'auto' }}>
                    ends {minutesToLabel(endMins)}
                  </span>
                </>
              )}
            </div>
          </div>

          </div>{/* end LEFT COLUMN */}

          {/* RIGHT COLUMN — Notes + Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Notes */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlignLeft size={11} /> Notes (optional)
              </p>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Add any notes about this activity..."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, width: '100%' }}
                onFocus={focus} onBlur={blur}
              />
            </div>

            {/* Location */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={11} /> Location (optional)
              </p>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Central Park, Home, Gym..." style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

          </div>{/* end RIGHT COLUMN */}

          </div>{/* end 2-column grid */}
          <div style={{ height: 8 }} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 32px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#64748b', fontFamily: 'DM Sans', fontSize: 14, cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSave}
              disabled={!allDay && endBeforeStart}
              whileHover={{ scale: 1.02, boxShadow: `0 0 24px rgba(${rgb},0.45)` }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 2, padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 0 16px rgba(${rgb},0.3)`,
                color: '#000', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!allDay && endBeforeStart) ? 0.4 : 1,
              }}
            >
              <Save size={15} /> Save Event
            </motion.button>
          </div>
          {onRemove && (
            <motion.button
              onClick={() => { onRemove(event.id); onClose(); }}
              whileHover={{ scale: 1.01, background: 'rgba(248,113,113,0.18)', boxShadow: '0 0 14px rgba(248,113,113,0.25)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '11px', borderRadius: 14, cursor: 'pointer',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Trash2 size={15} /> Delete Event
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
