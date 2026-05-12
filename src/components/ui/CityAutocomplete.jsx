import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader, X } from 'lucide-react';

export function CityAutocomplete({ value, onChange, accentColor = '#00d4b1', placeholder = 'e.g. Brooklyn, NYC' }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const search = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setResults([]); setOpen(false); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Run two queries in parallel: structured city search + freetext, then merge
        const [r1, r2] = await Promise.all([
          fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1`,
            { headers: { 'Accept-Language': 'en-US,en' } }
          ).then(r => r.json()).catch(() => []),
          fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1&featuretype=city`,
            { headers: { 'Accept-Language': 'en-US,en' } }
          ).then(r => r.json()).catch(() => []),
        ]);

        const seen = new Set();
        const cities = [...r1, ...r2]
          .map(r => {
            const city = r.address?.city || r.address?.town || r.address?.village
              || r.address?.municipality || r.address?.suburb || r.name;
            const state = r.address?.state || r.address?.county || '';
            const country = r.address?.country || '';
            const key = `${city}|${state}|${country}`;
            return { city, state, country, key };
          })
          .filter(r => r.city && !seen.has(r.key) && seen.add(r.key))
          .slice(0, 6);

        setResults(cities);
        setOpen(cities.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 150);
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    setActiveIndex(-1);
    search(q);
  };

  const select = (r) => {
    const parts = [r.city, r.state, r.country].filter(Boolean);
    const label = parts.slice(0, 2).join(', ');
    setQuery(label);
    onChange(label);
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  };

  const clear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); select(results[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', maxWidth: 520 }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <MapPin
          size={15}
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: query ? accentColor : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={e => {
            e.target.style.borderColor = `${accentColor}90`;
            e.target.style.boxShadow = `0 0 0 4px ${accentColor}18`;
            if (results.length > 0) setOpen(true);
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.11)';
            e.target.style.boxShadow = 'none';
          }}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.11)',
            borderRadius: 16,
            color: '#f1f5f9',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 15,
            padding: '16px 44px',
            outline: 'none',
            lineHeight: 1.5,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />

        {/* Right icon: spinner or clear */}
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader size={15} style={{ color: accentColor }} />
            </motion.div>
          ) : query ? (
            <motion.button
              onClick={clear}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{ color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </motion.button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: 16,
              overflow: 'hidden',
              zIndex: 200,
              boxShadow: '0 20px 56px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              transformOrigin: 'top center',
            }}
          >
            {results.map((r, i) => (
              <motion.button
                key={r.key}
                onMouseDown={(e) => { e.preventDefault(); select(r); }}
                whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                className="w-full text-left flex items-center"
                style={{
                  gap: 12,
                  padding: '13px 18px',
                  background: activeIndex === i ? 'rgba(255,255,255,0.07)' : 'transparent',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: `rgba(${hexToRgb(accentColor)}, 0.12)`,
                    border: `1px solid rgba(${hexToRgb(accentColor)}, 0.2)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={13} style={{ color: accentColor }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                    {r.city}
                    {r.state && (
                      <span style={{ fontWeight: 400, color: '#64748b' }}>, {r.state}</span>
                    )}
                  </p>
                  {r.country && (
                    <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{r.country}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}
