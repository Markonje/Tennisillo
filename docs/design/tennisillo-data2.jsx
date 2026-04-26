// Tennisillo — Extended Mock Data v2

// ── Frequency / Availability ─────────────────────────────────────────────────
// frequencyStatus: 'green'|'yellow'|'red', weeklyPlayed/weeklyMax
const PLAYER_STATUS = {
  marco:    { freq:'red',    weeklyPlayed:3, weeklyMax:3, hot:true  },
  alex:     { freq:'yellow', weeklyPlayed:2, weeklyMax:3, hot:true  },
  giovanni: { freq:'green',  weeklyPlayed:0, weeklyMax:2, hot:false },
  paolo:    { freq:'green',  weeklyPlayed:1, weeklyMax:3, hot:true  },
  andrea:   { freq:'yellow', weeklyPlayed:2, weeklyMax:2, hot:true  },
  sofia:    { freq:'green',  weeklyPlayed:0, weeklyMax:2, hot:false },
  matteo:   { freq:'red',    weeklyPlayed:2, weeklyMax:2, hot:true  },
  chiara:   { freq:'green',  weeklyPlayed:1, weeklyMax:3, hot:true  },
  roberto:  { freq:'green',  weeklyPlayed:0, weeklyMax:2, hot:false },
  elena:    { freq:'yellow', weeklyPlayed:1, weeklyMax:2, hot:false },
  franco:   { freq:'green',  weeklyPlayed:0, weeklyMax:3, hot:false },
  luca:     { freq:'yellow', weeklyPlayed:2, weeklyMax:3, hot:true  },
};

// ── Head to Head ─────────────────────────────────────────────────────────────
const H2H = {
  marco:    { wins:2, losses:4, lastResult:'loss' },
  alex:     { wins:3, losses:2, lastResult:'win'  },
  giovanni: { wins:1, losses:3, lastResult:'loss' },
  paolo:    { wins:4, losses:1, lastResult:'win'  },
  andrea:   { wins:5, losses:0, lastResult:'win'  },
  sofia:    { wins:3, losses:1, lastResult:'win'  },
  matteo:   { wins:2, losses:2, lastResult:'win'  },
  chiara:   { wins:4, losses:2, lastResult:'win'  },
};

// ── Sfide Inviate / Ricevute ──────────────────────────────────────────────────
const SFIDE_RICEVUTE = [
  { id:'sr1', fromId:'alex',   type:'match',    proposedDate:'28 Maggio', venue:'TC Ambrosiano',       time:'18:30', status:'pending',  createdAt:'2h fa' },
  { id:'sr2', fromId:'paolo',  type:'match',    proposedDate:'30 Maggio', venue:'Tennis Club Milano', time:'10:00', status:'pending',  createdAt:'5h fa' },
  { id:'sr3', fromId:'chiara', type:'sparring', proposedDate:'25 Maggio', venue:'Sport Village',       time:'09:00', status:'pending',  createdAt:'1g fa' },
];
const SFIDE_INVIATE = [
  { id:'si1', toId:'marco',    type:'match',    proposedDate:'24 Maggio', venue:'Tennis Club Milano', time:'10:00', status:'confirmed', createdAt:'1g fa' },
  { id:'si2', toId:'giovanni', type:'match',    proposedDate:'31 Maggio', venue:'Tennis Club Milano', time:'15:00', status:'pending',   createdAt:'3h fa' },
  { id:'si3', toId:'sofia',    type:'sparring', proposedDate:'26 Maggio', venue:'TC Ambrosiano',       time:'17:00', status:'rejected',  createdAt:'2g fa' },
];

// ── Sparring History ──────────────────────────────────────────────────────────
const SPARRING_HISTORY = [
  { id:'sp1', opponentId:'alex',   date:'18 Mag', points:12, status:'completed' },
  { id:'sp2', opponentId:'chiara', date:'12 Mag', points:12, status:'completed' },
  { id:'sp3', opponentId:'paolo',  date:'5 Mag',  points:12, status:'completed' },
  { id:'sp4', opponentId:'sofia',  date:'28 Apr', points:12, status:'completed' },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGES = [
  { id:'b1',  icon:'🏆', name:'Campione',       desc:'Ha vinto la classifica stagione',             earned:false, progress:null },
  { id:'b2',  icon:'🔥', name:'In Fiamme',       desc:'5 vittorie consecutive vs avversari diversi',earned:false, progress:'3/5' },
  { id:'b3',  icon:'⚔️',  name:'Ammazzagiganti', desc:'Vittoria contro giocatore 2+ livelli sup.',  earned:true,  date:'12 Mar' },
  { id:'b4',  icon:'🛡️',  name:'Muro',           desc:'Sconfitta con max set per 5 volte',          earned:false, progress:'2/5' },
  { id:'b5',  icon:'🗺️',  name:'Esploratore',    desc:'Giocato contro tutti i membri almeno 1 volta',earned:false, progress:'7/12' },
  { id:'b6',  icon:'⚖️',  name:'Equilibrista',   desc:'Win rate 45-55% per tutta la stagione',      earned:false, progress:null },
  { id:'b7',  icon:'🥇', name:'Prima Vittoria',  desc:'Prima partita vinta nella lega',             earned:true,  date:'15 Feb' },
  { id:'b8',  icon:'👊', name:'Vendicatore',     desc:'3 rivincite nella stessa stagione',          earned:false, progress:'1/3' },
  { id:'b9',  icon:'💪', name:'Iron Man',        desc:'Almeno 1 partita ogni settimana della stagione',earned:false, progress:'6/13 sett.' },
  { id:'b10', icon:'🤝', name:'Sportivo',        desc:'Zero contestazioni in stagione',             earned:true,  date:'Stagione attiva' },
  { id:'b11', icon:'📚', name:'Studioso',        desc:'10 allenamenti con Maestro in stagione',     earned:false, progress:'0/10' },
  { id:'b12', icon:'🎾', name:'Compagno di Banco',desc:'10 sessioni Sparring completate',           earned:false, progress:'4/10' },
];

// ── Points Breakdown (per ultima partita) ─────────────────────────────────────
const POINTS_BREAKDOWN = [
  { match:'vs Paolo B. (Apr 12)', base:100, mLivello:50, mRisultato:20, bCostanza:10, bDiversificazione:15, bRivalsa:0, malus:0, total:195 },
  { match:'vs Andrea C. (Apr 5)', base:100, mLivello:0,  mRisultato:0,  bCostanza:5,  bDiversificazione:8,  bRivalsa:25, malus:0, total:138 },
  { match:'vs Marco V. (Mar 28)', base:30,  mLivello:33, mRisultato:0,  bCostanza:10, bDiversificazione:15, bRivalsa:0,  malus:0, total:88  },
  { match:'vs Sofia M. (Mar 20)', base:100, mLivello:0,  mRisultato:20, bCostanza:10, bDiversificazione:8,  bRivalsa:0,  malus:-8, total:130 },
  { match:'vs Matteo F. (Mar 15)',base:100, mLivello:0,  mRisultato:0,  bCostanza:5,  bDiversificazione:3,  bRivalsa:0,  malus:-18,total:90  },
];

// ── Bacheca / Feed Lega ────────────────────────────────────────────────────────
const BACHECA = [
  { id:'f1',  type:'match_result', time:'2h fa',  playerId:'marco',  text:'Marco Verdi ha battuto Alex Neri 6-3 6-4', likes:3, comments:1 },
  { id:'f2',  type:'ranking',      time:'3h fa',  playerId:null,     text:'🏆 La classifica è stata aggiornata. Marco Verdi mantiene la testa.', likes:2, comments:0 },
  { id:'f3',  type:'badge',        time:'5h fa',  playerId:'luca',   text:'Luca Bianchi ha conquistato il badge 🤝 Sportivo!', likes:5, comments:2 },
  { id:'f4',  type:'match_result', time:'1g fa',  playerId:'sofia',  text:'Sofia Martini ha battuto Roberto Esposito 6-2 7-5', likes:2, comments:0 },
  { id:'f5',  type:'sparring',     time:'1g fa',  playerId:'alex',   text:'Alessandro Neri e Chiara Romano hanno completato uno sparring', likes:1, comments:0 },
  { id:'f6',  type:'admin',        time:'2g fa',  playerId:null,     text:'📢 Admin: Ricordate che la stagione termina il 30 giugno. Accelerate con le partite!', likes:4, comments:3 },
  { id:'f7',  type:'match_result', time:'2g fa',  playerId:'paolo',  text:'Paolo Bianchi ha battuto Franco Ricci 6-4 6-2', likes:1, comments:0 },
  { id:'f8',  type:'badge',        time:'3g fa',  playerId:'marco',  text:'Marco Verdi ha conquistato il badge 🔥 In Fiamme!', likes:7, comments:4 },
  { id:'f9',  type:'challenge',    time:'3g fa',  playerId:'giovanni', text:'Giovanni Rossi ha lanciato una sfida a Elena Conti', likes:0, comments:0 },
  { id:'f10', type:'match_result', time:'4g fa',  playerId:'andrea', text:'Andrea Colombo ha battuto Roberto Esposito 7-6 6-3', likes:2, comments:1 },
];

// ── Allenamento con Maestro ───────────────────────────────────────────────────
const TRAINING_HISTORY = [
  { id:'t1', maestroId:'coach_mario', date:'15 Mag', focus:'Servizio',    xp:20, status:'validated' },
  { id:'t2', maestroId:'coach_mario', date:'8 Mag',  focus:'Rovescio',    xp:20, status:'validated' },
  { id:'t3', maestroId:'coach_mario', date:'1 Mag',  focus:'Tattica',     xp:20, status:'validated' },
  { id:'t4', maestroId:'coach_mario', date:'22 Apr', focus:'Volee',       xp:20, status:'validated' },
];
const COACH = { id:'coach_mario', name:'Mario Ferretti', initials:'MF', hue:'55', title:'Maestro FIT', xpGiven: 200 };

// ── Campi di Lega ─────────────────────────────────────────────────────────────
const CAMPI = [
  { id:'c1', name:'Tennis Club Milano',   address:'Via Arona 22, Milano',    surface:'Terra rossa', cover:'Scoperto', price:'15-20€/h', link:'https://tennisclubmilano.it', phone:'02 123456', status:'active' },
  { id:'c2', name:'TC Ambrosiano',        address:'Via Tortona 15, Milano',   surface:'Cemento',    cover:'Coperto',  price:'18-25€/h', link:'https://tcambrosiano.it',     phone:'02 654321', status:'active' },
  { id:'c3', name:'Sport Village Assago', address:'Via Roma 1, Assago',       surface:'Sintetico',   cover:'Coperto',  price:'20-28€/h', link:'https://sportvillage.it',     phone:'02 987654', status:'active' },
  { id:'c4', name:'Circolo Canottieri',   address:'Alzaia Naviglio 1, Milano',surface:'Terra rossa', cover:'Scoperto', price:'12-18€/h', link:'',                            phone:'02 111222', status:'active' },
  { id:'c5', name:'Parco Lambro Tennis',  address:'Via Feltre 55, Milano',    surface:'Terra rossa', cover:'Scoperto', price:'10-15€/h', link:'',                            phone:'',          status:'pending' },
];

// ── Smart Match Suggestions ───────────────────────────────────────────────────
const SMART_MATCHES = [
  { playerId:'paolo',   score:94, reasons:['Livello simile', 'Non giocate di recente', '3 slot compatibili'] },
  { playerId:'chiara',  score:88, reasons:['Livello simile', 'Frequenza disponibile', '2 slot compatibili'] },
  { playerId:'andrea',  score:82, reasons:['Diversificazione alta', '1 slot compatibile'] },
  { playerId:'giovanni',score:71, reasons:['Sfida difficile', 'Slot disponibili'] },
];

// ── Season Stats ──────────────────────────────────────────────────────────────
const SEASON_STATS = {
  totalPoints: 1430, pointsFromBase: 720, pointsFromBonuses: 710, pointsFromSparring: 48,
  winStreak: 3, bestStreak: 5, diversificationIndex: 0.74,
  uniqueOpponents: 9, setsWon: 31, setsLost: 18, gamesWon: 198, gamesLost: 142,
  decayRisk: false, lastMatchDaysAgo: 4,
  weeklyCompetitive: 2, weeklyMax: 3,
  sparkPoints: [1200,1260,1310,1280,1350,1390,1430],
  sparkWins:   [1,    2,    3,    3,    4,    5,    5 ],
};

// ── Disponibilità Settimanale (pattern) ──────────────────────────────────────
// 3 fasce orarie × 7 giorni
const MY_AVAILABILITY = [
  [false, true,  true,  true,  false, true,  true ],  // Mattina 8-12
  [false, true,  false, true,  true,  true,  true ],  // Pomeriggio 12-18
  [false, false, true,  false, true,  false, false],  // Sera 18-22
];

Object.assign(window, {
  PLAYER_STATUS, H2H,
  SFIDE_RICEVUTE, SFIDE_INVIATE,
  SPARRING_HISTORY, BADGES,
  POINTS_BREAKDOWN, BACHECA,
  TRAINING_HISTORY, COACH,
  CAMPI, SMART_MATCHES,
  SEASON_STATS, MY_AVAILABILITY,
});
