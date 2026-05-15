import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Sparkles, Zap, Trophy, Clock } from 'lucide-react';
import { FutureScoreBar } from './FutureScoreBar.jsx';

function getScoreColor(v) {
  if (v >= 8) return '#34d399';
  if (v >= 6) return '#00d4b1';
  if (v >= 4) return '#f59e0b';
  return '#f87171';
}

function PathColumn({ path, label, color, prediction, delay = 0 }) {
  if (!prediction) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* Path header */}
      <div style={{ padding: '18px 20px', borderRadius: 18, background: `linear-gradient(135deg, rgba(${hexToRgbStr(color)},0.15), rgba(${hexToRgbStr(color)},0.06))`, border: `1.5px solid rgba(${hexToRgbStr(color)},0.4)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color, fontFamily: 'Space Grotesk' }}>{label}</span>
        </div>
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 20, color: '#f1f5f9', lineHeight: 1.25, marginBottom: 10 }}>{prediction.dayTitle}</h3>
        <p style={{ fontFamily: 'DM Sans', fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{prediction.dayOpening}</p>
      </div>

      {/* Event flow */}
      {prediction.eventFlow?.length > 0 && (
        <div style={{ padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', marginBottom: 12 }}>Day Flow</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {prediction.eventFlow.map((evt, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: i < prediction.eventFlow.length - 1 ? 14 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
                  {i < prediction.eventFlow.length - 1 && <div style={{ width: 1.5, flex: 1, background: `rgba(${hexToRgbStr(color)},0.25)`, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#f1f5f9' }}>{evt.label}</span>
                    {evt.time && <span style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{evt.time}</span>}
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{evt.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scores */}
      {prediction.scores && (
        <div style={{ padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <FutureScoreBar scores={prediction.scores} />
        </div>
      )}

      {/* Identity */}
      {prediction.identity && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: `rgba(${hexToRgbStr(color)},0.06)`, border: `1px solid rgba(${hexToRgbStr(color)},0.2)` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: `rgba(${hexToRgbStr(color)},0.7)`, fontFamily: 'Space Grotesk', marginBottom: 6 }}>Who You're Becoming</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', margin: 0 }}>"{prediction.identity}"</p>
        </div>
      )}

      {/* 30-day */}
      {prediction.thirtyDayImpact && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)', fontFamily: 'Space Grotesk', marginBottom: 6 }}>🔭 30-Day Projection</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{prediction.thirtyDayImpact}</p>
        </div>
      )}
    </motion.div>
  );
}

function hexToRgbStr(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255';
}

const EDGE_COLOR = { A: '#00d4b1', B: '#a78bfa', tie: '#94a3b8' };

function ComparisonSection({ comparison, colorA, colorB }) {
  if (!comparison) return null;
  const winnerColor = comparison.winner === 'A' ? colorA : comparison.winner === 'B' ? colorB : '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Headline + winner */}
      <div style={{ padding: '20px 24px', borderRadius: 20, background: `linear-gradient(135deg, rgba(${hexToRgbStr(winnerColor)},0.12), rgba(${hexToRgbStr(winnerColor)},0.05))`, border: `2px solid rgba(${hexToRgbStr(winnerColor)},0.4)`, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <Trophy size={16} color={winnerColor} />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: winnerColor }}>
            {comparison.winner === 'tie' ? 'It\'s a Tie' : `Path ${comparison.winner} Wins`}
          </span>
        </div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 18, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 10 }}>{comparison.headline}</p>
        <p style={{ fontFamily: 'DM Sans', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{comparison.winnerReason}</p>
      </div>

      {/* Dimension comparison table */}
      {comparison.dimensions?.length > 0 && (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr 1fr', gap: 0, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: colorA, fontFamily: 'Space Grotesk' }}>Path A</span>
            <span />
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: colorB, fontFamily: 'Space Grotesk' }}>Path B</span>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', textAlign: 'right' }}>Edge</span>
          </div>
          {comparison.dimensions.map((dim, i) => {
            const edgeColor = dim.edgeWinner === 'A' ? colorA : dim.edgeWinner === 'B' ? colorB : '#94a3b8';
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr 1fr', gap: 0, padding: '12px 16px', borderBottom: i < comparison.dimensions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', margin: 0, paddingRight: 8 }}>{dim.pathASummary}</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', textAlign: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}>{dim.label}</span>
                  <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                </div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', margin: 0, paddingLeft: 8 }}>{dim.pathBSummary}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 11, color: edgeColor, background: `rgba(${hexToRgbStr(edgeColor)},0.15)`, padding: '2px 8px', borderRadius: 99 }}>
                    {dim.edgeWinner === 'tie' ? '—' : `Path ${dim.edgeWinner}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strengths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Path A Strengths', items: comparison.pathAStrengths, color: colorA },
          { label: 'Path B Strengths', items: comparison.pathBStrengths, color: colorB },
        ].map(({ label, items, color }) => (
          <div key={label} style={{ padding: '14px 16px', borderRadius: 14, background: `rgba(${hexToRgbStr(color)},0.06)`, border: `1px solid rgba(${hexToRgbStr(color)},0.2)` }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color, fontFamily: 'Space Grotesk', marginBottom: 10 }}>✦ {label}</p>
            {items?.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < items.length - 1 ? 6 : 0 }}>
                <span style={{ color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>•</span>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{s}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {comparison.recommendation && (
        <div style={{ padding: '18px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Grotesk', marginBottom: 10 }}>🧭 Who Should Choose Which?</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{comparison.recommendation}</p>
        </div>
      )}
    </motion.div>
  );
}

export function DayComparisonFullscreen({ result, pathALabel, pathBLabel, colorA, colorB, onClose }) {
  if (!result) return null;
  const { pathA, pathB, comparison } = result;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#09090f', display: 'flex', flexDirection: 'column' }}
    >
      {/* Ambient */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: '-5%', left: '20%', background: `radial-gradient(circle, rgba(${hexToRgbStr(colorA)},0.07) 0%, transparent 65%)` }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: '-5%', right: '15%', background: `radial-gradient(circle, rgba(${hexToRgbStr(colorB)},0.06) 0%, transparent 65%)` }} />
      </div>

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,rgba(0,212,177,0.2),rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={17} color="#00d4b1" />
          </div>
          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>Day Comparison</p>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>{pathALabel} vs {pathBLabel} — full simulation & analysis</p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.05, background: 'linear-gradient(135deg, #00d4b1, #00bfa0)', boxShadow: '0 0 28px rgba(0,212,177,0.7), 0 0 60px rgba(0,212,177,0.3)', borderColor: 'rgba(0,212,177,0.9)', color: '#000' }}
          whileTap={{ scale: 0.96 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1.5px solid rgba(0,212,177,0.55)', background: 'linear-gradient(135deg, rgba(0,212,177,0.15), rgba(0,191,160,0.1))', cursor: 'pointer', color: '#00d4b1', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 800, boxShadow: '0 0 12px rgba(0,212,177,0.25)', transition: 'all 0.15s ease' }}
        >
          <Minimize2 size={14} /> Back to Canvas
        </motion.button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px 80px' }}>

          {/* Section: Comparison Analysis (full width, shown first) */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Trophy size={18} color="#f59e0b" />
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 22, color: '#f1f5f9', margin: 0 }}>Head-to-Head Analysis</h2>
            </div>
            <ComparisonSection comparison={comparison} colorA={colorA} colorB={colorB} />
          </div>

          {/* Section: Side-by-side day details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={18} color="#00d4b1" />
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 22, color: '#f1f5f9', margin: 0 }}>Full Day Simulations</h2>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <PathColumn path={{ label: pathALabel }} label={pathALabel} color={colorA} prediction={pathA} delay={0.1} />
              {/* Divider */}
              <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <PathColumn path={{ label: pathBLabel }} label={pathBLabel} color={colorB} prediction={pathB} delay={0.2} />
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
