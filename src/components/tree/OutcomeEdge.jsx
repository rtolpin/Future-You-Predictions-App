import { memo } from 'react';
import { BaseEdge, getBezierPath } from 'reactflow';
import { getScoreColor } from '../../utils/scoreCalculator.js';

export const OutcomeEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const color = data?.score ? getScoreColor(data.score) : 'rgba(255,255,255,0.15)';

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ stroke: color, strokeWidth: 1.5, strokeDasharray: data?.score ? 'none' : '4 4' }}
    />
  );
});

OutcomeEdge.displayName = 'OutcomeEdge';
