import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Maximize2 } from 'lucide-react';
import { FutureScoreBar } from './FutureScoreBar.jsx';

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

function EmptyState() {
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
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: '#475569', fontSize: 13, marginBottom: 8 }}>No prediction yet</p>
        <p style={{ color: '#334155', fontSize: 12, lineHeight: 1.6 }}>
          Add activities to the timeline, then click{' '}
          <span style={{ color: '#00d4b1', fontWeight: 600 }}>Simulate Day</span>
        </p>
      </div>
      {[
        { icon: '1️⃣', text: 'Drag cards onto the timeline' },
        { icon: '2️⃣', text: 'Click "Simulate Day"' },
        { icon: '3️⃣', text: 'See your full day prediction' },
      ].map(({ icon, text }) => (
        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
          <span style={{ color: '#475569', fontSize: 12 }}>{text}</span>
        </div>
      ))}
    </div>
  );
}

function DayPredictionSidebar({ prediction, onExpand }) {
  const scoreColor = (v) => v >= 8 ? '#34d399' : v >= 6 ? '#00d4b1' : v >= 4 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 14px', gap: 14 }}>
      {/* Day title */}
      <div style={{ textAlign: 'center', padding: '16px 12px 12px', background: 'linear-gradient(135deg,rgba(0,212,177,0.08),rgba(167,139,250,0.06))', border: '1px solid rgba(0,212,177,0.2)', borderRadius: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,212,177,0.6)', fontFamily: 'Space Grotesk', marginBottom: 8 }}>✦ Your Day</p>
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 17, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 10 }}>{prediction.dayTitle}</h3>
        <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
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
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Day Scores</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 20, color: scoreColor(prediction.scores.overall) }}>{prediction.scores.overall}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Sans' }}>/10</span></span>
          </div>
          <FutureScoreBar scores={prediction.scores} />
        </div>
      )}

      {/* Identity */}
      {prediction.identity && (
        <div style={{ padding: '12px 14px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)', fontFamily: 'Space Grotesk', marginBottom: 8 }}>WHO YOU'RE BECOMING</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{prediction.identity}"</p>
        </div>
      )}
    </div>
  );
}

export function PredictionPanel({ prediction, dayPrediction, isLoading, selectedSlot, onClose, isFullscreen, onToggleFullscreen }) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
      {/* Header */}
      {!isFullscreen && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,rgba(0,212,177,0.2),rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} color="#00d4b1" />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, color: '#f1f5f9', lineHeight: 1.2 }}>AI Prediction</h4>
              {dayPrediction && <p style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>Full day simulated</p>}
            </div>
          </div>
          {dayPrediction && (
            <motion.button
              onClick={onToggleFullscreen}
              whileHover={{ scale: 1.05, background: 'rgba(0,212,177,0.15)' }}
              whileTap={{ scale: 0.95 }}
              style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(0,212,177,0.3)', background: 'rgba(0,212,177,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4b1' }}
              title="Expand to fullscreen"
            >
              <Maximize2 size={13} />
            </motion.button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <LoadingOrbs />
            </motion.div>
          )}
          {!isLoading && dayPrediction && (
            <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <DayPredictionSidebar prediction={dayPrediction} onExpand={onToggleFullscreen} />
            </motion.div>
          )}
          {!isLoading && !dayPrediction && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <EmptyState />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
