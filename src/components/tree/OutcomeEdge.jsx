import { memo } from 'react';
import { getBezierPath, BaseEdge } from 'reactflow';
import { getScoreColor } from '../../utils/scoreCalculator.js';

export const OutcomeEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const baseColor = data?.color || (data?.score != null ? getScoreColor(data.score) : null) || 'rgba(255,255,255,0.2)';
  const hasScore = data?.score != null;
  const strokeWidth = hasScore ? Math.max(1.5, (data.score / 10) * 3) : 1.5;
  const gradId = `grad-${id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const animId = `anim-${id}`.replace(/[^a-zA-Z0-9-]/g, '-');

  return (
    <>
      <defs>
        {/* Gradient along the edge */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={baseColor} stopOpacity="0.4" />
          <stop offset="50%" stopColor={baseColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="0.4" />
        </linearGradient>
        {/* Animated dot */}
        <circle id={animId} r="4" fill={baseColor} opacity="0.8">
          <filter id={`glow-${gradId}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </circle>
      </defs>

      {/* Shadow/glow path underneath */}
      <path
        d={edgePath}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeWidth + 3}
        strokeOpacity={0.12}
        strokeLinecap="round"
      />

      {/* Main edge */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated flowing dot along the path */}
      {hasScore && (
        <circle r="3.5" fill={baseColor} opacity="0.85"
          style={{ filter: `drop-shadow(0 0 4px ${baseColor})` }}
        >
          <animateMotion
            dur={`${2.5 + (10 - (data.score || 5)) * 0.15}s`}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* Arrow marker at target */}
      <path
        d={`M ${targetX} ${targetY}`}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeWidth}
        markerEnd={`url(#arrow-${gradId})`}
      />
      <defs>
        <marker id={`arrow-${gradId}`} markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={baseColor} opacity="0.8" />
        </marker>
      </defs>
    </>
  );
});

OutcomeEdge.displayName = 'OutcomeEdge';
