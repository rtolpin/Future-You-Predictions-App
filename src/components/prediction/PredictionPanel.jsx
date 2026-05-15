import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Maximize2, Minimize2, X, ChevronDown } from 'lucide-react';
import { FutureScoreBar } from './FutureScoreBar.jsx';

const SCORE_COLOR = (s) => s >= 7 ? '#34d399' : s >= 4 ? '#fbbf24' : '#f87171';

function RetroInsightsPanel({ result, onClear }) {
  const [open, setOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  if (!result) return null;

  const scoreCol = SCORE_COLOR(result.overallScore ?? 5);

  const fullscreenPortal = fullscreen && createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#09090f', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Day Retrospective</p>
            {result.headline && <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{result.headline}</p>}
          </div>
        </div>
        <motion.button onClick={() => setFullscreen(false)} whileHover={{ scale: 1.05, background: 'linear-gradient(135deg, #00d4b1, #00bfa0)', boxShadow: '0 0 28px rgba(0,212,177,0.7), 0 0 60px rgba(0,212,177,0.3)', borderColor: 'rgba(0,212,177,0.9)', color: '#000' }} whileTap={{ scale: 0.96 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1.5px solid rgba(0,212,177,0.55)', background: 'linear-gradient(135deg, rgba(0,212,177,0.15), rgba(0,191,160,0.1))', cursor: 'pointer', color: '#00d4b1', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 800, boxShadow: '0 0 12px rgba(0,212,177,0.25)', transition: 'all 0.15s ease' }}>
          <Minimize2 size={14} /> Back to Panel
        </motion.button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {result.overallScore != null && (
            <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(52,211,153,0.6)', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Overall Score</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 64, fontWeight: 900, color: scoreCol, lineHeight: 1 }}>{result.overallScore}<span style={{ fontSize: 20, color: '#334155' }}>/10</span></p>
            </div>
          )}
          {result.wins?.length > 0 && (
            <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#34d399', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>✅ Wins</p>
              {result.wins.map((w, i) => <p key={i} style={{ fontSize: 15, color: '#6ee7b7', fontFamily: 'DM Sans', lineHeight: 1.7, marginBottom: 8, fontWeight: 500 }}>{w.text}</p>)}
            </div>
          )}
          {(result.misses?.length > 0 || result.partials?.length > 0) && (
            <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>💡 To Work On</p>
              {[...(result.partials ?? []), ...(result.misses ?? [])].map((m, i) => <p key={i} style={{ fontSize: 15, color: '#fcd34d', fontFamily: 'DM Sans', lineHeight: 1.7, marginBottom: 6, fontWeight: 500 }}>{m.text}{m.strategy && <span style={{ color: '#64748b', fontWeight: 400 }}> — {m.strategy}</span>}</p>)}
            </div>
          )}
          {result.tomorrowPriority && (
            <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(0,212,177,0.06)', border: '1px solid rgba(0,212,177,0.2)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#00d4b1', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🎯 Tomorrow's Focus</p>
              <p style={{ fontSize: 15, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.75 }}>{result.tomorrowPriority}</p>
            </div>
          )}
          {result.closingMessage && <p style={{ fontSize: 15, color: '#475569', fontFamily: 'DM Sans', lineHeight: 1.75, fontStyle: 'italic', textAlign: 'center', padding: '8px 24px' }}>"{result.closingMessage}"</p>}
        </div>
      </div>
    </motion.div>,
    document.body
  );

  return (
    <>
    {fullscreenPortal}
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 8px', background: 'rgba(52,211,153,0.04)' }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>📊</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Day Retrospective</p>
          {result.headline && (
            <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'DM Sans', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.headline}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: scoreCol, fontFamily: 'JetBrains Mono' }}>{result.overallScore ?? '—'}</span>
          <span style={{ fontSize: 12, color: '#475569' }}>/10</span>
          <motion.button onClick={() => setFullscreen(true)} whileHover={{ scale: 1.08, background: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.6)' }} whileTap={{ scale: 0.95 }} title="View fullscreen"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 8, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', cursor: 'pointer', color: '#34d399' }}>
            <Maximize2 size={13} />
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Full Screen</span>
          </motion.button>
          <motion.button onClick={() => setOpen(o => !o)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
            <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }} style={{ display: 'flex' }}>
              <ChevronDown size={13} />
            </motion.span>
          </motion.button>
          <motion.button onClick={onClear} whileHover={{ scale: 1.1 }} title="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </motion.button>
        </div>
      </div>

      {/* Expandable content */}
      <div style={{ maxHeight: open ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>

          {/* Score bar */}
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 2 }}>
            <motion.div animate={{ width: `${((result.overallScore ?? 5) / 10) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${scoreCol}, ${scoreCol}99)`, boxShadow: `0 0 6px ${scoreCol}60` }} />
          </div>

          {/* Wins */}
          {result.wins?.length > 0 && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#34d399', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>✅ Wins</p>
              {result.wins.map((w, i) => (
                <p key={i} style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.5, marginBottom: i < result.wins.length - 1 ? 5 : 0 }}>
                  <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{w.text}</span>
                </p>
              ))}
            </div>
          )}

          {/* Misses/Partials */}
          {(result.misses?.length > 0 || result.partials?.length > 0) && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>💡 To Work On</p>
              {[...(result.partials ?? []), ...(result.misses ?? [])].slice(0, 3).map((m, i) => (
                <p key={i} style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.5, marginBottom: 4 }}>
                  <span style={{ color: '#fcd34d', fontWeight: 600 }}>{m.text}</span>
                  {m.strategy && <span style={{ color: '#64748b' }}> — {m.strategy}</span>}
                </p>
              ))}
            </div>
          )}

          {/* Tomorrow's focus */}
          {result.tomorrowPriority && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,212,177,0.06)', border: '1px solid rgba(0,212,177,0.2)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#00d4b1', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>🎯 Tomorrow's Focus</p>
              <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.55 }}>{result.tomorrowPriority}</p>
            </div>
          )}

          {/* Closing message */}
          {result.closingMessage && (
            <p style={{ fontSize: 13, color: '#475569', fontFamily: 'DM Sans', lineHeight: 1.6, fontStyle: 'italic', padding: '4px 2px' }}>"{result.closingMessage}"</p>
          )}
        </div>
      </div>
    </motion.div>
    </>
  );
}

function DailySummaryInsightsPanel({ result, onClear }) {
  const [open, setOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  if (!result) return null;

  const scoreCol = SCORE_COLOR(result.scores?.overall ?? 5);

  const fullscreenPortal = fullscreen && createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#09090f', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✨</div>
          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Daily Summary</p>
            {result.headline && <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{result.headline}</p>}
          </div>
        </div>
        <motion.button onClick={() => setFullscreen(false)} whileHover={{ scale: 1.05, background: 'linear-gradient(135deg, #00d4b1, #00bfa0)', boxShadow: '0 0 28px rgba(0,212,177,0.7), 0 0 60px rgba(0,212,177,0.3)', borderColor: 'rgba(0,212,177,0.9)', color: '#000' }} whileTap={{ scale: 0.96 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1.5px solid rgba(0,212,177,0.55)', background: 'linear-gradient(135deg, rgba(0,212,177,0.15), rgba(0,191,160,0.1))', cursor: 'pointer', color: '#00d4b1', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 800, boxShadow: '0 0 12px rgba(0,212,177,0.25)', transition: 'all 0.15s ease' }}>
          <Minimize2 size={14} /> Back to Panel
        </motion.button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {result.scores?.overall != null && (
            <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,158,11,0.6)', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Overall Score</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 64, fontWeight: 900, color: scoreCol, lineHeight: 1 }}>{result.scores.overall}<span style={{ fontSize: 20, color: '#334155' }}>/10</span></p>
            </div>
          )}
          {result.trend && <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', alignSelf: 'flex-start' }}><p style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', fontFamily: 'Space Grotesk' }}>{result.trend}</p></div>}
          {result.summary && <p style={{ fontSize: 16, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.8 }}>{result.summary}</p>}
          {result.oneWin && (
            <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(0,212,177,0.07)', border: '1px solid rgba(0,212,177,0.2)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#00d4b1', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>✅ Today's Win</p>
              <p style={{ fontSize: 15, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.75 }}>{result.oneWin}</p>
            </div>
          )}
          {result.oneRisk && (
            <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#f87171', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>⚠️ Watch For</p>
              <p style={{ fontSize: 15, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.75 }}>{result.oneRisk}</p>
            </div>
          )}
          {result.thirtyDayProjection && (
            <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📅 30-Day Projection</p>
              <p style={{ fontSize: 15, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.75 }}>{result.thirtyDayProjection}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );

  return (
    <>
    {fullscreenPortal}
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 8px', background: 'rgba(245,158,11,0.04)' }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✨</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Summary</p>
          {result.headline && (
            <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'DM Sans', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.headline}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: scoreCol, fontFamily: 'JetBrains Mono' }}>{result.scores?.overall ?? '—'}</span>
          <span style={{ fontSize: 12, color: '#475569' }}>/10</span>
          <motion.button onClick={() => setFullscreen(true)} whileHover={{ scale: 1.08, background: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.6)' }} whileTap={{ scale: 0.95 }} title="View fullscreen"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', color: '#f59e0b' }}>
            <Maximize2 size={13} />
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Full Screen</span>
          </motion.button>
          <motion.button onClick={() => setOpen(o => !o)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
            <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }} style={{ display: 'flex' }}>
              <ChevronDown size={13} />
            </motion.span>
          </motion.button>
          <motion.button onClick={onClear} whileHover={{ scale: 1.1 }} title="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </motion.button>
        </div>
      </div>

      {/* Expandable content */}
      <div style={{ maxHeight: open ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>

          {/* Score bar */}
          {result.scores?.overall != null && (
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 2 }}>
              <motion.div
                animate={{ width: `${((result.scores.overall) / 10) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${scoreCol}, ${scoreCol}99)`, boxShadow: `0 0 6px ${scoreCol}60` }}
              />
            </div>
          )}

          {/* Trend */}
          {result.trend && (
            <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', display: 'inline-flex', alignSelf: 'flex-start' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: 'Space Grotesk' }}>{result.trend}</p>
            </div>
          )}

          {/* Summary text */}
          {result.summary && (
            <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.6, padding: '2px 0' }}>{result.summary}</p>
          )}

          {/* Win */}
          {result.oneWin && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,212,177,0.07)', border: '1px solid rgba(0,212,177,0.18)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#00d4b1', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>✅ Today's Win</p>
              <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.55 }}>{result.oneWin}</p>
            </div>
          )}

          {/* Risk */}
          {result.oneRisk && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>⚠️ Watch For</p>
              <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.55 }}>{result.oneRisk}</p>
            </div>
          )}

          {/* 30-day projection */}
          {result.thirtyDayProjection && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>📅 30-Day Projection</p>
              <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.55 }}>{result.thirtyDayProjection}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
    </>
  );
}

function LoadingOrbs() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: 20, padding: '0 20px' }}>
      <div className="relative" style={{ width: 64, height: 64 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: 'rgba(0,212,177,0.35)' }}
            animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, delay: i * 0.55, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 26 }}>🔮</div>
      </div>
      <div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e8f0', fontSize: 13, marginBottom: 6 }}>Simulating your day…</p>
        <motion.p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }} animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
          Claude is analyzing every activity
        </motion.p>
      </div>
    </div>
  );
}

function EmptyState({ onSimulateAll, filledCount }) {
  const canSimulate = filledCount > 0 && !!onSimulateAll;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: 16, padding: '0 20px' }}>
      <motion.div
        className="rounded-2xl flex items-center justify-center"
        style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 26 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🔮
      </motion.div>
      <div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: '#cbd5e1', fontSize: 15, marginBottom: 8 }}>No prediction yet</p>
        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.65 }}>
          {canSimulate
            ? `You have ${filledCount} activit${filledCount === 1 ? 'y' : 'ies'} — ready to simulate!`
            : <>Add activities to the timeline, then click{' '}<span style={{ color: '#00d4b1', fontWeight: 700 }}>Simulate Day</span></>
          }
        </p>
      </div>
      {!canSimulate && [
        { icon: '1️⃣', text: 'Drag cards onto the timeline' },
        { icon: '2️⃣', text: 'Click "Simulate Day"' },
        { icon: '3️⃣', text: 'See your full day prediction' },
      ].map(({ icon, text }) => (
        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{text}</span>
        </div>
      ))}
      {canSimulate && (
        <motion.button
          onClick={onSimulateAll}
          whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(167,139,250,0.55), 0 0 50px rgba(139,92,246,0.3)' }}
          whileTap={{ scale: 0.96 }}
          animate={{ boxShadow: ['0 0 10px rgba(167,139,250,0.25)', '0 0 22px rgba(167,139,250,0.5)', '0 0 10px rgba(167,139,250,0.25)'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 24,
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={15} /> Generate AI Prediction
        </motion.button>
      )}
    </div>
  );
}

function DayPredictionSidebar({ prediction, onExpand }) {
  const scoreColor = (v) => v >= 8 ? '#34d399' : v >= 6 ? '#00d4b1' : v >= 4 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 14px', gap: 14 }}>
      {/* Day title */}
      <div style={{ textAlign: 'center', padding: '16px 12px 12px', background: 'linear-gradient(135deg,rgba(0,212,177,0.08),rgba(167,139,250,0.06))', border: '1px solid rgba(0,212,177,0.2)', borderRadius: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,212,177,0.6)', fontFamily: 'Space Grotesk', marginBottom: 8 }}>✦ Your Day</p>
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 19, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 10 }}>{prediction.dayTitle}</h3>
        <p style={{ fontFamily: 'DM Sans', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
          {prediction.dayOpening}
        </p>
        <motion.button
          onClick={onExpand}
          whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(0,212,177,0.3)' }}
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(0,212,177,0.2),rgba(167,139,250,0.15))', border: '1px solid rgba(0,212,177,0.35)', cursor: 'pointer', color: '#00d4b1', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12, width: '100%', justifyContent: 'center' }}
        >
          <Maximize2 size={12} /> View Full Day Prediction
        </motion.button>
      </div>

      {/* Scores */}
      {prediction.scores && (
        <div style={{ padding: '14px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={13} color="#00d4b1" />
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Day Scores</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 22, color: scoreColor(prediction.scores.overall) }}>{prediction.scores.overall}<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Sans' }}>/10</span></span>
          </div>
          <FutureScoreBar scores={prediction.scores} />
        </div>
      )}

      {/* Identity */}
      {prediction.identity && (
        <div style={{ padding: '12px 14px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)', fontFamily: 'Space Grotesk', marginBottom: 8 }}>WHO YOU'RE BECOMING</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{prediction.identity}"</p>
        </div>
      )}
    </div>
  );
}

export function PredictionPanel({ prediction, dayPrediction, isLoading, selectedSlot, onClose, isFullscreen, onToggleFullscreen, retroResult, onClearRetro, summaryResult, onClearSummary, onSimulateAll, filledCount = 0 }) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
      {/* Fullscreen button — shown when a full day prediction exists */}
      {!isFullscreen && dayPrediction && (
        <motion.button
          onClick={onToggleFullscreen}
          whileHover={{ background: 'linear-gradient(135deg, #00d4b1 0%, #00bfa0 100%)', boxShadow: '0 0 32px rgba(0,212,177,0.65), 0 0 60px rgba(0,212,177,0.3)', color: '#000', scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,212,177,0.1), rgba(167,139,250,0.08))',
            cursor: 'pointer', color: '#00d4b1',
            fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12,
            border: 'none', borderBottom: '1px solid rgba(0,212,177,0.18)',
            transition: 'all 0.15s ease',
          }}
        >
          <Maximize2 size={13} />
          View AI Insights Full Screen
        </motion.button>
      )}

      {/* Scrollable body — insight panels + prediction content all scroll together */}
      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* Daily Summary insights */}
        {summaryResult && <DailySummaryInsightsPanel result={summaryResult} onClear={onClearSummary} />}

        {/* Retrospective insights */}
        {retroResult && <RetroInsightsPanel result={retroResult} onClear={onClearRetro} />}

        {/* Prediction content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <LoadingOrbs />
              </motion.div>
            )}
            {!isLoading && dayPrediction && (
              <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DayPredictionSidebar prediction={dayPrediction} onExpand={onToggleFullscreen} />
              </motion.div>
            )}
            {!isLoading && !dayPrediction && !summaryResult && !retroResult && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <EmptyState onSimulateAll={onSimulateAll} filledCount={filledCount} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
