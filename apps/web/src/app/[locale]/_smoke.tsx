'use client';

import React from 'react';
import {
  Avatar,
  Button,
  GlassCard,
  GlassInput,
  GlassSelect,
  KpiCard,
  Modal,
  SegmentedControl,
  StatusBadge,
  Toast,
  MatchRow,
  RankingRow,
  MiniLineChart,
  ActivityItem,
  ChallengeCard,
  type BadgeStatus,
  type ToastItem,
} from '@tennisillo/ui';
import type {
  Player,
  UpcomingMatch,
  RecentMatch,
  Challenge,
  ActivityFeedItem,
} from '@tennisillo/shared-types';

const BG: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a1628 0%, #0d2818 100%)',
  padding: 32,
  fontFamily: 'Inter, system-ui, sans-serif',
};

const SECTION_LABEL: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: 11,
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <p style={SECTION_LABEL}>{title}</p>
      {children}
    </section>
  );
}

const CURRENT_PLAYER: Player = { id: 'fp', name: 'Fabio Pini',    initials: 'FP', hue: '30',  level: 3, points: 1980, ranking: 5, variation: -8,  winRate: 61, matches: 26, wins: 16, losses: 10 };
const P_LC: Player            = { id: 'lc', name: 'Luca Conti',    initials: 'LC', hue: '210', level: 4, points: 2840, ranking: 1, variation: 45,  winRate: 78, matches: 32, wins: 25, losses: 7  };
const P_AB: Player            = { id: 'ab', name: 'Andrea Belli',  initials: 'AB', hue: '320', level: 4, points: 2610, ranking: 2, variation: -20, winRate: 72, matches: 28, wins: 20, losses: 8  };
const P_MR: Player            = { id: 'mr', name: 'Marco Russo',   initials: 'MR', hue: '142', level: 3, points: 2420, ranking: 3, variation: 0,   winRate: 68, matches: 35, wins: 24, losses: 11 };
const P_GT: Player            = { id: 'gt', name: 'Giorgio Testa', initials: 'GT', hue: '60',  level: 3, points: 2190, ranking: 4, variation: 12,  winRate: 65, matches: 30, wins: 19, losses: 11 };

const UPCOMING_MATCHES: Array<{ match: UpcomingMatch; opponent: Player }> = [
  { match: { id: 'um1', date: '28', month: 'APR', opponentId: 'lc', status: 'confirmed', time: '10:00', venue: 'Tennis Club Milano — Campo 3' }, opponent: P_LC },
  { match: { id: 'um2', date: '03', month: 'MAG', opponentId: 'ab', status: 'pending',   time: '10:00', venue: 'Club Parioli — Campo 1'         }, opponent: P_AB },
];

const RECENT_MATCHES: Array<{ match: RecentMatch; opponent: Player }> = [
  { match: { id: 'rm1', date: '20 Apr 2026', opponentId: 'gt', score: '6-4 6-2', result: 'win'  }, opponent: P_GT },
  { match: { id: 'rm2', date: '14 Apr 2026', opponentId: 'mr', score: '3-6 4-6', result: 'loss' }, opponent: P_MR },
];

const RANKING: Player[] = [P_LC, P_AB, P_MR, P_GT, CURRENT_PLAYER];

const CHART_DATA = [1420, 1395, 1450, 1480, 1465, 1510, 1535, 1520, 1560, 1590];

const ACTIVITIES: ActivityFeedItem[] = [
  { id: 'a1', type: 'match',        text: 'Partita con Luca Conti confermata per il 28 Aprile',         time: '2 min fa'    },
  { id: 'a2', type: 'ranking',      text: 'Hai scalato 3 posizioni in classifica dopo la vittoria',     time: '1 ora fa'    },
  { id: 'a3', type: 'challenge',    text: 'Andrea Belli ti ha sfidato per il 5 Maggio',                 time: '3 ore fa'    },
  { id: 'a4', type: 'availability', text: 'Disponibilità aggiornata per la settimana prossima',         time: 'Ieri'        },
  { id: 'a5', type: 'badge',        text: 'Nuovo badge sbloccato: "Imbattibile" — 5 vittorie di fila',  time: '2 giorni fa' },
];

const CHALLENGES: Array<{ challenge: Challenge; challenger: Player }> = [
  { challenge: { id: 'c1', fromId: 'lc', proposedDate: '5 Maggio' }, challenger: P_LC },
  { challenge: { id: 'c2', fromId: 'gt', proposedDate: '8 Maggio' }, challenger: P_GT },
];

export function SmokePage() {
  const [inputVal, setInputVal] = React.useState('');
  const [selectVal, setSelectVal] = React.useState('singolo');
  const [segment, setSegment] = React.useState('Tutti');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastItem[]>([
    { id: 1, message: 'Partita confermata con Luca Conti!', tone: 'success' },
    { id: 2, message: 'Sfida in attesa di risposta.',        tone: 'info' },
    { id: 3, message: 'Rating aggiornato: +35 punti.',       tone: 'warning' },
  ]);

  const statuses: BadgeStatus[] = ['confirmed', 'pending', 'completed', 'cancelled', 'disputed', 'win', 'loss', 'training'];

  return (
    <div style={BG}>
      <h2 style={{ color: '#B9FF5A', marginBottom: 32, fontSize: 20, fontWeight: 700 }}>
        Smoke Test — Design System Tennisillo
      </h2>

      <Section title="Avatar">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar initials="MR" hue="142" size={48} />
          <Avatar initials="LC" hue="210" size={48} />
          <Avatar initials="AB" hue="320" size={36} />
          <Avatar initials="GT" hue="60"  size={36} />
          <Avatar initials="FP" hue="30"  size={28} />
        </div>
      </Section>

      <Section title="Button">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="primary">Conferma partita</Button>
          <Button variant="secondary">Annulla</Button>
          <Button variant="danger">Elimina account</Button>
          <Button variant="primary"   size="sm">Sm primary</Button>
          <Button variant="secondary" size="sm">Sm secondary</Button>
          <Button variant="danger"    size="sm">Sm danger</Button>
        </div>
      </Section>

      <Section title="StatusBadge">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {statuses.map((s) => <StatusBadge key={s} status={s} />)}
        </div>
      </Section>

      <Section title="GlassCard + KpiCard">
        <GlassCard style={{ padding: '24px', maxWidth: 520 }} hover>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16, fontSize: 13 }}>
            GlassCard con hover abilitato
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <KpiCard icon="🏆" label="Vittorie"  value={12}   delta="+2"  positive />
            <KpiCard icon="📊" label="Rating"    value={1590} delta="+35" positive />
            <KpiCard icon="📉" label="Sconfitte" value={4}    delta="+1"  positive={false} />
          </div>
        </GlassCard>
      </Section>

      <Section title="Input / Select">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <GlassInput label="Nome giocatore" value={inputVal} onChange={setInputVal} placeholder="es. Marco Rossi" />
          <GlassSelect
            label="Tipo partita"
            value={selectVal}
            onChange={setSelectVal}
            options={['singolo', 'doppio', 'sparring']}
          />
        </div>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl options={['Tutti', 'Vinte', 'Perse']} value={segment} onChange={setSegment} />
      </Section>

      <Section title="Modal">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Apri Modal</Button>
        {modalOpen && (
          <Modal title="Conferma partita" onClose={() => setModalOpen(false)}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 20 }}>
              Sei sicuro di voler confermare la partita con Luca Conti per il 28 Aprile?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Annulla</Button>
              <Button variant="primary"   size="sm" onClick={() => setModalOpen(false)}>Conferma</Button>
            </div>
          </Modal>
        )}
      </Section>

      <Section title="MatchRow — Prossime partite">
        <GlassCard style={{ padding: '8px 16px', maxWidth: 560 }}>
          {UPCOMING_MATCHES.map(({ match, opponent }, i) => (
            <MatchRow
              key={i}
              match={match}
              currentPlayer={CURRENT_PLAYER}
              opponent={opponent}
              showVenue
            />
          ))}
        </GlassCard>
      </Section>

      <Section title="MatchRow — Partite recenti">
        <GlassCard style={{ padding: '8px 16px', maxWidth: 560 }}>
          {RECENT_MATCHES.map(({ match, opponent }, i) => (
            <MatchRow
              key={i}
              match={match}
              currentPlayer={CURRENT_PLAYER}
              opponent={opponent}
            />
          ))}
        </GlassCard>
      </Section>

      <Section title="RankingRow">
        <GlassCard style={{ padding: '8px', maxWidth: 680 }}>
          {RANKING.map((p) => (
            <RankingRow
              key={p.ranking}
              player={p}
              isCurrentPlayer={p.ranking === 5}
              onClick={() => {}}
            />
          ))}
        </GlassCard>
      </Section>

      <Section title="MiniLineChart — Andamento rating">
        <GlassCard style={{ padding: '20px 24px', display: 'inline-block' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Rating ultimi 10 match</div>
          <MiniLineChart data={CHART_DATA} width={300} height={80} />
        </GlassCard>
      </Section>

      <Section title="ActivityItem">
        <GlassCard style={{ padding: '4px 16px', maxWidth: 480 }}>
          {ACTIVITIES.map((a) => <ActivityItem key={a.id} item={a} />)}
        </GlassCard>
      </Section>

      <Section title="ChallengeCard">
        <div style={{ maxWidth: 400 }}>
          {CHALLENGES.map(({ challenge, challenger }, i) => (
            <ChallengeCard
              key={i}
              challenge={challenge}
              challenger={challenger}
              onAccept={() => alert(`Accettata sfida di ${challenger.name}`)}
              onReject={() => alert(`Rifiutata sfida di ${challenger.name}`)}
            />
          ))}
        </div>
      </Section>

      <Toast toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
