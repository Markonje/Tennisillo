'use client';

import React from 'react';
import {
  Avatar,
  Button,
  GlassCard,
  GlassInput,
  GlassSelect,
  KpiCard,
  SegmentedControl,
  StatusBadge,
  Toast,
  type BadgeStatus,
  type ToastItem,
} from '@tennisillo/ui';

export function SmokePage() {
  const [inputVal, setInputVal] = React.useState('');
  const [selectVal, setSelectVal] = React.useState('singolo');
  const [segment, setSegment] = React.useState('Tutti');
  const [toasts, setToasts] = React.useState<ToastItem[]>([
    { id: 1, message: 'Partita confermata!', tone: 'success' },
    { id: 2, message: 'Richiesta in attesa di risposta.', tone: 'info' },
  ]);

  const statuses: BadgeStatus[] = ['confirmed', 'pending', 'completed', 'cancelled', 'disputed', 'win', 'loss', 'training'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2818 100%)',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h2 style={{ color: '#B9FF5A', marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 700 }}>
        Smoke Test — Design System Tennisillo
      </h2>

      {/* Avatars */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avatar</p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar initials="MR" hue="142" size={48} />
          <Avatar initials="LC" hue="210" size={48} />
          <Avatar initials="AB" hue="320" size={36} />
          <Avatar initials="GT" hue="60" size={36} />
        </div>
      </section>

      {/* Buttons */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Button</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary">Conferma partita</Button>
          <Button variant="secondary">Annulla</Button>
          <Button variant="danger">Elimina account</Button>
          <Button variant="primary" size="sm">Sm primary</Button>
          <Button variant="secondary" size="sm">Sm secondary</Button>
        </div>
      </section>

      {/* Status badges */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>StatusBadge</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {statuses.map((s) => <StatusBadge key={s} status={s} />)}
        </div>
      </section>

      {/* GlassCard + KpiCard */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GlassCard + KpiCard</p>
        <GlassCard style={{ padding: '1.5rem', maxWidth: 480 }} hover>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            GlassCard con hover abilitato
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
            <KpiCard icon="🏆" label="Vittorie" value={12} delta="+2" positive />
            <KpiCard icon="📊" label="Rating" value={1420} delta="+35" positive />
            <KpiCard icon="📉" label="Sconfitte" value={4} delta="+1" positive={false} />
          </div>
        </GlassCard>
      </section>

      {/* Form inputs */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Input / Select</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
          <GlassInput label="Nome giocatore" value={inputVal} onChange={setInputVal} placeholder="es. Marco Rossi" />
          <GlassSelect
            label="Tipo partita"
            value={selectVal}
            onChange={setSelectVal}
            options={['singolo', 'doppio', 'sparring']}
          />
        </div>
      </section>

      {/* SegmentedControl */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SegmentedControl</p>
        <SegmentedControl options={['Tutti', 'Vinte', 'Perse']} value={segment} onChange={setSegment} />
      </section>

      {/* Toast */}
      <Toast toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
