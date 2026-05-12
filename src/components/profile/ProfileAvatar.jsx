import { motion } from 'framer-motion';

const GENDER_AVATARS = { 'Man': '👨', 'Woman': '👩', 'Non-binary': '🧑', default: '🧑' };
const EMPLOYMENT_ICONS = {
  'Employed full-time': '💼', 'Employed part-time': '⏱', 'Part-time': '⏱',
  'Unemployed': '🔍', 'Student': '📚', 'Retired': '🌴', 'Freelancer': '💻',
};
const MOOD_COLORS = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#818cf8','#c084fc','#e879f9'];

export function ProfileAvatar({ profile, compact = false }) {
  const avatar = GENDER_AVATARS[profile?.genderIdentity] || GENDER_AVATARS.default;
  const moodColor = MOOD_COLORS[(profile?.mood || 5) - 1];
  const name = profile?.name || 'You';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          className="w-7 h-7 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{
            background: `linear-gradient(135deg, ${moodColor}25, ${moodColor}10)`,
            border: `1.5px solid ${moodColor}50`,
          }}
        >
          {avatar}
        </motion.div>
        <div className="text-left">
          <p className="text-xs font-semibold text-slate-200 leading-tight">{name}</p>
          <p className="text-xs leading-tight" style={{ color: moodColor, fontSize: 10 }}>
            {profile?.employment?.split(' ')[0] || 'Explorer'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <motion.div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
        style={{
          background: `linear-gradient(135deg, ${moodColor}20, ${moodColor}08)`,
          border: `2px solid ${moodColor}40`,
        }}
        animate={{ boxShadow: [`0 0 0 0 ${moodColor}40`, `0 0 12px 3px ${moodColor}20`, `0 0 0 0 ${moodColor}40`] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {avatar}
      </motion.div>
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-slate-500">
          {EMPLOYMENT_ICONS[profile?.employment] || '❓'} {profile?.employment || 'Not specified'}
        </p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-sm font-bold font-mono" style={{ color: moodColor }}>{profile?.mood || 5}</p>
        <p className="text-xs text-slate-600">mood</p>
      </div>
    </motion.div>
  );
}
