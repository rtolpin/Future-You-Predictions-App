import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Trash2, Eye, Clock } from 'lucide-react';
import { daysClient } from '../../utils/accountClient.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${MONTHS[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

function DayDetailPanel({ day, onClose, onDelete }) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    daysClient.get(day.id).then(setFull).finally(() => setLoading(false));
  }, [day.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>{day.title}</p>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📅 {formatDate(day.date)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button onClick={() => onDelete(day.id)} whileHover={{ scale: 1.1, color: '#f87171' }} whileTap={{ scale: 0.9 }}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <Trash2 size={13} />
          </motion.button>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 18px' }}>
        {loading && <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Loading...</div>}
        {full && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Meta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {full.mood && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,212,177,0.1)', border: '1px solid rgba(0,212,177,0.25)', color: '#00d4b1', fontFamily: 'Space Grotesk', fontWeight: 700 }}>🎭 {full.mood}</span>}
              {full.outfits?.length > 0 && full.outfits.map(o => (
                <span key={o} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontFamily: 'Space Grotesk' }}>{o}</span>
              ))}
            </div>

            {/* Events */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                📋 {full.events?.length || 0} Events
              </p>
              {full.events?.map((evt, i) => {
                const pred = full.predictions?.[evt.id];
                return (
                  <div key={i} style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: pred ? 6 : 0 }}>
                      <span style={{ fontSize: 16 }}>{evt.card?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>{evt.card?.label}</p>
                        <p style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono', marginTop: 1 }}>
                          <Clock size={9} style={{ display: 'inline', marginRight: 3 }} />
                          {String(Math.floor(evt.startMinutes/60)).padStart(2,'0')}:{String(evt.startMinutes%60).padStart(2,'0')} · {evt.durationMinutes}m
                        </p>
                      </div>
                    </div>
                    {pred?.scene && (
                      <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                        {pred.scene.slice(0, 120)}…
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {full.notes && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>📝 Notes</p>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{full.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HistoryCalendar({ onClose }) {
  const today = new Date();
  const [year, setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [days, setDays]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    daysClient.list().then(d => setDays(d.days || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_,i) => i+1));
  while (cells.length % 7 !== 0) cells.push(null);

  const daysByDate = days.reduce((acc, d) => {
    const key = d.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const dateKey = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const handleDelete = async (id) => {
    await daysClient.delete(id);
    setSelected(null);
    load();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#09090f' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,rgba(0,212,177,0.2),rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} color="#00d4b1" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk' }}>Simulation History</h2>
            <p style={{ fontSize: 11, color: '#64748b' }}>{days.length} saved day{days.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.95 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: '#94a3b8', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700 }}>
          <ChevronLeft size={14} /> Back to App
        </motion.button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '20px 24px' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <motion.button onClick={prevMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <ChevronLeft size={16} />
            </motion.button>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk' }}>{MONTHS[month]} {year}</h3>
            <motion.button onClick={nextMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <ChevronRight size={16} />
            </motion.button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS.map(d => <p key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#334155', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</p>)}
          </div>

          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, flex: 1 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const key = dateKey(day);
              const saved = daysByDate[key] || [];
              const isToday = key === todayKey;
              const hasSaved = saved.length > 0;
              return (
                <motion.div
                  key={i}
                  onClick={() => hasSaved && setSelected(saved[0])}
                  whileHover={hasSaved ? { scale: 1.04, y: -2 } : {}}
                  whileTap={hasSaved ? { scale: 0.96 } : {}}
                  style={{
                    borderRadius: 12, padding: '8px 6px',
                    background: hasSaved ? 'rgba(0,212,177,0.1)' : isToday ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: isToday ? '1.5px solid rgba(0,212,177,0.4)' : hasSaved ? '1px solid rgba(0,212,177,0.25)' : '1px solid transparent',
                    cursor: hasSaved ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    minHeight: 60,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: isToday ? '#00d4b1' : hasSaved ? '#e2e8f0' : '#334155', fontFamily: 'Space Grotesk' }}>{day}</span>
                  {hasSaved && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                      {saved.slice(0,2).map(s => (
                        <div key={s.id} style={{ fontSize: 9, color: '#00d4b1', background: 'rgba(0,212,177,0.15)', borderRadius: 4, padding: '1px 4px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                          {s.event_count}e
                        </div>
                      ))}
                      {saved.length > 2 && <div style={{ fontSize: 9, color: '#475569', textAlign: 'center' }}>+{saved.length-2}</div>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {loading && <div style={{ textAlign: 'center', color: '#475569', fontSize: 13, marginTop: 20 }}>Loading history...</div>}
          {!loading && days.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📅</p>
              <p style={{ fontSize: 14, color: '#475569', fontFamily: 'Space Grotesk' }}>No saved days yet.</p>
              <p style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>Save your first day simulation to see it here.</p>
            </div>
          )}
        </div>

        {/* Day detail */}
        <AnimatePresence>
          {selected && (
            <div style={{ width: 340, flexShrink: 0 }}>
              <DayDetailPanel day={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
