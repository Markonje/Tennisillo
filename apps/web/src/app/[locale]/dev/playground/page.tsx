'use client';

import React from 'react';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  EmptyState,
  FrequencyBadge,
  GlassCard,
  GlassInput,
  GlassSelect,
  KpiCard,
  LogoMark,
  Modal,
  SegmentedControl,
  Skeleton,
  StepDots,
  Textarea,
  Toast,
  Toggle,
  TrainingSessionBadge,
} from '@tennisillo/ui';
import { toast } from '../../../../lib/toast';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <p className="text-[10px] font-bold text-tertiary-glass uppercase tracking-[0.08em] mb-3">
        {title}
      </p>
      {children}
    </section>
  );
}

export default function PlaygroundPage() {
  const [inputVal, setInputVal]     = React.useState('');
  const [textareaVal, setTextareaVal] = React.useState('');
  const [selectVal, setSelectVal]   = React.useState('singolo');
  const [segment, setSegment]       = React.useState('Tutti');
  const [toggle, setToggle]         = React.useState(false);
  const [step, setStep]             = React.useState(1);
  const [modalOpen, setModalOpen]   = React.useState(false);
  const [legacyToasts, setLegacyToasts] = React.useState([
    { id: 1, message: 'Partita confermata!', tone: 'success' as const },
    { id: 2, message: 'Sfida in attesa.',    tone: 'info'    as const },
  ]);

  return (
    <div className="min-h-screen bg-app p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <LogoMark size={36} />
          <h1 className="text-2xl font-extrabold text-accent tracking-tight">
            Playground — Sprint UI v2
          </h1>
        </div>

        {/* LogoMark */}
        <Section title="LogoMark">
          <div className="flex items-center gap-4">
            <LogoMark size={16} />
            <LogoMark size={24} />
            <LogoMark size={32} />
            <LogoMark size={48} />
            <LogoMark size={64} />
          </div>
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <div className="flex items-center gap-4">
            <Avatar initials="MR" hue="142" size={48} />
            <Avatar initials="LC" hue="210" size={48} />
            <Avatar initials="AB" hue="320" size={36} />
            <Avatar initials="GT" hue="60"  size={36} />
            <Avatar initials="FP" hue={30}  size={28} />
          </div>
        </Section>

        {/* Button */}
        <Section title="Button">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Conferma</Button>
            <Button variant="secondary">Annulla</Button>
            <Button variant="danger">Elimina</Button>
            <Button variant="warning">Attenzione</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" size="sm">Sm Primary</Button>
            <Button variant="secondary" size="sm">Sm Secondary</Button>
            <Button variant="primary" size="lg">Lg Primary</Button>
            <Button variant="primary" loading>Loading…</Button>
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">Attivo</Badge>
            <Badge tone="yellow">In Attesa</Badge>
            <Badge tone="red">Scaduto</Badge>
            <Badge tone="blue">Info</Badge>
            <Badge tone="gray">Neutro</Badge>
            <Badge tone="green" dot>Con dot</Badge>
            <Badge tone="red" dot>Errore dot</Badge>
          </div>
        </Section>

        {/* GlassCard */}
        <Section title="GlassCard">
          <div className="flex gap-4 flex-wrap">
            <GlassCard className="p-5 w-40">
              <p className="text-sm text-secondary-glass">Card base</p>
            </GlassCard>
            <GlassCard interactive className="p-5 w-40">
              <p className="text-sm text-secondary-glass">Interactive</p>
            </GlassCard>
          </div>
        </Section>

        {/* KpiCard */}
        <Section title="KpiCard">
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <KpiCard icon="🏆" label="Vittorie"  value={12}   delta="+2"  positive />
            <KpiCard icon="📊" label="Rating"    value={1590} delta="+35" positive />
            <KpiCard icon="📉" label="Sconfitte" value={4}    delta="+1"  positive={false} />
          </div>
        </Section>

        {/* Toggle */}
        <Section title="Toggle">
          <div className="flex items-center gap-6">
            <Toggle size="sm" checked={toggle} onChange={setToggle} />
            <Toggle size="md" checked={toggle} onChange={setToggle} />
            <Toggle size="md" checked={true}   onChange={() => {}} disabled />
            <span className="text-sm text-secondary-glass">{toggle ? 'On' : 'Off'}</span>
          </div>
        </Section>

        {/* SegmentedControl */}
        <Section title="SegmentedControl">
          <div className="flex flex-col gap-3">
            <SegmentedControl
              options={['Tutti', 'Vinte', 'Perse']}
              value={segment}
              onChange={setSegment}
            />
            <SegmentedControl
              options={[
                { label: 'Settimana', value: 'week' },
                { label: 'Mese',      value: 'month' },
                { label: 'Anno',      value: 'year' },
              ]}
              value="month"
              onChange={() => {}}
            />
          </div>
        </Section>

        {/* StepDots */}
        <Section title="StepDots">
          <div className="flex flex-col gap-4">
            <StepDots total={4} current={step} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Prev
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.min(3, s + 1))}>
                Next
              </Button>
            </div>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="GlassInput / GlassSelect / Textarea">
          <div className="flex flex-col gap-4 max-w-sm">
            <GlassInput
              label="Nome giocatore"
              value={inputVal}
              onChange={setInputVal}
              placeholder="es. Marco Rossi"
            />
            <GlassInput
              label="Con icona"
              value={inputVal}
              onChange={setInputVal}
              placeholder="Cerca…"
              iconLeft={<span className="text-xs">🔍</span>}
            />
            <GlassSelect
              label="Tipo partita"
              value={selectVal}
              onChange={setSelectVal}
              options={['singolo', 'doppio', 'sparring']}
            />
            <Textarea
              label="Note"
              value={textareaVal}
              onChange={setTextareaVal}
              placeholder="Scrivi qualcosa…"
              rows={3}
            />
          </div>
        </Section>

        {/* Banner */}
        <Section title="Banner">
          <div className="flex flex-col gap-3 max-w-md">
            <Banner tone="info">Nuova versione disponibile.</Banner>
            <Banner tone="success">Partita confermata con successo.</Banner>
            <Banner tone="warning">La sessione scade tra 5 minuti.</Banner>
            <Banner tone="danger">Errore durante il salvataggio.</Banner>
          </div>
        </Section>

        {/* FrequencyBadge */}
        <Section title="FrequencyBadge">
          <div className="flex flex-wrap gap-2">
            <FrequencyBadge status="GREEN" />
            <FrequencyBadge status="YELLOW" />
            <FrequencyBadge status="RED" />
            <FrequencyBadge status="UNKNOWN" />
          </div>
        </Section>

        {/* TrainingSessionBadge */}
        <Section title="TrainingSessionBadge">
          <div className="flex flex-wrap gap-2">
            <TrainingSessionBadge type="SPARRING" />
            <TrainingSessionBadge type="MASTER_LESSON" />
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="flex flex-col gap-3 max-w-xs">
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="rect" height={80} />
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" width={36} height={36} />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-2/3" />
              </div>
            </div>
          </div>
        </Section>

        {/* Modal */}
        <Section title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Apri Modal
          </Button>
          {modalOpen && (
            <Modal title="Conferma partita" onClose={() => setModalOpen(false)}>
              <p className="text-sm text-secondary-glass mb-5">
                Sei sicuro di voler confermare la partita con Luca Conti per il 28 Aprile?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                  Annulla
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                  Conferma
                </Button>
              </div>
            </Modal>
          )}
        </Section>

        {/* EmptyState */}
        <Section title="EmptyState">
          <GlassCard className="max-w-sm">
            <EmptyState
              icon="🎾"
              title="Nessuna partita trovata"
              description="Non hai ancora giocato nessuna partita. Sfida un avversario per iniziare."
              action={<Button size="sm">Sfida qualcuno</Button>}
            />
          </GlassCard>
        </Section>

        {/* Toast (legacy component) */}
        <Section title="Toast (legacy component)">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setLegacyToasts((prev) => [
                ...prev,
                { id: Date.now(), message: 'Nuovo toast!', tone: 'success' },
              ])
            }
          >
            Aggiungi toast legacy
          </Button>
          <Toast
            toasts={legacyToasts}
            onRemove={(id) => setLegacyToasts((prev) => prev.filter((t) => t.id !== id))}
          />
        </Section>

        {/* Sonner toast */}
        <Section title="toast() — sonner">
          <div className="flex gap-3 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => toast.success('Partita confermata!')}>
              Success
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast.error('Errore durante il salvataggio')}>
              Error
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast.info('Nuova versione disponibile')}>
              Info
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast.warning('Sessione in scadenza')}>
              Warning
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
