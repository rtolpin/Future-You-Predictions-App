import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Edit3, Mail, MapPin, Briefcase, Calendar, Target, Sparkles, User, Shield } from 'lucide-react';

const GENDER_AVATARS = { Man: '👨', Woman: '👩', 'Non-binary': '🧑', default: '🧑' };
const MOOD_COLORS   = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#818cf8','#c084fc','#e879f9'];

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#64748b' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 14, color: '#e2e8f0', fontFamily: 'DM Sans', fontWeight: 500, wordBreak: 'break-word' }}>{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ color: '#00d4b1' }}>{icon}</div>
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00d4b1' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function UserProfilePage({ profile, account, goals = [], onClose, onEditProfile, onLogout }) {
  const avatar     = GENDER_AVATARS[profile?.genderIdentity] || GENDER_AVATARS.default;
  const moodColor  = MOOD_COLORS[(profile?.mood || 5) - 1];
  const moodLevel  = profile?.mood || 5;
  const memberSince = account?.created_at
    ? new Date(account.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #0d0d1a 0%, #09090f 100%)', border: '1.5px solid rgba(0,212,177,0.25)', borderRadius: 24, boxShadow: '0 0 60px rgba(0,212,177,0.12), 0 32px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}
      >
        {/* ── Hero header ── */}
        <div style={{ position: 'relative', padding: '32px 28px 24px', background: `linear-gradient(135deg, rgba(0,212,177,0.1), rgba(167,139,250,0.07))`, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
          >
            <X size={15} />
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            {/* Big avatar */}
            <motion.div
              animate={{ boxShadow: [`0 0 0 0 ${moodColor}50`, `0 0 24px 6px ${moodColor}30`, `0 0 0 0 ${moodColor}50`] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${moodColor}25, ${moodColor}10)`, border: `2.5px solid ${moodColor}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0 }}
            >
              {avatar}
            </motion.div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,212,177,0.7)', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
                {account ? '✦ Signed In' : '✦ Guest'}
              </p>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 26, color: '#f1f5f9', lineHeight: 1.15, marginBottom: 4 }}>
                {profile?.name || account?.name || 'Your Profile'}
              </h2>
              {account?.email && (
                <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={12} /> {account.email}
                </p>
              )}
            </div>

            {/* Mood badge */}
            <div style={{ flexShrink: 0, textAlign: 'center', padding: '8px 14px', borderRadius: 12, background: `rgba(${moodColor.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',')},0.15)`, border: `1px solid ${moodColor}40` }}>
              <p style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 22, color: moodColor, lineHeight: 1 }}>{moodLevel}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: moodColor, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>Mood</p>
            </div>
          </div>

          {memberSince && (
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Calendar size={11} color="#475569" />
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Space Grotesk' }}>Member since {memberSince}</span>
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Personal Details */}
          {profile && (
            <Section title="Personal Details" icon={<User size={14} />}>
              <InfoRow icon={<MapPin size={14} />} label="Location" value={profile.city} />
              <InfoRow icon={<Briefcase size={14} />} label="Employment" value={profile.employment} />
              <InfoRow icon={<User size={14} />} label="Gender Identity" value={profile.genderIdentity} />
              <InfoRow icon={<Calendar size={14} />} label="Age Range" value={profile.ageRange} />
              {profile.age && <InfoRow icon={<Calendar size={14} />} label="Age" value={`${profile.age} years old`} />}
              {profile.appearance && <InfoRow icon={<Sparkles size={14} />} label="Appearance" value={profile.appearance} />}
            </Section>
          )}

          {/* Goals summary */}
          {goals.length > 0 && (
            <Section title="Today's Goals" icon={<Target size={14} />}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {goals.map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: g.type === 'build' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${g.type === 'build' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                    <span style={{ fontSize: 13 }}>{g.emoji}</span>
                    <span style={{ fontSize: 12, fontFamily: 'DM Sans', color: g.type === 'build' ? '#6ee7b7' : '#fca5a5', fontWeight: 500 }}>{g.text}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Account */}
          {account && (
            <Section title="Account" icon={<Shield size={14} />}>
              <InfoRow icon={<Mail size={14} />} label="Email" value={account.email} />
              {account.name && <InfoRow icon={<User size={14} />} label="Display Name" value={account.name} />}
            </Section>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 }}>
          <motion.button
            onClick={onEditProfile}
            whileHover={{ scale: 1.02, boxShadow: '0 0 16px rgba(0,212,177,0.3)' }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,212,177,0.2), rgba(0,212,177,0.1))', border: '1.5px solid rgba(0,212,177,0.45)', color: '#00d4b1', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
          >
            <Edit3 size={15} /> Edit Profile
          </motion.button>

          {account && (
            <motion.button
              onClick={onLogout}
              whileHover={{ scale: 1.02, background: 'rgba(248,113,113,0.18)', boxShadow: '0 0 14px rgba(248,113,113,0.25)' }}
              whileTap={{ scale: 0.97 }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              <LogOut size={15} /> Sign Out
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
