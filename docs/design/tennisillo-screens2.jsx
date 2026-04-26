// Tennisillo — Giocatori, Sfide, Statistiche, Messaggi, Impostazioni

// ── Helpers ────────────────────────────────────────────────────────────────
function FreqDot({ status, size = 8 }) {
  const colors = { green:'#B9FF5A', yellow:'#F2D35E', red:'#E96D6D' };
  return (
    <span style={{
      display:'inline-block', width:size, height:size, borderRadius:'50%',
      background: colors[status] ?? '#888',
      boxShadow:`0 0 6px ${colors[status] ?? '#888'}88`, flexShrink:0,
    }} />
  );
}

function HotBadge({ hot }) {
  if (!hot) return (
    <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>❄️ Inattivo</span>
  );
  return (
    <span style={{ fontSize:10, color:'#F2A35A', fontWeight:600 }}>🔥 Attivo</span>
  );
}

function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.95)', letterSpacing:'-0.02em' }}>{children}</h2>
      {action && (
        <button onClick={onAction} style={{ background:'none', border:'none',
          color:'rgba(185,255,90,0.8)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          {action} →
        </button>
      )}
    </div>
  );
}

// ── GIOCATORI ─────────────────────────────────────────────────────────────────
function ScreenGiocatori({ onPlayerClick, onNavigate, addToast }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('Tutti');
  const [smartOnly, setSmartOnly] = useState(false);

  const freqLabel = { green:'Disponibile', yellow:'Forse disponibile', red:'Occupato' };

  const filtered = PLAYERS.filter(p => {
    if (p.id === 'luca') return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'Smart Match') return SMART_MATCHES.some(s => s.playerId === p.id);
    return true;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Giocatori</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>{PLAYERS.length - 1} membri nella lega</p>
        </div>
        <SegmentedControl options={['Tutti','Smart Match']} value={tab} onChange={setTab} />
      </div>

      {/* Search */}
      <GlassInput placeholder="Cerca giocatore…" value={search} onChange={setSearch} />

      {/* Smart Match cards (when tab = Smart Match) */}
      {tab === 'Smart Match' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
          {SMART_MATCHES.map(sm => {
            const p = playerById(sm.playerId);
            const st = PLAYER_STATUS[p.id] ?? {};
            return (
              <GlassCard key={p.id} style={{ padding:'18px 20px' }} hover onClick={() => onPlayerClick(p)}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <Avatar player={p} size={44} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.95)' }}>{p.name}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Livello {p.level} · #{p.ranking}</div>
                  </div>
                  <div style={{
                    background:'rgba(185,255,90,0.18)', border:'1px solid rgba(185,255,90,0.35)',
                    borderRadius:12, padding:'4px 10px', textAlign:'center',
                  }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'#c8ff78' }}>{sm.score}%</div>
                    <div style={{ fontSize:9, color:'rgba(185,255,90,0.6)', fontWeight:600 }}>MATCH</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                  {sm.reasons.map(r => (
                    <span key={r} style={{
                      background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
                      borderRadius:6, padding:'2px 8px', fontSize:11, color:'rgba(255,255,255,0.6)',
                    }}>{r}</span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <BtnSecondary small onClick={e => { e.stopPropagation(); addToast({ message:`Sparring richiesto a ${p.name}!`, tone:'info' }); }}>⚡ Sparring</BtnSecondary>
                  <BtnPrimary small onClick={e => { e.stopPropagation(); addToast({ message:`Sfida inviata a ${p.name}! 🎾`, tone:'success' }); }}>🎾 Sfida</BtnPrimary>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Full player grid */}
      {tab === 'Tutti' && (
        <GlassCard style={{ padding:'20px 24px' }}>
          {/* Table header */}
          <div style={{
            display:'grid', gridTemplateColumns:'44px 1fr 90px 100px 80px 80px 120px',
            padding:'6px 14px', fontSize:11, fontWeight:700,
            color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4,
          }}>
            <div>#</div><div>Giocatore</div>
            <div style={{ textAlign:'right' }}>Punti</div>
            <div style={{ textAlign:'center' }}>Freq.</div>
            <div style={{ textAlign:'right' }}>Win%</div>
            <div style={{ textAlign:'center' }}>Attività</div>
            <div style={{ textAlign:'right' }}>Azioni</div>
          </div>
          {filtered.map(p => {
            const st = PLAYER_STATUS[p.id] ?? { freq:'green', hot:false };
            const h2h = H2H[p.id];
            return (
              <div key={p.id}
                onClick={() => onPlayerClick(p)}
                style={{
                  display:'grid', gridTemplateColumns:'44px 1fr 90px 100px 80px 80px 120px',
                  alignItems:'center', padding:'10px 14px', borderRadius:14, cursor:'pointer',
                  transition:'background 0.15s', marginBottom:2,
                }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>{p.ranking}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar player={p} size={32} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.92)' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>Livello {p.level}</div>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)', textAlign:'right' }}>{p.points.toLocaleString()}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <FreqDot status={st.freq} />
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                    {st.weeklyPlayed}/{st.weeklyMax}
                  </span>
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', textAlign:'right' }}>{p.winRate}%</div>
                <div style={{ textAlign:'center' }}><HotBadge hot={st.hot} /></div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }} onClick={e=>e.stopPropagation()}>
                  <button onClick={() => addToast({ message:`Sparring richiesto a ${p.name}!`, tone:'info' })} style={{
                    padding:'5px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)',
                    background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)',
                    cursor:'pointer', fontSize:11, fontWeight:600,
                  }}>⚡</button>
                  <button onClick={() => addToast({ message:`Sfida inviata a ${p.name}! 🎾`, tone:'success' })} style={{
                    padding:'5px 10px', borderRadius:8, border:'1px solid rgba(185,255,90,0.3)',
                    background:'rgba(185,255,90,0.12)', color:'#c8ff78',
                    cursor:'pointer', fontSize:11, fontWeight:600,
                  }}>🎾</button>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12,
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>
              <FreqDot status="green" size={7} /> <span style={{ marginLeft:4 }}>Disponibile · </span>
              <FreqDot status="yellow" size={7} /> <span style={{ marginLeft:4 }}>Forse disponibile · </span>
              <FreqDot status="red" size={7} /> <span style={{ marginLeft:4 }}>Occupato per questa settimana</span>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── SFIDE ─────────────────────────────────────────────────────────────────────
function ScreenSfide({ addToast }) {
  const [tab, setTab] = useState('Ricevute');
  const [sfideRic, setSfideRic] = useState(SFIDE_RICEVUTE);
  const [sfideInv, setSfideInv] = useState(SFIDE_INVIATE);
  const [sparring, setSparring] = useState(SPARRING_HISTORY);

  const accept = (id) => { setSfideRic(s => s.filter(x => x.id !== id)); addToast({ message:'Sfida accettata! Partita programmata.', tone:'success' }); };
  const reject = (id) => { setSfideRic(s => s.filter(x => x.id !== id)); addToast({ message:'Sfida rifiutata.', tone:'info' }); };
  const cancel = (id) => { setSfideInv(s => s.filter(x => x.id !== id)); addToast({ message:'Sfida annullata.', tone:'info' }); };

  const typeLabel = { match:'Partita', sparring:'Sparring' };
  const typeIcon  = { match:'🎾', sparring:'⚡' };
  const stsColor  = { confirmed:'rgba(185,255,90,0.18)', pending:'rgba(242,211,94,0.12)', rejected:'rgba(233,109,109,0.12)' };
  const stsBorder = { confirmed:'rgba(185,255,90,0.35)', pending:'rgba(242,211,94,0.3)',  rejected:'rgba(233,109,109,0.3)' };
  const stsText   = { confirmed:'Confermata', pending:'In attesa', rejected:'Rifiutata' };
  const stsColor2 = { confirmed:'#c8ff78', pending:'#f5d96a', rejected:'#f09090' };

  const pendingCount = sfideRic.filter(s => s.status === 'pending').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Sfide</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Partite e sessioni di sparring</p>
        </div>
        {pendingCount > 0 && (
          <div style={{
            background:'rgba(185,255,90,0.18)', border:'1px solid rgba(185,255,90,0.35)',
            borderRadius:14, padding:'8px 16px', display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'#c8ff78' }}>{pendingCount} sfide</div>
              <div style={{ fontSize:11, color:'rgba(185,255,90,0.6)' }}>in attesa di risposta</div>
            </div>
          </div>
        )}
      </div>

      <SegmentedControl options={['Ricevute','Inviate','Sparring']} value={tab} onChange={setTab} />

      {/* Ricevute */}
      {tab === 'Ricevute' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {sfideRic.length === 0 ? (
            <GlassCard style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🎾</div>
              <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>Nessuna sfida ricevuta</div>
            </GlassCard>
          ) : sfideRic.map(s => {
            const from = playerById(s.fromId);
            return (
              <GlassCard key={s.id} style={{ padding:'18px 22px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{
                    width:40, height:40, borderRadius:12, flexShrink:0,
                    background: s.type === 'sparring' ? 'rgba(242,211,94,0.18)' : 'rgba(185,255,90,0.18)',
                    border: `1px solid ${s.type === 'sparring' ? 'rgba(242,211,94,0.4)' : 'rgba(185,255,90,0.4)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                  }}>{typeIcon[s.type]}</div>
                  <Avatar player={from} size={40} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.95)' }}>{from.name}</span>
                      <span style={{
                        background: s.type==='sparring' ? 'rgba(242,211,94,0.15)' : 'rgba(185,255,90,0.15)',
                        border:`1px solid ${s.type==='sparring' ? 'rgba(242,211,94,0.35)' : 'rgba(185,255,90,0.35)'}`,
                        borderRadius:999, padding:'1px 8px', fontSize:10, fontWeight:700,
                        color: s.type==='sparring' ? '#f5d96a' : '#c8ff78',
                      }}>{typeLabel[s.type]}</span>
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:3 }}>
                      📅 {s.proposedDate} alle {s.time} · 📍 {s.venue}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Ricevuta {s.createdAt}</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <BtnSecondary small danger onClick={() => reject(s.id)}>Rifiuta</BtnSecondary>
                    <BtnPrimary small onClick={() => accept(s.id)}>Accetta</BtnPrimary>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Inviate */}
      {tab === 'Inviate' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {sfideInv.map(s => {
            const to = playerById(s.toId);
            return (
              <GlassCard key={s.id} style={{ padding:'18px 22px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <Avatar player={to} size={42} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.95)' }}>{to.name}</span>
                      <span style={{
                        background: s.type==='sparring' ? 'rgba(242,211,94,0.15)' : 'rgba(185,255,90,0.15)',
                        border:`1px solid ${s.type==='sparring' ? 'rgba(242,211,94,0.35)' : 'rgba(185,255,90,0.35)'}`,
                        borderRadius:999, padding:'1px 8px', fontSize:10, fontWeight:700,
                        color: s.type==='sparring' ? '#f5d96a' : '#c8ff78',
                      }}>{typeLabel[s.type]}</span>
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:3 }}>
                      📅 {s.proposedDate} · {s.time} · 📍 {s.venue}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Inviata {s.createdAt}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{
                      background: stsColor[s.status], border:`1px solid ${stsBorder[s.status]}`,
                      borderRadius:999, padding:'4px 12px', fontSize:12, fontWeight:700,
                      color: stsColor2[s.status],
                    }}>{stsText[s.status]}</div>
                    {s.status === 'pending' && (
                      <button onClick={() => cancel(s.id)} style={{
                        width:28, height:28, borderRadius:8, border:'1px solid rgba(255,255,255,0.15)',
                        background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)',
                        cursor:'pointer', fontSize:12,
                      }}>✕</button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
          {/* Pending slots indicator */}
          <GlassCard style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>Sfide aperte</div>
              <div style={{ display:'flex', gap:6 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{
                    width:28, height:28, borderRadius:8,
                    background: i <= sfideInv.filter(s=>s.status==='pending').length
                      ? 'rgba(185,255,90,0.2)' : 'rgba(255,255,255,0.06)',
                    border: i <= sfideInv.filter(s=>s.status==='pending').length
                      ? '1px solid rgba(185,255,90,0.35)' : '1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, color: i <= sfideInv.filter(s=>s.status==='pending').length ? '#c8ff78' : 'rgba(255,255,255,0.2)',
                  }}>{i}</div>
                ))}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>max 3 aperte</div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Sparring */}
      {tab === 'Sparring' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Weekly cap */}
          <GlassCard style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:28 }}>⚡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:4 }}>
                  Sparring questa settimana
                </div>
                <div style={{ height:5, borderRadius:999, background:'rgba(255,255,255,0.1)' }}>
                  <div style={{
                    height:'100%', width:'50%', borderRadius:999,
                    background:'linear-gradient(90deg,#f5d96a,#f2a35a)',
                  }} />
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>1 / 2 sessioni utilizzate</div>
              </div>
              <BtnPrimary small onClick={() => addToast({ message:'Richiesta sparring inviata!', tone:'success' })}>
                + Nuovo sparring
              </BtnPrimary>
            </div>
          </GlassCard>
          {/* History */}
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionTitle>Storico Sparring</SectionTitle>
            {SPARRING_HISTORY.map(s => {
              const opp = playerById(s.opponentId);
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                  borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <Avatar player={opp} size={34} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{opp.name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{s.date}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f5d96a' }}>+{s.points} pt</div>
                  <span style={{
                    background:'rgba(121,167,216,0.15)', border:'1px solid rgba(121,167,216,0.35)',
                    borderRadius:999, padding:'2px 10px', fontSize:11, color:'#9abfdd', fontWeight:600,
                  }}>Sparring</span>
                </div>
              );
            })}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ── STATISTICHE ───────────────────────────────────────────────────────────────
function ScreenStatistiche({ onPlayerClick }) {
  const [tab, setTab] = useState('Stagione');
  const ss = SEASON_STATS;
  const cp = CURRENT_PLAYER;

  // Mini bar chart for points breakdown
  function PointsBar({ label, value, max, color }) {
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{label}</span>
          <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>+{value}</span>
        </div>
        <div style={{ height:6, borderRadius:999, background:'rgba(255,255,255,0.08)' }}>
          <div style={{ height:'100%', width:`${(value/max)*100}%`, borderRadius:999, background:color, transition:'width 0.5s ease' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Statistiche</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Stagione Primavera 2026</p>
        </div>
        <SegmentedControl options={['Stagione','Partite','Badge']} value={tab} onChange={setTab} />
      </div>

      {/* STAGIONE TAB */}
      {tab === 'Stagione' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            <KpiCard icon="⭐" label="Punti totali" value={ss.totalPoints.toLocaleString()} delta="+230 questa settimana" positive />
            <KpiCard icon="📈" label="Diversificazione" value={`${Math.round(ss.diversificationIndex*100)}%`} delta="7 avversari unici" positive />
            <KpiCard icon="🔥" label="Striscia attuale" value={`${ss.winStreak} 🏅`} delta={`Record: ${ss.bestStreak}`} positive />
            <KpiCard icon="🕐" label="Ultima partita" value={`${ss.lastMatchDaysAgo}g fa`} delta={ss.decayRisk ? 'Rischio decay!' : 'Nessun decay'} positive={!ss.decayRisk} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Breakdown punti */}
            <GlassCard style={{ padding:'22px 24px' }}>
              <SectionTitle>Composizione Punti</SectionTitle>
              <PointsBar label="Punti base partite" value={ss.pointsFromBase} max={ss.totalPoints} color="rgba(185,255,90,0.7)" />
              <PointsBar label="Bonus (costanza, diversificazione…)" value={ss.pointsFromBonuses} max={ss.totalPoints} color="rgba(121,167,216,0.7)" />
              <PointsBar label="Sparring" value={ss.pointsFromSparring} max={ss.totalPoints} color="rgba(242,211,94,0.7)" />
              <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.05)',
                borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Totale stagione</span>
                  <span style={{ fontSize:16, fontWeight:800, color:'rgba(255,255,255,0.97)' }}>{ss.totalPoints.toLocaleString()} pt</span>
                </div>
              </div>
            </GlassCard>

            {/* Trend punti */}
            <GlassCard style={{ padding:'22px 24px' }}>
              <SectionTitle>Andamento Punti</SectionTitle>
              <MiniLineChart data={POINTS_HISTORY} dates={POINTS_DATES} width={280} height={110} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
                {[
                  { label:'Set vinti',   value:ss.setsWon },
                  { label:'Set persi',   value:ss.setsLost },
                  { label:'Game vinti',  value:ss.gamesWon },
                  { label:'Game persi',  value:ss.gamesLost },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', background:'rgba(255,255,255,0.04)',
                    borderRadius:10, padding:'8px' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.9)' }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Decay / activity status */}
          <GlassCard style={{ padding:'16px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:28 }}>{ss.decayRisk ? '⚠️' : '✅'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>
                  {ss.decayRisk ? 'Attenzione: rischio decay!' : 'Nessun rischio decay'}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                  {ss.decayRisk
                    ? 'Gioca almeno 1 partita competitiva per evitare la penalità'
                    : `Ultima partita ${ss.lastMatchDaysAgo} giorni fa · Prossimo check tra ${14 - ss.lastMatchDaysAgo} giorni`
                  }
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:22, fontWeight:800, color: ss.decayRisk ? '#f09090' : '#c8ff78' }}>
                  {ss.decayRisk ? '-15 pt' : '0 pt'}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>penalità decay</div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* PARTITE TAB */}
      {tab === 'Partite' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <GlassCard style={{ padding:'22px 24px' }}>
            <SectionTitle>Dettaglio Punti per Partita</SectionTitle>
            {/* Column headers */}
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 60px 70px 70px 60px 65px 60px 70px',
              padding:'6px 8px', fontSize:10, fontWeight:700,
              color:'rgba(255,255,255,0.3)', letterSpacing:'0.05em', textTransform:'uppercase',
              marginBottom:4, gap:4,
            }}>
              <div>Partita</div>
              <div style={{ textAlign:'right' }}>Base</div>
              <div style={{ textAlign:'right' }}>×Liv.</div>
              <div style={{ textAlign:'right' }}>×Ris.</div>
              <div style={{ textAlign:'right' }}>Cost.</div>
              <div style={{ textAlign:'right' }}>Divers.</div>
              <div style={{ textAlign:'right' }}>Malus</div>
              <div style={{ textAlign:'right' }}>Totale</div>
            </div>
            {POINTS_BREAKDOWN.map((pb, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'1fr 60px 70px 70px 60px 65px 60px 70px',
                padding:'10px 8px', borderRadius:10, marginBottom:2, gap:4,
                background: i%2===0 ? 'rgba(255,255,255,0.03)' : 'transparent',
              }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>{pb.match}</div>
                <div style={{ fontSize:12, textAlign:'right', color:'rgba(255,255,255,0.6)' }}>{pb.base}</div>
                <div style={{ fontSize:12, textAlign:'right', color: pb.mLivello > 0 ? '#c8ff78' : 'rgba(255,255,255,0.5)' }}>
                  {pb.mLivello > 0 ? `+${pb.mLivello}` : '—'}
                </div>
                <div style={{ fontSize:12, textAlign:'right', color: pb.mRisultato > 0 ? '#c8ff78' : 'rgba(255,255,255,0.5)' }}>
                  {pb.mRisultato > 0 ? `+${pb.mRisultato}` : '—'}
                </div>
                <div style={{ fontSize:12, textAlign:'right', color: pb.bCostanza > 0 ? '#9abfdd' : 'rgba(255,255,255,0.5)' }}>
                  {pb.bCostanza > 0 ? `+${pb.bCostanza}` : '—'}
                </div>
                <div style={{ fontSize:12, textAlign:'right', color: pb.bDiversificazione > 0 ? '#9abfdd' : 'rgba(255,255,255,0.5)' }}>
                  {pb.bDiversificazione > 0 ? `+${pb.bDiversificazione}` : '—'}
                </div>
                <div style={{ fontSize:12, textAlign:'right', color: pb.malus < 0 ? '#f09090' : 'rgba(255,255,255,0.5)' }}>
                  {pb.malus < 0 ? pb.malus : '—'}
                </div>
                <div style={{ fontSize:13, fontWeight:800, textAlign:'right', color:'rgba(255,255,255,0.97)' }}>+{pb.total}</div>
              </div>
            ))}
          </GlassCard>

          {/* H2H */}
          <GlassCard style={{ padding:'22px 24px' }}>
            <SectionTitle>Testa a Testa</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {Object.entries(H2H).map(([pid, h]) => {
                const p = playerById(pid);
                const total = h.wins + h.losses;
                const winPct = total > 0 ? Math.round((h.wins/total)*100) : 0;
                return (
                  <div key={pid} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    background:'rgba(255,255,255,0.05)', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
                    <Avatar player={p} size={30} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ height:3, borderRadius:999, background:'rgba(255,255,255,0.1)', marginTop:4 }}>
                        <div style={{ height:'100%', width:`${winPct}%`, borderRadius:999,
                          background: winPct >= 50 ? 'rgba(185,255,90,0.7)' : 'rgba(233,109,109,0.7)' }} />
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color: h.wins > h.losses ? '#c8ff78' : '#f09090' }}>
                        {h.wins}-{h.losses}
                      </div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>
                        {h.lastResult === 'win' ? '↑ ultima' : '↓ ultima'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* BADGE TAB */}
      {tab === 'Badge' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {BADGES.map(b => (
              <GlassCard key={b.id} style={{
                padding:'16px 18px',
                opacity: b.earned ? 1 : 0.6,
                border: b.earned ? '1px solid rgba(185,255,90,0.25)' : '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:14, flexShrink:0,
                    background: b.earned ? 'rgba(185,255,90,0.15)' : 'rgba(255,255,255,0.06)',
                    border: b.earned ? '1px solid rgba(185,255,90,0.35)' : '1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                    filter: b.earned ? 'none' : 'grayscale(0.8)',
                  }}>{b.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: b.earned ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.55)' }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:1, lineHeight:1.4 }}>{b.desc}</div>
                    {b.earned && <div style={{ fontSize:10, color:'#c8ff78', marginTop:3, fontWeight:600 }}>✓ Conquistato {b.date}</div>}
                    {!b.earned && b.progress && (
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3, fontWeight:600 }}>
                        Progresso: {b.progress}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MESSAGGI / BACHECA ────────────────────────────────────────────────────────
function ScreenMessaggi({ addToast }) {
  const [liked, setLiked] = useState({});
  const [newMsg, setNewMsg] = useState('');

  const typeIcon = {
    match_result:'🎾', ranking:'🏆', badge:'🏅', sparring:'⚡',
    admin:'📢', challenge:'⚔️',
  };
  const typeBg = {
    match_result:'rgba(185,255,90,0.08)', ranking:'rgba(242,211,94,0.08)',
    badge:'rgba(185,255,90,0.12)', sparring:'rgba(121,167,216,0.08)',
    admin:'rgba(255,255,255,0.10)', challenge:'rgba(233,109,109,0.08)',
  };

  const toggleLike = (id) => setLiked(l => ({ ...l, [id]: !l[id] }));

  const post = () => {
    if (!newMsg.trim()) return;
    addToast({ message:'Messaggio pubblicato in bacheca!', tone:'success' });
    setNewMsg('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Bacheca Lega</h1>
        <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Attività e comunicazioni della lega</p>
      </div>

      {/* Compose */}
      <GlassCard style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Avatar player={CURRENT_PLAYER} size={36} />
          <div style={{ flex:1 }}>
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && post()}
              placeholder="Scrivi un messaggio alla lega…"
              style={{
                width:'100%', background:'rgba(255,255,255,0.07)',
                border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
                padding:'10px 14px', color:'rgba(255,255,255,0.88)', fontSize:13,
                outline:'none',
              }}
            />
          </div>
          <BtnPrimary small onClick={post}>Pubblica</BtnPrimary>
        </div>
      </GlassCard>

      {/* Feed */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {BACHECA.map(item => {
          const p = item.playerId ? playerById(item.playerId) : null;
          const isLiked = liked[item.id];
          return (
            <GlassCard key={item.id} style={{ padding:'16px 20px', background: typeBg[item.type] ?? 'rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', gap:12 }}>
                {/* Icon or avatar */}
                {p ? (
                  <Avatar player={p} size={38} />
                ) : (
                  <div style={{
                    width:38, height:38, borderRadius:12, flexShrink:0,
                    background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                  }}>{typeIcon[item.type]}</div>
                )}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.88)', lineHeight:1.5, marginBottom:6 }}>
                    {p && <strong style={{ color:'rgba(255,255,255,0.97)' }}>{p.name} · </strong>}
                    {item.text}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{item.time}</span>
                    <button onClick={() => toggleLike(item.id)} style={{
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      fontSize:12, color: isLiked ? '#c8ff78' : 'rgba(255,255,255,0.4)',
                      fontWeight:600, display:'flex', alignItems:'center', gap:4,
                    }}>
                      {isLiked ? '♥' : '♡'} {item.likes + (isLiked ? 1 : 0)}
                    </button>
                    {item.comments > 0 && (
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                        💬 {item.comments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// ── IMPOSTAZIONI ──────────────────────────────────────────────────────────────
function ScreenImpostazioni({ addToast }) {
  const [tab, setTab] = useState('Disponibilità');
  const [avail, setAvail] = useState(MY_AVAILABILITY.map(r => [...r]));
  const [freqIdeal, setFreqIdeal] = useState(2);
  const [freqMax, setFreqMax]     = useState(3);
  const [username, setUsername]   = useState('Luca Bianchi');
  const [city, setCity]           = useState('Milano');
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifRank, setNotifRank]   = useState(true);
  const [notifSparring, setNotifSparring] = useState(false);

  const days = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];
  const slots = ['Mattina\n08–12','Pomeriggio\n12–18','Sera\n18–22'];

  const toggleAvail = (ri, ci) => {
    setAvail(a => {
      const copy = a.map(r => [...r]);
      copy[ri][ci] = !copy[ri][ci];
      return copy;
    });
  };

  const save = () => addToast({ message:'Impostazioni salvate!', tone:'success' });

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} style={{
      width:44, height:24, borderRadius:999, border:'none', cursor:'pointer', position:'relative',
      background: value ? 'rgba(185,255,90,0.85)' : 'rgba(255,255,255,0.15)',
      transition:'background 0.2s ease', flexShrink:0,
    }}>
      <div style={{
        position:'absolute', top:3, left: value ? 23 : 3, width:18, height:18, borderRadius:'50%',
        background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
        transition:'left 0.2s ease',
      }} />
    </button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Impostazioni</h1>
        <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Profilo, disponibilità e preferenze</p>
      </div>

      <SegmentedControl
        options={['Disponibilità','Frequenza','Profilo','Notifiche']}
        value={tab} onChange={setTab} />

      {/* Disponibilità */}
      {tab === 'Disponibilità' && (
        <GlassCard style={{ padding:'24px 26px' }}>
          <SectionTitle>Calendario Disponibilità</SectionTitle>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20, marginTop:-8 }}>
            Definisci il tuo schema settimanale ricorrente. Verrà usato dal sistema per suggerirti avversari compatibili.
          </p>
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'100px repeat(7,1fr)', gap:8, minWidth:500 }}>
              <div />
              {days.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700,
                  color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', paddingBottom:6 }}>{d}</div>
              ))}
              {slots.map((slot, ri) => (
                <React.Fragment key={ri}>
                  <div style={{
                    fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.4,
                    display:'flex', alignItems:'center', whiteSpace:'pre-line', paddingRight:8,
                  }}>{slot}</div>
                  {avail[ri].map((on, ci) => (
                    <div key={ci} onClick={() => toggleAvail(ri, ci)} style={{
                      height:44, borderRadius:10, cursor:'pointer',
                      background: on ? 'rgba(185,255,90,0.22)' : 'rgba(255,255,255,0.05)',
                      border: on ? '1px solid rgba(185,255,90,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: on ? '0 0 12px rgba(185,255,90,0.2)' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, color: on ? '#c8ff78' : 'rgba(255,255,255,0.2)',
                      transition:'all 0.15s ease',
                    }}>
                      {on ? '✓' : ''}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={{ marginTop:20, display:'flex', gap:10, justifyContent:'flex-end' }}>
            <BtnSecondary small onClick={() => setAvail(MY_AVAILABILITY.map(r => [...r]))}>Reset</BtnSecondary>
            <BtnPrimary small onClick={save}>Salva disponibilità</BtnPrimary>
          </div>
        </GlassCard>
      )}

      {/* Frequenza */}
      {tab === 'Frequenza' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <GlassCard style={{ padding:'24px 26px' }}>
            <SectionTitle>Frequenza Desiderata</SectionTitle>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20, marginTop:-8 }}>
              Imposta quante partite vuoi giocare a settimana. Gli altri giocatori vedranno un semaforo di disponibilità basato su questi valori.
            </p>

            {/* Ideal freq */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>Frequenza ideale (partite/settimana)</span>
                <span style={{ fontSize:18, fontWeight:800, color:'#c8ff78' }}>{freqIdeal}</span>
              </div>
              <input type="range" min={1} max={7} value={freqIdeal}
                onChange={e => setFreqIdeal(Number(e.target.value))}
                style={{ width:'100%', accentColor:'#B9FF5A' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                <span>1</span><span>7</span>
              </div>
            </div>

            {/* Max freq */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>Frequenza massima (non voglio superare)</span>
                <span style={{ fontSize:18, fontWeight:800, color:'#f5d96a' }}>{freqMax}</span>
              </div>
              <input type="range" min={freqIdeal} max={7} value={freqMax}
                onChange={e => setFreqMax(Number(e.target.value))}
                style={{ width:'100%', accentColor:'#F2D35E' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                <span>{freqIdeal}</span><span>7</span>
              </div>
            </div>

            {/* Semaforo preview */}
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:14, padding:'14px 18px',
              border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Come ti vedono gli altri questa settimana:
              </div>
              {[
                { label:`0–${freqIdeal-1} partite giocate`, status:'green',  desc:'🟢 Disponibile — alta probabilità che tu accetti sfide' },
                { label:`${freqIdeal}–${freqMax-1} partite`, status:'yellow', desc:'🟡 Forse disponibile — probabilità media' },
                { label:`${freqMax}+ partite`,               status:'red',   desc:'🔴 Occupato — bassa probabilità' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0',
                  borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <FreqDot status={row.status} size={10} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>{row.desc}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{row.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
              <BtnPrimary small onClick={save}>Salva frequenza</BtnPrimary>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Profilo */}
      {tab === 'Profilo' && (
        <GlassCard style={{ padding:'24px 26px' }}>
          <SectionTitle>Dati Personali</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
              <Avatar player={CURRENT_PLAYER} size={64} />
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Luca Bianchi</div>
                <button style={{ background:'none', border:'1px solid rgba(255,255,255,0.2)',
                  borderRadius:8, padding:'4px 12px', color:'rgba(255,255,255,0.6)',
                  cursor:'pointer', fontSize:12, marginTop:6 }}>
                  Cambia avatar
                </button>
              </div>
            </div>
            <GlassInput label="Nome e cognome" value={username} onChange={setUsername} />
            <GlassInput label="Città" value={city} onChange={setCity} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <GlassSelect label="Livello dichiarato" value="Intermedio" onChange={()=>{}}
                options={['Principiante','Intermedio','Avanzato','Agonista']} />
              <GlassSelect label="Frequenza (giocatore)" value="3x settimana" onChange={()=>{}}
                options={['1x settimana','2x settimana','3x settimana','Quotidiano']} />
            </div>
            <div style={{ marginTop:6, display:'flex', justifyContent:'flex-end' }}>
              <BtnPrimary small onClick={save}>Salva profilo</BtnPrimary>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Notifiche */}
      {tab === 'Notifiche' && (
        <GlassCard style={{ padding:'24px 26px' }}>
          <SectionTitle>Preferenze Notifiche</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {[
              { label:'Sfide ricevute e accettate',    desc:'Notifica quando ricevi o qualcuno risponde a una sfida', val:notifMatch,   set:setNotifMatch   },
              { label:'Aggiornamenti classifica',      desc:'Quando la classifica viene aggiornata dopo una partita', val:notifRank,    set:setNotifRank    },
              { label:'Conferme Sparring',             desc:'Quando uno sparring richiede la tua conferma',           val:notifSparring, set:setNotifSparring },
              { label:'Reminder partite',              desc:'24h e 2h prima di una partita programmata',             val:true,         set:()=>{}          },
              { label:'Badge conquistati',             desc:'Quando sblocchi un nuovo achievement',                  val:true,         set:()=>{}          },
              { label:'Nuovi giocatori in lega',       desc:'Quando un nuovo membro si unisce alla tua lega',        val:false,        set:()=>{}          },
            ].map((n, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0',
                borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.88)' }}>{n.label}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{n.desc}</div>
                </div>
                <Toggle value={n.val} onChange={n.set} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
            <BtnPrimary small onClick={save}>Salva preferenze</BtnPrimary>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── CLASSIFICA V2 (con semaforo + hot/cold) ───────────────────────────────────
function ScreenClassificaV2({ onPlayerClick }) {
  const [tab, setTab] = useState('Generale');
  const [search, setSearch] = useState('');
  const filtered = PLAYERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Classifica</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Stagione Primavera 2026</p>
        </div>
        <SegmentedControl options={['Generale','Mensile','Settimanale']} value={tab} onChange={setTab} />
      </div>
      <GlassCard style={{ padding:'20px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <GlassInput placeholder="Cerca giocatore…" value={search} onChange={setSearch} />
        </div>
        <div style={{
          display:'grid', gridTemplateColumns:'44px 1fr 90px 70px 60px 80px 80px',
          padding:'8px 14px', fontSize:10, fontWeight:700,
          color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4,
        }}>
          <div>#</div><div>Giocatore</div>
          <div style={{ textAlign:'right' }}>Punti</div>
          <div style={{ textAlign:'right' }}>Var.</div>
          <div style={{ textAlign:'center' }}>Freq.</div>
          <div style={{ textAlign:'center' }}>Attività</div>
          <div style={{ textAlign:'right' }}>Win%</div>
        </div>
        {filtered.map(p => {
          const st = PLAYER_STATUS[p.id] ?? { freq:'green', hot:false };
          const isCurrent = p.id === 'luca';
          const medal = ['🥇','🥈','🥉'];
          return (
            <div key={p.id} onClick={() => onPlayerClick(p)}
              style={{
                display:'grid', gridTemplateColumns:'44px 1fr 90px 70px 60px 80px 80px',
                alignItems:'center', padding:'10px 14px', borderRadius:14, cursor:'pointer',
                background: isCurrent ? 'rgba(185,255,90,0.10)' : 'transparent',
                border: isCurrent ? '1px solid rgba(185,255,90,0.3)' : '1px solid transparent',
                transition:'all 0.15s', marginBottom:2,
              }}
              onMouseEnter={e => { if(!isCurrent) e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if(!isCurrent) e.currentTarget.style.background='transparent'; }}>
              <div style={{ fontSize:14, fontWeight:700 }}>
                {p.ranking <= 3 ? medal[p.ranking-1] : <span style={{ color:'rgba(255,255,255,0.5)' }}>{p.ranking}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar player={p} size={30} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color: isCurrent ? '#c8ff78' : 'rgba(255,255,255,0.9)' }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Livello {p.level}</div>
                </div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.95)', textAlign:'right' }}>{p.points.toLocaleString()}</div>
              <div style={{ textAlign:'right' }}>
                {p.variation === 0
                  ? <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>—</span>
                  : <span style={{ color: p.variation > 0 ? '#b0ef60' : '#f09090', fontSize:12, fontWeight:700 }}>
                      {p.variation > 0 ? `▲${p.variation}` : `▼${Math.abs(p.variation)}`}
                    </span>
                }
              </div>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:4 }}>
                <FreqDot status={st.freq} size={9} />
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{st.weeklyPlayed}/{st.weeklyMax}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <HotBadge hot={st.hot} />
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', textAlign:'right' }}>{p.winRate}%</div>
            </div>
          );
        })}
        <div style={{ marginTop:14, fontSize:11, color:'rgba(255,255,255,0.28)', textAlign:'center' }}>
          La classifica si aggiorna dopo ogni partita competitiva validata
        </div>
      </GlassCard>
    </div>
  );
}

Object.assign(window, {
  FreqDot, HotBadge,
  ScreenGiocatori, ScreenSfide,
  ScreenStatistiche, ScreenMessaggi,
  ScreenImpostazioni, ScreenClassificaV2,
});
