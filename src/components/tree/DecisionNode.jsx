import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/scoreCalculator.js';

export const DecisionNode = memo(({ data, selected }) => {
  const { label, time, score, emoji, onClick } = data;
  const color = score ? getScoreColor(score) : '#94a3b8';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      className="rounded-xl px-4 py-3 cursor-pointer min-w-[140px]"
      style={{
        background: selected ? `${color}20` : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.1)'}`,
        boxShadow: selected ? `0 0 16px ${color}40` : 'none',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: 6, height: 6 }} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{emoji || '⚡'}</span>
        <span className="text-xs text-slate-500 font-mono">{time}</span>
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{label}</p>
      {score !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(score / 10) * 100}%`, background: color }}
            />
          </div>
          <span className="text-xs font-mono" style={{ color }}>{score}</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: 6, height: 6 }} />
    </motion.div>
  );
});

DecisionNode.displayName = 'DecisionNode';
