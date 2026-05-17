import React, { useState, useMemo } from 'react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import {
  ShieldCheck,
  KeyRound,
  Eye,
  Lock,
  Globe2,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

const TOPICS = [
  {
    id: 'pii-basics',
    icon: Eye,
    eyebrow: 'PII 101',
    title: 'What counts as personal data?',
    summary: 'Names, birthdays, pet names, location — even your favourite team is PII when paired with a password.',
    body: [
      {
        h: 'Direct vs derivable identifiers',
        p: 'Direct identifiers (full name, email, phone) point at one person. Derivable identifiers (birth year, city, employer) become identifying when combined. Attackers chain a handful of weak hints together to narrow down a target.',
      },
      {
        h: 'Why PIIcasso models this',
        p: 'The generator builds wordlists from the same hints a human attacker would scrape from social media. If your password contains any of those tokens, the engine surfaces it as a candidate before any heavy compute hits the lock.',
      },
      {
        h: 'Practical hygiene',
        p: 'Audit anything public — pet names, birth years, sports teams, partner names — and assume any of it could end up in a wordlist tomorrow. Rotate passwords that lean on those tokens, even partially.',
      },
    ],
  },
  {
    id: 'password-resilience',
    icon: KeyRound,
    eyebrow: 'Password Resilience',
    title: 'How crack-time is actually estimated',
    summary: 'Length and entropy matter more than special characters. A 16-char passphrase beats P@ssw0rd! every day of the week.',
    body: [
      {
        h: 'Entropy in plain English',
        p: 'Entropy measures how surprising a password is to a computer. Every additional random character roughly doubles the search space; predictable substitutions barely shift the needle.',
      },
      {
        h: 'Why dictionary attacks dominate',
        p: 'Modern GPUs try billions of guesses per second, but they don\'t guess at random — they replay the most common patterns first. Anything in a leak corpus is tested before brute force even starts.',
      },
      {
        h: 'The 16/4 rule of thumb',
        p: 'Aim for at least 16 characters across at least four character classes, or a 5-word passphrase. Anything shorter falls inside the easy zone of mainstream cracking tools.',
      },
    ],
  },
  {
    id: 'breach-monitoring',
    icon: Globe2,
    eyebrow: 'Leak Monitoring',
    title: 'Reading a Have I Been Pwned hit',
    summary: 'A breach hit means the credential pair exists in a public dump — not that someone is mid-attack on you.',
    body: [
      {
        h: 'How k-anonymity works',
        p: 'Your password is hashed locally and only the first five hex characters travel to the HIBP API. The server returns every hash that shares the prefix; the comparison happens in your browser.',
      },
      {
        h: 'What to do after a hit',
        p: 'Treat any non-zero match as compromised. Rotate the password on every site that used it (or a close variant), and turn on 2FA where available — it neutralises most credential-stuffing attempts.',
      },
      {
        h: 'False positives',
        p: 'You will occasionally see counts on short, generic passwords like "summer2024". That doesn\'t target you personally, but it confirms that string is in attackers\' first-pass dictionary.',
      },
    ],
  },
  {
    id: 'workflow',
    icon: ShieldCheck,
    eyebrow: 'PIIcasso Workflow',
    title: 'How the engine thinks about cracking',
    summary: 'Seed → permute → score → rank. Each stage filters down a target-specific wordlist before any heavy compute runs.',
    body: [
      {
        h: '1. Seed extraction',
        p: 'The PII you submit (or that a target leaks publicly) gets tokenised into base seeds: names, dates, locations, hobbies. Each seed carries a confidence score based on how identifying it is.',
      },
      {
        h: '2. Permutation',
        p: 'Seeds expand through deterministic rules: leetspeak swaps, date appendices, capitalisation, common suffixes. Each permutation is tagged with the rule it came from, so you can reason about its provenance.',
      },
      {
        h: '3. Scoring & ranking',
        p: 'Candidates are scored against a relevance heuristic plus a reference corpus (RockYou + breach lists). High-score candidates sort to the top so a downstream cracker hits them first.',
      },
    ],
  },
  {
    id: 'storage',
    icon: Lock,
    eyebrow: 'Data Handling',
    title: 'Where your PII actually lives',
    summary: 'Submitted PII is encrypted at rest with Fernet keys. Wordlists are stored separately and aged out per retention policy.',
    body: [
      {
        h: 'Encryption at rest',
        p: 'Every PII record is wrapped with a Fernet key before it touches the database. The plaintext only exists in memory during generation; the DB column always holds ciphertext.',
      },
      {
        h: 'Retention windows',
        p: 'Generated wordlists expire on a configurable retention window (default 30 days). Old payloads are purged on schedule so you don\'t accumulate dormant target data.',
      },
      {
        h: 'Operator visibility',
        p: 'Even admins only see masked field names ("***") in history exports — never raw PII. Reports rebuild on demand from the encrypted source.',
      },
    ],
  },
];

const LearnPage = () => {
  const [activeId, setActiveId] = useState(TOPICS[0].id);
  const active = useMemo(
    () => TOPICS.find((t) => t.id === activeId) || TOPICS[0],
    [activeId],
  );
  const Icon = active.icon;

  return (
    <DesignAppShell activeKey="learn">
      <div style={{ paddingTop: 12, paddingBottom: 80, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ color: 'var(--accent-500)' }}>● LEARNING HUB</div>
          <h1 className="h-display" style={{ fontSize: 38, marginTop: 4, color: 'var(--fg-0)' }}>
            Sharpen your defence.
          </h1>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 6, maxWidth: 640 }}>
            Short, opinionated reads on the same problems PIIcasso solves under the hood. Pick a topic to dive in.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 1fr',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          <aside
            className="card"
            style={{
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              position: 'sticky',
              top: 88,
            }}
          >
            <div
              className="eyebrow"
              style={{ padding: '4px 10px', color: 'var(--fg-3)', marginBottom: 4 }}
            >
              Topics
            </div>
            {TOPICS.map((topic) => {
              const Active = topic.icon;
              const isActive = topic.id === activeId;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveId(topic.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive ? 'var(--ink-3)' : 'transparent',
                    color: isActive ? 'var(--fg-0)' : 'var(--fg-2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    transition: 'background 0.15s',
                  }}
                >
                  <Active
                    size={16}
                    color={isActive ? 'var(--accent-500)' : 'var(--fg-3)'}
                  />
                  <span style={{ flex: 1, lineHeight: 1.2 }}>{topic.title}</span>
                  {isActive && (
                    <ChevronRight size={14} color="var(--accent-500)" />
                  )}
                </button>
              );
            })}
          </aside>

          <article
            className="card"
            style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'color-mix(in oklab, var(--accent-500) 12%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={22} color="var(--accent-500)" />
              </div>
              <div>
                <div className="eyebrow" style={{ color: 'var(--accent-500)' }}>
                  ● {active.eyebrow}
                </div>
                <h2
                  className="h-display"
                  style={{ fontSize: 26, marginTop: 2, color: 'var(--fg-0)' }}
                >
                  {active.title}
                </h2>
              </div>
            </div>

            <p
              style={{
                color: 'var(--fg-2)',
                fontSize: 15,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {active.summary}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                borderTop: '1px solid var(--ink-4)',
                paddingTop: 20,
              }}
            >
              {active.body.map((section, i) => (
                <div key={i}>
                  <h3
                    style={{
                      color: 'var(--fg-0)',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 6,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {section.h}
                  </h3>
                  <p
                    style={{
                      color: 'var(--fg-2)',
                      fontSize: 14,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {section.p}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--ink-2)',
                border: '1px solid var(--ink-4)',
              }}
            >
              <BookOpen size={16} color="var(--accent-500)" />
              <span
                style={{
                  color: 'var(--fg-3)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                More chapters land monthly — bookmark and come back.
              </span>
            </div>
          </article>
        </div>
      </div>
    </DesignAppShell>
  );
};

export default LearnPage;
