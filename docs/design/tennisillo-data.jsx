// Tennisillo — Mock Data & Design Tokens
const PLAYERS = [
  { id:'marco',    name:'Marco Verdi',       level:8, points:2340, ranking:1,  variation:0,  winRate:72, matches:28, wins:20, losses:8,  initials:'MV', hue:'142' },
  { id:'alex',     name:'Alessandro Neri',   level:7, points:2100, ranking:2,  variation:1,  winRate:68, matches:25, wins:17, losses:8,  initials:'AN', hue:'210' },
  { id:'giovanni', name:'Giovanni Rossi',    level:7, points:1980, ranking:3,  variation:-1, winRate:65, matches:36, wins:23, losses:13, initials:'GR', hue:'0'   },
  { id:'paolo',    name:'Paolo Bianchi',     level:6, points:1780, ranking:4,  variation:3,  winRate:60, matches:24, wins:14, losses:10, initials:'PB', hue:'28'  },
  { id:'andrea',   name:'Andrea Colombo',   level:6, points:1620, ranking:5,  variation:0,  winRate:58, matches:23, wins:13, losses:10, initials:'AC', hue:'280' },
  { id:'sofia',    name:'Sofia Martini',     level:5, points:1540, ranking:6,  variation:2,  winRate:55, matches:20, wins:11, losses:9,  initials:'SM', hue:'330' },
  { id:'matteo',   name:'Matteo Ferrari',    level:5, points:1480, ranking:7,  variation:-1, winRate:52, matches:18, wins:9,  losses:9,  initials:'MF', hue:'185' },
  { id:'chiara',   name:'Chiara Romano',     level:5, points:1460, ranking:8,  variation:0,  winRate:51, matches:22, wins:11, losses:11, initials:'CR', hue:'55'  },
  { id:'roberto',  name:'Roberto Esposito', level:4, points:1445, ranking:9,  variation:-2, winRate:50, matches:15, wins:7,  losses:8,  initials:'RE', hue:'165' },
  { id:'elena',    name:'Elena Conti',       level:4, points:1440, ranking:10, variation:1,  winRate:49, matches:17, wins:8,  losses:9,  initials:'EC', hue:'250' },
  { id:'franco',   name:'Franco Ricci',      level:4, points:1435, ranking:11, variation:0,  winRate:48, matches:14, wins:6,  losses:8,  initials:'FR', hue:'15'  },
  { id:'luca',     name:'Luca Bianchi',      level:7, points:1430, ranking:12, variation:2,  winRate:62, matches:24, wins:15, losses:9,  initials:'LB', hue:'85'  },
];

const CURRENT_PLAYER = PLAYERS.find(p => p.id === 'luca');

const UPCOMING_MATCHES = [
  { id:'u1', date:'24', month:'MAG', opponentId:'marco',    status:'confirmed', time:'10:00', venue:'Tennis Club Milano'  },
  { id:'u2', date:'27', month:'MAG', opponentId:'alex',     status:'pending',   time:'18:30', venue:'TC Ambrosiano'        },
  { id:'u3', date:'31', month:'MAG', opponentId:'giovanni', status:'confirmed', time:'15:00', venue:'Tennis Club Milano'  },
];

const RECENT_MATCHES = [
  { id:'r1', date:'12 Apr 2026', opponentId:'paolo',   score:'6-4  6-2',       result:'win'  },
  { id:'r2', date:'05 Apr 2026', opponentId:'andrea',  score:'3-6  7-5  6-3',  result:'win'  },
  { id:'r3', date:'28 Mar 2026', opponentId:'marco',   score:'2-6  4-6',       result:'loss' },
  { id:'r4', date:'20 Mar 2026', opponentId:'sofia',   score:'6-2  6-1',       result:'win'  },
  { id:'r5', date:'15 Mar 2026', opponentId:'matteo',  score:'6-4  5-7  7-6',  result:'win'  },
];

const CHALLENGES = [
  { id:'c1', fromId:'alex',  proposedDate:'28 Maggio', venue:'Tennis Club Milano' },
  { id:'c2', fromId:'paolo', proposedDate:'30 Maggio', venue:'TC Ambrosiano'       },
];

const ACTIVITY = [
  { id:'a1', text:'Marco Verdi ha accettato la sfida',              time:'2h fa',  type:'match'        },
  { id:'a2', text:'Nuova partita creata vs Alessandro Neri',         time:'5h fa',  type:'match'        },
  { id:'a3', text:'Giovanni Rossi ha aggiornato la disponibilità',  time:'1g fa',  type:'availability' },
  { id:'a4', text:'Paolo Bianchi ha confermato la partita',          time:'2g fa',  type:'match'        },
  { id:'a5', text:'La classifica è stata aggiornata',                time:'2g fa',  type:'ranking'      },
];

const POINTS_HISTORY = [1200, 1260, 1310, 1280, 1350, 1390, 1430];
const POINTS_DATES   = ['22 Apr','25 Apr','28 Apr','1 Mag','5 Mag','10 Mag','20 Mag'];

const CALENDAR_EVENTS = [
  { date:8,  type:'match',    title:'vs Sofia M.',      status:'confirmed' },
  { date:15, type:'sparring', title:'Allenamento',       status:'training'  },
  { date:19, type:'sparring', title:'Allenamento',       status:'training'  },
  { date:24, type:'match',    title:'vs Marco V.',       status:'confirmed' },
  { date:27, type:'match',    title:'vs Alessandro N.', status:'pending'   },
  { date:31, type:'match',    title:'vs Giovanni R.',   status:'confirmed' },
];

// availability[row][col]: row=Mattina/Pomeriggio/Sera, col=LUN–DOM
const AVAILABILITY = [
  [true,  true,  true,  true,  false, true,  true ],
  [false, true,  false, true,  true,  true,  false],
  [false, false, true,  false, true,  false, false],
];

const VENUES = ['Tennis Club Milano','TC Ambrosiano','Sport Village Assago','Circolo Canottieri','Parco Lambro Tennis'];

Object.assign(window, {
  PLAYERS, CURRENT_PLAYER,
  UPCOMING_MATCHES, RECENT_MATCHES,
  CHALLENGES, ACTIVITY,
  POINTS_HISTORY, POINTS_DATES,
  CALENDAR_EVENTS, AVAILABILITY, VENUES,
});
