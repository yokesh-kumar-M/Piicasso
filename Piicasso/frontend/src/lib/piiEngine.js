/**
 * piiEngine.js — client-side PII detection + crackability scoring.
 *
 * Powers the live demos on the marketing site (Hero stream, LiveDemo password
 * tester, Register password meter, UserDashboard quick-check). Pure JS, no
 * dependencies, no network — designed to feel instant.
 *
 * Ported from the design package (app/pii-engine.jsx) into a project module.
 */

export const PII_PATTERNS = [
  { type: 'EMAIL', label: 'email',  re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, weight: 0.18 },
  { type: 'PHONE', label: 'phone',  re: /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, weight: 0.16 },
  { type: 'SSN',   label: 'ssn',    re: /\b\d{3}-\d{2}-\d{4}\b/g, weight: 0.30 },
  { type: 'CARD',  label: 'card',   re: /\b(?:\d[ -]*?){13,16}\b/g, weight: 0.30 },
  { type: 'DOB',   label: 'dob',    re: /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/g, weight: 0.22 },
  { type: 'IP',    label: 'ip',     re: /\b\d{1,3}(?:\.\d{1,3}){3}\b/g, weight: 0.10 },
  { type: 'ADDR',  label: 'address', re: /\b\d{1,5}\s+[A-Z][a-z]+\s(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Drive|Dr)\b/g, weight: 0.14 },
  { type: 'ZIP',   label: 'zip',    re: /\b\d{5}(?:-\d{4})?\b/g, weight: 0.06 },
  { type: 'NAME',  label: 'name',   re: /\b(?:Mr|Ms|Mrs|Dr)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b|\b[A-Z][a-z]{2,}\s[A-Z][a-z]{2,}\b/g, weight: 0.18 },
];

/** Detect PII entities in `text`. Higher-priority overlaps win. */
export function detectEntities(text) {
  const found = [];
  for (const { type, label, re, weight } of PII_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    let match;
    while ((match = r.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (found.some(f => f.start === start && f.type === type)) continue;
      if (found.some(f => start >= f.start && end <= f.end)) continue;
      found.push({ type, label, weight, start, end, text: match[0] });
    }
  }
  found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const filtered = [];
  for (const f of found) {
    if (filtered.some(g => f.start < g.end && f.end > g.start)) continue;
    filtered.push(f);
  }
  return filtered;
}

/** Split `text` into [{ kind: 'text'|'redact', text, label?, type? }] segments. */
export function redactText(text, entities) {
  if (!entities.length) return [{ kind: 'text', text }];
  const out = [];
  let cursor = 0;
  for (const e of entities) {
    if (cursor < e.start) out.push({ kind: 'text', text: text.slice(cursor, e.start) });
    out.push({ kind: 'redact', text: text.slice(e.start, e.end), label: e.label, type: e.type });
    cursor = e.end;
  }
  if (cursor < text.length) out.push({ kind: 'text', text: text.slice(cursor) });
  return out;
}

/**
 * Score a password against an optional profile. Returns:
 *   { score: 0–100 (higher = stronger), guesses, time, reasons[], rating, entropy }
 */
export function scorePassword(pw, profile = {}) {
  if (!pw) return { score: 0, guesses: 0, time: 'instant', reasons: [], rating: '—', entropy: 0 };

  const len = pw.length;
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const sym = /[^a-zA-Z0-9]/.test(pw);

  let pool = 0;
  if (lower) pool += 26;
  if (upper) pool += 26;
  if (digit) pool += 10;
  if (sym)   pool += 32;

  const entropy = Math.log2(Math.max(pool, 1)) * len;
  const reasons = [];
  let penalty = 0;
  const lowPw = pw.toLowerCase();

  // Profile-based PII matching
  for (const [k, v] of Object.entries(profile)) {
    if (!v || typeof v !== 'string' || v.length < 3) continue;
    const lv = v.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!lv) continue;
    if (lowPw.includes(lv.slice(0, Math.max(3, Math.floor(lv.length * 0.5))))) {
      penalty += 22;
      reasons.push({ kind: 'pii', label: `Contains "${v}" (${k})` });
    }
  }

  // Common tokens
  const commons = ['password', 'qwerty', 'admin', 'welcome', 'letmein', '123456', 'iloveyou', 'sunshine', 'monkey', 'football', 'dragon', 'master', 'summer'];
  for (const c of commons) {
    if (lowPw.includes(c)) { penalty += 25; reasons.push({ kind: 'common', label: `Common token "${c}"` }); break; }
  }
  if (/(.)\1{2,}/.test(pw))   { penalty += 8;  reasons.push({ kind: 'pattern', label: 'Repeated characters' }); }
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf/i.test(pw)) {
    penalty += 12; reasons.push({ kind: 'pattern', label: 'Sequential characters' });
  }
  if (/(19|20)\d{2}$/.test(pw)) { penalty += 14; reasons.push({ kind: 'pattern', label: 'Year suffix detected' }); }

  let lengthBoost = 0;
  if (len >= 12) lengthBoost += 12;
  if (len >= 16) lengthBoost += 8;
  if (sym && upper && digit && lower) lengthBoost += 8;

  const score = Math.max(0, Math.min(100, Math.round(entropy * 1.4 - penalty + lengthBoost)));
  const guesses = Math.pow(2, Math.max(1, entropy - penalty * 0.5));
  const time = humanTime(guesses / 1e10); // 10B guesses/sec
  const rating = score < 25 ? 'Trivially crackable'
              : score < 45 ? 'Weak'
              : score < 65 ? 'Moderate'
              : score < 82 ? 'Strong'
              :              'Excellent';

  return { score, guesses, time, reasons, rating, entropy: Math.round(entropy) };
}

export function humanTime(seconds) {
  if (!isFinite(seconds) || seconds < 1) return 'instant';
  const units = [[60, 'second'], [60, 'minute'], [24, 'hour'], [365, 'day'], [100, 'year'], [1e6, 'century']];
  let val = seconds;
  let name = 'second';
  for (const [div, n] of units) {
    if (val < div) { name = n; break; }
    val /= div;
    name = n;
  }
  if (val > 1e6) return '>1M centuries';
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${name}${val >= 2 ? 's' : ''}`;
}

/** Generate up to `limit` candidate passwords from a profile. */
export function generateWordlist(profile, limit = 40) {
  const tokens = Object.values(profile).filter(v => typeof v === 'string' && v.length >= 2);
  const years = ['2024', '2025', '1998', '1999', '2000', '2001'];
  const symbols = ['', '!', '@', '#', '123', '1!'];
  const out = new Set();

  for (const t of tokens) {
    const base = t.replace(/[^a-zA-Z0-9]/g, '');
    if (!base) continue;
    out.add(base);
    out.add(base.toLowerCase());
    out.add(base[0].toUpperCase() + base.slice(1).toLowerCase());
    for (const y of years) out.add(base + y);
    for (const s of symbols) {
      out.add(base + s);
      out.add(base.toLowerCase() + s);
    }
    out.add(base.toLowerCase().replace(/a/g, '@').replace(/e/g, '3').replace(/i/g, '1').replace(/o/g, '0'));
  }
  if (tokens.length >= 2) {
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i === j) continue;
        const a = tokens[i].replace(/[^a-zA-Z0-9]/g, '');
        const b = tokens[j].replace(/[^a-zA-Z0-9]/g, '');
        if (a && b) out.add(a + b);
      }
    }
  }
  return Array.from(out).slice(0, limit);
}
