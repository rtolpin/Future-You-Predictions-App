import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, X, Sparkles } from 'lucide-react';
import { decisionCards, CARD_CATEGORIES, CATEGORY_META } from '../../data/decisionCards.js';
import { DecisionCard } from './DecisionCard.jsx';

const CATEGORY_ORDER = [
  CARD_CATEGORIES.FOOD,
  CARD_CATEGORIES.PERSONAL,
  CARD_CATEGORIES.CHORES,
  CARD_CATEGORIES.LOCATION,
  CARD_CATEGORIES.ACTIVITY,
  CARD_CATEGORIES.TRANSPORT,
  CARD_CATEGORIES.STUDY,
  CARD_CATEGORIES.FITNESS,
];

const CUSTOM_STORAGE_KEY = 'future-you-custom-cards';

function loadCustomCards() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveCustomCards(cards) {
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(cards));
}

function scoreCard(card, rawQuery) {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return 0;
  const label = card.label.toLowerCase();
  const desc  = card.description.toLowerCase();

  if (label === q)           return 100;
  if (label.startsWith(q))   return 85;
  if (label.includes(q))     return 70;
  if (desc.includes(q))      return 50;

  // Multi-word matching: score proportional to how many query words hit the label/desc
  const qWords = q.split(/\s+/).filter(w => w.length >= 2);
  if (qWords.length > 0) {
    let hits = 0;
    for (const w of qWords) {
      if (label.includes(w))      hits += 2;
      else if (desc.includes(w))  hits += 1;
    }
    if (hits > 0) return Math.min(20 + hits * 12, 65);
  }

  // Individual label-word prefix matching (e.g. "brea" → "Eat Breakfast")
  if (q.length >= 3) {
    for (const lw of label.split(/\s+/)) {
      if (lw.startsWith(q)) return 42;
    }
  }

  return 0;
}

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

const ACCENT = '#00d4b1';
const ACCENT_RGB = '0,212,177';

export function CardLibrary() {
  const [expanded, setExpanded] = useState(
    Object.fromEntries([...CATEGORY_ORDER, CARD_CATEGORIES.CUSTOM].map(c => [c, true]))
  );
  const [query, setQuery]           = useState('');
  const [customInput, setCustomInput] = useState('');
  const [customCards, setCustomCards] = useState(loadCustomCards);

  const toggle = useCallback((cat) => setExpanded(e => ({ ...e, [cat]: !e[cat] })), []);

  const allCards = useMemo(() => [...decisionCards, ...customCards], [customCards]);

  // Scored + sorted search results; null when not searching
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return allCards
      .map(card => ({ card, score: scoreCard(card, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ card, score }) => ({ card, strong: score >= 60 }));
  }, [query, allCards]);

  const addCustomCard = useCallback(() => {
    const label = customInput.trim();
    if (!label) return;
    const card = {
      id: `custom-${Date.now()}`,
      category: CARD_CATEGORIES.CUSTOM,
      icon: '⭐',
      label,
      description: 'My custom event',
    };
    const updated = [...customCards, card];
    setCustomCards(updated);
    saveCustomCards(updated);
    setCustomInput('');
  }, [customInput, customCards]);

  const removeCustomCard = useCallback((id) => {
    const updated = customCards.filter(c => c.id !== id);
    setCustomCards(updated);
    saveCustomCards(updated);
  }, [customCards]);

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') addCustomCard();
  };

  const strongMatches = searchResults?.filter(r => r.strong)  ?? [];
  const closeMatches  = searchResults?.filter(r => !r.strong) ?? [];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div style={{ padding: '10px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: query ? ACCENT : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events…"
            style={{
              width: '100%',
              background: query ? `rgba(${ACCENT_RGB},0.07)` : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${query ? `rgba(${ACCENT_RGB},0.45)` : 'rgba(255,255,255,0.09)'}`,
              borderRadius: 10,
              color: '#f1f5f9',
              fontFamily: 'DM Sans',
              fontSize: 13,
              padding: '8px 32px 8px 30px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = `rgba(${ACCENT_RGB},0.6)`; e.target.style.boxShadow = `0 0 0 2px rgba(${ACCENT_RGB},0.1)`; }}
            onBlur={e => { e.target.style.borderColor = query ? `rgba(${ACCENT_RGB},0.45)` : 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '2px 4px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 8 }}>

        {/* ── SEARCH RESULTS ── */}
        {searchResults !== null ? (
          <div style={{ padding: '10px 10px 4px' }}>
            {searchResults.length === 0 && (
              <div style={{ padding: '24px 10px', textAlign: 'center' }}>
                <p style={{ color: '#475569', fontSize: 13, fontFamily: 'DM Sans' }}>No matches found.</p>
                <p style={{ color: '#334155', fontSize: 12, marginTop: 6, fontFamily: 'DM Sans' }}>Try the custom event creator below ↓</p>
              </div>
            )}

            {/* Strong matches */}
            {strongMatches.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 6px 8px' }}>
                  Best matches
                </p>
                {strongMatches.map(({ card }) => (
                  <div key={card.id} style={{ position: 'relative', marginBottom: 6 }}>
                    <DecisionCard card={card} compact />
                    {card.category === CARD_CATEGORIES.CUSTOM && (
                      <DeleteBtn onDelete={() => removeCustomCard(card.id)} />
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Close matches */}
            {closeMatches.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em', padding: `${strongMatches.length > 0 ? '12px' : '4px'} 6px 8px` }}>
                  Close matches
                </p>
                {closeMatches.map(({ card }) => (
                  <div key={card.id} style={{ position: 'relative', marginBottom: 6, opacity: 0.75 }}>
                    <DecisionCard card={card} compact />
                    {card.category === CARD_CATEGORIES.CUSTOM && (
                      <DeleteBtn onDelete={() => removeCustomCard(card.id)} />
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Suggest custom creation when no strong match */}
            {strongMatches.length === 0 && searchResults.length > 0 && (
              <div style={{ margin: '10px 6px 4px', padding: '10px 12px', borderRadius: 10, background: 'rgba(232,121,249,0.07)', border: '1px solid rgba(232,121,249,0.2)' }}>
                <p style={{ fontSize: 11, color: '#e879f9', fontFamily: 'Space Grotesk', fontWeight: 600 }}>Not quite right?</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontFamily: 'DM Sans' }}>Create a custom event with your exact label using the form below.</p>
              </div>
            )}

            {/* Always show custom creator while searching */}
            <div style={{ marginTop: 16 }}>
              <CustomCreator value={customInput} onChange={setCustomInput} onSubmit={addCustomCard} onKeyDown={handleCustomKeyDown} />
            </div>
          </div>

        ) : (
          /* ── NORMAL CATEGORY VIEW ── */
          <>
            {/* Custom cards section (shown when any exist) */}
            {customCards.length > 0 && (
              <CategorySection
                category={CARD_CATEGORIES.CUSTOM}
                cards={customCards}
                isOpen={expanded[CARD_CATEGORIES.CUSTOM]}
                onToggle={() => toggle(CARD_CATEGORIES.CUSTOM)}
                renderCard={(card) => (
                  <div key={card.id} style={{ position: 'relative', marginBottom: 6 }}>
                    <DecisionCard card={card} compact />
                    <DeleteBtn onDelete={() => removeCustomCard(card.id)} />
                  </div>
                )}
              />
            )}

            {/* Standard categories */}
            {CATEGORY_ORDER.map(category => {
              const cards = decisionCards.filter(c => c.category === category);
              return (
                <CategorySection
                  key={category}
                  category={category}
                  cards={cards}
                  isOpen={expanded[category]}
                  onToggle={() => toggle(category)}
                  renderCard={(card) => (
                    <motion.div key={card.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 6 }}>
                      <DecisionCard card={card} compact />
                    </motion.div>
                  )}
                />
              );
            })}

            {/* Custom event creator — always at bottom */}
            <div style={{ padding: '10px 10px 4px' }}>
              <CustomCreator value={customInput} onChange={setCustomInput} onSubmit={addCustomCard} onKeyDown={handleCustomKeyDown} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategorySection({ category, cards, isOpen, onToggle, renderCard }) {
  const meta = CATEGORY_META[category];
  const rgb  = hexToRgb(meta.color);

  return (
    <div style={{ marginBottom: 2 }}>
      <motion.button
        onClick={onToggle}
        whileHover={{ background: 'rgba(255,255,255,0.04)' }}
        className="w-full flex items-center justify-between transition-all cursor-pointer"
        style={{ padding: '10px 20px' }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
          <span className="font-semibold" style={{ color: meta.color, fontSize: 12 }}>{meta.label}</span>
          <span className="font-mono rounded" style={{ background: `rgba(${rgb},0.12)`, color: meta.color, fontSize: 10, padding: '2px 6px' }}>
            {cards.length}
          </span>
        </div>
        <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} color={meta.color} style={{ opacity: 0.7 }} />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div style={{ padding: '2px 10px 10px' }}>
              {cards.map(card => renderCard(card))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ margin: '0 16px', height: 1, background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

function CustomCreator({ value, onChange, onSubmit, onKeyDown }) {
  const FUCHSIA = '#e879f9';
  const FUCHSIA_RGB = '232,121,249';
  const canSubmit = value.trim().length > 0;

  return (
    <div style={{ borderRadius: 12, background: 'rgba(232,121,249,0.06)', border: '1px solid rgba(232,121,249,0.18)', padding: '12px 12px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
        <Sparkles size={12} color={FUCHSIA} />
        <span style={{ fontSize: 11, fontWeight: 700, color: FUCHSIA, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Custom Event
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. Doctor's appointment…"
          maxLength={48}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(232,121,249,0.25)',
            borderRadius: 9,
            color: '#f1f5f9',
            fontFamily: 'DM Sans',
            fontSize: 13,
            padding: '8px 12px',
            outline: 'none',
            transition: 'border-color 0.2s',
            minWidth: 0,
          }}
          onFocus={e => { e.target.style.borderColor = `rgba(${FUCHSIA_RGB},0.6)`; e.target.style.boxShadow = `0 0 0 2px rgba(${FUCHSIA_RGB},0.1)`; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(232,121,249,0.25)'; e.target.style.boxShadow = 'none'; }}
        />
        <motion.button
          onClick={onSubmit}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.06, boxShadow: `0 0 14px rgba(${FUCHSIA_RGB},0.4)` } : {}}
          whileTap={canSubmit ? { scale: 0.94 } : {}}
          style={{
            width: 34, height: 34, borderRadius: 9, border: 'none', flexShrink: 0,
            background: canSubmit ? `rgba(${FUCHSIA_RGB},0.2)` : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${canSubmit ? `rgba(${FUCHSIA_RGB},0.5)` : 'rgba(255,255,255,0.08)'}`,
            color: canSubmit ? FUCHSIA : '#334155',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Plus size={15} />
        </motion.button>
      </div>

      <p style={{ fontSize: 10, color: '#334155', fontFamily: 'DM Sans', marginTop: 7 }}>
        Press Enter or + to add · drag it onto the timeline
      </p>
    </div>
  );
}

function DeleteBtn({ onDelete }) {
  return (
    <button
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onDelete(); }}
      title="Remove"
      style={{
        position: 'absolute', top: 4, right: 4,
        width: 18, height: 18, borderRadius: 5,
        background: 'rgba(248,113,113,0.15)',
        border: '1px solid rgba(248,113,113,0.3)',
        color: '#f87171',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
    >
      <X size={10} />
    </button>
  );
}
