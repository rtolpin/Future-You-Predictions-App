import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { getScoreColor, getScoreLabel } from '../../utils/scoreCalculator.js';

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255';
}

export const DecisionNode = memo(({ data, selected }) => {
  const { label, time, score, emoji, insight, color: pathColor, onAddAfter } = data;
  const scoreColor = score != null ? getScoreColor(score) : null;
  const accentColor = pathColor || scoreColor || '#475569';
  const rgb = hexToRgb(accentColor);
  const scoreLabel = score != null ? getScoreLabel(score) : null;

  return (
    <div
      style={{
        width: 220,
        borderRadius: 16,
        overflow: 'hidden',
        background: selected
          ? `rgba(${rgb},0.12)`
          : 'rgba(14,14,22,0.92)',
        border: `1.5px solid ${selected ? accentColor : 'rgba(255,255,255,0.1)'}`,
        boxShadow: selected
          ? `0 0 0 3px rgba(${rgb},0.25), 0 8px 32px rgba(${rgb},0.3), 0 2px 8px rgba(0,0,0,0.5)`
          : '0 4px 20px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

      {/* Left accent stripe */}
      <div style={{ position: 'absolute', left: 0, top: 3, bottom: 0, width: 3, background: accentColor, opacity: 0.6 }} />

      {/* Top row: handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: accentColor, border: `2px solid rgba(${rgb},0.5)`, width: 10, height: 10, boxShadow: `0 0 8px rgba(${rgb},0.6)` }}
      />

      <div style={{ padding: '12px 14px 14px 17px' }}>
        {/* Icon + time row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, rgba(${rgb},0.25), rgba(${rgb},0.1))`,
            border: `1px solid rgba(${rgb},0.35)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            boxShadow: `0 0 10px rgba(${rgb},0.2)`,
          }}>
            {emoji || '⚡'}
          </div>
          {time && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, fontWeight: 900,
              color: '#fff',
              background: `rgba(${rgb},0.85)`,
              padding: '3px 9px', borderRadius: 99,
              letterSpacing: '0.04em',
              boxShadow: `0 0 10px rgba(${rgb},0.5)`,
              whiteSpace: 'nowrap',
            }}>
              {time}
            </span>
          )}
        </div>

        {/* Activity name */}
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#f1f5f9',
          fontFamily: 'Space Grotesk, sans-serif',
          lineHeight: 1.35, marginBottom: insight ? 6 : 8,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {label}
        </p>

        {/* Insight preview */}
        {insight && (
          <p style={{
            fontSize: 11, lineHeight: 1.55,
            color: 'rgba(255,255,255,0.38)',
            fontFamily: 'DM Sans, sans-serif',
            marginBottom: 8,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {insight}
          </p>
        )}

        {/* Score row */}
        {score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {/* Bar */}
            <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${(score / 10) * 100}%`,
                background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
                boxShadow: `0 0 6px rgba(${rgb},0.5)`,
                transition: 'width 0.6s ease',
              }} />
            </div>
            {/* Score pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              background: `rgba(${rgb},0.15)`,
              border: `1px solid rgba(${rgb},0.3)`,
              borderRadius: 99, padding: '2px 8px',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 12, color: accentColor }}>{score}</span>
              {scoreLabel && <span style={{ fontSize: 9, fontWeight: 600, color: `rgba(${rgb},0.7)`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{scoreLabel}</span>}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: accentColor, border: `2px solid rgba(${rgb},0.5)`, width: 10, height: 10, boxShadow: `0 0 8px rgba(${rgb},0.6)` }}
      />

      {/* Add child button */}
      {onAddAfter && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddAfter(); }}
          title="Add activity after this"
          style={{
            position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            border: `2px solid rgba(14,14,22,0.8)`,
            color: '#000', fontWeight: 900, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: `0 0 10px rgba(${rgb},0.5)`,
            zIndex: 10, lineHeight: 1,
          }}
        >
          +
        </button>
      )}
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
