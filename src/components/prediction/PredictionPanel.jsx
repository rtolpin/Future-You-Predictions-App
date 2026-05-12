import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { SceneBlock } from './SceneBlock.jsx';
import { FutureScoreBar } from './FutureScoreBar.jsx';

function LoadingOrbs() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: 24, padding: '0 24px' }}>
      <div className="relative w-20 h-20">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: 'rgba(0,212,177,0.3)' }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🔮</div>
      </div>
      <div>
        <p className="font-semibold text-slate-300" style={{ fontSize: 14, marginBottom: 6 }}>Simulating your future...</p>
        <motion.p
          className="text-slate-600"
          style={{ fontSize: 12, lineHeight: 1.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Analyzing psychology, sociology, environment
        </motion.p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: 20, padding: '0 24px' }}>
      <motion.div
        className="rounded-2xl flex items-center justify-center text-3xl"
        style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🔮
      </motion.div>
      <div>
        <p className="font-semibold text-slate-400" style={{ fontSize: 14, marginBottom: 8 }}>No prediction yet</p>
        <p className="text-slate-600" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Drop cards onto the timeline, then click{' '}
          <span className="text-teal-500 font-medium">Simulate Day</span>{' '}
          to see your future
        </p>
      </div>
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        {[
          { icon: '1️⃣', text: 'Drag cards from the left panel' },
          { icon: '2️⃣', text: 'Drop onto time slots' },
          { icon: '3️⃣', text: 'Click "Simulate Day"' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            className="flex items-center text-left"
            style={{ gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <span className="text-slate-500" style={{ fontSize: 13 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PredictionPanel({ prediction, isLoading, selectedSlot, onClose, isFullscreen, onToggleFullscreen }) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>

      {/* Header — hidden in fullscreen (App.jsx renders its own top bar) */}
      {!isFullscreen && <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="rounded-xl flex items-center justify-center shrink-0"
            style={{ width: 34, height: 34, background: 'linear-gradient(135deg, rgba(0,212,177,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.3)' }}
          >
            <Sparkles size={14} color="#00d4b1" />
          </div>
          <div>
            <h4 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk', fontSize: 14, lineHeight: 1.3 }}>AI Prediction</h4>
            {selectedSlot && (
              <p style={{ fontSize: 11, marginTop: 2, color: '#94a3b8', fontFamily: 'DM Sans' }}>📍 {selectedSlot}</p>
            )}
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          {/* Fullscreen toggle */}
          <motion.button
            onClick={onToggleFullscreen}
            whileHover={{ scale: 1.05, background: 'rgba(0,212,177,0.15)', borderColor: 'rgba(0,212,177,0.4)' }}
            whileTap={{ scale: 0.95 }}
            title={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)', color: '#cbd5e1',
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </motion.button>

          {/* Close / collapse panel */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, background: 'rgba(248,113,113,0.18)', borderColor: 'rgba(248,113,113,0.45)' }}
            whileTap={{ scale: 0.95 }}
            title="Close prediction"
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)', color: '#cbd5e1',
            }}
          >
            <X size={15} />
          </motion.button>
        </div>
      </div>}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <LoadingOrbs />
            </motion.div>
          )}

          {!isLoading && !prediction && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <EmptyState />
            </motion.div>
          )}

          {!isLoading && prediction && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="h-full overflow-y-auto"
            >
              <div style={{ padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SceneBlock
                  scene={prediction.scene}
                  immediateFeel={prediction.immediateFeel}
                  endOfDayFeel={prediction.endOfDayFeel}
                  rippleEffect={prediction.rippleEffect}
                />

                {prediction.scores && (
                  <div
                    style={{
                      borderRadius: 16,
                      padding: '14px 16px',
                      background: 'linear-gradient(135deg, rgba(0,212,177,0.12), rgba(167,139,250,0.1))',
                      border: '1.5px solid rgba(0,212,177,0.35)',
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
                      <Zap size={15} color="#00d4b1" />
                      <p style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 800, color: '#00d4b1' }}>Future Self Scores</p>
                    </div>
                    <FutureScoreBar scores={prediction.scores} />
                  </div>
                )}

                {prediction.nextChoices?.length > 0 && (
                  <div>
                    <p style={{ gap: 8, fontSize: 13, marginBottom: 10, fontFamily: 'Space Grotesk', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center' }}>
                      <span>🔀</span> What next?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {prediction.nextChoices.map((choice, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.07 }}
                          className="flex items-center"
                          style={{
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            color: '#cbd5e1',
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#00d4b1', flexShrink: 0, background: 'rgba(0,212,177,0.15)', padding: '1px 6px', borderRadius: 5 }}>{String.fromCharCode(65 + i)}</span>
                          <span style={{ fontSize: 13, lineHeight: 1.5, color: '#e2e8f0', fontFamily: 'DM Sans' }}>{choice}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ height: 16 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
