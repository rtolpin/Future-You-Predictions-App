import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Trophy, Lightbulb, Leaf, Target, TrendingUp } from 'lucide-react';
import { generateRetrospective } from '../../utils/claudeClient.js';

const ACCENT     = '#00d4b1';
const WIN_COLOR  = '#34d399';
const MISS_COLOR = '#f87171';
const PART_COLOR = '#fbbf24';

const MOOD_EMOJI = ['😞','😕','😐','🙂','😊','😄','😁','🤩','✨','🌟'];

function ScoreRing({ score, color, size = 52 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size < 50 ? 11 : 13} fontWeight="900" fontFamily="JetBrains Mono">
        {score}
      </text>
    </svg>
  );
}

function SliderRow({ label, emoji, value, onChange, color }) {
  const COLORS = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#818cf8','#c084fc','#e879f9'];
  const col = COLORS[value - 1] || color;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: 'Space Grotesk' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{MOOD_EMOJI[value - 1]}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: col, fontFamily: 'JetBrains Mono' }}>{value}</span>
          <span style={{ fontSize: 11, color: '#475569' }}>/ 10</span>
        </div>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

// ── Stage 1: Form ────────────────────────────────────────────────────────────
function RetroForm({ goals, outcomes, onOutcomeChange, reflection, onReflection, actualEvents, onActual, mood, onMood, energy, onEnergy, onSubmit, onClose, apiError }) {
  const RESULT_OPTS = [
    { key: 'yes',     label: '✅ Done',    color: WIN_COLOR,  bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.4)' },
    { key: 'partial', label: '🟡 Partial', color: PART_COLOR, bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.4)' },
    { key: 'no',      label: '❌ Missed',  color: MISS_COLOR, bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)' },
  ];

  const allRated  = outcomes.every(o => o.result !== null);
  const canSubmit = goals.length === 0 || allRated;

  const handleSubmit = () => { onSubmit(); };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#09090f' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,212,177,0.15)', border: '1.5px solid rgba(0,212,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={18} color={ACCENT} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk' }}>Day Retrospective</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>How did today actually go?</p>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <X size={16} />
        </motion.button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Goal outcomes */}
        {goals.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              🎯 How did your goals go?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {goals.map(goal => {
                const outcome = outcomes.find(o => o.goalId === goal.id);
                return (
                  <div key={goal.id} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{goal.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: 'DM Sans', flex: 1 }}>{goal.text}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: goal.type === 'build' ? WIN_COLOR : MISS_COLOR, fontFamily: 'Space Grotesk', textTransform: 'uppercase' }}>
                        {goal.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {RESULT_OPTS.map(opt => (
                        <motion.button key={opt.key} onClick={() => onOutcomeChange(goal.id, opt.key)}
                          whileTap={{ scale: 0.95 }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `1.5px solid ${outcome?.result === opt.key ? opt.border : 'rgba(255,255,255,0.08)'}`, background: outcome?.result === opt.key ? opt.bg : 'rgba(255,255,255,0.03)', color: outcome?.result === opt.key ? opt.color : '#475569', fontSize: 11, fontWeight: 700, fontFamily: 'Space Grotesk', cursor: 'pointer', transition: 'all 0.12s' }}>
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* What actually happened */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            📋 What did you actually do today?
          </label>
          <textarea
            value={actualEvents} onChange={e => onActual(e.target.value)}
            placeholder="e.g. Went to the gym, had lunch with a friend, worked from home until 6pm, watched TV until midnight…"
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9', fontFamily: 'DM Sans', fontSize: 14, padding: '12px 14px', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            onFocus={e => { e.target.style.borderColor = `rgba(0,212,177,0.5)`; e.target.style.boxShadow = '0 0 0 2px rgba(0,212,177,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Free reflection */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            💭 How did the day feel?
          </label>
          <textarea
            value={reflection} onChange={e => onReflection(e.target.value)}
            placeholder="How did you feel overall? What went well? What was hard? Anything surprising?"
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9', fontFamily: 'DM Sans', fontSize: 14, padding: '12px 14px', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            onFocus={e => { e.target.style.borderColor = `rgba(0,212,177,0.5)`; e.target.style.boxShadow = '0 0 0 2px rgba(0,212,177,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Actual mood & energy */}
        <div style={{ padding: '18px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            ⚡ End-of-day check-in
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SliderRow label="Actual Mood" emoji={MOOD_EMOJI[mood - 1]} value={mood} onChange={onMood} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <SliderRow label="Actual Energy" emoji="⚡" value={energy} onChange={onEnergy} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {!canSubmit && goals.length > 0 && !allRated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1.5px solid rgba(251,191,36,0.4)', marginBottom: 12 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Grotesk', lineHeight: 1.4 }}>
              Please rate all your goals above (✅ Done / 🟡 Partial / ❌ Missed) before analyzing.
            </p>
          </div>
        )}
        {apiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1.5px solid rgba(248,113,113,0.4)', marginBottom: 12 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>❌</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', fontFamily: 'DM Sans', lineHeight: 1.4 }}>{apiError}</p>
          </div>
        )}
        <motion.button onClick={handleSubmit} disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02, boxShadow: '0 0 32px rgba(0,212,177,0.5)' } : {}}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          className="w-full flex items-center justify-center cursor-pointer"
          style={{ gap: 8, padding: '15px', borderRadius: 16, border: 'none', background: canSubmit ? `linear-gradient(135deg, ${ACCENT}, #00c4a3)` : 'rgba(255,255,255,0.05)', boxShadow: canSubmit ? '0 0 20px rgba(0,212,177,0.3)' : 'none', color: canSubmit ? '#000' : '#334155', fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          <Sparkles size={16} /> Analyze My Day
        </motion.button>
      </div>
    </div>
  );
}

// ── Stage 2: Loading ─────────────────────────────────────────────────────────
const RETRO_LABELS = [
  'Reviewing your goals…',
  'Understanding your day…',
  'Identifying patterns…',
  'Crafting your coaching…',
  'Personalising insights…',
];

function RetroLoading() {
  const [labelIdx, setLabelIdx] = useState(0);
  const [pct, setPct]           = useState(0);

  // Continuous asymptotic: always moving, never gets stuck
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const p = Math.min(99, Math.floor(99 * (1 - Math.exp(-elapsed / 10))));
      setPct(p);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Cycle label text every ~2s independently of the percentage
  useEffect(() => {
    const t = setInterval(() => setLabelIdx(i => (i + 1) % RETRO_LABELS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full" style={{ background: '#09090f', gap: 0, padding: '0 48px' }}>

      {/* Spinning ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid rgba(0,212,177,0.12)`, borderTop: `3px solid ${ACCENT}`, marginBottom: 28 }}
      />

      {/* Step label */}
      <div style={{ textAlign: 'center', marginBottom: 28, minHeight: 48 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Space Grotesk', marginBottom: 8 }}>
          Analyzing your day…
        </p>
        <motion.p
          key={labelIdx}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 13, color: '#64748b', fontFamily: 'DM Sans' }}
        >
          {RETRO_LABELS[labelIdx]}
        </motion.p>
      </div>

      {/* Progress bar + percentage */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Progress
          </span>
          <motion.span
            key={pct}
            style={{ fontSize: 15, fontWeight: 900, color: ACCENT, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {pct}%
          </motion.span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 4,
              background: `linear-gradient(90deg, ${ACCENT}, #00bfa3)`,
              boxShadow: `0 0 10px rgba(0,212,177,0.5)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Stage 3: Results ─────────────────────────────────────────────────────────
function RetroResults({ result, onClose, onRedo }) {
  const hasWins     = result.wins?.length > 0;
  const hasPartials = result.partials?.length > 0;
  const hasMisses   = result.misses?.length > 0;

  const scoreColor = result.overallScore >= 7 ? WIN_COLOR : result.overallScore >= 4 ? PART_COLOR : MISS_COLOR;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#09090f' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ScoreRing score={result.overallScore} color={scoreColor} size={52} />
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>{result.headline}</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Day Retrospective · AI Coaching</p>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <X size={16} />
        </motion.button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Wins */}
        {hasWins && (
          <div>
            <SectionLabel icon={<Trophy size={13} />} label="Today's Wins" color={WIN_COLOR} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.wins.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{w.emoji || '🏆'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7', fontFamily: 'Space Grotesk' }}>{w.text}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 6 }}>{w.celebration}</p>
                  <p style={{ fontSize: 12, color: '#34d399', fontFamily: 'DM Sans', lineHeight: 1.5, fontStyle: 'italic' }}>💡 {w.impact}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Partials */}
        {hasPartials && (
          <div>
            <SectionLabel icon={<Leaf size={13} />} label="Partial Progress" color={PART_COLOR} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.partials.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{p.emoji || '🌱'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fcd34d', fontFamily: 'Space Grotesk' }}>{p.text}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 6 }}>{p.acknowledgment}</p>
                  <p style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'DM Sans', lineHeight: 1.5 }}>→ {p.nextStep}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Misses */}
        {hasMisses && (
          <div>
            <SectionLabel icon={<Lightbulb size={13} />} label="Opportunities to Grow" color={MISS_COLOR} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.misses.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{m.emoji || '💡'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', fontFamily: 'Space Grotesk' }}>{m.text}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 8 }}>{m.compassion}</p>
                  {m.rootCause && (
                    <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'DM Sans', lineHeight: 1.5, marginBottom: 8 }}>🔍 {m.rootCause}</p>
                  )}
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: MISS_COLOR, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Strategy for tomorrow</p>
                    <p style={{ fontSize: 13, color: '#e2e8f0', fontFamily: 'DM Sans', lineHeight: 1.5 }}>{m.strategy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns */}
        {result.patterns && (
          <InsightBlock icon="🔍" label="Your Patterns" color="#a78bfa" text={result.patterns} />
        )}

        {/* Tomorrow priority */}
        {result.tomorrowPriority && (
          <InsightBlock icon="🎯" label="Tomorrow's Focus" color={ACCENT} text={result.tomorrowPriority} highlight />
        )}

        {/* 30-day outlook */}
        {result.thirtyDayOutlook && (
          <InsightBlock icon="🚀" label="30-Day Outlook" color={PART_COLOR} text={result.thirtyDayOutlook} />
        )}

        {/* Closing message */}
        {result.closingMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ padding: '20px 22px', borderRadius: 16, background: `linear-gradient(135deg, rgba(0,212,177,0.09), rgba(0,212,177,0.04))`, border: '1px solid rgba(0,212,177,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#a7f3d0', fontFamily: 'DM Sans', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{result.closingMessage}"
            </p>
          </motion.div>
        )}

        {/* Redo */}
        <motion.button
          onClick={onRedo}
          whileHover={{ scale: 1.03, boxShadow: '0 0 14px rgba(0,212,177,0.25)', borderColor: 'rgba(0,212,177,0.45)' }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 cursor-pointer"
          style={{
            color: '#00d4b1', fontSize: 13, fontWeight: 700,
            fontFamily: 'Space Grotesk',
            background: 'rgba(0,212,177,0.08)',
            border: '1.5px solid rgba(0,212,177,0.3)',
            borderRadius: 10, padding: '9px 20px',
            transition: 'all 0.15s', marginBottom: 8,
          }}>
          ↩ Update My Reflection
        </motion.button>
      </div>
    </div>
  );
}

function SectionLabel({ icon, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ color, fontSize: 12, fontWeight: 800, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon} {label}
      </span>
    </div>
  );
}

function InsightBlock({ icon, label, color, text, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '16px 18px', borderRadius: 14, background: highlight ? `rgba(0,212,177,0.08)` : 'rgba(255,255,255,0.03)', border: `1px solid ${highlight ? 'rgba(0,212,177,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
      <p style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {icon} {label}
      </p>
      <p style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'DM Sans', lineHeight: 1.65 }}>{text}</p>
    </motion.div>
  );
}

// ── Main exported component ──────────────────────────────────────────────────
export function DayRetrospective({ goals, checkedGoals, profile, plannedEvents, onClose, onComplete }) {
  const [stage, setStage]       = useState('form');
  const [result, setResult]     = useState(null);
  const [apiError, setApiError] = useState(null);

  // Form state lives here so it survives loading/error stage transitions
  const [outcomes, setOutcomes]       = useState(() =>
    goals.map(g => ({ goalId: g.id, result: checkedGoals?.has(g.id) ? 'yes' : null }))
  );
  const [reflection, setReflection]   = useState('');
  const [actualEvents, setActual]     = useState('');
  const [mood, setMood]               = useState(5);
  const [energy, setEnergy]           = useState(5);

  const handleOutcomeChange = (goalId, val) =>
    setOutcomes(prev => prev.map(o => o.goalId === goalId ? { ...o, result: val } : o));

  const handleSubmit = async () => {
    setApiError(null);
    setStage('loading');
    try {
      const res = await generateRetrospective({
        goals,
        goalOutcomes: outcomes,
        reflection,
        actualEvents,
        actualMood:   mood,
        actualEnergy: energy,
        profile,
        plannedEvents: plannedEvents?.map(e => ({ time: e.time || '', label: e.card?.label || e.label || '' })),
      });
      setResult(res);
      setStage('result');
      onComplete?.(res);
    } catch (err) {
      console.error('Retrospective error:', err);
      setApiError(err.message || 'Something went wrong. Make sure the server is running and try again.');
      setStage('form');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full flex flex-col"
        style={{ maxWidth: 780, height: '90vh', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(160deg, #0e0e1c 0%, #09090f 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,177,0.06)' }}
      >
        <AnimatePresence mode="wait">
          {stage === 'form' && (
            <motion.div key="form" className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RetroForm
                goals={goals}
                outcomes={outcomes}
                onOutcomeChange={handleOutcomeChange}
                reflection={reflection}
                onReflection={setReflection}
                actualEvents={actualEvents}
                onActual={setActual}
                mood={mood}
                onMood={setMood}
                energy={energy}
                onEnergy={setEnergy}
                onSubmit={handleSubmit}
                onClose={onClose}
                apiError={apiError}
              />
            </motion.div>
          )}
          {stage === 'loading' && (
            <motion.div key="loading" className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RetroLoading />
            </motion.div>
          )}
          {stage === 'result' && result && (
            <motion.div key="result" className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RetroResults result={result} onClose={onClose} onRedo={() => setStage('form')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
