// Tennisillo — Base UI Components + Domain Widgets

// ── Helpers ──────────────────────────────────────────────────────────────────
function playerById(id) { return window.PLAYERS.find(p => p.id === id) || {}; }

function Avatar({ player, size = 36 }) {
  const hue = player?.hue ?? '85';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.72 0.18 ${hue}), oklch(0.55 0.22 ${hue}))`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.36, fontWeight: 700, color:'rgba(0,0,0,0.75)',
      border:'1.5px solid rgba(255,255,255,0.25)',
      boxShadow:`0 0 14px oklch(0.65 0.18 ${hue} / 0.35)`,
      letterSpacing:'-0.02em',
    }}>
      {player?.initials ?? '?'}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { label:'Confermata', bg:'rgba(185,255,90,0.18)',  border:'rgba(185,255,90,0.4)',  color:'#c8ff78' },
    pending:   { label:'In attesa',  bg:'rgba(242,211,94,0.18)',  border:'rgba(242,211,94,0.4)',  color:'#f5d96a' },
    completed: { label:'Completata', bg:'rgba(121,167,216,0.18)', border:'rgba(121,167,216,0.4)', color:'#9abfdd' },
    cancelled: { label:'Annullata',  bg:'rgba(255,255,255,0.08)', border:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.5)' },
    disputed:  { label:'Contestata', bg:'rgba(233,109,109,0.18)', border:'rgba(233,109,109,0.4)', color:'#f09090' },
    win:       { label:'Vittoria',   bg:'rgba(185,255,90,0.18)',  border:'rgba(185,255,90,0.4)',  color:'#c8ff78' },
    loss:      { label:'Sconfitta',  bg:'rgba(233,109,109,0.18)', border:'rgba(233,109,109,0.4)', color:'#f09090' },
    training:  { label:'Allenamento',bg:'rgba(121,167,216,0.18)',border:'rgba(121,167,216,0.4)', color:'#9abfdd' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600,
      background:s.bg, border:`1px solid ${s.border}`, color:s.color, whiteSpace:'nowrap',
    }}>{s.label}</span>
  );
}

function BtnPrimary({ children, onClick, small }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background: hover
          ? 'linear-gradient(135deg,#d8ff88,#a0ef5a)'
          : 'linear-gradient(135deg,#c8ff6a,#8ee044)',
        color:'#0a1a0e', fontWeight:700, border:'none', cursor:'pointer',
        padding: small ? '7px 16px' : '10px 22px',
        borderRadius:14, fontSize: small ? 12 : 14,
        boxShadow:`0 8px 24px rgba(185,255,90,${hover?0.4:0.25})`,
        transform: hover ? 'translateY(-1px)' : 'none',
        transition:'all 0.18s ease', display:'flex', alignItems:'center', gap:6,
      }}>{children}</button>
  );
}

function BtnSecondary({ children, onClick, small, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background: hover
          ? (danger ? 'rgba(233,109,109,0.22)' : 'rgba(255,255,255,0.15)')
          : (danger ? 'rgba(233,109,109,0.12)' : 'rgba(255,255,255,0.09)'),
        color: danger ? '#f09090' : 'rgba(255,255,255,0.88)',
        border:`1px solid ${danger ? 'rgba(233,109,109,0.4)' : 'rgba(255,255,255,0.18)'}`,
        cursor:'pointer', padding: small ? '7px 16px' : '10px 22px',
        borderRadius:14, fontSize: small ? 12 : 14, fontWeight:600,
        transition:'all 0.18s ease', backdropFilter:'blur(12px)',
        display:'flex', alignItems:'center', gap:6,
      }}>{children}</button>
  );
}

function GlassCard({ children, style, onClick, hover: hoverClass }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov && hoverClass
          ? 'linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.07))'
          : 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))',
        border:'1px solid rgba(255,255,255,0.14)',
        borderRadius:20, backdropFilter:'blur(26px) saturate(140%)',
        boxShadow: hov && hoverClass
          ? '0 20px 50px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 14px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
        transform: hov && hoverClass ? 'translateY(-2px)' : 'none',
        transition:'all 0.22s ease', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>{children}</div>
  );
}

function GlassInput({ label, value, onChange, type='text', placeholder }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>{label}</label>}
      <input
        type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{
          background: focus ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
          border:`1px solid ${focus ? 'rgba(185,255,90,0.5)' : 'rgba(255,255,255,0.14)'}`,
          borderRadius:12, padding:'10px 14px', color:'rgba(255,255,255,0.9)',
          fontSize:14, outline:'none', width:'100%', boxSizing:'border-box',
          backdropFilter:'blur(12px)',
          boxShadow: focus ? '0 0 0 3px rgba(185,255,90,0.12)' : 'none',
          transition:'all 0.18s ease',
        }}
      />
    </div>
  );
}

function GlassSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{
          background:'rgba(12,28,36,0.85)', border:'1px solid rgba(255,255,255,0.14)',
          borderRadius:12, padding:'10px 14px', color:'rgba(255,255,255,0.9)',
          fontSize:14, outline:'none', width:'100%', backdropFilter:'blur(12px)',
          cursor:'pointer',
        }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display:'inline-flex', background:'rgba(255,255,255,0.07)',
      border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
      padding:3, gap:2,
    }}>
      {options.map(opt => (
        <button key={opt} onClick={()=>onChange(opt)} style={{
          padding:'6px 14px', borderRadius:10, border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, transition:'all 0.18s ease',
          background: value===opt ? 'rgba(185,255,90,0.2)' : 'transparent',
          color: value===opt ? '#c8ff78' : 'rgba(255,255,255,0.5)',
          boxShadow: value===opt ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
        }}>{opt}</button>
      ))}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, delta, positive=true }) {
  return (
    <GlassCard style={{ padding:'20px 22px' }} hover>
      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color:'rgba(255,255,255,0.96)', lineHeight:1.1, letterSpacing:'-0.02em' }}>{value}</div>
      {delta && (
        <div style={{ fontSize:12, color: positive ? '#b0ef60' : '#f09090', marginTop:5, fontWeight:600 }}>
          {positive ? '▲' : '▼'} {delta}
        </div>
      )}
    </GlassCard>
  );
}

// ── Match Row ─────────────────────────────────────────────────────────────────
function MatchRow({ match, showVenue }) {
  const opp = playerById(match.opponentId || match.opponentId);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'10px 4px',
      borderBottom:'1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ textAlign:'center', minWidth:38 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.9)', lineHeight:1 }}>{match.date}</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{match.month}</div>
      </div>
      <Avatar player={window.CURRENT_PLAYER} size={32} />
      <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>vs</span>
      <Avatar player={opp} size={32} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{opp.name}</div>
        {showVenue && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{match.venue}</div>}
      </div>
      <StatusBadge status={match.status} />
    </div>
  );
}

// ── Mini Line Chart ───────────────────────────────────────────────────────────
function MiniLineChart({ data, dates, width=300, height=80 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) - 50;
  const max = Math.max(...data) + 30;
  const pts = data.map((v,i) => {
    const x = (i / (data.length-1)) * width;
    const y = height - ((v - min) / (max - min)) * height;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B9FF5A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#B9FF5A" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lgArea)" />
      <path d={pathD} fill="none" stroke="#B9FF5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v,i) => {
        const [x,y] = pts[i].split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r={i===data.length-1?4:2.5}
          fill={i===data.length-1?'#B9FF5A':'rgba(185,255,90,0.7)'}
          stroke="rgba(185,255,90,0.5)" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

// ── Ranking Row ───────────────────────────────────────────────────────────────
function RankingRow({ player, isCurrentPlayer, onClick }) {
  const [hov, setHov] = useState(false);
  const isTop3 = player.ranking <= 3;
  const medal = ['🥇','🥈','🥉'];
  return (
    <div onClick={()=>onClick(player)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:'grid', gridTemplateColumns:'44px 1fr 90px 80px 80px 70px',
        alignItems:'center', padding:'10px 14px', borderRadius:14, cursor:'pointer',
        background: isCurrentPlayer
          ? 'rgba(185,255,90,0.10)'
          : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: isCurrentPlayer ? '1px solid rgba(185,255,90,0.3)' : '1px solid transparent',
        boxShadow: isCurrentPlayer ? '0 0 20px rgba(185,255,90,0.1)' : 'none',
        transition:'all 0.15s ease', marginBottom:2,
      }}>
      <div style={{ fontSize:14, fontWeight:700, color: isTop3 ? undefined : 'rgba(255,255,255,0.7)' }}>
        {isTop3 ? medal[player.ranking-1] : player.ranking}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <Avatar player={player} size={30} />
        <div>
          <div style={{ fontSize:13, fontWeight:600, color: isCurrentPlayer ? '#c8ff78' : 'rgba(255,255,255,0.9)' }}>{player.name}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Livello {player.level}</div>
        </div>
      </div>
      <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)', textAlign:'right' }}>{player.points.toLocaleString()}</div>
      <div style={{ textAlign:'right' }}>
        {player.variation === 0
          ? <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>—</span>
          : <span style={{ color: player.variation > 0 ? '#b0ef60' : '#f09090', fontSize:12, fontWeight:700 }}>
              {player.variation > 0 ? `▲ ${player.variation}` : `▼ ${Math.abs(player.variation)}`}
            </span>
        }
      </div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', textAlign:'right' }}>{player.winRate}%</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', textAlign:'right' }}>{player.matches}</div>
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ item }) {
  const icons = { match:'🎾', availability:'📅', ranking:'🏆', message:'💬', system:'📋' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0',
      borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{
        width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0,
      }}>{icons[item.type] ?? '•'}</div>
      <div style={{ flex:1, fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.4 }}>{item.text}</div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>{item.time}</div>
    </div>
  );
}

// ── Challenge Card ────────────────────────────────────────────────────────────
function ChallengeCard({ challenge, onAccept, onReject }) {
  const from = playerById(challenge.fromId);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px',
      background:'rgba(255,255,255,0.06)', borderRadius:14, marginBottom:8,
      border:'1px solid rgba(255,255,255,0.1)',
    }}>
      <Avatar player={from} size={38} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>{from.name}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Sfida per il {challenge.proposedDate}</div>
      </div>
      <button onClick={onReject} style={{
        width:30, height:30, borderRadius:10, border:'1px solid rgba(233,109,109,0.35)',
        background:'rgba(233,109,109,0.12)', color:'#f09090', cursor:'pointer', fontSize:14,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>✕</button>
      <button onClick={onAccept} style={{
        width:30, height:30, borderRadius:10, border:'1px solid rgba(185,255,90,0.4)',
        background:'rgba(185,255,90,0.15)', color:'#c8ff78', cursor:'pointer', fontSize:14,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>✓</button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  const colors = {
    success: { bg:'rgba(185,255,90,0.15)', border:'rgba(185,255,90,0.4)', icon:'✓', c:'#c8ff78' },
    info:    { bg:'rgba(121,167,216,0.15)',border:'rgba(121,167,216,0.4)',icon:'ℹ', c:'#9abfdd' },
    warning: { bg:'rgba(242,211,94,0.15)', border:'rgba(242,211,94,0.4)', icon:'!', c:'#f5d96a' },
    danger:  { bg:'rgba(233,109,109,0.15)',border:'rgba(233,109,109,0.4)',icon:'✕', c:'#f09090' },
  };
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => {
        const s = colors[t.tone] ?? colors.info;
        return (
          <div key={t.id} style={{
            background:s.bg, border:`1px solid ${s.border}`, borderRadius:14,
            padding:'12px 16px', backdropFilter:'blur(24px)', pointerEvents:'all',
            display:'flex', alignItems:'center', gap:10, minWidth:260,
            boxShadow:'0 10px 30px rgba(0,0,0,0.3)', animation:'slideIn 0.25s ease',
          }}>
            <span style={{ color:s.c, fontWeight:700, fontSize:14 }}>{s.icon}</span>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.9)', flex:1 }}>{t.message}</span>
            <button onClick={()=>remove(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:14, padding:0 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(10px)',
      zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        background:'linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))',
        border:'1px solid rgba(255,255,255,0.2)', borderRadius:24,
        backdropFilter:'blur(36px) saturate(150%)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)',
        padding:'28px 32px', width:'100%', maxWidth:480,
        animation:'modalIn 0.22s ease',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'rgba(255,255,255,0.95)' }}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)',
            background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)',
            cursor:'pointer', fontSize:14,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  Avatar, StatusBadge, BtnPrimary, BtnSecondary,
  GlassCard, GlassInput, GlassSelect, SegmentedControl,
  KpiCard, MatchRow, MiniLineChart, RankingRow,
  ActivityItem, ChallengeCard, Toast, Modal,
  playerById,
});
