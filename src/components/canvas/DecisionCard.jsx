import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { CATEGORY_META } from '../../data/decisionCards.js';

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

export function DecisionCard({ card, compact = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-lib-${card.id}`,
    data: { card },
  });

  const meta = CATEGORY_META[card.category];
  const rgb = hexToRgb(meta.color);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 9999 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        borderRadius: 12,
        overflow: 'hidden',
        background: isDragging
          ? `linear-gradient(135deg, rgba(${rgb},0.25), rgba(${rgb},0.1))`
          : 'rgba(255,255,255,0.05)',
        border: isDragging
          ? `2px solid rgba(${rgb},0.7)`
          : `1px solid rgba(${rgb},0.2)`,
        boxShadow: isDragging
          ? `0 24px 48px rgba(0,0,0,0.6), 0 0 32px rgba(${rgb},0.4)`
          : 'none',
        opacity: isDragging ? 0.45 : 1,
        transition: 'background 0.15s, border 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.background = `rgba(${rgb},0.1)`;
          e.currentTarget.style.transform = (CSS.Translate.toString(transform) || '') + ' translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 6px 20px rgba(${rgb},0.2)`;
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.transform = CSS.Translate.toString(transform) || '';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Left color bar */}
        <div style={{
          width: 3, alignSelf: 'stretch', background: meta.color,
          opacity: isDragging ? 1 : 0.6, borderRadius: 2, flexShrink: 0,
        }} />

        {/* Grip icon — purely visual */}
        <div style={{
          padding: compact ? '10px 5px' : '12px 5px',
          color: 'rgba(255,255,255,0.18)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <GripVertical size={12} />
        </div>

        {/* Card content */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: compact ? '10px 10px 10px 2px' : '12px 12px 12px 2px',
          flex: 1,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `rgba(${rgb},0.15)`,
            border: `1px solid rgba(${rgb},0.25)`,
            pointerEvents: 'none',
          }}>
            {card.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1, pointerEvents: 'none' }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: '#e2e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
            }}>
              {card.label}
            </p>
            {!compact && (
              <p style={{
                fontSize: 11, color: '#64748b',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginTop: 2, lineHeight: 1.3,
              }}>
                {card.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
