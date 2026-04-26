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
  type MatchData,
  type RankingPlayer,
  type ActivityData,
  type ChallengeData,
} from '@tennisillo/ui';

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

const UPCOMING_MATCHES: MatchData[] = [
  {
    date: '28',
    month: 'APR',
    status: 'confirmed',
    venue: 'Tennis Club Milano — Campo 3',
    opponentInitials: 'LC',
    opponentHue: '210',
    opponentName: 'Luca Conti',
  },
  {
    date: '03',
    month: 'MAG',
    status: 'pending',
    venue: 'Club Parioli — Campo 1',
    opponentInitials: 'AB',
    opponentHue: '320',
    opponentName: 'Andrea Belli',
  },
];

const RECENT_MATCHES: MatchData[] = [
  {
    date: '20 Apr',
    score: '6-4 6-2',
    result: 'win',
    opponentInitials: 'GT',
    opponentHue: '60',
    opponentName: 'Giorgio Testa',
  },
  {
    date: '14 Apr',
    score: '3-6 4-6',
    result: 'loss',
    opponentInitials: 'MR',
    opponentHue: '142',
    opponentName: 'Marco Russo',
  },
];

const RANKING: RankingPlayer[] = [
  { ranking: 1, initials: 'LC', hue: '210', name: 'Luca Conti',   level: 4, points: 2840, variation: 45,  winRate: 78, matches: 32 },
  { ranking: 2, initials: 'AB', hue: '320', name: 'Andrea Belli', level: 4, points: 2610, variation: -20, winRate: 72, matches: 28 },
  { ranking: 3, initials: 'MR', hue: '142', name: 'Marco Russo',  level: 3, points: 2420, variation: 0,   winRate: 68, matches: 35 },
  { ranking: 4, initials: 'GT', hue: '60',  name: 'Giorgio Testa',level: 3, points: 2190, variation: 12,  winRate: 65, matches: 30 },
  { ranking: 5, initials: 'FP', hue: '30',  name: 'Fabio Pini',   level: 3, points: 1980, variation: -8,  winRate: 61, matches: 26 },
];

const CHART_DATA = [1420, 1395, 1450, 1480, 1465, 1510, 1535, 1520, 1560, 1590];

const ACTIVITIES: ActivityData[] = [
  { type: 'match',        text: 'Partita con Luca Conti confermata per il 28 Aprile',  time: '2 min fa' },
  { type: 'ranking',      text: 'Hai scalato 3 posizioni in classifica dopo la vittoria', time: '1 ora fa' },
  { type: 'challenge',    text: 'Andrea Belli ti ha sfidato per il 5 Maggio',            time: '3 ore fa' },
  { type: 'availability', text: 'Disponibilità aggiornata per la settimana prossima',    time: 'Ieri' },
  { type: 'badge',        text: 'Nuovo badge sbloccato: "Imbattibile" — 5 vittorie di fila', time: '2 giorni fa' },
];

const CHALLENGES: ChallengeData[] = [
  { fromInitials: 'LC', fromHue: '210', fromName: 'Luca Conti',   proposedDate: '5 Maggio' },
  { fromInitials: 'GT', fromHue: '60',  fromName: 'Giorgio Testa', proposedDate: '8 Maggio' },
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
          {UPCOMING_MATCHES.map((m, i) => (
            <MatchRow
              key={i}
              match={m}
              currentPlayerInitials="FP"
              currentPlayerHue="30"
              showVenue
            />
          ))}
        </GlassCard>
      </Section>

      <Section title="MatchRow — Partite recenti">
        <GlassCard style={{ padding: '8px 16px', maxWidth: 560 }}>
          {RECENT_MATCHES.map((m, i) => (
            <MatchRow
              key={i}
              match={m}
              currentPlayerInitials="FP"
              currentPlayerHue="30"
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
              isCurrentPlayer={p.ranking === 4}
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
          {ACTIVITIES.map((a, i) => <ActivityItem key={i} item={a} />)}
        </GlassCard>
      </Section>

      <Section title="ChallengeCard">
        <div style={{ maxWidth: 400 }}>
          {CHALLENGES.map((c, i) => (
            <ChallengeCard
              key={i}
              challenge={c}
              onAccept={() => alert(`Accettata sfida di ${c.fromName}`)}
              onReject={() => alert(`Rifiutata sfida di ${c.fromName}`)}
            />
          ))}
        </div>
      </Section>

      <Toast toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
