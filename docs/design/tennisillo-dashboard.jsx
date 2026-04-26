// Tennisillo — Dashboard Screen

function Dashboard({ onNavigate, onPlayerClick, addToast }) {
  const cp = window.CURRENT_PLAYER;
  const [challenges, setChallenges] = useState(window.CHALLENGES);

  const acceptChallenge = (id) => {
    setChallenges(c => c.filter(x => x.id !== id));
    addToast({ message:'Sfida accettata! Partita creata.', tone:'success' });
  };
  const rejectChallenge = (id) => {
    setChallenges(c => c.filter(x => x.id !== id));
    addToast({ message:'Sfida rifiutata.', tone:'info' });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.97)', letterSpacing:'-0.02em' }}>
            Ciao, {cp.name.split(' ')[0]}! 👋
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.45)' }}>
            Ecco cosa succede nella tua lega
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button style={{
            width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.09)',
            border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.7)',
            cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
          }}>🔍</button>
          <button style={{
            width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.09)',
            border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.7)',
            cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
            position:'relative',
          }}>
            🔔
            <span style={{
              position:'absolute', top:7, right:7, width:8, height:8, borderRadius:'50%',
              background:'#B9FF5A', border:'2px solid rgba(0,0,0,0.3)',
            }} />
          </button>
          <window.BtnPrimary onClick={() => onNavigate('nuova-partita')}>
            <span style={{ fontSize:16 }}>＋</span> Nuova partita
          </window.BtnPrimary>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <window.KpiCard icon="🏆" label="Il tuo ranking" value={`${cp.ranking}°`} delta={cp.variation > 0 ? `+${cp.variation} posizioni` : null} positive />
        <window.KpiCard icon="⭐" label="Punti totali" value={cp.points.toLocaleString()} delta="+120 questa settimana" positive />
        <window.KpiCard icon="🎾" label="Partite giocate" value={cp.matches} delta="60% vinte" positive />
        <window.KpiCard icon="📈" label="Win rate" value={`${cp.winRate}%`} delta="+8%" positive />
      </div>

      {/* Main 2-col grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>

        {/* Prossime partite */}
        <window.GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Prossime partite</h2>
            <button onClick={() => onNavigate('calendario')} style={{
              background:'none', border:'none', color:'rgba(185,255,90,0.8)',
              cursor:'pointer', fontSize:12, fontWeight:600,
            }}>Vedi calendario →</button>
          </div>
          {window.UPCOMING_MATCHES.map(m => (
            <window.MatchRow key={m.id} match={m} showVenue />
          ))}
        </window.GlassCard>

        {/* Top 5 Ranking */}
        <window.GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Classifica — Top 5</h2>
            <button onClick={() => onNavigate('classifica')} style={{
              background:'none', border:'none', color:'rgba(185,255,90,0.8)',
              cursor:'pointer', fontSize:12, fontWeight:600,
            }}>Completa →</button>
          </div>
          {window.PLAYERS.filter(p => p.ranking <= 5).map(p => (
            <div key={p.id} onClick={() => onPlayerClick(p)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 0',
              borderBottom:'1px solid rgba(255,255,255,0.06)', cursor:'pointer',
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.45)', width:20 }}>{p.ranking}</div>
              <window.Avatar player={p} size={28} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.88)' }}>{p.name}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>{p.points.toLocaleString()}</div>
              {p.variation !== 0 && (
                <div style={{ fontSize:11, color: p.variation > 0 ? '#b0ef60' : '#f09090', fontWeight:700, width:28, textAlign:'right' }}>
                  {p.variation > 0 ? `▲${p.variation}` : `▼${Math.abs(p.variation)}`}
                </div>
              )}
            </div>
          ))}
          {/* Current player row */}
          {(() => { const p = window.CURRENT_PLAYER; return (
            <div onClick={() => onPlayerClick(p)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginTop:8,
              background:'rgba(185,255,90,0.10)', border:'1px solid rgba(185,255,90,0.28)',
              borderRadius:10, cursor:'pointer',
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#c8ff78', width:20 }}>{p.ranking}</div>
              <window.Avatar player={p} size={28} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#c8ff78' }}>{p.name}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#c8ff78' }}>{p.points.toLocaleString()}</div>
              <div style={{ fontSize:11, color:'#b0ef60', fontWeight:700, width:28, textAlign:'right' }}>▲{p.variation}</div>
            </div>
          ); })()}
        </window.GlassCard>
      </div>

      {/* Bottom 3-col grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

        {/* Stats */}
        <window.GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Le tue statistiche</h2>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>Ultimi 30 giorni</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[
              { label:'Vittorie', value:cp.wins },
              { label:'Sconfitte', value:cp.losses },
              { label:'Win rate', value:`${cp.winRate}%` },
              { label:'Streak', value:'+3', lime:true },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color: s.lime ? '#c8ff78' : 'rgba(255,255,255,0.9)' }}>{s.value}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <window.MiniLineChart data={window.POINTS_HISTORY} dates={window.POINTS_DATES} width={240} height={72} />
          <div style={{ fontSize:12, color:'#b0ef60', marginTop:8, fontWeight:600 }}>▲ 8% vs mese scorso</div>
        </window.GlassCard>

        {/* Activity */}
        <window.GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Attività recente</h2>
            <button style={{ background:'none', border:'none', color:'rgba(185,255,90,0.8)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              Vedi tutto →
            </button>
          </div>
          {window.ACTIVITY.slice(0,4).map(a => <window.ActivityItem key={a.id} item={a} />)}
        </window.GlassCard>

        {/* Challenges */}
        <window.GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Sfide ricevute</h2>
            {challenges.length > 0 && (
              <span style={{
                background:'rgba(185,255,90,0.2)', border:'1px solid rgba(185,255,90,0.35)',
                borderRadius:999, padding:'2px 8px', fontSize:11, color:'#c8ff78', fontWeight:700,
              }}>{challenges.length}</span>
            )}
          </div>
          {challenges.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'rgba(255,255,255,0.35)', fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🎾</div>
              Nessuna sfida ricevuta
            </div>
          ) : (
            challenges.map(c => (
              <window.ChallengeCard key={c.id} challenge={c}
                onAccept={() => acceptChallenge(c.id)}
                onReject={() => rejectChallenge(c.id)} />
            ))
          )}
        </window.GlassCard>
      </div>

      {/* XP Bar */}
      <window.GlassCard style={{ padding:'16px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            background:'linear-gradient(135deg,rgba(185,255,90,0.3),rgba(185,255,90,0.1))',
            border:'1px solid rgba(185,255,90,0.35)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, fontWeight:800, color:'#c8ff78',
          }}>{cp.level}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Livello {cp.level}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>2.340 / 3.000 XP · Prossimo livello: 660 XP</span>
            </div>
            <div style={{ height:6, borderRadius:999, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${(2340/3000)*100}%`, borderRadius:999,
                background:'linear-gradient(90deg,#8ee044,#c8ff78)',
                boxShadow:'0 0 10px rgba(185,255,90,0.5)',
              }} />
            </div>
          </div>
        </div>
      </window.GlassCard>

    </div>
  );
}

Object.assign(window, { Dashboard });
