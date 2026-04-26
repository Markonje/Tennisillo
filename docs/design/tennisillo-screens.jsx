// Tennisillo — Ranking, Matches, Calendar, Profile, New Match screens

// ── Classifica ────────────────────────────────────────────────────────────────
function ScreenClassifica({ onPlayerClick }) {
  const [tab, setTab] = useState('Generale');
  const [search, setSearch] = useState('');
  const filtered = window.PLAYERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Classifica</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Stagione Primavera 2026</p>
        </div>
        <window.SegmentedControl options={['Generale','Mensile','Settimanale']} value={tab} onChange={setTab} />
      </div>
      <window.GlassCard style={{ padding:'20px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <window.GlassInput placeholder="Cerca giocatore…" value={search} onChange={setSearch} />
        </div>
        {/* Table header */}
        <div style={{
          display:'grid', gridTemplateColumns:'44px 1fr 90px 80px 80px 70px',
          padding:'8px 14px', fontSize:11, fontWeight:700,
          color:'rgba(255,255,255,0.35)', letterSpacing:'0.05em', textTransform:'uppercase',
          marginBottom:4,
        }}>
          <div>#</div><div>Giocatore</div>
          <div style={{ textAlign:'right' }}>Punti</div>
          <div style={{ textAlign:'right' }}>Var.</div>
          <div style={{ textAlign:'right' }}>Win %</div>
          <div style={{ textAlign:'right' }}>Partite</div>
        </div>
        {filtered.map(p => (
          <window.RankingRow key={p.id} player={p}
            isCurrentPlayer={p.id === 'luca'}
            onClick={onPlayerClick} />
        ))}
        <div style={{ marginTop:16, fontSize:12, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
          La classifica si aggiorna dopo ogni partita completata
        </div>
      </window.GlassCard>
    </div>
  );
}

// ── Partite ───────────────────────────────────────────────────────────────────
function ScreenPartite({ onNavigate, addToast }) {
  const [tab, setTab] = useState('Prossime');
  const matches = tab === 'Prossime' ? window.UPCOMING_MATCHES : window.RECENT_MATCHES;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Partite</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Le tue partite e la tua storia</p>
        </div>
        <window.BtnPrimary onClick={() => onNavigate('nuova-partita')}>
          <span style={{ fontSize:16 }}>＋</span> Nuova partita
        </window.BtnPrimary>
      </div>
      <window.SegmentedControl options={['Prossime','Recenti']} value={tab} onChange={setTab} />
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {matches.map(m => (
          <window.GlassCard key={m.id} style={{ padding:'16px 20px' }} hover>
            {tab === 'Prossime' ? (
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  textAlign:'center', minWidth:48, padding:'8px', borderRadius:12,
                  background:'rgba(185,255,90,0.12)', border:'1px solid rgba(185,255,90,0.25)',
                }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#c8ff78', lineHeight:1 }}>{m.date}</div>
                  <div style={{ fontSize:10, color:'rgba(185,255,90,0.7)', fontWeight:700 }}>{m.month}</div>
                </div>
                <window.Avatar player={window.CURRENT_PLAYER} size={40} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>VS</div>
                </div>
                <window.Avatar player={window.playerById(m.opponentId)} size={40} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.95)' }}>
                    {window.playerById(m.opponentId).name}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                    📍 {m.venue} · {m.time}
                  </div>
                </div>
                <window.StatusBadge status={m.status} />
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  textAlign:'center', minWidth:52, padding:'6px 10px', borderRadius:12,
                  background:'rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{m.date}</div>
                </div>
                <window.Avatar player={window.playerById(m.opponentId)} size={38} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>
                    vs {window.playerById(m.opponentId).name}
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', fontFamily:'monospace', marginTop:2 }}>
                    {m.score}
                  </div>
                </div>
                <window.StatusBadge status={m.result} />
              </div>
            )}
          </window.GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── Calendario ────────────────────────────────────────────────────────────────
function ScreenCalendario() {
  const [view, setView] = useState('Mese');
  const days = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];
  // May 2026 starts on Friday (index 4)
  const totalDays = 31; const startOffset = 4;
  const cells = Array.from({ length: startOffset + totalDays }, (_, i) =>
    i < startOffset ? null : i - startOffset + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);
  const eventColors = { confirmed:'#B9FF5A', pending:'#F2D35E', training:'#79A7D8', sparring:'#79A7D8' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Calendario</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Maggio 2026</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <window.SegmentedControl options={['Mese','Settimana','Oggi']} value={view} onChange={setView} />
          <button style={{
            width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.09)',
            border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.7)',
            cursor:'pointer', fontSize:14,
          }}>‹</button>
          <button style={{
            width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.09)',
            border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.7)',
            cursor:'pointer', fontSize:14,
          }}>›</button>
        </div>
      </div>
      <window.GlassCard style={{ padding:'20px 22px' }}>
        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:8 }}>
          {days.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700,
              color:'rgba(255,255,255,0.35)', letterSpacing:'0.06em', padding:'4px 0' }}>{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
          {cells.map((day, i) => {
            const evs = day ? window.CALENDAR_EVENTS.filter(e => e.date === day) : [];
            const isToday = day === 24;
            return (
              <div key={i} style={{
                minHeight:80, borderRadius:12, padding:'8px',
                background: isToday ? 'rgba(185,255,90,0.12)' : 'rgba(255,255,255,0.04)',
                border: isToday ? '1px solid rgba(185,255,90,0.35)' : '1px solid rgba(255,255,255,0.07)',
                cursor: day ? 'pointer' : 'default',
              }}>
                {day && (
                  <>
                    <div style={{
                      fontSize:13, fontWeight: isToday ? 800 : 600,
                      color: isToday ? '#c8ff78' : 'rgba(255,255,255,0.7)',
                      marginBottom:4,
                    }}>{day}</div>
                    {evs.map((ev, j) => (
                      <div key={j} style={{
                        fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:6,
                        background: `${eventColors[ev.status] ?? '#B9FF5A'}22`,
                        border: `1px solid ${eventColors[ev.status] ?? '#B9FF5A'}55`,
                        color: eventColors[ev.status] ?? '#c8ff78',
                        marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>{ev.title}</div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginTop:16 }}>
          {[
            { color:'#B9FF5A', label:'Partita' },
            { color:'#F2D35E', label:'In attesa' },
            { color:'#79A7D8', label:'Allenamento' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:l.color }} />
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </window.GlassCard>
    </div>
  );
}

// ── Nuova Partita ─────────────────────────────────────────────────────────────
function ScreenNuovaPartita({ onNavigate, addToast }) {
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState(window.VENUES[0]);
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const days = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];
  const times = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
  const avail = window.AVAILABILITY;

  const submit = () => {
    if (!opponent) { addToast({ message:'Seleziona un avversario.', tone:'warning' }); return; }
    addToast({ message:'Partita creata con successo! 🎾', tone:'success' });
    onNavigate('partite');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={() => onNavigate('partite')} style={{
          width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.09)',
          border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.7)',
          cursor:'pointer', fontSize:16,
        }}>←</button>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>Nuova partita</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>Crea e pianifica una partita</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Form */}
        <window.GlassCard style={{ padding:'24px' }}>
          <h3 style={{ margin:'0 0 18px', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Dettagli partita</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <window.GlassSelect label="Avversario" value={opponent} onChange={setOpponent}
              options={['Seleziona giocatore...', ...window.PLAYERS.filter(p=>p.id!=='luca').map(p=>p.name)]} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <window.GlassInput label="Data" type="date" value={date} onChange={setDate} />
              <window.GlassInput label="Ora" type="time" value={time} onChange={setTime} />
            </div>
            <window.GlassSelect label="Campo" value={venue} onChange={setVenue} options={window.VENUES} />
            <window.GlassInput label="Note (opzionale)" placeholder="Aggiungi una nota…" value={notes} onChange={setNotes} />
          </div>
        </window.GlassCard>
        {/* Availability Grid */}
        <window.GlassCard style={{ padding:'24px' }}>
          <h3 style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Disponibilità</h3>
          <p style={{ margin:'0 0 16px', fontSize:12, color:'rgba(255,255,255,0.4)' }}>Seleziona i giorni e gli orari in cui sei disponibile</p>
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'80px repeat(7,1fr)', gap:6, minWidth:400 }}>
              <div />
              {days.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700,
                  color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', padding:'2px 0' }}>{d}</div>
              ))}
              {['Mattina\n09–12','Pomeriggio\n12–18','Sera\n18–22'].map((row, ri) => (
                <React.Fragment key={ri}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', lineHeight:1.4,
                    display:'flex', alignItems:'center', whiteSpace:'pre-line' }}>{row}</div>
                  {avail[ri].map((available, ci) => {
                    const slotId = `${ri}-${ci}`;
                    const isSelected = selectedSlot === slotId;
                    return (
                      <div key={ci} onClick={() => available && setSelectedSlot(isSelected ? null : slotId)} style={{
                        height:36, borderRadius:8, cursor: available ? 'pointer' : 'not-allowed',
                        opacity: available ? 1 : 0.3,
                        background: isSelected
                          ? 'rgba(185,255,90,0.3)'
                          : available ? 'rgba(185,255,90,0.12)' : 'rgba(255,255,255,0.05)',
                        border: isSelected
                          ? '1px solid rgba(185,255,90,0.6)'
                          : available ? '1px solid rgba(185,255,90,0.25)' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? '0 0 14px rgba(185,255,90,0.25)' : 'none',
                        transition:'all 0.15s ease', display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:14,
                      }}>
                        {available ? (isSelected ? '✓' : '') : '—'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </window.GlassCard>
      </div>
      {/* Actions */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
        <window.BtnSecondary onClick={() => onNavigate('partite')}>Annulla</window.BtnSecondary>
        <window.BtnPrimary onClick={submit}>Crea partita</window.BtnPrimary>
      </div>
    </div>
  );
}

// ── Player Profile ────────────────────────────────────────────────────────────
function ScreenProfilo({ player, addToast }) {
  const [tab, setTab] = useState('Panoramica');
  if (!player) return null;
  const recentMatches = window.RECENT_MATCHES.filter(m => m.opponentId !== player.id).slice(0,3);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Profile header */}
      <window.GlassCard style={{ padding:'28px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <window.Avatar player={player} size={72} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
                {player.name}
              </h1>
              {player.id === 'luca' && (
                <span style={{
                  background:'rgba(185,255,90,0.18)', border:'1px solid rgba(185,255,90,0.4)',
                  borderRadius:999, padding:'2px 10px', fontSize:11, color:'#c8ff78', fontWeight:700,
                }}>Tu</span>
              )}
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)' }}>
              Livello {player.level} · {player.points.toLocaleString()} Punti
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
              Ranking #{player.ranking} · Win rate {player.winRate}%
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {player.id !== 'luca' && (
              <window.BtnSecondary small onClick={() => addToast({ message:`Messaggio inviato a ${player.name}!`, tone:'info' })}>
                💬 Messaggio
              </window.BtnSecondary>
            )}
            {player.id !== 'luca' && (
              <window.BtnPrimary small onClick={() => addToast({ message:`Sfida inviata a ${player.name}! 🎾`, tone:'success' })}>
                🎾 Sfida
              </window.BtnPrimary>
            )}
          </div>
        </div>
        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:20, paddingTop:20,
          borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label:'Ranking', value:`#${player.ranking}` },
            { label:'Punti', value:player.points.toLocaleString() },
            { label:'Win rate', value:`${player.winRate}%` },
            { label:'Partite', value:player.matches },
          ].map(k => (
            <div key={k.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,0.95)' }}>{k.value}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </window.GlassCard>

      <window.SegmentedControl
        options={['Panoramica','Statistiche','Cronologia partite']}
        value={tab} onChange={setTab} />

      {tab === 'Panoramica' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <window.GlassCard style={{ padding:'20px 22px' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Statistiche</h3>
            {[
              { label:'Vittorie', value:player.wins },
              { label:'Sconfitte', value:player.losses },
              { label:'Win rate', value:`${player.winRate}%` },
              { label:'Streak attuale', value:'+3 🔥' },
              { label:'Punti per partita', value:Math.round(player.points/player.matches) },
              { label:'Break point vinti', value:'60%' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>{s.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>{s.value}</span>
              </div>
            ))}
          </window.GlassCard>
          <window.GlassCard style={{ padding:'20px 22px' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Andamento punti</h3>
            <window.MiniLineChart data={window.POINTS_HISTORY} width={260} height={100} />
            <div style={{ marginTop:12, fontSize:12, color:'#b0ef60', fontWeight:600 }}>▲ 8% vs mese scorso</div>
          </window.GlassCard>
        </div>
      )}

      {tab === 'Cronologia partite' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {window.RECENT_MATCHES.map(m => (
            <window.GlassCard key={m.id} style={{ padding:'14px 18px' }} hover>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', minWidth:80 }}>{m.date}</div>
                <window.Avatar player={window.playerById(m.opponentId)} size={32} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>
                    vs {window.playerById(m.opponentId).name}
                  </div>
                </div>
                <div style={{ fontSize:15, fontFamily:'monospace', color:'rgba(255,255,255,0.8)', fontWeight:700 }}>
                  {m.score}
                </div>
                <window.StatusBadge status={m.result} />
              </div>
            </window.GlassCard>
          ))}
        </div>
      )}

      {tab === 'Statistiche' && (
        <window.GlassCard style={{ padding:'24px' }}>
          <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Andamento stagionale</h3>
          <window.MiniLineChart data={window.POINTS_HISTORY} width={500} height={120} />
        </window.GlassCard>
      )}
    </div>
  );
}

Object.assign(window, {
  ScreenClassifica, ScreenPartite, ScreenCalendario,
  ScreenNuovaPartita, ScreenProfilo,
});
