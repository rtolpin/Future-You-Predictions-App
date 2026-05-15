import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Sparkles, Zap, Clock } from 'lucide-react';
import { FutureScoreBar } from './FutureScoreBar.jsx';

function Section({ title, icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '24px 28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Para({ children }) {
  return (
    <p style={{ fontFamily: 'DM Sans', fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.78)', margin: 0 }}>
      {children}
    </p>
  );
}

export function DayPredictionFullscreen({ prediction, eventCount, onClose, onMinimize }) {
  if (!prediction) return null;

  const scoreColor = (v) => {
    if (v >= 8) return '#34d399';
    if (v >= 6) return '#00d4b1';
    if (v >= 4) return '#f59e0b';
    return '#f87171';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
      exit={{ opacity: 0, scale: 0.96, x: 40, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#09090f', display: 'flex', flexDirection: 'column' }}
    >
      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', top: '-10%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(0,212,177,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', bottom: '0%', right: '5%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 65%)' }} />
      </div>

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,rgba(0,212,177,0.25),rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={17} color="#00d4b1" />
          </div>
          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>AI Day Prediction</p>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>{eventCount} activities simulated</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            onClick={onMinimize}
            whileHover={{ scale: 1.05, background: 'linear-gradient(135deg, #00d4b1, #00bfa0)', boxShadow: '0 0 28px rgba(0,212,177,0.7), 0 0 60px rgba(0,212,177,0.3)', borderColor: 'rgba(0,212,177,0.9)', color: '#000' }}
            whileTap={{ scale: 0.96 }}
            title="Keep prediction in sidebar"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1.5px solid rgba(0,212,177,0.55)', background: 'linear-gradient(135deg, rgba(0,212,177,0.15), rgba(0,191,160,0.1))', cursor: 'pointer', color: '#00d4b1', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 800, boxShadow: '0 0 12px rgba(0,212,177,0.25)', transition: 'all 0.15s ease' }}
          >
            <Minimize2 size={14} /> Back to Canvas
          </motion.button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 32px 80px' }}>

          {/* Hero: Day title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 50, background: 'rgba(0,212,177,0.1)', border: '1px solid rgba(0,212,177,0.25)', marginBottom: 20 }}>
              <Sparkles size={12} color="#00d4b1" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00d4b1', fontFamily: 'Space Grotesk' }}>Your Day Simulation</span>
            </div>
            <h1 style={{
              fontFamily: 'Space Grotesk',
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: '-1px',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(0,212,177,0.9) 55%, rgba(167,139,250,0.85) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 24,
            }}>
              {prediction.dayTitle}
            </h1>
            <p style={{ fontFamily: 'DM Sans', fontSize: 18, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: 620, margin: '0 auto' }}>
              {prediction.dayOpening}
            </p>
          </motion.div>

          {/* Event flow timeline */}
          {prediction.eventFlow?.length > 0 && (
            <Section title="Your Day Unfolds" icon="🌊" delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {prediction.eventFlow.map((evt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                    style={{ display: 'flex', gap: 16, paddingBottom: i < prediction.eventFlow.length - 1 ? 20 : 0 }}
                  >
                    {/* Timeline spine */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4b1,#a78bfa)', boxShadow: '0 0 8px rgba(0,212,177,0.5)', marginTop: 5, flexShrink: 0 }} />
                      {i < prediction.eventFlow.length - 1 && (
                        <div style={{ width: 1.5, flex: 1, background: 'linear-gradient(to bottom, rgba(0,212,177,0.3), rgba(167,139,250,0.1))', marginTop: 6 }} />
                      )}
                    </div>
                    {/* Event content */}
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>{evt.label}</span>
                        {evt.time && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono' }}>
                            <Clock size={10} /> {evt.time}
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', margin: 0 }}>
                        {evt.insight}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            {/* Momentum */}
            {prediction.momentum && (
              <Section title="Day Momentum" icon="⚡" delay={0.3}>
                <Para>{prediction.momentum}</Para>
              </Section>
            )}

            {/* End of day */}
            {prediction.endOfDay && (
              <Section title="End of Day" icon="🌙" delay={0.35}>
                <Para>{prediction.endOfDay}</Para>
              </Section>
            )}
          </div>

          {/* Identity */}
          {prediction.identity && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ marginTop: 16, padding: '24px 28px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,212,177,0.1), rgba(167,139,250,0.08))', border: '1.5px solid rgba(0,212,177,0.3)', textAlign: 'center' }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,212,177,0.7)', fontFamily: 'Space Grotesk', marginBottom: 12 }}>✦ WHO YOU'RE BECOMING</p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', margin: 0 }}>
                "{prediction.identity}"
              </p>
            </motion.div>
          )}

          {/* Scores */}
          {prediction.scores && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              style={{ marginTop: 16, padding: '24px 28px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Zap size={16} color="#00d4b1" />
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Day Scores</h3>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 900, color: scoreColor(prediction.scores.overall) }}>{prediction.scores.overall}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/10</span>
                </div>
              </div>
              <FutureScoreBar scores={prediction.scores} />
            </motion.div>
          )}

          {/* 30-day impact */}
          {prediction.thirtyDayImpact && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{ marginTop: 16, padding: '24px 28px', borderRadius: 20, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', fontFamily: 'Space Grotesk', marginBottom: 12 }}>🔭 30-DAY PROJECTION</p>
              <Para>{prediction.thirtyDayImpact}</Para>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
