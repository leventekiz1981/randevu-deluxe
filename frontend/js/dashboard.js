/* =============================================
   RANDEVU-DELUXE — Dashboard Logik v2
   dashboard.js
   ============================================= */

// ════════════════════════════════════════════
// THEME SYSTEM
// ════════════════════════════════════════════
(function initTheme() {
  const saved = localStorage.getItem('rd-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  // Icon nach dem DOM-Load setzen
  document.addEventListener('DOMContentLoaded', () => updateThemeIcon(saved));
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('rd-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  const lbl = document.getElementById('theme-lbl');
  if (btn)  btn.innerHTML = theme === 'dark' ? '🌙 <span id="theme-lbl">Dark</span>' : '☀️ <span id="theme-lbl">Light</span>';
}

// ── KONSTANTEN ───────────────────────────────
const PX_MIN      = 1.5;   // px pro Minute → 90px/Stunde
const CAL_START_H = 8;     // Kalender startet 08:00
const CAL_END_H   = 20;    // Kalender endet  20:00
const TOTAL_PX    = (CAL_END_H - CAL_START_H) * 60 * PX_MIN; // 1080px

// ── YETKİLER ─────────────────────────────────
const PERM_DEFS = [
  { key:'calTüm',    icon:'📅', label:'Tüm randevuları gör'      },
  { key:'calDüzenle',icon:'✏️', label:'Randevu ekle / düzenle'   },
  { key:'müşteri',   icon:'👤', label:'Müşteri bilgilerini gör'  },
  { key:'kasa',      icon:'💰', label:'Bugün kasaya gir / tahsil et' },
  { key:'raporlar',  icon:'📊', label:'Geçmiş rapor & gelir görüntüle' },
  { key:'stok',      icon:'📦', label:'Stok yönetimi'            },
  { key:'kampanya',  icon:'🎯', label:'Kampanya & indirim'       },
  { key:'personel',  icon:'👥', label:'Personel yönetimi'        },
];

// ── PERSONEL ─────────────────────────────────
const STAFF = [
  { id:1, name:'Ahmet',   jobTitle:'Berber & Stilist', color:'#C9A84C', bg:'rgba(201,168,76,.18)',  appts:5, weekHours:42, revenue:2100, photo:null,
    perms:{ calTüm:true, calDüzenle:true, müşteri:true, kasa:true,  raporlar:true,  stok:true,  kampanya:true,  personel:true  } },
  { id:2, name:'Mehmet',  jobTitle:'Saç Uzmanı',       color:'#00C8FF', bg:'rgba(0,200,255,.18)',   appts:4, weekHours:38, revenue:1840, photo:null,
    perms:{ calTüm:false,calDüzenle:true, müşteri:true, kasa:true,  raporlar:false, stok:false, kampanya:false, personel:false } },
  { id:3, name:'Fatma',   jobTitle:'Güzellik Uzmanı',  color:'#E879A3', bg:'rgba(232,121,163,.18)', appts:4, weekHours:36, revenue:1640, photo:null,
    perms:{ calTüm:true, calDüzenle:true, müşteri:true, kasa:false, raporlar:false, stok:false, kampanya:false, personel:false } },
];

// ── AVATAR HELPER ─────────────────────────────
// Gibt HTML für Mitarbeiter-Avatar zurück (Foto oder Buchstaben-Kreis)
function _av(s, size=36, extraStyle='') {
  if (!s) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#666;${extraStyle}"></div>`;
  const fs = Math.round(size * 0.42);
  if (s.photo) {
    return `<img src="${s.photo}" alt="${s.name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;${extraStyle}">`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${s.color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fs}px;color:#fff;flex-shrink:0;${extraStyle}">${s.name[0]}</div>`;
}

// ── CUSTOMER AVATAR HELPER ────────────────────
// Gibt HTML für Kunden-Avatar zurück (Foto oder Initialen-Kreis)
const _CUST_COLORS = ['#C9A84C','#E879A3','#00C8FF','#7C6AF7','#34D399','#F97316','#FB7185','#A78BFA'];
function _custAv(c, size=36, extraStyle='') {
  if (!c) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#666;${extraStyle}"></div>`;
  const fs = Math.round(size * 0.42);
  const col = _CUST_COLORS[c.id % 8];
  if (c.photo) {
    return `<img src="${c.photo}" alt="${c.name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;${extraStyle}">`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fs}px;color:#fff;flex-shrink:0;${extraStyle}">${getInitials(c.name)}</div>`;
}

// ── HİZMET KATALOĞU ──────────────────────────
// price: null = Serbest (kasada girilir)
// duration: null = Belirsiz
// extras[].price: null = Serbest ek ücret
let SERVICE_CATALOG = [
  { id:1,  name:'Saç Kesimi',          category:'Saç',      price:150,  duration:30,  description:'',  active:true,
    extras:[ {id:1, name:'Yıkama', price:50}, {id:2, name:'Fön', price:null} ] },
  { id:2,  name:'Saç + Sakal',         category:'Saç',      price:220,  duration:50,  description:'',  active:true, extras:[] },
  { id:3,  name:'Sakal Tıraşı',        category:'Saç',      price:100,  duration:20,  description:'',  active:true, extras:[] },
  { id:4,  name:'Çocuk Kesimi',        category:'Saç',      price:100,  duration:20,  description:'',  active:true, extras:[] },
  { id:5,  name:'Saç Boyama',          category:'Renk',     price:null, duration:null,description:'Fiyat saça ve malzemeye göre değişir.', active:true,
    extras:[ {id:1, name:'Röfle ek', price:null}, {id:2, name:'Olaplex', price:200} ] },
  { id:6,  name:'Röfle & Boya',        category:'Renk',     price:null, duration:120, description:'',  active:true, extras:[] },
  { id:7,  name:'Keratin Bakımı',      category:'Bakım',    price:480,  duration:90,  description:'',  active:true,
    extras:[ {id:1, name:'Botoks ek', price:150} ] },
  { id:8,  name:'Fön & Şekillendirme', category:'Saç',      price:180,  duration:45,  description:'',  active:true, extras:[] },
  { id:9,  name:'Manikür & Pedikür',   category:'Tırnak',   price:280,  duration:60,  description:'',  active:true,
    extras:[ {id:1, name:'Jel oje', price:100}, {id:2, name:'Süsleme', price:50} ] },
  { id:10, name:'Cilt Bakımı',         category:'Cilt',     price:300,  duration:60,  description:'',  active:true, extras:[] },
  { id:11, name:'Masaj',               category:'Masaj',    price:500,  duration:60,  description:'',  active:true,
    extras:[ {id:1, name:'Özel yağ', price:100}, {id:2, name:'Aromatik', price:80} ] },
];
let svcIdCounter = 12;
let svcExtraIdCounter = 10;

// Rückwärtskompatibilität — kasse.js liest SERVICES
Object.defineProperty(window, 'SERVICES', { get: () => SERVICE_CATALOG.filter(s => s.active) });

// ── BUGÜNKÜ RANDEVULAR ────────────────────────
const TODAY_APPOINTMENTS = [
  { id:1,  staffId:1, time:'09:00', end:'09:30', duration:30,  name:'Mehmet Yılmaz',  service:'Saç Kesimi',          price:150, status:'confirmed', phone:'905551112233' },
  { id:2,  staffId:2, time:'09:30', end:'11:30', duration:120, name:'Buse Demir',     service:'Röfle & Boya',        price:550, status:'confirmed', phone:'905559876543' },
  { id:3,  staffId:3, time:'10:00', end:'10:30', duration:30,  name:'Mert Kaya',      service:'Sakal Tıraşı',        price:100, status:'confirmed', phone:'905555551234' },
  { id:4,  staffId:1, time:'10:30', end:'12:00', duration:90,  name:'Leyla Arslan',   service:'Saç Boyama',          price:420, status:'pending',   phone:'905553219876' },
  { id:5,  staffId:2, time:'12:00', end:'12:45', duration:45,  name:'Can Öztürk',     service:'Saç Kesimi',          price:150, status:'confirmed', phone:'905556667788' },
  { id:6,  staffId:1, time:'12:00', end:'13:00', duration:60,  name:'—',              service:'Öğle Arası',          price:0,   status:'break',     phone:'' },
  { id:7,  staffId:3, time:'11:00', end:'12:30', duration:90,  name:'Zeynep Yıldız',  service:'Manikür & Pedikür',   price:280, status:'confirmed', phone:'905552223344' },
  { id:8,  staffId:1, time:'13:30', end:'14:15', duration:45,  name:'Selin Çelik',    service:'Fön & Şekillendirme', price:180, status:'confirmed', phone:'905554445566' },
  { id:9,  staffId:2, time:'14:00', end:'14:30', duration:30,  name:'Emre Şahin',     service:'Saç Kesimi',          price:150, status:'confirmed', phone:'905557778899' },
  { id:10, staffId:3, time:'13:00', end:'14:00', duration:60,  name:'Elif Kaya',      service:'Cilt Bakımı',         price:300, status:'confirmed', phone:'905551234567' },
];

// ── WOCHE ─────────────────────────────────────
// Für Wochenansicht: Termine der ganzen Woche (Mon–So)
function getWeekAppointments(mondayDate) {
  const base = [
    { day:0, staffId:2, time:'09:00', end:'09:45', duration:45, name:'Aslı Kara',     service:'Saç Kesimi',   price:150, status:'confirmed' },
    { day:0, staffId:1, time:'10:00', end:'10:30', duration:30, name:'Okan Doğan',    service:'Sakal Tıraşı', price:100, status:'confirmed' },
    { day:1, staffId:3, time:'09:00', end:'10:00', duration:60, name:'Nisan Yıldız',  service:'Cilt Bakımı',  price:300, status:'confirmed' },
    { day:1, staffId:1, time:'11:00', end:'12:00', duration:60, name:'Barış Çelik',   service:'Saç + Sakal',  price:220, status:'pending'   },
    { day:2, staffId:2, time:'10:00', end:'12:00', duration:120,name:'Derya Kılıç',   service:'Röfle & Boya', price:550, status:'confirmed' },
    { day:2, staffId:3, time:'13:00', end:'14:30', duration:90, name:'Seda Aslan',    service:'Keratin',      price:480, status:'confirmed' },
    { day:3, ...TODAY_APPOINTMENTS[0], day:3 }, // Heute
    { day:3, ...TODAY_APPOINTMENTS[1], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[2], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[3], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[4], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[6], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[7], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[8], day:3 },
    { day:3, ...TODAY_APPOINTMENTS[9], day:3 },
    { day:4, staffId:1, time:'09:00', end:'09:30', duration:30,  name:'Kamil Arslan',  service:'Saç Kesimi',         price:150, status:'confirmed' },
    { day:4, staffId:1, time:'10:00', end:'10:45', duration:45,  name:'Tarık Yılmaz',  service:'Saç + Sakal',         price:220, status:'confirmed' },
    { day:4, staffId:1, time:'11:00', end:'11:30', duration:30,  name:'Cem Aydın',     service:'Saç Kesimi',          price:150, status:'confirmed' },
    { day:4, staffId:1, time:'12:30', end:'13:00', duration:30,  name:'Tolga Kara',    service:'Sakal Tıraşı',        price:100, status:'pending'   },
    { day:4, staffId:1, time:'14:00', end:'14:30', duration:30,  name:'Murat Şen',     service:'Saç Kesimi',          price:150, status:'confirmed' },
    { day:4, staffId:1, time:'15:30', end:'16:00', duration:30,  name:'Burak Doğan',   service:'Saç Kesimi',          price:150, status:'confirmed' },
    { day:4, staffId:2, time:'09:30', end:'11:30', duration:120, name:'Pınar Demir',   service:'Röfle & Boya',        price:550, status:'confirmed' },
    { day:4, staffId:2, time:'12:00', end:'12:45', duration:45,  name:'Selin Arslan',  service:'Fön & Şekillendirme', price:180, status:'confirmed' },
    { day:4, staffId:2, time:'13:30', end:'14:00', duration:30,  name:'Hande Koç',     service:'Saç Kesimi',          price:150, status:'confirmed' },
    { day:4, staffId:2, time:'15:00', end:'16:00', duration:60,  name:'Ayşe Çelik',    service:'Keratin Bakımı',      price:480, status:'pending'   },
    { day:4, staffId:3, time:'10:00', end:'11:00', duration:60,  name:'Merve Yıldız',  service:'Manikür & Pedikür',  price:280, status:'confirmed' },
    { day:4, staffId:3, time:'11:30', end:'13:00', duration:90,  name:'Gamze Demir',   service:'Cilt Bakımı',         price:300, status:'confirmed' },
    { day:4, staffId:3, time:'14:00', end:'14:30', duration:30,  name:'Nisa Kaya',     service:'Sakal Tıraşı',        price:100, status:'confirmed' },
    { day:5, staffId:3, time:'10:00', end:'11:30', duration:90,  name:'Gözde Şahin',   service:'Saç Boyama',          price:420, status:'confirmed' },
    { day:5, staffId:1, time:'11:00', end:'11:30', duration:30,  name:'Ali Yılmaz',    service:'Saç Kesimi',          price:150, status:'confirmed' },
    { day:5, staffId:2, time:'09:00', end:'10:00', duration:60,  name:'Dilara Çelik',  service:'Manikür',             price:280, status:'confirmed' },
    { day:6, staffId:1, time:'09:00', end:'09:30', duration:30,  name:'Mert Özkan',    service:'Saç Kesimi',          price:150, status:'confirmed' },
    { day:6, staffId:2, time:'10:00', end:'10:30', duration:30,  name:'Kaan Şahin',    service:'Sakal Tıraşı',        price:100, status:'confirmed' },
  ];
  return base;
}

// ── GELİR VERİLERİ ────────────────────────────
const REVENUE_DATA = [
  { month:'Eki', value:7800  },
  { month:'Kas', value:9200  },
  { month:'Ara', value:11400 },
  { month:'Oca', value:8600  },
  { month:'Şub', value:10100 },
  { month:'Mar', value:10900 },
  { month:'Nis', value:12400, current:true },
];

// ── MÜŞTERİLER ───────────────────────────────
let custIdCounter = 8;
let CUSTOMERS = [
  { id:1, name:'Mehmet Yılmaz', phone:'905321112233', email:'mehmet@example.com', birthday:'1985-03-15', gender:'Erkek', notes:'Kısa kesim tercih eder.', photo:null, preferredStaffId:1, tags:['VIP','Düzenli'],
    history:[
      { date:'2026-04-16', service:'Saç Kesimi',   staffId:1, staff:'Ahmet', price:150, total:150, paid:'nakit' },
      { date:'2026-04-02', service:'Saç + Sakal',  staffId:1, staff:'Ahmet', price:220, total:220, paid:'kart'  },
      { date:'2026-03-15', service:'Saç Kesimi',   staffId:1, staff:'Ahmet', price:150, total:150, paid:'nakit' },
    ]},
  { id:2, name:'Buse Demir',    phone:'905554445566', email:'buse@example.com', birthday:'1993-07-22', gender:'Kadın', notes:'Boyaya karşı hafif reaksiyon.', photo:null, preferredStaffId:2, tags:['VIP'],
    history:[
      { date:'2026-04-16', service:'Röfle & Boya', staffId:2, staff:'Mehmet', price:550, total:550, paid:'kart'  },
      { date:'2026-03-01', service:'Saç Boyama',   staffId:2, staff:'Mehmet', price:420, total:420, paid:'kart'  },
    ]},
  { id:3, name:'Leyla Arslan',  phone:'905437778899', email:'leyla@example.com', birthday:'1990-11-05', gender:'Kadın', notes:'', photo:null, preferredStaffId:1, tags:['Düzenli'],
    history:[
      { date:'2026-04-16', service:'Saç Boyama',    staffId:1, staff:'Ahmet', price:420, total:420, paid:'nakit' },
      { date:'2026-03-20', service:'Keratin Bakımı',staffId:1, staff:'Ahmet', price:480, total:480, paid:'kart'  },
    ]},
  { id:4, name:'Elif Kaya',     phone:'905012223344', email:'elif@example.com', birthday:'1988-04-30', gender:'Kadın', notes:'Lateks alerjisi var.', photo:null, preferredStaffId:3, tags:[],
    history:[
      { date:'2026-04-16', service:'Cilt Bakımı',        staffId:3, staff:'Fatma', price:300, total:300, paid:'kart'  },
      { date:'2026-03-05', service:'Manikür & Pedikür',  staffId:3, staff:'Fatma', price:280, total:280, paid:'nakit' },
    ]},
  { id:5, name:'Zeynep Yıldız', phone:'905329990011', email:'', birthday:'1996-02-14', gender:'Kadın', notes:'', photo:null, preferredStaffId:null, tags:[],
    history:[
      { date:'2026-04-16', service:'Manikür & Pedikür', staffId:3, staff:'Fatma', price:280, total:280, paid:'nakit' },
    ]},
  { id:6, name:'Can Öztürk',   phone:'905451234567', email:'', birthday:'1978-09-08', gender:'Erkek', notes:'', photo:null, preferredStaffId:2, tags:[],
    history:[
      { date:'2026-04-16', service:'Saç Kesimi', staffId:2, staff:'Mehmet', price:150, total:150, paid:'nakit' },
    ]},
  { id:7, name:'Selin Çelik',  phone:'905323334455', email:'selin@example.com', birthday:'2001-06-20', gender:'Kadın', notes:'', photo:null, preferredStaffId:2, tags:['Düzenli'],
    history:[
      { date:'2026-04-16', service:'Fön & Şekillendirme', staffId:2, staff:'Mehmet', price:180, total:180, paid:'kart'  },
      { date:'2026-04-01', service:'Saç Boyama',           staffId:2, staff:'Mehmet', price:420, total:420, paid:'nakit' },
    ]},
];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}
function getLastVisit(c) {
  if (!c.history?.length) return '—';
  const sorted = [...c.history].sort((a,b) => b.date.localeCompare(a.date));
  return _fmtDate ? _fmtDate(sorted[0].date) : sorted[0].date;
}
function getLastPrice(customerId, serviceName) {
  const c = CUSTOMERS.find(x => x.id === customerId);
  const h = c?.history?.find(x => x.service === serviceName);
  return h ? h.price : null;
}

// ── SALON KONFİGÜRASYONU ─────────────────────
let SALON_CONFIG = {
  id:          'RD-00142',   // Salon ID — später aus DB
  name:        "Ahmet's Barber",
  tagline:     'Profesyonel Berber & Güzellik Salonu',
  plan:        'pro',
  expiryDate:  '2027-02-14',
  waUsed:      312,
  logo:        null,
  phone:       '+90 532 111 22 33',
  email:       'info@ahmetsbarber.com',
  address:     'Atatürk Cad. No:42',
  district:    'Kadıköy',
  city:        'İstanbul',
  postalCode:  '34710',
  description: 'Ahmet\'s Barber olarak 10 yılı aşkın deneyimimizle saç kesimi, sakal tıraşı, boya ve bakım hizmetleri sunuyoruz. Uzman kadromuz ve modern ekipmanlarımızla her müşterimize özel hizmet veriyoruz.',
  hours: [
    { day:'Pazartesi', open:true,  start:'09:00', end:'19:00' },
    { day:'Salı',      open:true,  start:'09:00', end:'19:00' },
    { day:'Çarşamba',  open:true,  start:'09:00', end:'19:00' },
    { day:'Perşembe',  open:true,  start:'09:00', end:'19:00' },
    { day:'Cuma',      open:true,  start:'09:00', end:'19:00' },
    { day:'Cumartesi', open:true,  start:'10:00', end:'17:00' },
    { day:'Pazar',     open:false, start:'10:00', end:'15:00' },
  ],
  social: {
    instagram:  'ahmetsbarberistanbul',
    facebook:   '',
    tiktok:     '',
    whatsapp:   '905321112233',
    website:    '',
    googlemaps: '',
  },
  notifications: {
    whatsappEnabled: true,
    smsEnabled:      false,
    reminderMinutes: 60,   // 0 = devre dışı, 15/30/60/120/180/1440
  },
};

// ── PLAN FEATURES ────────────────────────────
// Hangi plan welche Features hat
const PLAN_FEATURES = {
  free: { kasa:false, stok:false, kampanya:false },
  std:  { kasa:false, stok:false, kampanya:false },
  pro:  { kasa:true,  stok:false, kampanya:false },
  lux:  { kasa:true,  stok:true,  kampanya:true  },
};

function _planHas(feature) {
  const plan = (SALON_CONFIG && SALON_CONFIG.plan) || 'free';
  return !!(PLAN_FEATURES[plan] && PLAN_FEATURES[plan][feature]);
}

// Liefert Gate-HTML wenn kein Zugang, sonst null
function _gateHtml(feature, planNeeded) {
  if (_planHas(feature)) return null;
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                padding:60px 24px;text-align:center;min-height:260px">
      <div style="font-size:3.5rem;margin-bottom:16px">🔒</div>
      <div style="font-size:1.05rem;font-weight:700;color:var(--tx);margin-bottom:8px">
        Bu özellik <span style="color:var(--gold)">${planNeeded}</span> planından itibaren kullanılabilir
      </div>
      <div style="font-size:.83rem;color:var(--tx2);max-width:320px;line-height:1.6;margin-bottom:22px">
        Planınızı yükselterek bu özelliğe ve daha fazlasına erişebilirsiniz.
      </div>
      <button onclick="showView('abonelik')"
              style="padding:11px 24px;background:var(--gold);color:#080808;border:none;
                     border-radius:10px;font-weight:700;font-size:.88rem;cursor:pointer">
        💎 Planları Gör →
      </button>
    </div>`;
}

// ── KALENDER ZUSTAND ──────────────────────────
const calState = {
  view:        'day',
  date:        new Date(),      // aktuelles Datum im Kalender
  staffFilter: 'all',           // 'all' | staffId
};

// ── DETAILMODAL ZUSTAND ───────────────────────
let currentDetailAppt = null;

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  renderOverviewAppointments();
  renderMiniRevenueChart();
  renderCustomers();
  renderStaffView();
  renderStaffRevenueTable();
  renderServiceRevenueTable();
  renderFullRevenueChart();
  initCalendar();
  initNewApptForm();
  renderKasseAppointments(); // aus kasse.js
  updateKasseSummary();      // aus kasse.js
});

// ── Datum setzen ──────────────────────────────
function setTodayDate() {
  const el = document.getElementById('today-date');
  if (el) el.textContent = new Date().toLocaleDateString('tr-TR', {
    weekday:'long', day:'numeric', month:'long'
  });
}

// ── Navigation ────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  // Mobile bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const mobileBtn = document.getElementById('nav-' + name);
  if (mobileBtn) mobileBtn.classList.add('active');

  // Desktop top nav
  document.querySelectorAll('.desktop-nav-item').forEach(b => b.classList.remove('active'));
  const desktopBtn = document.getElementById('dnav-' + name);
  if (desktopBtn) desktopBtn.classList.add('active');

  window.scrollTo({ top:0, behavior:'smooth' });

  // Kalender beim ersten Öffnen rendern
  if (name === 'takvim')    renderCalendar();
  if (name === 'hizmetler') renderHizmetler();
  if (name === 'ayarlar')   renderAyarlar();
}

// ════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════
function renderOverviewAppointments() {
  const list = document.getElementById('appt-list-ov');
  if (!list) return;
  const appts = TODAY_APPOINTMENTS.filter(a => a.status !== 'break').slice(0, 6);

  // Bugünkü geliri hesapla
  const todayRevenue = TODAY_APPOINTMENTS
    .filter(a => a.status === 'confirmed')
    .reduce((sum, a) => sum + a.price, 0);
  const revEl = document.getElementById('ov-today-revenue');
  if (revEl) {
    revEl.textContent = todayRevenue >= 1000
      ? '₺' + (todayRevenue / 1000).toFixed(1) + 'K'
      : '₺' + todayRevenue;
  }
  list.innerHTML = appts.map(a => {
    const staff = STAFF.find(s => s.id === a.staffId);
    return `
      <div class="appt-item" onclick="openApptDetail(${a.id})">
        <div class="appt-time-box">
          <div class="appt-hour">${a.time}</div>
          <div class="appt-dur">${a.duration} dk</div>
        </div>
        <div style="width:4px;height:36px;border-radius:2px;background:${staff?.color || '#444'};flex-shrink:0"></div>
        <div class="appt-info">
          <div class="appt-name">${a.name}</div>
          <div class="appt-service">${a.service} · ₺${a.price} · ${staff?.name || '—'}</div>
        </div>
        <div class="appt-actions">
          <span class="badge ${a.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}">
            ${a.status === 'confirmed' ? '✓ Onaylı' : '⏳ Bekliyor'}
          </span>
        </div>
      </div>`;
  }).join('');
}

function renderMiniRevenueChart() {
  const el = document.getElementById('rev-chart-mini');
  if (!el) return;
  const max = Math.max(...REVENUE_DATA.map(d => d.value));
  el.innerHTML = REVENUE_DATA.map(d => `
    <div class="rev-bar-wrap">
      <div class="rev-bar ${d.current ? 'cur' : ''}" style="height:${Math.round(d.value/max*100)}%"
           title="₺${d.value.toLocaleString('tr-TR')}"></div>
      <div class="rev-bar-lbl">${d.month}</div>
    </div>`).join('');
}

// ════════════════════════════════════════════
// MÜŞTERİLER
// ════════════════════════════════════════════
function renderCustomers() {
  const listEl  = document.getElementById('cust-list');
  const countEl = document.getElementById('cust-count');
  if (!listEl) return;
  if (countEl) countEl.textContent = `${CUSTOMERS.length} müşteri`;
  filterCustomers(document.getElementById('cust-search-input')?.value || '');
}

function _custTagsHtml(tags) {
  if (!tags?.length) return '';
  return tags.map(t => {
    const cls = t === 'VIP' ? 'vip' : t === 'Düzenli' ? 'duzenli' : '';
    return `<span class="cust-tag${cls ? ' '+cls : ''}">${t}</span>`;
  }).join(' ');
}

function _fmtDate(iso) {
  if (!iso) return '—';
  try {
    const [y,m,d] = iso.split('-');
    return `${d}.${m}.${y}`;
  } catch(e) { return iso; }
}

function filterCustomers(query) {
  const listEl = document.getElementById('cust-list');
  if (!listEl) return;
  const q = query.toLowerCase().trim();
  const filtered = q
    ? CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.toLowerCase().includes(q))
      )
    : CUSTOMERS;

  const newBtn = `<div class="cust-new-btn" onclick="openNewCustomerModal()">＋ Yeni Müşteri Ekle</div>`;

  if (!filtered.length) {
    listEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--tx2);font-size:.86rem">Müşteri bulunamadı.</div>${newBtn}`;
    return;
  }

  const total = c => (c.history || []).reduce((s, h) => s + (h.total || h.price || 0), 0);
  const lastVisitDate = c => c.history?.length ? c.history[0].date : null;

  listEl.innerHTML = filtered.map(c => `
    <div class="cust-item" onclick="openCustomerDetail(${c.id})" style="cursor:pointer">
      ${_custAv(c, 40)}
      <div class="cust-info" style="flex:1;min-width:0">
        <div class="cust-name">${c.name} ${_custTagsHtml(c.tags)}</div>
        <div class="cust-phone">${c.phone}</div>
      </div>
      <div class="cust-stats" style="text-align:right;flex-shrink:0;font-size:.75rem">
        <div class="cust-appt-count">${c.history?.length || 0} ziyaret</div>
        <div class="cust-last-visit">${lastVisitDate(c) ? _fmtDate(lastVisitDate(c)) : '—'}</div>
        <div style="color:var(--gold);font-weight:700;font-size:.78rem">₺${total(c).toLocaleString('tr')}</div>
      </div>
      <div style="color:var(--tx3);font-size:.9rem;margin-left:4px">›</div>
    </div>`).join('') + newBtn;
}

// ── Müşteri Profil Modal ─────────────────────
let _custDetailId = null;
let _custActiveTab = 'gecmis';

function openCustomerDetail(custId) {
  _custDetailId = custId;
  _custActiveTab = 'gecmis';
  renderCustomerDetail(custId);
  document.getElementById('cust-detail-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function switchCustTab(tab, btn) {
  _custActiveTab = tab;
  document.querySelectorAll('.cd-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _renderCustTabContent(_custDetailId, tab);
}

function _renderCustTabContent(custId, tab) {
  const c = CUSTOMERS.find(x => x.id === custId);
  const panel = document.getElementById('cd-tab-panel');
  if (!c || !panel) return;

  if (tab === 'gecmis') {
    if (!c.history?.length) {
      panel.innerHTML = `<div style="text-align:center;padding:32px;color:var(--tx2);font-size:.86rem">Henüz hizmet kaydı yok.</div>`;
      return;
    }
    panel.innerHTML = [...c.history].sort((a,b) => b.date.localeCompare(a.date)).map(h => {
      const staffObj = STAFF.find(s => s.id === h.staffId);
      const paidCls  = h.paid === 'nakit' ? 'nakit' : 'kart';
      const paidLbl  = h.paid === 'nakit' ? 'Nakit' : 'Kart';
      return `
        <div class="cd-hist-row">
          <div class="cd-hist-date">${_fmtDate(h.date)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.84rem;font-weight:600">${h.service}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
              ${staffObj ? _av(staffObj, 20) : ''}
              <span style="font-size:.73rem;color:var(--tx2)">${h.staff}</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-weight:700;color:var(--gold);font-size:.86rem">₺${(h.total||h.price).toLocaleString('tr')}</div>
            <span class="cd-paid-badge ${paidCls}">${paidLbl}</span>
          </div>
        </div>`;
    }).join('');
  }

  else if (tab === 'bilgiler') {
    const staffOpts = STAFF.map(s =>
      `<option value="${s.id}" ${c.preferredStaffId===s.id?'selected':''}>${s.name}</option>`
    ).join('');
    panel.innerHTML = `
      <div class="cd-form-row"><label class="cd-form-lbl">Ad Soyad</label>
        <input class="cd-form-inp" id="cbi-name" value="${c.name||''}"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">Telefon</label>
        <input class="cd-form-inp" id="cbi-phone" value="${c.phone||''}"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">E-posta</label>
        <input class="cd-form-inp" id="cbi-email" type="email" value="${c.email||''}"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">Doğum Tarihi</label>
        <input class="cd-form-inp" id="cbi-birthday" type="date" value="${c.birthday||''}"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">Cinsiyet</label>
        <select class="cd-form-inp" id="cbi-gender">
          <option value="Belirtilmemiş" ${(!c.gender||c.gender==='Belirtilmemiş')?'selected':''}>Belirtilmemiş</option>
          <option value="Erkek" ${c.gender==='Erkek'?'selected':''}>Erkek</option>
          <option value="Kadın" ${c.gender==='Kadın'?'selected':''}>Kadın</option>
        </select></div>
      <div class="cd-form-row"><label class="cd-form-lbl">Tercih edilen personel</label>
        <select class="cd-form-inp" id="cbi-staff">
          <option value="">— Belirtilmemiş —</option>
          ${staffOpts}
        </select></div>
      <button class="cd-save-btn" onclick="saveCustInfo(${c.id})">💾 Kaydet</button>`;
  }

  else if (tab === 'notlar') {
    panel.innerHTML = `
      <textarea class="cd-notes-input" id="cbi-notes" placeholder="Müşteri notu…">${c.notes||''}</textarea>
      <button class="cd-save-btn" style="margin-top:10px" onclick="saveCustNotes(${c.id})">💾 Kaydet</button>`;
  }
}

function saveCustInfo(custId) {
  const c = CUSTOMERS.find(x => x.id === custId);
  if (!c) return;
  c.name             = document.getElementById('cbi-name')?.value.trim()    || c.name;
  c.phone            = document.getElementById('cbi-phone')?.value.trim()   || c.phone;
  c.email            = document.getElementById('cbi-email')?.value.trim()   || '';
  c.birthday         = document.getElementById('cbi-birthday')?.value       || '';
  c.gender           = document.getElementById('cbi-gender')?.value         || 'Belirtilmemiş';
  const sid          = document.getElementById('cbi-staff')?.value;
  c.preferredStaffId = sid ? parseInt(sid) : null;
  showMsg('✅ Müşteri bilgileri kaydedildi.', 'green');
  renderCustomerDetail(custId);
}

function saveCustNotes(custId) {
  const c = CUSTOMERS.find(x => x.id === custId);
  if (!c) return;
  c.notes = document.getElementById('cbi-notes')?.value || '';
  showMsg('✅ Not kaydedildi.', 'green');
}

function renderCustomerDetail(custId) {
  const c = CUSTOMERS.find(x => x.id === custId);
  if (!c) return;

  const modal = document.getElementById('cust-detail-modal');
  if (!modal) return;

  const total   = (c.history || []).reduce((s, h) => s + (h.total || h.price || 0), 0);
  const avgBasket = c.history?.length ? Math.round(total / c.history.length) : 0;
  const lastDate  = c.history?.length ? _fmtDate([...c.history].sort((a,b) => b.date.localeCompare(a.date))[0].date) : '—';

  const sheet = modal.querySelector('.cust-detail-sheet');
  sheet.innerHTML = `
    <!-- Header -->
    <div class="cust-detail-hdr" style="flex-direction:column;align-items:flex-start;gap:10px;padding:16px 18px 10px">
      <div style="display:flex;align-items:center;gap:12px;width:100%">
        ${_custAv(c, 80, 'flex-shrink:0')}
        <div style="flex:1;min-width:0">
          <div style="font-size:1.1rem;font-weight:700">${c.name}</div>
          <div style="margin-top:4px">${_custTagsHtml(c.tags)}</div>
        </div>
        <button class="extras-modal-close" onclick="closeCustDetail()">✕</button>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="tel:${c.phone}" class="cd-action-btn">📞 ${c.phone || '—'}</a>
        ${c.phone ? `<button class="cd-action-btn" onclick="window.open('https://wa.me/${c.phone.replace(/\\D/g,'')}','_blank')">💬 WhatsApp</button>` : ''}
        <button class="cd-action-btn" onclick="switchCustTab('bilgiler', null); document.querySelectorAll('.cd-tab-btn').forEach((b,i)=>{b.classList.toggle('active',i===1)})">✏️ Düzenle</button>
      </div>
    </div>

    <!-- Stat Grid -->
    <div class="cd-stat-grid" style="padding:0 18px 12px">
      <div class="cd-stat-box"><div class="cd-stat-val">${c.history?.length || 0}</div><div class="cd-stat-lbl">Toplam Ziyaret</div></div>
      <div class="cd-stat-box"><div class="cd-stat-val">₺${total.toLocaleString('tr')}</div><div class="cd-stat-lbl">Toplam Harcama</div></div>
      <div class="cd-stat-box"><div class="cd-stat-val">${avgBasket ? '₺'+avgBasket.toLocaleString('tr') : '—'}</div><div class="cd-stat-lbl">Ort. Sepet</div></div>
      <div class="cd-stat-box"><div class="cd-stat-val" style="font-size:.82rem">${lastDate}</div><div class="cd-stat-lbl">Son Ziyaret</div></div>
    </div>

    <!-- Tabs -->
    <div class="cd-tab-row">
      <button class="cd-tab-btn active" onclick="switchCustTab('gecmis',this)">Geçmiş</button>
      <button class="cd-tab-btn" onclick="switchCustTab('bilgiler',this)">Bilgiler</button>
      <button class="cd-tab-btn" onclick="switchCustTab('notlar',this)">Notlar</button>
    </div>
    <div id="cd-tab-panel" class="cust-detail-body"></div>

    <!-- Footer -->
    <div class="cust-detail-ftr">
      <button class="cust-detail-wa-btn" onclick="newApptFromCust()">🗓️ Randevu Ver</button>
    </div>`;

  _renderCustTabContent(custId, _custActiveTab);
}

function closeCustDetail() {
  document.getElementById('cust-detail-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function openNewCustomerModal() {
  // Einfaches Inline-Modal im Body
  let el = document.getElementById('new-cust-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'new-cust-modal';
    el.style.cssText = 'position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="background:var(--surface1);border-radius:18px;width:min(400px,92vw);padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-weight:700;font-size:1rem">Yeni Müşteri Ekle</div>
        <button class="extras-modal-close" onclick="document.getElementById('new-cust-modal').remove()">✕</button>
      </div>
      <div class="cd-form-row"><label class="cd-form-lbl">Ad Soyad *</label>
        <input class="cd-form-inp" id="nc-name" placeholder="Müşteri adı"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">Telefon</label>
        <input class="cd-form-inp" id="nc-phone" type="tel" placeholder="905xxxxxxxxx"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">E-posta</label>
        <input class="cd-form-inp" id="nc-email" type="email" placeholder="ornek@email.com"></div>
      <div class="cd-form-row"><label class="cd-form-lbl">Cinsiyet</label>
        <select class="cd-form-inp" id="nc-gender">
          <option value="Belirtilmemiş">Belirtilmemiş</option>
          <option value="Erkek">Erkek</option>
          <option value="Kadın">Kadın</option>
        </select></div>
      <div class="cd-form-row"><label class="cd-form-lbl">📲 Bildirim Tercihi</label>
        <select class="cd-form-inp" id="nc-notify">
          ${(()=>{
            const ch = _getActiveNotifyChannels();
            let opts = '';
            if (ch.wa)  opts += '<option value="wa">💬 WhatsApp</option>';
            if (ch.sms) opts += '<option value="sms">📱 SMS</option>';
            if (ch.wa && ch.sms) opts += '<option value="both">💬+📱 Her İkisi de</option>';
            opts += '<option value="none">🚫 Bildirim İstemiyorum</option>';
            if (!ch.any) opts = '<option value="none">⛔ Bildirim kanalı aktif değil</option>';
            return opts;
          })()}
        </select></div>
      <button class="cd-save-btn" style="width:100%;margin-top:14px" onclick="saveNewCustomer()">✅ Kaydet</button>
    </div>`;
  el.style.display = 'flex';
}

function saveNewCustomer() {
  const name = document.getElementById('nc-name')?.value.trim();
  if (!name) { showMsg('⚠️ Ad Soyad zorunludur.', 'red'); return; }
  const newCust = {
    id: ++custIdCounter,
    name,
    phone:            document.getElementById('nc-phone')?.value.trim() || '',
    email:            document.getElementById('nc-email')?.value.trim() || '',
    birthday:         '',
    gender:           document.getElementById('nc-gender')?.value || 'Belirtilmemiş',
    notifyPref:       document.getElementById('nc-notify')?.value || 'wa',
    notes:            '',
    photo:            null,
    preferredStaffId: null,
    tags:             [],
    history:          [],
  };
  CUSTOMERS.push(newCust);
  document.getElementById('new-cust-modal')?.remove();
  renderCustomers();
  showMsg(`✅ ${name} müşteri olarak eklendi.`, 'green');
}

function newApptFromCust() {
  const custId = _custDetailId;
  closeCustDetail();
  setTimeout(() => {
    openNewApptModal(null, null, null);
    if (custId !== null) selectCustomer(custId);
  }, 160);
}

// ════════════════════════════════════════════
// PERSONEL
// ════════════════════════════════════════════
function renderStaffView() {
  const grid  = document.getElementById('staff-grid');
  const count = document.getElementById('staff-count');
  if (!grid) return;
  if (count) count.textContent = `${STAFF.length} personel`;

  const workDays = [
    ['Pzt','09:00–18:00'],['Sal','09:00–18:00'],['Çar','09:00–18:00'],
    ['Per','09:00–18:00'],['Cum','09:00–18:00'],['Cmt','10:00–16:00'],['Paz','Kapalı'],
  ];

  grid.innerHTML = STAFF.map(s => {
    const perms = s.perms || {};
    const permHtml = PERM_DEFS.map(p => {
      const on = !!perms[p.key];
      return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 6px;border-radius:7px;
                background:${on ? 'rgba(34,197,94,.12)' : 'rgba(0,0,0,.04)'};
                border:1px solid ${on ? 'rgba(34,197,94,.3)' : 'rgba(0,0,0,.08)'}">
        <input type="checkbox" ${on?'checked':''} style="display:none" onchange="togglePerm(${s.id},'${p.key}',this.checked)">
        <span style="font-size:.8rem;width:16px;text-align:center;color:${on?'#16a34a':'#aaa'}">${on?'✓':'✗'}</span>
        <span style="font-size:.72rem;color:${on?'var(--tx)':'var(--tx2)'};">${p.icon} ${p.label}</span>
      </label>`;
    }).join('');

    return `
    <div class="staff-card">
      <div class="staff-card-top">
        ${_av(s, 64, 'border:3px solid var(--border)')}
        <div class="staff-info">
          <div class="staff-card-name">${s.name}</div>
          <div class="staff-card-role">${s.jobTitle}</div>
        </div>
      </div>
      <div class="staff-card-stats">
        <div class="staff-stat"><div class="staff-stat-val" style="color:${s.color}">${s.appts}</div><div class="staff-stat-lbl">Bugün</div></div>
        <div class="staff-stat"><div class="staff-stat-val">${s.weekHours}</div><div class="staff-stat-lbl">Saat/Hf</div></div>
        <div class="staff-stat"><div class="staff-stat-val">₺${(s.revenue/1000).toFixed(1)}K</div><div class="staff-stat-lbl">Bu Ay</div></div>
      </div>
      <div style="margin:10px 0 4px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--tx2)">🔑 Yetkiler</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${permHtml}</div>
      <div class="work-hours-grid" style="margin-top:10px">
        ${workDays.map(([d,h]) => `
          <div class="work-hour-row">
            <span class="work-hour-day">${d}</span>
            <span class="${h==='Kapalı'?'work-hour-off':'work-hour-time'}">${h}</span>
          </div>`).join('')}
      </div>
      <div class="staff-card-footer">
        <button class="staff-action-btn" onclick="showWAToast('${s.name}')">💬 WA</button>
        <button class="staff-action-btn primary" onclick="openStaffEdit(${s.id})">✏️ Düzenle</button>
      </div>
    </div>
  `}).join('') + `
    <div onclick="openStaffEdit(0)" style="
      border:2px dashed var(--border2);border-radius:16px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:10px;padding:32px 16px;cursor:pointer;min-height:180px;
      color:var(--tx2);transition:.2s;
      background:transparent"
      onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'"
      onmouseout="this.style.borderColor='var(--border2)';this.style.color='var(--tx2)'">
      <div style="font-size:2rem">➕</div>
      <div style="font-weight:700;font-size:.9rem">Yeni Personel Ekle</div>
      <div style="font-size:.75rem;text-align:center;opacity:.7">Çalışanlarınızı ekleyip<br>yetkilerini belirleyin</div>
    </div>`;
}

function togglePerm(staffId, key, val) {
  const s = STAFF.find(x => x.id === staffId);
  if (!s) return;
  if (!s.perms) s.perms = {};
  s.perms[key] = val;
  renderStaffView();
  showMsg(`${s.name} — yetki güncellendi ✓`, 'green');
}

function openStaffEdit(id) {
  const s = id ? STAFF.find(x => x.id === id) : null;
  const colors = ['#C9A84C','#F97316','#EF4444','#E879A3','#8B5CF6','#00C8FF','#22C55E',
                  '#14B8A6','#F59E0B','#84CC16','#06B6D4','#6366F1','#EC4899','#64748B'];
  const selColor = s?.color || colors[0];
  const colorOpts = colors.map(c =>
    `<span onclick="pickColor('${c}',this)" title="${c}"
      class="se-color-dot${selColor===c?' sel':''}" style="background:${c}"></span>`
  ).join('');

  const html = `<div class="modal-overlay" id="staff-edit-modal" onclick="if(event.target===this)closeStaffEdit()">
  <div class="modal-box" style="max-width:420px">
    <div class="modal-hdr">
      <span>${s?'Personeli Düzenle':'Yeni Personel Ekle'}</span>
      <button class="modal-close" onclick="closeStaffEdit()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;padding:4px 0">
      <!-- Profil Fotoğrafı -->
      <div style="display:flex;align-items:center;gap:14px">
        <div id="se-photo-preview" style="width:72px;height:72px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;background:${s?.color||'#666'}">
          ${s?.photo ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:1.6rem;font-weight:700;color:#fff">${s?.name?.[0]||'+'}</span>`}
        </div>
        <div style="flex:1">
          <div style="font-size:.75rem;font-weight:600;color:var(--tx2);margin-bottom:6px">Profil Fotoğrafı</div>
          <label style="display:inline-flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.78rem;color:var(--tx)">
            📷 Fotoğraf Seç
            <input type="file" accept="image/*" style="display:none" onchange="previewStaffPhoto(this)">
          </label>
          ${s?.photo ? `<button onclick="removeStaffPhoto()" style="margin-left:6px;background:none;border:none;color:#ef4444;cursor:pointer;font-size:.75rem">✕ Sil</button>` : ''}
          <div style="font-size:.65rem;color:var(--tx2);margin-top:4px">JPG, PNG · Max 2MB</div>
        </div>
      </div>
      <div class="settings-form-row">
        <label>Ad Soyad *</label>
        <input id="se-name" class="settings-input" value="${s?.name||''}" placeholder="Ahmet Yılmaz">
      </div>
      <div class="settings-form-row">
        <label>Ünvan / Uzmanlık</label>
        <input id="se-title" class="settings-input" value="${s?.jobTitle||''}" placeholder="Berber & Stilist">
      </div>
      <div class="settings-form-row">
        <label>Telefon</label>
        <input id="se-phone" class="settings-input" value="${s?.phone||''}" placeholder="+90 555 000 00 00">
      </div>
      <div class="settings-form-row">
        <label>E-posta</label>
        <input id="se-email" class="settings-input" value="${s?.email||''}" placeholder="ahmet@salon.com">
      </div>
      <div>
        <label style="font-size:.78rem;font-weight:600;color:var(--tx2);display:block;margin-bottom:6px">Renk</label>
        <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
          ${colorOpts}
          <label title="Özel renk seç" style="cursor:pointer">
            <span class="se-color-dot" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);position:relative;overflow:hidden">
              <input type="color" value="${selColor}" onchange="pickColor(this.value,null)"
                style="opacity:0;position:absolute;inset:0;width:100%;height:100%;cursor:pointer;border:none">
            </span>
          </label>
        </div>
        <input type="hidden" id="se-color" value="${selColor}">
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px">
          <div id="se-color-preview" style="width:20px;height:20px;border-radius:50%;background:${selColor}"></div>
          <span id="se-color-hex" style="font-size:.72rem;color:var(--tx2);font-family:monospace">${selColor}</span>
        </div>
      </div>
    </div>
    <div class="modal-footer" style="margin-top:16px">
      <button class="btn-sec" onclick="closeStaffEdit()">İptal</button>
      <button class="btn-pri" onclick="saveStaffEdit(${id||0})">💾 Kaydet</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function previewStaffPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showMsg('Fotoğraf max 2MB olmalı', 'red'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('se-photo-preview');
    if (prev) prev.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    // Geçici saklama
    window._sePhotoData = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeStaffPhoto() {
  window._sePhotoData = null;
  window._sePhotoRemoved = true;
  const prev = document.getElementById('se-photo-preview');
  const colorEl = document.getElementById('se-color');
  const color = colorEl ? colorEl.value : '#666';
  const nameEl = document.getElementById('se-name');
  const initial = nameEl?.value?.[0] || '+';
  if (prev) prev.innerHTML = `<span style="font-size:1.6rem;font-weight:700;color:#fff">${initial}</span>`;
}

function pickColor(c, dot) {
  document.getElementById('se-color').value = c;
  document.getElementById('se-color-preview').style.background = c;
  document.getElementById('se-color-hex').textContent = c;
  document.querySelectorAll('.se-color-dot').forEach(d => d.classList.remove('sel'));
  if (dot) dot.classList.add('sel');
}

function closeStaffEdit() {
  const m = document.getElementById('staff-edit-modal');
  if (m) m.remove();
}

function saveStaffEdit(id) {
  const name  = document.getElementById('se-name').value.trim();
  const title = document.getElementById('se-title').value.trim();
  const phone = document.getElementById('se-phone').value.trim();
  const email = document.getElementById('se-email').value.trim();
  const color = document.getElementById('se-color').value;
  if (!name) { showMsg('Ad zorunludur!', 'red'); return; }

  const newPhoto = window._sePhotoData !== undefined ? window._sePhotoData : undefined;
  const removed  = window._sePhotoRemoved === true;

  if (id) {
    const s = STAFF.find(x => x.id === id);
    if (s) {
      s.name=name; s.jobTitle=title; s.phone=phone; s.email=email; s.color=color; s.bg=color+'2e';
      if (newPhoto !== undefined) s.photo = newPhoto;
      if (removed) s.photo = null;
    }
  } else {
    const newId = Math.max(0,...STAFF.map(x=>x.id)) + 1;
    STAFF.push({ id:newId, name, jobTitle:title, phone, email, color, bg:color+'2e',
                 photo: newPhoto || null,
                 appts:0, weekHours:0, revenue:0,
                 perms:{ calTüm:false,calDüzenle:true,müşteri:true,kasa:false,raporlar:false,stok:false,kampanya:false,personel:false } });
  }
  window._sePhotoData = undefined;
  window._sePhotoRemoved = false;
  closeStaffEdit();
  renderStaffView();
  showMsg(`${name} kaydedildi ✓`, 'green');
}

function changeStaffRole(staffId, newRole) {
  const s = STAFF.find(x => x.id === staffId);
  if (!s) return;
  s.systemRole = newRole;
  const role = ROLES[newRole];
  showMsg(`${s.name} → ${role.icon} ${role.label} olarak güncellendi`, 'gold');
  renderStaffView();
}

function switchPersonelTab(tab, btn) {
  document.querySelectorAll('.personel-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.personel-tab-panel').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('ptab-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'dienstplan') {
    // Populate staff select
    const sel = document.getElementById('ab-staff-sel');
    if (sel && sel.options.length <= 1) {
      STAFF.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id; opt.textContent = s.name;
        sel.appendChild(opt);
      });
    }
    renderDienstplan();
  }
}

function showAddStaffToast() {
  showMsg('Yeni personel ekleme yakında aktif olacak.', 'gold');
}
function showWAToast(name) {
  showMsg(`${name} için WhatsApp açılıyor...`, 'green');
}

// ════════════════════════════════════════════
// GELİR RAPORU
// ════════════════════════════════════════════
function renderFullRevenueChart() {
  const el = document.getElementById('rev-chart-full');
  if (!el) return;
  const max = Math.max(...REVENUE_DATA.map(d => d.value));
  el.innerHTML = REVENUE_DATA.map(d => `
    <div class="rev-bar-wrap">
      <div class="rev-bar ${d.current ? 'cur' : ''}" style="height:${Math.round(d.value/max*100)}%"
           title="₺${d.value.toLocaleString('tr-TR')}"></div>
      <div class="rev-bar-lbl">${d.month}</div>
    </div>`).join('');
}

function renderStaffRevenueTable() {
  const tbody = document.getElementById('staff-rev-body');
  if (!tbody) return;
  tbody.innerHTML = STAFF.map(s => `
    <tr>
      <td>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block"></span>
          ${s.name}
        </span>
      </td>
      <td>${s.appts * 5}</td>
      <td class="val">₺${s.revenue.toLocaleString('tr-TR')}</td>
    </tr>`).join('');
}

function renderServiceRevenueTable() {
  const tbody = document.getElementById('svc-rev-body');
  if (!tbody) return;
  const svcData = [
    { name:'Saç Kesimi',   count:38, total:5700  },
    { name:'Saç + Sakal',  count:24, total:5280  },
    { name:'Saç Boyama',   count:12, total:5040  },
    { name:'Röfle & Boya', count:8,  total:4400  },
    { name:'Sakal Tıraşı', count:41, total:4100  },
    { name:'Keratin',      count:7,  total:3360  },
  ];
  tbody.innerHTML = svcData.map(d => `
    <tr>
      <td>${d.name}</td>
      <td>${d.count}</td>
      <td class="val">₺${d.total.toLocaleString('tr-TR')}</td>
    </tr>`).join('');
}

// ════════════════════════════════════════════
// KALENDER
// ════════════════════════════════════════════
function initCalendar() {
  calState.date = new Date();
  renderCalendarStaffStrip();
}

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function addMinutes(t, mins) {
  const total = timeToMin(t) + mins;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

function calNav(dir) {
  const d = new Date(calState.date);
  if (calState.view === 'day')   d.setDate(d.getDate() + dir);
  if (calState.view === 'week')  d.setDate(d.getDate() + dir * 7);
  if (calState.view === 'month') d.setMonth(d.getMonth() + dir);
  calState.date = d;
  renderCalendar();
}

function calGoToday() {
  calState.date = new Date();
  renderCalendar();
}

function setCalView(view, btn) {
  calState.view = view;
  document.querySelectorAll('.cal-seg-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCalendar();
}

function renderCalendarStaffStrip() {
  const strip = document.getElementById('cal-staff-strip');
  if (!strip) return;
  strip.innerHTML = `
    <button class="staff-pill ${calState.staffFilter === 'all' ? 'active' : ''}"
            onclick="calFilterStaff('all',this)">
      <span class="sp-dot" style="background:#888"></span> Tümü
    </button>` +
  STAFF.map(s => `
    <button class="staff-pill ${calState.staffFilter === s.id ? 'active' : ''}"
            onclick="calFilterStaff(${s.id},this)">
      <span class="sp-dot" style="background:${s.color}"></span> ${s.name}
    </button>`).join('');
}

function calFilterStaff(id, btn) {
  calState.staffFilter = id;
  document.querySelectorAll('.staff-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCalendar();
}

function renderCalendar() {
  updateCalDateLabel();
  ['cal-day-view','cal-week-view','cal-month-view'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (calState.view === 'day')   { document.getElementById('cal-day-view').style.display = 'flex';   renderDayView(); }
  if (calState.view === 'week')  { document.getElementById('cal-week-view').style.display = 'block'; renderWeekView(); }
  if (calState.view === 'month') { document.getElementById('cal-month-view').style.display = 'block';renderMonthView(); }
}

function updateCalDateLabel() {
  const el = document.getElementById('cal-date-lbl');
  if (!el) return;
  const d = calState.date;
  const opts = calState.view === 'day'
    ? { weekday:'long', day:'numeric', month:'long' }
    : calState.view === 'week'
    ? { day:'numeric', month:'long', year:'numeric' }
    : { month:'long', year:'numeric' };
  el.textContent = d.toLocaleDateString('tr-TR', opts);
}

// ── Gün görünümü — Google Calendar Style ─────
function renderDayView() {
  const visibleStaff = calState.staffFilter === 'all'
    ? STAFF
    : STAFF.filter(s => s.id === calState.staffFilter);

  const appts = TODAY_APPOINTMENTS;

  // ── Staff-Header ──────────────────────────
  const hdrEl = document.getElementById('day-col-headers');
  hdrEl.innerHTML = visibleStaff.map(s => {
    const cnt = appts.filter(a => a.staffId === s.id && a.status !== 'break').length;
    // Soft tinted header background per staff
    return `
      <div class="day-col-hdr" style="background:${s.bg}">
        ${_av(s, 30, 'flex-shrink:0')}
        <div>
          <div class="day-staff-name" style="color:${s.color}">${s.name}</div>
          <div class="day-staff-count">${cnt} randevu · ${s.jobTitle}</div>
        </div>
      </div>`;
  }).join('');

  // ── Zeit-Gutter ───────────────────────────
  const gutterEl = document.getElementById('day-time-gutter');
  gutterEl.style.height = TOTAL_PX + 'px';
  let labelsHtml = '';
  for (let h = CAL_START_H; h <= CAL_END_H; h++) {
    const topPx = (h - CAL_START_H) * 60 * PX_MIN;
    labelsHtml += `<div class="time-lbl" style="top:${topPx}px">${String(h).padStart(2,'0')}:00</div>`;
  }
  gutterEl.innerHTML = labelsHtml;

  // ── Staff-Spalten ─────────────────────────
  const colsEl = document.getElementById('day-cols-scroll');

  // Current time
  const today  = new Date();
  const isToday = calState.date.toDateString() === today.toDateString();
  const nowMin  = today.getHours() * 60 + today.getMinutes();
  const nowTop  = (nowMin - CAL_START_H * 60) * PX_MIN;

  colsEl.innerHTML = visibleStaff.map(s => {
    const staffAppts = appts.filter(a => a.staffId === s.id);

    // Grid-Linien (Google Calendar style: jede Stunde + halbe Stunde)
    let gridHtml = '';
    for (let h = CAL_START_H; h <= CAL_END_H; h++) {
      const topPx = (h - CAL_START_H) * 60 * PX_MIN;
      gridHtml += `<div class="grid-line major" style="top:${topPx}px"></div>`;
      if (h < CAL_END_H) {
        gridHtml += `<div class="grid-line minor" style="top:${topPx + 30 * PX_MIN}px"></div>`;
      }
    }

    // Aktuelle Zeit-Linie
    if (isToday && nowTop >= 0 && nowTop <= TOTAL_PX) {
      gridHtml += `<div class="now-line" style="top:${nowTop}px"></div>`;
    }

    // Termin-Blöcke
    const apptHtml = staffAppts.map(a => {
      const startMin = timeToMin(a.time);
      const endMin   = timeToMin(a.end);
      const topPx    = (startMin - CAL_START_H * 60) * PX_MIN;
      const hPx      = Math.max((endMin - startMin) * PX_MIN, 24);
      const isBreak  = a.status === 'break';

      const bgColor  = isBreak ? 'transparent' : s.bg;
      const borderC  = isBreak ? 'var(--border2)' : s.color;
      const textC    = isBreak ? 'var(--tx3)' : s.color;

      return `
        <div class="cal-blk ${a.status} ${isBreak ? 'brk' : ''}"
             style="top:${topPx}px;height:${hPx}px;background:${bgColor};border-left-color:${borderC};color:${textC}"
             onclick="${isBreak ? '' : `openApptDetail(${a.id})`}">
          <div class="cb-time">${a.time} – ${a.end}</div>
          ${hPx >= 30 ? `<div class="cb-name">${isBreak ? 'Mola' : a.name}</div>` : ''}
          ${hPx >= 48 ? `<div class="cb-svc">${a.service}</div>` : ''}
          ${hPx >= 66 && !isBreak ? `<div class="cb-price">₺${a.price}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="day-staff-col" style="height:${TOTAL_PX}px"
           onclick="onDayColClick(event,${s.id})">
        ${gridHtml}${apptHtml}
      </div>`;
  }).join('');

  // ── Scroll-Sync: Header folgt Body horizontal ──
  syncDayScroll();

  // Nach Render: zu aktueller Uhrzeit scrollen
  if (isToday) {
    setTimeout(() => {
      const bodyEl = document.querySelector('.day-body');
      if (bodyEl) {
        const scrollTo = Math.max(0, nowTop - 120);
        bodyEl.scrollTop = scrollTo;
      }
    }, 50);
  }
}

// Sync horizontal scroll zwischen Header und Spalten
function syncDayScroll() {
  const colsEl = document.getElementById('day-cols-scroll');
  const hdrEl  = document.getElementById('day-col-headers');
  if (!colsEl || !hdrEl) return;
  colsEl.onscroll = () => { hdrEl.scrollLeft = colsEl.scrollLeft; };
}

// Leere Zeitslot anklicken → Neues Termin Modal
function onDayColClick(e, staffId) {
  // Klick auf Termin-Block ignorieren
  if (e.target.closest('.cal-blk')) return;
  const col  = e.currentTarget;
  const rect = col.getBoundingClientRect();
  // getBoundingClientRect gibt Viewport-Position zurück → bei gescrolltem Container
  // ist rect.top negativ (Spalte über Viewport), daher: clientY - rect.top = absolute Y in Spalte
  const y       = e.clientY - rect.top;
  const totalMin = Math.round(y / PX_MIN);
  // Auf 15-Min-Raster runden
  const snapped = Math.round(totalMin / 15) * 15;
  const absMin  = CAL_START_H * 60 + Math.max(0, Math.min(snapped, (CAL_END_H - CAL_START_H) * 60));
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  openNewApptModal(staffId, timeStr, calState.date);
}

// ── Haftalık görünüm ──────────────────────────
function renderWeekView() {
  const grid = document.getElementById('week-grid');
  const timeCol = document.getElementById('wk-time-col');
  if (!grid) return;

  // Zeitraster: 08:00–22:00, 1 Stunde = 60px
  const START_H = 8;
  const END_H   = 22;
  const PX_PER_MIN = 1; // 60px / 60min = 1px per minute

  // Stunden-Labels links
  if (timeCol) {
    let thtml = '';
    for (let h = START_H; h <= END_H; h++) {
      thtml += `<div class="wk-time-slot">${h < 10 ? '0'+h : h}:00</div>`;
    }
    timeCol.innerHTML = thtml;
  }

  const today = new Date();
  const monday = new Date(calState.date);
  const dow = monday.getDay() === 0 ? 6 : monday.getDay() - 1;
  monday.setDate(monday.getDate() - dow);

  const weekAppts = getWeekAppointments(monday);
  const DAY_NAMES = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

  // Stunden-Linien HTML
  function hrLines() {
    let s = '';
    for (let h = 0; h <= (END_H - START_H); h++) {
      const top = h * 60;
      s += `<div class="wk-hr-line" style="top:${top}px"></div>`;
      if (h < (END_H - START_H)) {
        s += `<div class="wk-hr-line half" style="top:${top + 30}px"></div>`;
      }
    }
    return s;
  }

  // Collision detection: gibt jedem Termin column-index und column-count
  function layoutAppts(appts) {
    // Sortieren nach Startzeit
    const sorted = appts.map(a => {
      const [hh, mm] = a.time.split(':').map(Number);
      const startMin = hh * 60 + mm;
      const durMin   = a.duration || 30;
      return { ...a, startMin, endMin: startMin + durMin };
    }).sort((a,b) => a.startMin - b.startMin);

    const cols = []; // cols[i] = endMin des letzten Termins in Spalte i
    sorted.forEach(a => {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c] <= a.startMin) {
          a._col = c;
          cols[c] = a.endMin;
          placed = true;
          break;
        }
      }
      if (!placed) {
        a._col = cols.length;
        cols.push(a.endMin);
      }
    });

    // Gesamtzahl Spalten für überlappende Gruppen berechnen
    sorted.forEach(a => {
      // Wie viele Termine überlappen mit diesem?
      const overlapping = sorted.filter(b =>
        b.startMin < a.endMin && b.endMin > a.startMin
      );
      a._colCount = Math.max(...overlapping.map(b => b._col), 0) + 1;
    });

    return sorted;
  }

  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const dayAppts = weekAppts.filter(a => a.day === i && a.status !== 'break');
    const laid = layoutAppts(dayAppts);
    const bodyH = (END_H - START_H) * 60;

    const apptHtml = laid.map(a => {
      const s = STAFF.find(x => x.id === a.staffId);
      const top  = (a.startMin - START_H * 60) * PX_PER_MIN;
      const h    = Math.max((a.duration || 30) * PX_PER_MIN, 20);
      const colW = 100 / a._colCount;
      const left = a._col * colW;
      const bg   = s?.bg   || 'rgba(99,102,241,.15)';
      const bc   = s?.color || '#6366f1';
      if (top < 0 || top > bodyH) return ''; // außerhalb Zeitbereich
      return `<div class="wk-item"
        style="top:${top}px;height:${h}px;left:calc(${left}% + 2px);width:calc(${colW}% - 4px);background:${bg};border-left-color:${bc};z-index:${2 + a._col}"
        onclick="openApptDetail('${a.id}')" title="${a.time} — ${a.name}">
        <div class="wk-item-time">${a.time}</div>
        <div class="wk-item-name">${a.name}</div>
      </div>`;
    }).join('');

    html += `
      <div class="wk-col ${isToday ? 'today' : ''}">
        <div class="wk-col-hdr" onclick="goToDayView(${d.getTime()})">
          <div class="wk-day-name">${DAY_NAMES[d.getDay()]}</div>
          <div class="wk-day-num">${d.getDate()}</div>
        </div>
        <div class="wk-body" style="height:${bodyH}px">
          ${hrLines()}
          ${apptHtml}
        </div>
      </div>`;
  }
  grid.innerHTML = html;
}

function goToDayView(timestamp) {
  calState.date = new Date(timestamp);
  calState.view = 'day';
  document.querySelectorAll('.cal-seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === 'day');
  });
  renderCalendar();
}

// ── Aylık görünüm ─────────────────────────────
function renderMonthView() {
  const namesEl = document.getElementById('month-day-names');
  const gridEl  = document.getElementById('month-grid');
  if (!namesEl || !gridEl) return;

  const DAYS_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  namesEl.innerHTML = DAYS_SHORT.map(d => `<div class="month-dn">${d}</div>`).join('');

  const today = new Date();
  const year  = calState.date.getFullYear();
  const month = calState.date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, -startOffset + i + 1);
    cells.push({ date: d, other: true });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), other: false });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length-1].date;
    const next = new Date(last); next.setDate(next.getDate()+1);
    cells.push({ date: next, other: true });
  }

  const weekAppts = getWeekAppointments(new Date());
  function getAppts(date) {
    if (date.getDay() === 0) return [];
    const dow = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return weekAppts.filter(a => a.day === dow && a.status !== 'break')
                    .sort((a,b) => a.time.localeCompare(b.time));
  }

  gridEl.innerHTML = cells.map(c => {
    const isToday = c.date.toDateString() === today.toDateString();
    const appts   = c.other ? [] : getAppts(c.date);
    const ts      = c.date.getTime();

    // Personel Sayısı (grupiert nach Mitarbeiter)
    const staffCounts = STAFF.map(s => {
      const n = appts.filter(a => a.staffId === s.id).length;
      return n > 0 ? `<span style="display:inline-flex;align-items:center;gap:2px;font-size:.55rem;font-weight:700;color:${s.color};background:${s.bg||'rgba(0,0,0,.06)'};border-radius:3px;padding:1px 4px">${s.name[0]}${s.name.split(' ')[0].substring(1,4)} <b>${n}</b></span>` : '';
    }).join('');

    const moreHtml = appts.length > 0
      ? `<div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:2px">${staffCounts}</div>
         <div class="mc-more" data-ts="${ts}">📋 ${appts.length} randevu</div>`
      : '';

    return `<div class="month-cell ${isToday?'today':''} ${c.other?'other':''}" data-ts="${ts}" data-other="${c.other}">
      <div class="mc-num">${c.date.getDate()}</div>
      ${moreHtml}
    </div>`;
  }).join('');

  // Event Delegation — EIN listener auf dem Grid
  gridEl.onclick = function(e) {
    const moreBtn = e.target.closest('.mc-more');
    const cell    = e.target.closest('.month-cell');

    if (moreBtn) {
      const ts = parseInt(moreBtn.dataset.ts);
      _openMcPopup(ts, moreBtn);
      return; // KEIN goToDayView
    }

    if (cell && cell.dataset.other !== 'true') {
      closeMcPopup();
      goToDayView(parseInt(cell.dataset.ts));
    }
  };
}

function _openMcPopup(timestamp, triggerEl) {
  const popup = document.getElementById('mc-day-popup');
  if (!popup) return;

  if (popup.style.display === 'block' && popup.dataset.ts === String(timestamp)) {
    closeMcPopup(); return;
  }

  const date      = new Date(timestamp);
  const weekAppts = getWeekAppointments(new Date());
  const dow       = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const appts     = weekAppts.filter(a => a.day === dow && a.status !== 'break')
                             .sort((a,b) => a.time.localeCompare(b.time));

  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  popup.dataset.ts = timestamp;
  popup.innerHTML = `
    <div class="mc-popup-hdr">
      <div class="mc-popup-title">📅 ${date.getDate()} ${MONTHS[date.getMonth()]}</div>
      <button class="mc-popup-close" onclick="closeMcPopup()">✕</button>
    </div>
    <div style="max-height:320px;overflow-y:auto">
    ${appts.map(a => {
      const s = STAFF.find(x => x.id === a.staffId);
      return `<div class="mc-popup-item" data-appt-id="${a.id}">
        <div class="mc-popup-dot" style="background:${s?.color||'#6366f1'}"></div>
        <div class="mc-popup-info">
          <div class="mc-popup-time">${a.time} · ${a.duration||30}dk · ${s?.name||''}</div>
          <div class="mc-popup-name">${a.name}</div>
          <div class="mc-popup-svc">${a.service}</div>
        </div>
      </div>`;
    }).join('')}
    </div>`;

  // Klick auf Termin im Popup
  popup.querySelectorAll('.mc-popup-item').forEach(el => {
    el.onclick = () => { closeMcPopup(); openApptDetail(el.dataset.apptId); };
  });

  popup.style.display = 'block';
  const rect = triggerEl.getBoundingClientRect();
  let left = rect.left, top = rect.bottom + 6;
  if (left + 280 > window.innerWidth - 12) left = window.innerWidth - 292;
  if (top + 350 > window.innerHeight)       top  = rect.top - popup.offsetHeight - 6;
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';

  setTimeout(() => document.addEventListener('click', _mcOutside), 0);
}

function _mcOutside(e) {
  const popup = document.getElementById('mc-day-popup');
  if (popup && !popup.contains(e.target) && !e.target.closest('.mc-more')) {
    closeMcPopup();
  }
}

function closeMcPopup() {
  const p = document.getElementById('mc-day-popup');
  if (p) { p.style.display = 'none'; p.dataset.ts = ''; }
  document.removeEventListener('click', _mcOutside);
}

// ════════════════════════════════════════════
// TERMIN DETAIL MODAL
// ════════════════════════════════════════════
function openApptDetail(apptId) {
  const a = TODAY_APPOINTMENTS.find(x => x.id === apptId);
  if (!a) return;
  currentDetailAppt = a;
  const s = STAFF.find(x => x.id === a.staffId);

  const adAvEl = document.getElementById('ad-staff-av');
  if (adAvEl) adAvEl.outerHTML = _av(s, 36, 'id="ad-staff-av"');
  document.getElementById('ad-name').textContent             = a.name;
  document.getElementById('ad-service').textContent          = a.service;
  document.getElementById('ad-time').textContent             = a.time + ' – ' + a.end;
  document.getElementById('ad-dur').textContent              = a.duration + ' dakika';
  document.getElementById('ad-price').textContent            = '₺' + a.price;
  document.getElementById('ad-staff').textContent            = s?.name || '—';
  document.getElementById('ad-phone').textContent            = a.phone || '—';

  // Status chip + buttons
  _refreshDetailStatusUI(a.status);

  // WhatsApp reminder badge
  const badge = document.getElementById('ad-reminder-badge');
  if (badge) {
    const notif = SALON_CONFIG.notifications;
    if (notif.whatsappEnabled && notif.reminderMinutes > 0 && a.phone && a.status !== 'cancelled' && a.status !== 'noshow') {
      const label = _reminderLabel(notif.reminderMinutes);
      badge.textContent = `⏰ WhatsApp hatırlatıcı — ${label} önce gönderilecek`;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  // Reschedule panel kapatmak
  const rp = document.getElementById('reschedule-panel');
  if (rp) rp.style.display = 'none';

  // WA button
  const waBtn = document.getElementById('ad-wa-btn');
  if (a.phone) {
    const msg = encodeURIComponent(`Merhaba ${a.name} 👋\n\nRandevunuzu hatırlatmak istedik:\n✂️ ${a.service}\n🕐 ${a.time}\n\nBekliyoruz! 😊`);
    waBtn.onclick = () => window.open(`https://wa.me/${a.phone}?text=${msg}`, '_blank');
    waBtn.style.opacity = '1';
  } else {
    waBtn.style.opacity = '0.4';
    waBtn.onclick = null;
  }

  // İptal butonu gizle/göster
  const cancelBtn = document.getElementById('ad-cancel-btn');
  if (cancelBtn) {
    cancelBtn.style.display = (a.status === 'cancelled') ? 'none' : '';
  }

  openModal('appt-detail-modal');
}

function _refreshDetailStatusUI(status) {
  const map = { confirmed:'active-confirmed', pending:'active-pending', noshow:'active-noshow', cancelled:'active-cancelled' };
  ['confirmed','pending','noshow'].forEach(s => {
    const btn = document.getElementById('sb-' + s);
    if (btn) btn.className = 'status-btn' + (status === s ? ' ' + (map[s] || '') : '');
  });
  // Status chip
  const chip = document.getElementById('ad-status-chip');
  if (!chip) return;
  const labels = { confirmed:'✓ Onaylı', pending:'⏳ Bekliyor', noshow:'🚫 Gelmedi', cancelled:'❌ İptal' };
  const colors = { confirmed:'var(--green)', pending:'var(--gold)', noshow:'#e74c3c', cancelled:'var(--tx3)' };
  chip.textContent  = labels[status] || status;
  chip.style.color  = colors[status] || 'var(--tx2)';
}

function setApptStatus(status) {
  if (!currentDetailAppt) return;
  currentDetailAppt.status = status;
  _refreshDetailStatusUI(status);
  renderCalendar();
  renderOverviewAppointments();
  const msgs = { noshow:'Gelmedi olarak işaretlendi.', confirmed:'Randevu onaylandı.', pending:'Beklemeye alındı.' };
  if (msgs[status]) showMsg(msgs[status], status === 'noshow' ? 'red' : 'green');
}

// ── Termin verschieben (Reschedule) ──────────
function toggleReschedulePanel() {
  const rp = document.getElementById('reschedule-panel');
  if (!rp) return;
  const open = rp.style.display !== 'none';
  rp.style.display = open ? 'none' : 'block';
  if (!open && currentDetailAppt) {
    document.getElementById('rp-time').value = currentDetailAppt.time;
    const dateEl = document.getElementById('rp-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    const staffSel = document.getElementById('rp-staff');
    if (staffSel) {
      staffSel.innerHTML = STAFF.map(s =>
        `<option value="${s.id}" ${s.id === currentDetailAppt.staffId ? 'selected' : ''}>${s.name} — ${s.jobTitle}</option>`
      ).join('');
    }
  }
}

function saveReschedule() {
  if (!currentDetailAppt) return;
  const newTime    = document.getElementById('rp-time').value;
  const newStaffId = parseInt(document.getElementById('rp-staff').value);
  if (!newTime) { showMsg('Saat seçiniz.', 'red'); return; }

  const old = currentDetailAppt;
  old.time    = newTime;
  old.end     = addMinutes(newTime, old.duration);
  old.staffId = newStaffId;
  TODAY_APPOINTMENTS.sort((a, b) => a.time.localeCompare(b.time));

  // Detail-Anzeige aktualisieren
  const staff = STAFF.find(s => s.id === newStaffId);
  document.getElementById('ad-time').textContent  = old.time + ' – ' + old.end;
  document.getElementById('ad-staff').textContent = staff?.name || '—';
  document.getElementById('reschedule-panel').style.display = 'none';

  renderCalendar();
  renderOverviewAppointments();
  showMsg(`✓ ${old.name} randevusu ${newTime}'e alındı.`, 'green');
}

// ── Termin absagen ────────────────────────────
function cancelAppt() {
  if (!currentDetailAppt) return;
  const conf = document.getElementById('cancel-confirm-row');
  if (conf) {
    conf.style.display = conf.style.display === 'none' ? 'flex' : 'none';
  }
}

function confirmCancelAppt() {
  if (!currentDetailAppt) return;
  currentDetailAppt.status = 'cancelled';
  _refreshDetailStatusUI('cancelled');
  const conf = document.getElementById('cancel-confirm-row');
  if (conf) conf.style.display = 'none';
  const cancelBtn = document.getElementById('ad-cancel-btn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  renderCalendar();
  renderOverviewAppointments();
  showMsg('Randevu iptal edildi.', 'red');
}

function addDetailApptToKasse() {
  if (!currentDetailAppt) return;
  closeModal('appt-detail-modal');
  showView('kasa');
  if (typeof addAppointmentToBasket === 'function') {
    addAppointmentToBasket(currentDetailAppt.id);
  }
}

// ── Reminder-Label Hilfsfunktion ─────────────
function _reminderLabel(min) {
  if (min < 60)  return `${min} dakika`;
  if (min === 60)  return '1 saat';
  if (min === 120) return '2 saat';
  if (min === 180) return '3 saat';
  if (min === 1440) return '1 gün';
  return `${min} dakika`;
}

// ════════════════════════════════════════════
// NEUES TERMIN MODAL
// ════════════════════════════════════════════
function initNewApptForm() {
  // Service-Select befüllen
  const sel = document.getElementById('na-service');
  if (sel) {
    SERVICES.forEach(svc => {
      const opt = document.createElement('option');
      opt.value = svc.id;
      const durPart   = svc.duration ? `${svc.duration} dk` : 'Süre serbest';
      const pricePart = svc.price    ? `₺${svc.price}`     : 'Serbest fiyat';
      opt.textContent = `${svc.name} (${durPart} · ${pricePart})`;
      sel.appendChild(opt);
    });
  }

  // Staff-Select befüllen
  const staffSel = document.getElementById('na-staff');
  if (staffSel) {
    STAFF.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name + ' — ' + s.jobTitle;
      staffSel.appendChild(opt);
    });
  }

  // Datum auf heute setzen
  const dateEl = document.getElementById('na-date');
  if (dateEl) {
    const now = new Date();
    dateEl.value = now.toISOString().split('T')[0];
  }
}

// ── Seçili müşteri state ──────────────────────
let _naSelectedCustId = null;

function naServiceChange() {
  const svcId = parseInt(document.getElementById('na-service').value);
  const svc   = SERVICES.find(s => s.id === svcId);
  if (!svc) return;
  document.getElementById('na-dur').value   = svc.duration || '';
  document.getElementById('na-price').value = svc.price    || '';
  _updateLastPriceHint();
}

function _updateLastPriceHint() {
  const hint = document.getElementById('na-last-price-hint');
  if (!hint) return;
  if (!_naSelectedCustId) { hint.style.display = 'none'; return; }
  const svcId = parseInt(document.getElementById('na-service').value);
  const svc   = SERVICES.find(s => s.id === svcId);
  if (!svc) { hint.style.display = 'none'; return; }
  const last = getLastPrice(_naSelectedCustId, svc.name);
  if (last !== null) {
    hint.textContent   = `💡 Son ziyarette ${svc.name}: ₺${last} — fiyat uygulandı`;
    hint.style.display = 'block';
    document.getElementById('na-price').value = last;
  } else {
    hint.style.display = 'none';
  }
}

// ── Müşteri Suche im Modal ────────────────────
function custSearchInput(query) {
  const dd = document.getElementById('na-cust-dropdown');
  if (!dd) return;
  const q = query.trim().toLowerCase();
  const filtered = q.length < 1
    ? CUSTOMERS.slice(0, 8)
    : CUSTOMERS.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));

  const items = filtered.map(c => `
    <div class="cust-dd-item" onclick="selectCustomer(${c.id})">
      <div class="cust-dd-av">${getInitials(c.name)}</div>
      <div style="flex:1">
        <div class="cust-dd-name">${c.name}</div>
        <div class="cust-dd-phone">${c.phone || '—'}</div>
      </div>
      <div style="font-size:.72rem;color:var(--tx3)">${c.history?.length || 0} ziyaret</div>
    </div>`).join('');

  const newOpt = q.length > 1 ? `
    <div class="cust-dd-item cust-dd-new" onclick="selectNewCustomer(${JSON.stringify(query.trim())})">
      <div class="cust-dd-av" style="background:var(--border2);color:var(--tx2)">+</div>
      <div style="flex:1">
        <div class="cust-dd-name">Yeni Müşteri: "${query.trim()}"</div>
        <div class="cust-dd-phone">Kayıt oluştur</div>
      </div>
    </div>` : '';

  dd.innerHTML = items
    ? items + newOpt
    : `<div style="padding:12px;text-align:center;color:var(--tx2);font-size:.82rem">Bulunamadı.</div>${newOpt}`;
  dd.style.display = 'block';
}

function selectCustomer(custId) {
  _naSelectedCustId = custId;
  const c = CUSTOMERS.find(x => x.id === custId);
  if (!c) return;

  document.getElementById('na-cust-search-wrap').style.display = 'none';
  document.getElementById('na-cust-dropdown').style.display    = 'none';

  const sel = document.getElementById('na-cust-selected');
  sel.style.display = 'block';
  sel.innerHTML = `
    <div class="cust-selected-chip">
      <div class="cust-chip-av">${getInitials(c.name)}</div>
      <div style="flex:1">
        <div class="cust-chip-name">${c.name}</div>
        <div class="cust-chip-phone">${c.phone || '—'}</div>
      </div>
      <button class="cust-chip-clear" onclick="clearCustSelection()">✕</button>
    </div>`;

  _updateLastPriceHint();
}

function selectNewCustomer(name) {
  const newCust = { id: ++custIdCounter, name, phone: '', email: '', notes: '', history: [] };
  CUSTOMERS.push(newCust);
  selectCustomer(newCust.id);
}

function clearCustSelection() {
  _naSelectedCustId = null;
  const sel  = document.getElementById('na-cust-selected');
  const wrap = document.getElementById('na-cust-search-wrap');
  const inp  = document.getElementById('na-cust-input');
  if (sel)  { sel.style.display = 'none'; sel.innerHTML = ''; }
  if (wrap) wrap.style.display = '';
  if (inp)  { inp.value = ''; inp.focus(); }
  document.getElementById('na-cust-dropdown').style.display = 'none';
  document.getElementById('na-last-price-hint').style.display = 'none';
  custSearchInput('');
}

// ── Schließt Dropdown bei Klick außerhalb ─────
document.addEventListener('click', e => {
  if (!e.target.closest('#na-cust-search-wrap')) {
    const dd = document.getElementById('na-cust-dropdown');
    if (dd) dd.style.display = 'none';
  }
});

function openNewApptModal(staffId, time, date) {
  // Reset Kundenauswahl
  _naSelectedCustId = null;
  const sel  = document.getElementById('na-cust-selected');
  const wrap = document.getElementById('na-cust-search-wrap');
  const inp  = document.getElementById('na-cust-input');
  const dd   = document.getElementById('na-cust-dropdown');
  const hint = document.getElementById('na-last-price-hint');
  if (sel)  { sel.style.display = 'none'; sel.innerHTML = ''; }
  if (wrap) wrap.style.display = '';
  if (inp)  inp.value = '';
  if (dd)   dd.style.display = 'none';
  if (hint) hint.style.display = 'none';

  // Service + Notiz zurücksetzen
  const svcEl = document.getElementById('na-service');
  if (svcEl) svcEl.value = '';
  const notEl = document.getElementById('na-notes');
  if (notEl) notEl.value = '';

  // Personel vorab auswählen
  if (staffId) {
    const staffSel = document.getElementById('na-staff');
    if (staffSel) staffSel.value = staffId;
  }

  // Uhrzeit vorab ausfüllen
  if (time) {
    const timeEl = document.getElementById('na-time');
    if (timeEl) timeEl.value = time;
  }

  // Datum vorab ausfüllen
  if (date) {
    const dateEl = document.getElementById('na-date');
    if (dateEl) {
      const d = date instanceof Date ? date : new Date(date);
      dateEl.value = d.toISOString().split('T')[0];
    }
  }

  openModal('new-appt-modal');
}

function saveNewAppt() {
  const time  = document.getElementById('na-time').value;
  const svcId = parseInt(document.getElementById('na-service').value);
  const dur   = parseInt(document.getElementById('na-dur').value) || 30;

  if (!_naSelectedCustId) { showMsg('Müşteri seçiniz.', 'red'); return; }
  if (!time)  { showMsg('Saat seçiniz.', 'red'); return; }
  if (!svcId) { showMsg('Hizmet seçiniz.', 'red'); return; }

  const cust    = CUSTOMERS.find(c => c.id === _naSelectedCustId);
  const name    = cust?.name  || 'Misafir';
  const phone   = cust?.phone || '';
  const svc     = SERVICES.find(s => s.id === svcId);
  const staffId = parseInt(document.getElementById('na-staff').value) || 1;
  const price   = parseFloat(document.getElementById('na-price').value) || svc?.price || 0;
  const endTime = addMinutes(time, dur);

  const newAppt = {
    id:       TODAY_APPOINTMENTS.length + 1 + Math.floor(Math.random() * 1000),
    staffId, time, end: endTime, duration: dur,
    name, service: svc?.name || 'Hizmet',
    price, status: 'confirmed', phone,
  };

  TODAY_APPOINTMENTS.push(newAppt);
  TODAY_APPOINTMENTS.sort((a, b) => a.time.localeCompare(b.time));

  // Müşteri geçmişine kaydet
  if (cust) {
    const staff   = STAFF.find(s => s.id === staffId);
    const dateStr = new Date().toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' });
    cust.history.unshift({
      date: dateStr, service: svc?.name || 'Hizmet',
      staffId, staff: staff?.name || '—', price,
    });
  }

  closeModal('new-appt-modal');
  renderCalendar();
  renderOverviewAppointments();
  renderKasseAppointments();

  // WhatsApp hatırlatıcı bildirimi
  const notif = SALON_CONFIG.notifications;
  if (notif.whatsappEnabled && notif.reminderMinutes > 0 && phone) {
    showMsg(`✓ ${name} randevusu oluşturuldu · ⏰ WA hatırlatıcı ${_reminderLabel(notif.reminderMinutes)} önce planlandı`, 'green');
  } else {
    showMsg(`✓ ${name} için randevu oluşturuldu.`, 'green');
  }

  // State sıfırla
  _naSelectedCustId = null;
}

// ════════════════════════════════════════════
// KASSE TABS
// ════════════════════════════════════════════
function switchKasseTab(tab) {
  ['pos','rapor','gecmis'].forEach(t => {
    document.getElementById('ktab-' + t)?.classList.toggle('active', t === tab);
    document.getElementById('ktp-' + t)?.classList.toggle('active', t === tab);
  });
  if (tab === 'rapor')  updateBericht();
  if (tab === 'gecmis') renderTransactionHistory();
}

function updateBericht() {
  // aus kasse.js kasseState nutzen
  if (typeof kasseState === 'undefined') return;
  const total = kasseState.nakit + kasseState.kart;
  const el = document.getElementById('br-bugun');
  if (el) el.textContent = '₺' + total.toFixed(2);

  const nTx = kasseState.transactions.filter(t => t.method === 'nakit').length;
  const kTx = kasseState.transactions.filter(t => t.method === 'kart').length;
  const nv  = document.getElementById('br-nakit-val');
  const kv  = document.getElementById('br-kart-val');
  const nt  = document.getElementById('br-nakit-tx');
  const kt  = document.getElementById('br-kart-tx');
  if (nv) nv.textContent = '₺' + kasseState.nakit.toFixed(2);
  if (kv) kv.textContent = '₺' + kasseState.kart.toFixed(2);
  if (nt) nt.textContent = nTx;
  if (kt) kt.textContent = kTx;

  // Per-Staff (Simulation)
  const tbody = document.getElementById('br-staff-body');
  if (tbody) {
    tbody.innerHTML = STAFF.map(s => `
      <tr>
        <td><span style="display:inline-flex;align-items:center;gap:5px">
          <span style="width:7px;height:7px;border-radius:50%;background:${s.color};display:inline-block"></span>
          ${s.name}
        </span></td>
        <td>${Math.floor(Math.random()*3)}</td>
        <td class="val">₺${(Math.floor(Math.random()*500)).toFixed(2)}</td>
      </tr>`).join('');
  }
}

// ════════════════════════════════════════════
// MODAL HELPERS
// ════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

// Klick auf Overlay schließt Modal
document.addEventListener('click', e => {
  document.querySelectorAll('.modal-overlay.open').forEach(overlay => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ── kasse.js closeModal override ─────────────
// kasse.js ruft closeModal() ohne Parameter — wir patchen:
const _kasseCloseModal = () => closeModal('receipt-modal');

// ════════════════════════════════════════════
// NACHRICHTEN (Toast)
// ════════════════════════════════════════════
function showMsg(msg, type = 'gold') {
  const old = document.getElementById('dash-msg');
  if (old) old.remove();
  const colors = {
    gold:  { bg: 'rgba(201,168,76,.12)',  border: 'rgba(201,168,76,.3)',  text: 'var(--gold)'     },
    green: { bg: 'rgba(46,204,113,.12)',  border: 'rgba(46,204,113,.3)',  text: 'var(--green)'    },
    red:   { bg: 'rgba(231,76,60,.12)',   border: 'rgba(231,76,60,.3)',   text: 'var(--red)'      },
  };
  const c = colors[type] || colors.gold;
  const el = document.createElement('div');
  el.id = 'dash-msg';
  el.style.cssText = `
    position:fixed;top:70px;left:50%;transform:translateX(-50%);
    background:${c.bg};border:1px solid ${c.border};color:${c.text};
    border-radius:10px;padding:10px 18px;font-size:.86rem;
    z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.4);
    animation:fadeUp .25s ease;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Abwärtskompatibilität mit kasse.js
function showKasseMsg(msg) { showMsg(msg, 'red'); }

// ════════════════════════════════════════════
// HİZMET KATALOĞU
// ════════════════════════════════════════════

let _hizmetEditId    = null;   // null = neu, number = bearbeiten
let _hizmetCatFilter = 'Tümü';

function renderHizmetler() {
  renderHizmetCatFilter();
  const search = (document.getElementById('hizmet-search')?.value || '').toLowerCase();
  const list   = document.getElementById('hizmet-list');
  if (!list) return;

  const filtered = SERVICE_CATALOG.filter(s => {
    const matchCat  = _hizmetCatFilter === 'Tümü' || s.category === _hizmetCatFilter;
    const matchText = !search || s.name.toLowerCase().includes(search) || (s.category||'').toLowerCase().includes(search);
    return matchCat && matchText;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--tx2);font-size:.88rem">Hizmet bulunamadı.</div>`;
    return;
  }

  list.innerHTML = filtered.map(s => {
    const priceHtml = s.price !== null
      ? `<span class="hizmet-price">₺${s.price}</span>`
      : `<span class="hizmet-price serbest">Serbest Fiyat</span>`;
    const durHtml = s.duration !== null
      ? `<span class="hizmet-dur">⏱ ${s.duration} dk</span>`
      : `<span class="hizmet-dur" style="font-style:italic">Belirsiz</span>`;
    const catInitial = (s.category || '?')[0].toUpperCase();
    const descHtml = s.description ? `<div class="hizmet-card-desc">${s.description}</div>` : '';
    const extrasHtml = s.extras?.length ? `
      <div class="hizmet-extras-bar">
        <span style="font-size:.7rem;color:var(--tx3);margin-right:2px">Ekstralar:</span>
        ${s.extras.map(ex => `
          <span class="hizmet-extra-chip">
            ${ex.name}
            <span class="extra-price">${ex.price !== null ? '+ ₺' + ex.price : '+ Serbest'}</span>
          </span>`).join('')}
      </div>` : '';

    return `
      <div class="hizmet-card ${s.active ? '' : 'inactive'}">
        <div class="hizmet-card-main">
          <div class="hizmet-cat-dot">${catInitial}</div>
          <div class="hizmet-card-info">
            <div class="hizmet-card-name">${s.name}</div>
            <div class="hizmet-card-cat">${s.category || '—'}</div>
            ${descHtml}
          </div>
          <div class="hizmet-meta">
            ${durHtml}
            ${priceHtml}
            <button class="hizmet-edit-btn" onclick="openHizmetModal(${s.id})">✏️</button>
            <button class="hizmet-edit-btn" onclick="toggleHizmetActive(${s.id})"
              title="${s.active ? 'Pasif yap' : 'Aktif yap'}" style="${s.active ? '' : 'color:var(--gold)'}">
              ${s.active ? '👁' : '👁‍🗨'}
            </button>
          </div>
        </div>
        ${extrasHtml}
      </div>`;
  }).join('');
}

function renderHizmetCatFilter() {
  const bar = document.getElementById('hizmet-cat-filter');
  if (!bar) return;
  const cats = ['Tümü', ...new Set(SERVICE_CATALOG.map(s => s.category).filter(Boolean))];
  bar.innerHTML = cats.map(c => `
    <button class="hizmet-cat-pill ${c === _hizmetCatFilter ? 'active' : ''}"
            onclick="setHizmetCat('${c}')">${c}</button>`).join('');
}

function setHizmetCat(cat) {
  _hizmetCatFilter = cat;
  renderHizmetler();
}

function toggleHizmetActive(id) {
  const s = SERVICE_CATALOG.find(x => x.id === id);
  if (s) { s.active = !s.active; renderHizmetler(); }
}

// ── Modal öffnen ──────────────────────────────
function openHizmetModal(id = null) {
  _hizmetEditId = id;
  const s = id ? SERVICE_CATALOG.find(x => x.id === id) : null;
  const title = document.getElementById('hizmet-modal-title');
  if (title) title.textContent = id ? 'Hizmeti Düzenle' : 'Yeni Hizmet';

  // Felder befüllen
  document.getElementById('hm-name').value     = s?.name        || '';
  document.getElementById('hm-category').value = s?.category    || '';
  document.getElementById('hm-desc').value     = s?.description || '';

  const priceInput = document.getElementById('hm-price');
  const priceFree  = document.getElementById('hm-price-free');
  const durInput   = document.getElementById('hm-duration');
  const durFree    = document.getElementById('hm-dur-free');

  if (s?.price === null) {
    priceInput.value    = ''; priceInput.disabled = true; priceFree.checked = true;
  } else {
    priceInput.value    = s?.price ?? ''; priceInput.disabled = false; priceFree.checked = false;
  }
  if (s?.duration === null) {
    durInput.value      = ''; durInput.disabled = true; durFree.checked = true;
  } else {
    durInput.value      = s?.duration ?? ''; durInput.disabled = false; durFree.checked = false;
  }

  // Extras Editor
  renderExtrasEditor(s?.extras || []);

  // Datalist für Kategorien
  const dl = document.getElementById('hm-cat-datalist');
  if (dl) {
    const cats = [...new Set(SERVICE_CATALOG.map(x => x.category).filter(Boolean))];
    dl.innerHTML = cats.map(c => `<option value="${c}">`).join('');
  }

  document.getElementById('hizmet-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('hm-name')?.focus(), 300);
}

function closeHizmetModal() {
  document.getElementById('hizmet-modal')?.classList.remove('open');
  document.body.style.overflow = '';
  _hizmetEditId = null;
}

function togglePriceFree() {
  const cb    = document.getElementById('hm-price-free');
  const input = document.getElementById('hm-price');
  input.disabled = cb.checked;
  if (cb.checked) input.value = '';
}

function toggleDurFree() {
  const cb    = document.getElementById('hm-dur-free');
  const input = document.getElementById('hm-duration');
  input.disabled = cb.checked;
  if (cb.checked) input.value = '';
}

// ── Extras Editor ─────────────────────────────
let _editExtras = [];

function renderExtrasEditor(extras) {
  _editExtras = extras.map(e => ({ ...e }));
  _refreshExtrasEditor();
}

function _refreshExtrasEditor() {
  const editor = document.getElementById('hm-extras-editor');
  if (!editor) return;
  editor.innerHTML = _editExtras.map((ex, i) => `
    <div class="extra-editor-row">
      <input type="text" placeholder="Ekstra adı (ör. Yıkama)" value="${ex.name}"
             oninput="_editExtras[${i}].name=this.value">
      <input type="number" class="price-input" placeholder="₺" min="0" step="0.01"
             value="${ex.price !== null ? ex.price : ''}"
             ${ex.price === null ? 'disabled' : ''}
             oninput="_editExtras[${i}].price=this.value===''?null:parseFloat(this.value)">
      <label class="serbest-lbl">
        <input type="checkbox" ${ex.price === null ? 'checked' : ''}
               onchange="_toggleExtraPrice(${i},this.checked)"> Serbest
      </label>
      <button class="extra-del-btn" onclick="_removeEditExtra(${i})">✕</button>
    </div>`).join('');
}

function _toggleExtraPrice(idx, isFree) {
  _editExtras[idx].price = isFree ? null : 0;
  _refreshExtrasEditor();
}

function _removeEditExtra(idx) {
  _editExtras.splice(idx, 1);
  _refreshExtrasEditor();
}

function addExtraRow() {
  _editExtras.push({ id: svcExtraIdCounter++, name: '', price: null });
  _refreshExtrasEditor();
}

// ── Speichern ─────────────────────────────────
function saveHizmet() {
  const name     = document.getElementById('hm-name').value.trim();
  if (!name) { showMsg('Hizmet adı zorunludur.', 'red'); return; }

  const category = document.getElementById('hm-category').value.trim() || null;
  const desc     = document.getElementById('hm-desc').value.trim();
  const priceFree= document.getElementById('hm-price-free').checked;
  const durFree  = document.getElementById('hm-dur-free').checked;
  const priceVal = parseFloat(document.getElementById('hm-price').value);
  const durVal   = parseInt(document.getElementById('hm-duration').value);

  const price    = priceFree ? null : (isNaN(priceVal) ? null : priceVal);
  const duration = durFree   ? null : (isNaN(durVal)   ? null : durVal);

  const extras = _editExtras.filter(e => e.name.trim());

  if (_hizmetEditId) {
    // Update
    const idx = SERVICE_CATALOG.findIndex(s => s.id === _hizmetEditId);
    if (idx > -1) {
      SERVICE_CATALOG[idx] = { ...SERVICE_CATALOG[idx], name, category, price, duration, description: desc, extras };
    }
    showMsg('Hizmet güncellendi.', 'green');
  } else {
    // Neu
    SERVICE_CATALOG.push({
      id: svcIdCounter++, name, category, price, duration,
      description: desc, active: true, extras,
    });
    showMsg('Yeni hizmet eklendi.', 'green');
  }

  closeHizmetModal();
  renderHizmetler();
}

// ════════════════════════════════════════════
// SALON AYARLARI
// ════════════════════════════════════════════

function renderAyarlar() {
  // Temel bilgiler
  _setVal('cfg-name',        SALON_CONFIG.name);
  _setVal('cfg-tagline',     SALON_CONFIG.tagline);
  _setVal('cfg-phone',       SALON_CONFIG.phone);
  _setVal('cfg-email',       SALON_CONFIG.email);
  _setVal('cfg-address',     SALON_CONFIG.address);
  _setVal('cfg-district',    SALON_CONFIG.district);
  _setVal('cfg-city',        SALON_CONFIG.city);
  _setVal('cfg-postal',      SALON_CONFIG.postalCode);
  _setVal('cfg-description', SALON_CONFIG.description);

  // Sosyal medya
  _setVal('cfg-instagram',   SALON_CONFIG.social.instagram);
  _setVal('cfg-facebook',    SALON_CONFIG.social.facebook);
  _setVal('cfg-tiktok',      SALON_CONFIG.social.tiktok);
  _setVal('cfg-whatsapp',    SALON_CONFIG.social.whatsapp);
  _setVal('cfg-website',     SALON_CONFIG.social.website);
  _setVal('cfg-googlemaps',  SALON_CONFIG.social.googlemaps);

  // Logo
  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');
  if (SALON_CONFIG.logo && preview) {
    preview.src = SALON_CONFIG.logo;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  } else if (placeholder) {
    placeholder.textContent = getInitials(SALON_CONFIG.name || 'S');
    if (preview) preview.style.display = 'none';
    placeholder.style.display = 'flex';
  }

  // Bildirimler
  const waToggle  = document.getElementById('cfg-wa-enabled');
  const smsToggle = document.getElementById('cfg-sms-enabled');
  const remSel    = document.getElementById('cfg-reminder-min');
  if (waToggle)  waToggle.checked  = SALON_CONFIG.notifications.whatsappEnabled;
  if (smsToggle) smsToggle.checked = SALON_CONFIG.notifications.smsEnabled;
  if (remSel)    remSel.value      = SALON_CONFIG.notifications.reminderMinutes;
  updateNotifyChannelUI();

  // Çalışma saatleri
  renderHoursTable();
}

function _setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function renderHoursTable() {
  const table = document.getElementById('hours-table');
  if (!table) return;
  const days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  table.innerHTML = SALON_CONFIG.hours.map((h, i) => `
    <div class="hours-row ${h.open ? '' : 'hours-closed'}">
      <div class="hours-day">${days[i]}<span class="hours-day-full">&nbsp;·&nbsp;${h.day}</span></div>
      <label class="toggle-switch">
        <input type="checkbox" ${h.open ? 'checked' : ''}
               onchange="toggleDayOpen(${i}, this.checked)">
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
      <div class="hours-times ${h.open ? '' : 'hours-times-hidden'}">
        <input type="time" class="hours-input" value="${h.start}"
               onchange="SALON_CONFIG.hours[${i}].start = this.value">
        <span class="hours-sep">—</span>
        <input type="time" class="hours-input" value="${h.end}"
               onchange="SALON_CONFIG.hours[${i}].end = this.value">
      </div>
      <div class="hours-closed-label ${h.open ? 'hidden' : ''}">Kapalı</div>
    </div>`).join('');
}

function toggleDayOpen(idx, isOpen) {
  SALON_CONFIG.hours[idx].open = isOpen;
  renderHoursTable();
}

function handleLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    SALON_CONFIG.logo = e.target.result;
    const preview = document.getElementById('logo-preview');
    const placeholder = document.getElementById('logo-placeholder');
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  SALON_CONFIG.logo = null;
  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) {
    placeholder.textContent = getInitials(SALON_CONFIG.name || 'S');
    placeholder.style.display = 'flex';
  }
}

// Bildirim kanalı önizleme + tab senkronizasyonu
function updateNotifyChannelUI() {
  const waOn  = document.getElementById('cfg-wa-enabled')?.checked
                ?? SALON_CONFIG.notifications.whatsappEnabled;
  const smsOn = document.getElementById('cfg-sms-enabled')?.checked
                ?? SALON_CONFIG.notifications.smsEnabled;

  // ── Önizleme metni (ayarlar sayfası) ──────────
  const preview = document.getElementById('notify-channel-preview');
  if (preview) {
    if (!waOn && !smsOn) {
      preview.innerHTML = `<span style="color:var(--tx3)">⛔ Hiçbir kanal aktif değil — müşterilere bildirim gönderilmez, reservasyon sayfasında bildirim seçeneği çıkmaz.</span>`;
    } else {
      const parts = [];
      if (waOn)  parts.push(`<span style="color:#25d366;font-weight:700">💬 WhatsApp</span>`);
      if (smsOn) parts.push(`<span style="color:#4fa8ff;font-weight:700">📱 SMS</span>`);
      const both = waOn && smsOn;
      preview.innerHTML = `
        Müşteri rezervasyon sayfasında şunlar görünür:<br>
        <strong style="color:var(--tx)">${parts.join(' ve ')}</strong> bildirim tercihi${both ? ' — ikisi arasından seçer' : ''}.<br>
        <span style="color:var(--tx3);font-size:.68rem">Yalnızca aktif kanallar gösterilir · Müşteri "Bildirim istemiyorum" da seçebilir</span>`;
    }
  }

  // ── Abonelik sekmesindeki WA/SMS tabları ──────
  const waTab  = document.getElementById('msg-tab-wa-btn');
  const smsTab = document.getElementById('msg-tab-sms-btn');
  const waContent  = document.getElementById('abo-wa-content');
  const smsContent = document.getElementById('abo-sms-content');

  if (waTab && smsTab) {
    // Tab-Buttons: deaktiviert wenn kanal aus
    waTab.style.opacity  = waOn  ? '1' : '0.4';
    smsTab.style.opacity = smsOn ? '1' : '0.4';

    // Falls gerade aktiver Tab deaktiviert wird → auf anderen wechseln
    const waVisible  = waContent  && waContent.style.display  !== 'none';
    const smsVisible = smsContent && smsContent.style.display !== 'none';
    if (waVisible && !waOn && smsOn)   switchMsgTab('sms');
    if (smsVisible && !smsOn && waOn)  switchMsgTab('wa');
    if (waOn && !smsOn)  switchMsgTab('wa');
    if (smsOn && !waOn)  switchMsgTab('sms');
  }

  // ── Aktif kanal-badge im Header ──────────────
  const badge = document.getElementById('notify-active-badge');
  if (badge) {
    if (!waOn && !smsOn)      badge.textContent = '⛔ Kapalı';
    else if (waOn && smsOn)   badge.textContent = '💬 WA + 📱 SMS';
    else if (waOn)            badge.textContent = '💬 WA aktif';
    else                      badge.textContent = '📱 SMS aktif';
  }
}

// Getter — liefert aktive Kanäle als Array ['wa', 'sms'] o.ä.
function _getActiveNotifyChannels() {
  return {
    wa:  SALON_CONFIG.notifications.whatsappEnabled,
    sms: SALON_CONFIG.notifications.smsEnabled,
    any: SALON_CONFIG.notifications.whatsappEnabled || SALON_CONFIG.notifications.smsEnabled,
  };
}

function saveAyarlar() {
  const g = id => document.getElementById(id)?.value?.trim() || '';
  SALON_CONFIG.name        = g('cfg-name')        || SALON_CONFIG.name;
  SALON_CONFIG.tagline     = g('cfg-tagline');
  SALON_CONFIG.phone       = g('cfg-phone');
  SALON_CONFIG.email       = g('cfg-email');
  SALON_CONFIG.address     = g('cfg-address');
  SALON_CONFIG.district    = g('cfg-district');
  SALON_CONFIG.city        = g('cfg-city');
  SALON_CONFIG.postalCode  = g('cfg-postal');
  SALON_CONFIG.description = g('cfg-description');
  SALON_CONFIG.social = {
    instagram:  g('cfg-instagram'),
    facebook:   g('cfg-facebook'),
    tiktok:     g('cfg-tiktok'),
    whatsapp:   g('cfg-whatsapp'),
    website:    g('cfg-website'),
    googlemaps: g('cfg-googlemaps'),
  };

  // Bildirim kanalları
  const waToggle  = document.getElementById('cfg-wa-enabled');
  const smsToggle = document.getElementById('cfg-sms-enabled');
  const remSel    = document.getElementById('cfg-reminder-min');
  if (waToggle)  SALON_CONFIG.notifications.whatsappEnabled = waToggle.checked;
  if (smsToggle) SALON_CONFIG.notifications.smsEnabled      = smsToggle.checked;
  if (remSel)    SALON_CONFIG.notifications.reminderMinutes = parseInt(remSel.value);
  updateNotifyChannelUI();

  // Booking sayfasının okuyabileceği kanal config'ini kaydet
  localStorage.setItem('rd_salon_notify_cfg', JSON.stringify({
    wa:  SALON_CONFIG.notifications.whatsappEnabled,
    sms: SALON_CONFIG.notifications.smsEnabled,
  }));

  // Salon adını topbara yansıt
  const nameEl = document.querySelector('.topbar-name');
  if (nameEl) nameEl.textContent = SALON_CONFIG.name;

  showMsg('✓ Salon bilgileri kaydedildi.', 'green');
}

// ════════════════════════════════════════════
// FEATURE 3: BERICHTE (Reports)
// ════════════════════════════════════════════
const BERICHTE_DATA = {
  // Haftalık: Pzt–Paz (nakit + kart ayrı)
  weekBar: [1200, 1800, 1500, 2000, 2300, 1600, 0],
  weekEC:  [1140, 1320, 1280, 1450, 1800, 1300, 0],
  weekCustomers: [18, 24, 21, 27, 31, 23, 0],

  // Aylık: 12 ay (nakit + kart ayrı)
  monthBar: [20000,22500,21000,23500,21800,23000,25000,24000,26000,28000,26500,27500],
  monthEC:  [18200,19600,18800,21000,19400,20800,22200,21100,22900,24300,23300,24100],
  monthCustomers: [210,235,218,248,229,241,265,254,272,291,278,287],

  // Hizmet — per period
  serviceRanking: {
    day:   [ { name:'Saç Kesimi', count:4, revenue:600 }, { name:'Saç + Sakal', count:2, revenue:440 }, { name:'Sakal Tıraşı', count:3, revenue:300 }, { name:'Saç Boyama', count:1, revenue:420 } ],
    week:  [ { name:'Saç Kesimi', count:22, revenue:3300 }, { name:'Saç + Sakal', count:13, revenue:2860 }, { name:'Saç Boyama', count:9, revenue:3780 }, { name:'Röfle & Boya', count:6, revenue:3300 }, { name:'Keratin Bakımı', count:4, revenue:1920 }, { name:'Manikür & Pedikür', count:8, revenue:2240 } ],
    month: [ { name:'Saç Kesimi', count:89, revenue:13350 }, { name:'Saç + Sakal', count:54, revenue:11880 }, { name:'Saç Boyama', count:41, revenue:17220 }, { name:'Röfle & Boya', count:28, revenue:15400 }, { name:'Keratin Bakımı', count:19, revenue:9120 }, { name:'Manikür & Pedikür', count:36, revenue:10080 } ],
    year:  [ { name:'Saç Kesimi', count:980, revenue:147000 }, { name:'Saç + Sakal', count:620, revenue:136400 }, { name:'Saç Boyama', count:480, revenue:201600 }, { name:'Röfle & Boya', count:320, revenue:176000 }, { name:'Keratin Bakımı', count:210, revenue:100800 }, { name:'Manikür & Pedikür', count:410, revenue:114800 } ],
  },

  // Personel — per period
  staffRevenue: {
    day:   [ { staffId:1, name:'Ahmet Yılmaz', revenue:1200, appts:5 }, { staffId:2, name:'Mehmet Demir', revenue:980,  appts:4 }, { staffId:3, name:'Fatma Kaya', revenue:780,  appts:3 } ],
    week:  [ { staffId:1, name:'Ahmet Yılmaz', revenue:5800, appts:24 }, { staffId:2, name:'Mehmet Demir', revenue:4900, appts:19 }, { staffId:3, name:'Fatma Kaya', revenue:3900, appts:15 } ],
    month: [ { staffId:1, name:'Ahmet Yılmaz', revenue:23400, appts:98 }, { staffId:2, name:'Mehmet Demir', revenue:19800, appts:76 }, { staffId:3, name:'Fatma Kaya', revenue:15600, appts:62 } ],
    year:  [ { staffId:1, name:'Ahmet Yılmaz', revenue:281000, appts:1180 }, { staffId:2, name:'Mehmet Demir', revenue:238000, appts:920 }, { staffId:3, name:'Fatma Kaya', revenue:187000, appts:740 } ],
  },
};

let _berihtePeriod = 'week';
let _brSelectedIdx = null; // seçili ay/gün index

function renderBerichte() {
  const gateEl = document.getElementById('view-berichte');
  const gate = _gateHtml('kasa', 'Pro');
  if (gate) { if (gateEl) gateEl.innerHTML = '<div class="sec-hdr"><h2>Raporlar & Analitik</h2></div>' + gate; return; }

  _brSelectedIdx = null;
  renderRevenueChart();
  renderBrLeftCard();
  renderBrPeriodCard();
  renderServiceRanking();
  renderBrStaffRanking();
  renderZamanRaporu();
}

function renderBrLeftCard() {
  const g = id => document.getElementById(id);
  const tf = v => '₺' + v.toLocaleString('tr');
  const isWeek = _berihtePeriod === 'week';
  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const curMonth = new Date().getMonth();

  let leftBar, leftEC, leftCustomers, leftAppts, leftTitle;

  if (isWeek) {
    // Haftalık seçiliyken → sol kart = BU AY özeti
    leftBar       = BERICHTE_DATA.monthBar[curMonth];
    leftEC        = BERICHTE_DATA.monthEC[curMonth];
    leftCustomers = BERICHTE_DATA.monthCustomers[curMonth];
    leftAppts     = '—';
    leftTitle     = '📅 ' + monthNames[curMonth] + ' Özeti';
  } else {
    // Aylık seçiliyken → sol kart = YILLIK özet
    leftBar       = BERICHTE_DATA.monthBar.reduce((a,b)=>a+b,0);
    leftEC        = BERICHTE_DATA.monthEC.reduce((a,b)=>a+b,0);
    leftCustomers = BERICHTE_DATA.monthCustomers.reduce((a,b)=>a+b,0);
    leftAppts     = '—';
    leftTitle     = '📅 Yıllık Özet (2026)';
  }

  if (g('br-left-title'))     g('br-left-title').textContent     = leftTitle;
  if (g('br-left-bar'))       g('br-left-bar').textContent       = tf(leftBar);
  if (g('br-left-ec'))        g('br-left-ec').textContent        = tf(leftEC);
  if (g('br-left-total'))     g('br-left-total').textContent     = tf(leftBar + leftEC);
  if (g('br-left-customers')) g('br-left-customers').textContent = leftCustomers.toLocaleString('tr');
  if (g('br-left-appts'))     g('br-left-appts').textContent     = leftAppts;
}

function renderBrPeriodCard(idx) {
  const g = id => document.getElementById(id);
  const tf = v => '₺' + v.toLocaleString('tr');
  const isWeek = _berihtePeriod === 'week';
  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const dayNames   = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
  const curMonth   = new Date().getMonth();

  let bar, ec, customers, title, hint;

  if (idx !== null && idx !== undefined) {
    // Balken angeklickt → zeige Detail für diesen Tag/Monat
    if (isWeek) {
      bar       = BERICHTE_DATA.weekBar[idx];
      ec        = BERICHTE_DATA.weekEC[idx];
      customers = BERICHTE_DATA.weekCustomers[idx];
      title     = dayNames[idx];
      hint      = '— Bu hafta içinde';
    } else {
      bar       = BERICHTE_DATA.monthBar[idx];
      ec        = BERICHTE_DATA.monthEC[idx];
      customers = BERICHTE_DATA.monthCustomers[idx];
      title     = monthNames[idx] + ' 2026';
      hint      = '— Aylık detay';
    }
  } else {
    // Kein Balken angeklickt → Standardansicht
    if (isWeek) {
      // Haftalık: rechts = Bu Hafta Toplamı
      bar       = BERICHTE_DATA.weekBar.reduce((a,b)=>a+b,0);
      ec        = BERICHTE_DATA.weekEC.reduce((a,b)=>a+b,0);
      customers = BERICHTE_DATA.weekCustomers.reduce((a,b)=>a+b,0);
      title     = 'Bu Hafta Toplamı';
      hint      = '— Bir güne tıkla';
    } else {
      // Aylık: rechts = Bu Ay özeti
      bar       = BERICHTE_DATA.monthBar[curMonth];
      ec        = BERICHTE_DATA.monthEC[curMonth];
      customers = BERICHTE_DATA.monthCustomers[curMonth];
      title     = monthNames[curMonth] + ' 2026';
      hint      = '— Bir aya tıkla';
    }
  }

  if (g('br-period-title'))    g('br-period-title').textContent    = title;
  if (g('br-period-hint'))     g('br-period-hint').textContent     = hint || '';
  if (g('br-pd-bar'))          g('br-pd-bar').textContent          = tf(bar);
  if (g('br-pd-ec'))           g('br-pd-ec').textContent           = tf(ec);
  if (g('br-pd-customers'))    g('br-pd-customers').textContent    = customers.toLocaleString('tr');
  if (g('br-pd-total'))        g('br-pd-total').textContent        = tf(bar + ec);
}

function renderRevenueChart() {
  const chart = document.getElementById('br-revenue-chart');
  if (!chart) return;
  const isWeek = _berihtePeriod === 'week';
  const barArr = isWeek ? BERICHTE_DATA.weekBar    : BERICHTE_DATA.monthBar;
  const ecArr  = isWeek ? BERICHTE_DATA.weekEC     : BERICHTE_DATA.monthEC;
  const labels = isWeek
    ? ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
    : ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const maxVal = Math.max(...barArr.map((v,i) => v + ecArr[i]), 1);

  chart.innerHTML = barArr.map((b, i) => {
    const ec     = ecArr[i];
    const total  = b + ec;
    const totalPct = Math.round(total / maxVal * 100);
    const ecPct    = total > 0 ? Math.round(ec / total * 100) : 0;
    const barPct   = 100 - ecPct;
    const isSel    = _brSelectedIdx === i;
    const accentColor = isSel ? 'var(--gold)' : 'var(--accent)';
    const ecColor     = isSel ? 'rgba(201,168,76,.6)' : 'rgba(99,102,241,.65)';
    return `
    <div class="br-bar-col" onclick="brSelectBar(${i})" style="cursor:pointer" title="₺${total.toLocaleString('tr')}">
      <div class="br-bar-wrap">
        <div style="width:100%;height:${totalPct}%;display:flex;flex-direction:column;border-radius:4px 4px 0 0;overflow:hidden;min-height:${total>0?4:0}px">
          <div style="flex:${ecPct};background:${ecColor};min-height:${ec>0?2:0}px" title="Kart: ₺${ec.toLocaleString('tr')}"></div>
          <div style="flex:${barPct};background:${accentColor};min-height:${b>0?2:0}px" title="Nakit: ₺${b.toLocaleString('tr')}"></div>
        </div>
      </div>
      <div class="br-bar-lbl" style="color:${isSel?'var(--gold)':'var(--tx2)'};font-weight:${isSel?700:400}">${labels[i]}</div>
    </div>`;
  }).join('');
}

function brSelectBar(idx) {
  _brSelectedIdx = (_brSelectedIdx === idx) ? null : idx;
  renderRevenueChart();
  renderBrPeriodCard(_brSelectedIdx);
}

function switchBerihtePeriod(period, btn) {
  _berihtePeriod = period;
  _brSelectedIdx = null;
  document.querySelectorAll('.br-seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRevenueChart();
  renderBrLeftCard();
  renderBrPeriodCard();
}

function _renderBarChart(containerIdOrEl, items, opts) {
  // items: [{label, value, value2, color, sublabel}]
  // opts: {height, unit, color2}
  const el = typeof containerIdOrEl === 'string' ? document.getElementById(containerIdOrEl) : containerIdOrEl;
  if (!el) return;
  const maxVal = Math.max(...items.map(it => it.value + (it.value2||0)), 1);
  const h = opts.height || 160;
  el.style.display = 'flex';
  el.style.alignItems = 'flex-end';
  el.style.gap = '6px';
  el.style.height = h + 'px';
  el.style.padding = '0 2px';
  const unit = opts.unit || '';
  el.innerHTML = items.map(it => {
    const total    = it.value + (it.value2||0);
    const totalPct = Math.round(total / maxVal * 100);
    const v2Pct    = total > 0 ? Math.round((it.value2||0) / total * 100) : 0;
    const v1Pct    = 100 - v2Pct;
    const col1     = it.color || 'var(--accent)';
    const col2     = opts.color2 || 'rgba(99,102,241,.65)';
    return `<div class="br-bar-col" title="${it.label}: ${unit}${total.toLocaleString('tr')}${it.sublabel?' · '+it.sublabel:''}">
      <div class="br-bar-wrap">
        <div style="width:100%;height:${totalPct}%;display:flex;flex-direction:column;border-radius:4px 4px 0 0;overflow:hidden;min-height:${total>0?4:0}px">
          ${it.value2>0?`<div style="flex:${v2Pct};background:${col2};min-height:2px"></div>`:''}
          <div style="flex:${v1Pct};background:${col1};min-height:${it.value>0?2:0}px"></div>
        </div>
      </div>
      <div class="br-bar-lbl" style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.label}</div>
      ${it.sublabel?`<div style="font-size:.58rem;color:var(--tx2);margin-top:1px">${it.sublabel}</div>`:''}
    </div>`;
  }).join('');
}

let _svcFilter    = 'day';  let _svcOffset    = 0;
let _staffFilter  = 'day';  let _staffOffset  = 0;

const _BR_TODAY = new Date('2026-04-19');

// Gibt {label, isFuture} für Filter + Offset zurück
function _brPeriodLabel(filter, offset) {
  const d = new Date(_BR_TODAY);
  const pad = n => String(n).padStart(2,'0');
  const fmtD = dt => `${pad(dt.getDate())}.${pad(dt.getMonth()+1)}.${dt.getFullYear()}`;
  const fmtM = dt => dt.toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
  const isFuture = offset > 0;

  if (filter === 'day') {
    d.setDate(d.getDate() + offset);
    const isToday = offset === 0;
    return { label: isToday ? `Bugün — ${fmtD(d)}` : fmtD(d), isFuture };
  } else if (filter === 'week') {
    const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay()+6)%7) + offset*7);
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    const isThis = offset === 0;
    return { label: (isThis ? 'Bu Hafta — ' : '') + `${fmtD(mon)} – ${fmtD(sun)}`, isFuture };
  } else if (filter === 'month') {
    const dt = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    const isThis = offset === 0;
    return { label: (isThis ? 'Bu Ay — ' : '') + fmtM(dt), isFuture };
  } else { // year
    const yr = d.getFullYear() + offset;
    return { label: (offset === 0 ? 'Bu Yıl — ' : '') + yr, isFuture };
  }
}

function _brNavBar(filter, offset, navFn, labelElId) {
  const {label, isFuture} = _brPeriodLabel(filter, offset);
  return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.75rem">
    <button onclick="${navFn}(-1)" style="background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:3px 10px;cursor:pointer;color:var(--tx);font-size:.85rem">◀</button>
    <span style="font-weight:600;color:var(--tx2);flex:1;text-align:center" id="${labelElId}">${label}</span>
    <button onclick="${navFn}(1)" style="background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:3px 10px;cursor:pointer;color:${isFuture?'var(--tx2)':'var(--tx)'};font-size:.85rem" ${isFuture?'disabled':''}>▶</button>
  </div>`;
}

function switchSvcFilter(f, btn) {
  _svcFilter = f; _svcOffset = 0;
  document.querySelectorAll('.svc-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderServiceRanking();
}
function navSvc(dir) { _svcOffset = Math.min(0, _svcOffset + dir); renderServiceRanking(); }

function switchStaffFilter(f, btn) {
  _staffFilter = f; _staffOffset = 0;
  document.querySelectorAll('.staff-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBrStaffRanking();
}
function navStaff(dir) { _staffOffset = Math.min(0, _staffOffset + dir); renderBrStaffRanking(); }

function renderServiceRanking() {
  const el = document.getElementById('br-svc-ranking');
  if (!el) return;
  const data   = BERICHTE_DATA.serviceRanking[_svcFilter] || BERICHTE_DATA.serviceRanking.month;
  const sorted = [...data].sort((a,b)=>b.revenue-a.revenue);
  let html = _brNavBar(_svcFilter, _svcOffset, 'navSvc', 'svc-period-lbl');
  el.innerHTML = html;
  const chartWrap = document.createElement('div');
  el.appendChild(chartWrap);
  _renderBarChart(chartWrap, sorted.map(s => ({
    label:    s.name.length > 9 ? s.name.slice(0,9)+'…' : s.name,
    value:    s.revenue,
    sublabel: s.count + ' rnv',
    color:    'var(--accent)',
  })), { height:160, unit:'₺' });
}

function renderBrStaffRanking() {
  const el = document.getElementById('br-staff-ranking');
  if (!el) return;
  const data   = BERICHTE_DATA.staffRevenue[_staffFilter] || BERICHTE_DATA.staffRevenue.month;
  const sorted = [...data].sort((a,b)=>b.revenue-a.revenue);
  const colors = STAFF.reduce((o,s)=>{ o[s.id]=s.color; return o; }, {});
  let html = _brNavBar(_staffFilter, _staffOffset, 'navStaff', 'staff-period-lbl');
  el.innerHTML = html;
  const chartWrap = document.createElement('div');
  el.appendChild(chartWrap);
  _renderBarChart(chartWrap, sorted.map(s => ({
    label:    s.name.split(' ')[0],
    value:    s.revenue,
    sublabel: s.appts + ' rnv',
    color:    colors[s.staffId] || 'var(--accent)',
  })), { height:160, unit:'₺' });
}


let _zamanFilter = 'day';

function switchZamanFilter(filter, btn) {
  _zamanFilter = filter;
  document.querySelectorAll('.zaman-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderZamanRaporu();
}

function renderZamanRaporu() {
  const el = document.getElementById('zaman-raporu-grid');
  if (!el) return;
  // period für Detailansicht bleibt (map filter → period)
  // Dönem tarih aralığı
  const today = new Date('2026-04-18');
  function getPeriodRange() {
    const d = new Date(today);
    if (_zamanFilter === 'day') {
      return [new Date(d), new Date(d)];
    } else if (_zamanFilter === 'week') {
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay()+6)%7));
      const sun = new Date(mon); sun.setDate(mon.getDate()+6);
      return [mon, sun];
    } else if (_zamanFilter === 'month') {
      return [new Date(d.getFullYear(),d.getMonth(),1), new Date(d.getFullYear(),d.getMonth()+1,0)];
    } else { // year
      return [new Date(d.getFullYear(),0,1), new Date(d.getFullYear(),11,31)];
    }
  }
  const [rangeStart, rangeEnd] = getPeriodRange();
  const fmt = d => d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'});
  const periodLabelMap = { day:'Bugün', week:'Bu Hafta', month:'Bu Ay', year:'Bu Yıl' };
  const periodLabel = periodLabelMap[_zamanFilter] || 'Bu Hafta';

  // Günlük saat hesabı (şablondan)
  function dayHours(sched, dowIndex) {
    const d = sched?.[dowIndex];
    if (!d?.a) return 0;
    const [fh,fm] = d.f.split(':').map(Number);
    const [th,tm] = d.t.split(':').map(Number);
    return (th + tm/60) - (fh + fm/60);
  }

  // Dönemdeki her gün için Soll hesapla — wochenspezifische Daten verwenden
  function calcSoll(staffId) {
    let hours = 0, days = 0;
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate()+1)) {
      const monday = _getWeekMonday(new Date(d));
      const sched  = _getWeekSched(staffId, monday);
      const dow = (d.getDay()+6)%7; // 0=Pzt ... 6=Paz
      const h = dayHours(sched, dow);
      if (h > 0) { hours += h; days++; }
    }
    return { hours: Math.round(hours*10)/10, days };
  }

  // İzin günleri — dönem içine düşen günlerin saatlerini çıkar
  function calcAbsenceHours(staffId) {
    const absences = ABSENCES.filter(a => a.staffId === staffId);
    let absH = 0; const absDetails = [];
    absences.forEach(ab => {
      const from = new Date(ab.from), to = new Date(ab.to);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate()+1)) {
        if (d < rangeStart || d > rangeEnd) continue;
        const monday = _getWeekMonday(new Date(d));
        const sched  = _getWeekSched(staffId, monday);
        const dow = (d.getDay()+6)%7;
        absH += dayHours(sched, dow);
      }
      // dönemle kesişiyor mu?
      if (to >= rangeStart && from <= rangeEnd) absDetails.push(ab);
    });
    return { hours: Math.round(absH*10)/10, absences: absDetails };
  }

  const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

  const rows = STAFF.map(s => {
    const sched = _getWeekSched(s.id, _getWeekMonday(rangeStart));
    const { hours: sollH, days: sollDays } = calcSoll(s.id);
    const { hours: absH, absences: absArr } = calcAbsenceHours(s.id);
    const istH = Math.max(0, Math.round((sollH - absH)*10)/10);
    const pct  = sollH > 0 ? Math.round(istH/sollH*100) : 100;
    const barColor = pct >= 90 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

    const dayPills = dayNames.map((d,i) => {
      const day = sched[i];
      return day?.a
        ? `<span style="font-size:.58rem;padding:2px 6px;border-radius:4px;background:rgba(34,197,94,.1);color:#16a34a;white-space:nowrap">${d} ${day.f}–${day.t}</span>`
        : `<span style="font-size:.58rem;padding:2px 6px;border-radius:4px;background:var(--surface2);color:var(--tx2)">${d} —</span>`;
    }).join('');

    const absHtml = absArr.length ? absArr.map(a =>
      `<span style="font-size:.6rem;padding:2px 6px;border-radius:4px;background:rgba(239,68,68,.1);color:#ef4444">
        ✗ ${(s=>s.split('-').reverse().join('.'))(a.from)===(s=>s.split('-').reverse().join('.'))(a.to)?(s=>s.split('-').reverse().join('.'))(a.from):`${(s=>s.split('-').reverse().join('.'))(a.from)}–${(s=>s.split('-').reverse().join('.'))(a.to)}`} · ${a.reason}
      </span>`).join('') : '';

    return `<div style="padding:14px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          ${_av(s, 34)}
          <div>
            <div style="font-weight:700;font-size:.88rem">${s.name}</div>
            <div style="font-size:.67rem;color:var(--tx2)">${s.jobTitle} · ${sollDays} gün/hf</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:var(--tx2)">Planlanan: <b style="color:var(--tx)">${sollH} saat</b></div>
          <div style="font-size:.72rem;color:var(--tx2)">Gerçekleşen: <b style="color:${barColor}">${istH} saat</b>${absH>0?` <span style="color:#ef4444">(-${absH})</span>`:''}</div>
        </div>
      </div>
      <div style="background:var(--surface2);border-radius:4px;height:6px;margin-bottom:6px">
        <div style="background:${barColor};height:6px;border-radius:4px;width:${pct}%;transition:.4s"></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">${dayPills}</div>
      ${absHtml?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:5px">${absHtml}</div>`:''}
    </div>`;
  }).join('');

  const totSoll = STAFF.reduce((s,st)=>s+calcSoll(st.id).hours,0);
  const totIst  = STAFF.reduce((s,st)=>{
    const {hours:sol}=calcSoll(st.id), {hours:abs}=calcAbsenceHours(st.id);
    return s + Math.max(0,sol-abs);
  },0);

  // ── Grafik ──
  const chartEl = document.getElementById('zaman-chart');
  if (chartEl) {
    const staffChartData = STAFF.map(s => {
      const {hours:sollH} = calcSoll(s.id);
      const {hours:absH}  = calcAbsenceHours(s.id);
      const istH = Math.max(0, Math.round((sollH-absH)*10)/10);
      return { name: s.name.split(' ')[0], soll: sollH, ist: istH, abs: Math.round(absH*10)/10, color: s.color };
    });
    const maxH = Math.max(...staffChartData.map(d=>d.soll), 1);
    const chartH = 140;
    chartEl.innerHTML = staffChartData.map(d => {
      const sollPct = Math.round(d.soll / maxH * 100);
      const istPct  = Math.round(d.ist  / maxH * 100);
      const absPct  = Math.round(d.abs  / maxH * 100);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;gap:3px">
        <div style="font-size:.6rem;color:var(--tx2);margin-bottom:2px">${d.soll}s</div>
        <div style="flex:1;width:100%;display:flex;align-items:flex-end;gap:3px;justify-content:center">
          <!-- Soll -->
          <div style="width:30%;display:flex;flex-direction:column;justify-content:flex-end;height:100%" title="Planlanan: ${d.soll} saat">
            <div style="background:var(--accent);opacity:.35;border-radius:3px 3px 0 0;height:${sollPct}%;min-height:${d.soll>0?3:0}px"></div>
          </div>
          <!-- Ist (yeşil) + Devamsızlık (kırmızı) üst kısmı -->
          <div style="width:30%;display:flex;flex-direction:column;justify-content:flex-end;height:100%" title="Gerçekleşen: ${d.ist} saat${d.abs>0?' · Devamsızlık: '+d.abs+'s':''}">
            ${d.abs>0?`<div style="background:rgba(239,68,68,.7);border-radius:3px 3px 0 0;height:${absPct}%;min-height:2px"></div>`:''}
            <div style="background:#22c55e;${d.abs===0?'border-radius:3px 3px 0 0;':''}height:${istPct}%;min-height:${d.ist>0?3:0}px"></div>
          </div>
        </div>
        <div style="font-size:.65rem;font-weight:600;color:var(--tx2);margin-top:3px">${d.name}</div>
      </div>`;
    }).join('');
  }

  el.innerHTML = `<div style="font-size:.72rem;color:var(--tx2);margin-bottom:10px">📅 ${fmt(rangeStart)} – ${fmt(rangeEnd)} · ${periodLabel}</div>`
    + rows
    + `<div style="display:flex;justify-content:space-between;padding-top:12px;font-size:.8rem;border-top:1px solid var(--border);margin-top:4px">
        <span style="color:var(--tx2)">Ekip Toplamı</span>
        <span>Planlanan <b>${Math.round(totSoll*10)/10} saat</b> · Gerçekleşen <b style="color:#22c55e">${Math.round(totIst*10)/10} saat</b></span>
      </div>`;
}

// ════════════════════════════════════════════
// FEATURE 4: DİENSTPLAN / İZİN
// ════════════════════════════════════════════
// Çalışma saatleri: { staffId: [ {active, from, to}, ... ] } — 7 gün (Pzt-Paz)
// Standard-Wochentemplate (Fallback wenn keine Wochendaten vorhanden)
const DIENSTPLAN = {
  1:[{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'14:00'},{a:false,f:'09:00',t:'18:00'}],
  2:[{a:true,f:'10:00',t:'19:00'},{a:true,f:'10:00',t:'19:00'},{a:true,f:'10:00',t:'19:00'},{a:true,f:'10:00',t:'19:00'},{a:true,f:'10:00',t:'19:00'},{a:true,f:'10:00',t:'19:00'},{a:false,f:'10:00',t:'19:00'}],
  3:[{a:true,f:'09:00',t:'13:00'},{a:false,f:'09:00',t:'13:00'},{a:true,f:'09:00',t:'13:00'},{a:true,f:'09:00',t:'13:00'},{a:true,f:'09:00',t:'13:00'},{a:true,f:'09:00',t:'13:00'},{a:false,f:'09:00',t:'13:00'}],
};

// Wochenspezifische Daten: DIENSTPLAN_WEEKS['2026-W16'][staffId] = [7 Tage]
const DIENSTPLAN_WEEKS = {};

// Aktuell angezeigte Woche (Montag-Datum als String 'YYYY-MM-DD')
let _dpWeekMonday = _getWeekMonday(new Date());

// Hilfsfunktionen für Wochennavigation
function _getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0) ? -6 : 1 - day; // Montag
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function _weekKey(mondayDate) {
  // ISO-Wochennummer
  const d = new Date(mondayDate);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = _getWeekMonday(jan4);
  const weekNum = Math.round((d - startOfWeek1) / (7*24*3600*1000)) + 1;
  return `${d.getFullYear()}-W${String(weekNum).padStart(2,'0')}`;
}

function _fmt(date) {
  return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}`;
}

function _getWeekSched(staffId, mondayDate) {
  const key = _weekKey(mondayDate);
  if (DIENSTPLAN_WEEKS[key] && DIENSTPLAN_WEEKS[key][staffId]) {
    return DIENSTPLAN_WEEKS[key][staffId];
  }
  // Fallback: Standard-Template kopieren
  const tmpl = DIENSTPLAN[staffId] || _defaultSched();
  return tmpl.map(d => ({...d}));
}

function _saveWeekSched(staffId, mondayDate, sched) {
  const key = _weekKey(mondayDate);
  if (!DIENSTPLAN_WEEKS[key]) DIENSTPLAN_WEEKS[key] = {};
  DIENSTPLAN_WEEKS[key][staffId] = sched;
}

let ABSENCES = [
  { id:1, staffId:1, from:'2026-04-20', to:'2026-04-22', reason:'Yıllık izin', type:'annual' },
  { id:2, staffId:2, from:'2026-04-25', to:'2026-04-25', reason:'Hastalık',    type:'sick'   },
  { id:3, staffId:3, from:'2026-05-01', to:'2026-05-03', reason:'Tatil',       type:'annual' },
];
let _absenceNextId = 10;

function _defaultSched() {
  return [{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},
          {a:true,f:'09:00',t:'18:00'},{a:true,f:'09:00',t:'18:00'},{a:false,f:'09:00',t:'18:00'},{a:false,f:'09:00',t:'18:00'}];
}

function renderDienstplan() {
  const grid = document.getElementById('dp-grid');
  if (!grid) return;

  const monday  = _dpWeekMonday instanceof Date ? _dpWeekMonday : new Date(_dpWeekMonday);
  const sunday  = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const today   = new Date(); today.setHours(0,0,0,0);
  const isCurrentWeek = monday.getTime() === _getWeekMonday(today).getTime();
  const isPast  = monday < _getWeekMonday(today);
  const weekKey = _weekKey(monday);

  // Tage-Daten mit Datum
  const dayNames = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
  const short    = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const dayDates = Array.from({length:7}, (_,i) => {
    const d = new Date(monday); d.setDate(d.getDate()+i); return d;
  });

  // Navigator
  const navLabel = `${weekKey.split('-W')[1]}. Hafta &nbsp;(${_fmt(monday)}–${_fmt(sunday)})`;
  const pastBadge = isPast ? `<span style="font-size:.68rem;background:rgba(245,158,11,.15);color:#f59e0b;border-radius:6px;padding:2px 8px;margin-left:8px">Geçmiş hafta</span>` : '';
  const curBadge  = isCurrentWeek ? `<span style="font-size:.68rem;background:rgba(34,197,94,.15);color:#16a34a;border-radius:6px;padding:2px 8px;margin-left:8px">Bu hafta</span>` : '';

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="dpWeekNav(-1)" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 12px;cursor:pointer;color:var(--tx);font-size:.85rem">◀</button>
        <span style="font-weight:700;font-size:.88rem">${navLabel}</span>
        ${pastBadge}${curBadge}
        <button onclick="dpWeekNav(1)" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 12px;cursor:pointer;color:var(--tx);font-size:.85rem">▶</button>
      </div>
      <button onclick="dpGoToday()" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 12px;cursor:pointer;color:var(--tx2);font-size:.78rem">Bugüne git</button>
    </div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem">
    <thead><tr>
      <th style="text-align:left;padding:8px 10px;color:var(--tx2);font-weight:600;min-width:120px">Personel</th>
      ${dayDates.map((dd,i) => {
        const isToday = dd.getTime()===today.getTime();
        return `<th style="padding:8px 6px;color:${isToday?'var(--gold)':'var(--tx2)'};font-weight:600;min-width:110px" title="${dayNames[i]}">
          ${short[i]}<br><span style="font-size:.65rem;font-weight:400">${_fmt(dd)}</span>
        </th>`;
      }).join('')}
    </tr></thead><tbody>`;

  STAFF.forEach(s => {
    const sched = _getWeekSched(s.id, monday);
    html += `<tr style="border-top:1px solid var(--border)">
      <td style="padding:10px 10px">
        <div style="display:flex;align-items:center;gap:8px">
          ${_av(s, 28)}
          <span style="font-weight:600">${s.name.split(' ')[0]}</span>
        </div>
      </td>
      ${sched.map((day,di) => `
        <td style="padding:6px 4px;text-align:center">
          <label class="dp-toggle-lbl" style="justify-content:center;margin-bottom:4px">
            <input type="checkbox" ${day.a?'checked':''} onchange="toggleDienstplan(${s.id},${di},this.checked)">
            <span class="dp-chk ${day.a?'dp-chk-on':''}"></span>
          </label>
          <div style="display:${day.a?'flex':'none'};flex-direction:column;gap:2px;align-items:center" id="dp-times-${s.id}-${di}">
            <input type="time" value="${day.f}" style="width:80px;font-size:.7rem;padding:2px 4px;border:1px solid var(--border);border-radius:5px;background:var(--card);color:var(--tx);text-align:center"
              onchange="saveDpTime(${s.id},${di},'f',this.value)">
            <span style="font-size:.6rem;color:var(--tx2)">–</span>
            <input type="time" value="${day.t}" style="width:80px;font-size:.7rem;padding:2px 4px;border:1px solid var(--border);border-radius:5px;background:var(--card);color:var(--tx);text-align:center"
              onchange="saveDpTime(${s.id},${di},'t',this.value)">
          </div>
          ${!day.a?`<div style="font-size:.68rem;color:var(--tx2)">Kapalı</div>`:''}
        </td>`).join('')}
    </tr>`;
  });
  html += `</tbody></table></div>
    <div style="margin-top:14px;padding:12px 14px;background:var(--surface2);border-radius:12px;">
      <div style="font-size:.75rem;font-weight:700;color:var(--tx2);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px">📋 Bu haftanın planını uygula…</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <button onclick="dpCopyAction('next')" style="background:var(--card);border:1px solid var(--border);border-radius:9px;padding:7px 14px;cursor:pointer;color:var(--tx);font-size:.78rem">
          ➡️ Sadece gelecek haftaya kopyala
        </button>
        <button onclick="dpSetAsTemplate()" style="background:var(--card);border:1px solid var(--border);border-radius:9px;padding:7px 14px;cursor:pointer;color:var(--tx);font-size:.78rem">
          📌 Standart plan olarak kaydet <span style="font-size:.68rem;color:var(--tx2)">(tüm gelecek haftalara)</span>
        </button>
        <div style="display:flex;align-items:center;gap:6px">
          <button onclick="dpCopyAction('until')" style="background:var(--gold);color:#000;border:none;border-radius:9px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.78rem">
            📅 Şu tarihe kadar kopyala:
          </button>
          <input type="date" id="dp-copy-until" style="border:1px solid var(--border);border-radius:8px;padding:5px 8px;background:var(--card);color:var(--tx);font-size:.78rem"
            value="${new Date(new Date(_dpWeekMonday).setDate(new Date(_dpWeekMonday).getDate()+27)).toISOString().slice(0,10)}">
        </div>
      </div>
    </div>`;
  grid.innerHTML = html;
  renderAbsenceList();
}

function dpWeekNav(dir) {
  const d = new Date(_dpWeekMonday);
  d.setDate(d.getDate() + dir * 7);
  _dpWeekMonday = d;
  renderDienstplan();
}

function dpGoToday() {
  _dpWeekMonday = _getWeekMonday(new Date());
  renderDienstplan();
}

function dpSetAsTemplate() {
  STAFF.forEach(s => {
    const sched = _getWeekSched(s.id, _dpWeekMonday);
    DIENSTPLAN[s.id] = sched.map(d => ({...d}));
  });
  showMsg('✅ Standart plan güncellendi — verisi olmayan tüm gelecek haftalar bunu kullanır', 'green');
}

function dpCopyAction(mode) {
  let targetMonday, untilDate, count = 0;

  if (mode === 'next') {
    // Sadece bir sonraki haftaya kopyala
    targetMonday = new Date(_dpWeekMonday);
    targetMonday.setDate(targetMonday.getDate() + 7);
    STAFF.forEach(s => {
      const sched = _getWeekSched(s.id, _dpWeekMonday);
      _saveWeekSched(s.id, targetMonday, sched.map(d => ({...d})));
    });
    count = 1;
    showMsg(`✅ Plan gelecek haftaya kopyalandı (${_fmt(targetMonday)})`, 'green');

  } else if (mode === 'until') {
    const untilInput = document.getElementById('dp-copy-until');
    if (!untilInput || !untilInput.value) { showMsg('Lütfen bir tarih seçin', 'gold'); return; }
    untilDate = new Date(untilInput.value);
    untilDate.setHours(0,0,0,0);

    // Starte ab der nächsten Woche nach der aktuell angezeigten
    targetMonday = new Date(_dpWeekMonday);
    targetMonday.setDate(targetMonday.getDate() + 7);

    if (untilDate < targetMonday) { showMsg('Tarih en az bir sonraki hafta olmalı', 'gold'); return; }

    while (targetMonday <= untilDate) {
      const m = new Date(targetMonday);
      STAFF.forEach(s => {
        const sched = _getWeekSched(s.id, _dpWeekMonday);
        _saveWeekSched(s.id, m, sched.map(d => ({...d})));
      });
      count++;
      targetMonday.setDate(targetMonday.getDate() + 7);
    }
    showMsg(`✅ Plan ${count} haftaya kopyalandı (${_fmt(new Date(new Date(_dpWeekMonday).setDate(new Date(_dpWeekMonday).getDate()+7)))} – ${_fmt(untilDate)})`, 'green');
  }
}

function toggleDienstplan(staffId, dayIdx, checked) {
  const sched = _getWeekSched(staffId, _dpWeekMonday);
  sched[dayIdx].a = checked;
  _saveWeekSched(staffId, _dpWeekMonday, sched);
  renderDienstplan();
  showMsg('Çalışma saatleri güncellendi ✓', 'green');
}

function saveDpTime(staffId, dayIdx, key, val) {
  const sched = _getWeekSched(staffId, _dpWeekMonday);
  sched[dayIdx][key] = val;
  _saveWeekSched(staffId, _dpWeekMonday, sched);
  showMsg('Çalışma saatleri güncellendi ✓', 'green');
}

function renderAbsenceList() {
  const el = document.getElementById('dp-absence-list');
  if (!el) return;
  if (!ABSENCES.length) {
    el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--tx2);font-size:.84rem">Kayıtlı izin yok.</div>`;
    return;
  }
  const typeLabel = { annual:'📅 Yıllık İzin', sick:'🤒 Hastalık', other:'📋 Diğer' };
  el.innerHTML = ABSENCES.map(ab => {
    const staff = STAFF.find(s=>s.id===ab.staffId);
    const fmtD = s => s.split('-').reverse().join('.');
    const dateRange = ab.from === ab.to ? fmtD(ab.from) : `${fmtD(ab.from)} – ${fmtD(ab.to)}`;
    return `<div class="ab-row">
      ${_av(staff, 32)}
      <div class="ab-info">
        <div class="ab-name">${staff?.name||'—'}</div>
        <div class="ab-type">${typeLabel[ab.type]||'📋 Diğer'}</div>
        <div class="ab-date">${dateRange}${ab.reason?' · '+ab.reason:''}</div>
      </div>
      <button class="ab-del-btn" onclick="deleteAbsence(${ab.id})">✕</button>
    </div>`;
  }).join('');
}

function addAbsence() {
  const g = id => document.getElementById(id);
  const staffId = parseInt(g('ab-staff-sel')?.value);
  const from    = g('ab-from')?.value;
  const to      = g('ab-to')?.value || from;
  const type    = g('ab-type')?.value || 'annual';
  const reason  = g('ab-reason')?.value?.trim() || '';
  if (!staffId || !from) { showMsg('Personel ve tarih gerekli.','red'); return; }
  ABSENCES.push({ id:++_absenceNextId, staffId, from, to, reason, type });
  ['ab-from','ab-to','ab-reason'].forEach(id => { const el=g(id); if(el) el.value=''; });
  renderAbsenceList();
  showMsg('İzin eklendi ✓','green');
}

function deleteAbsence(id) {
  const idx = ABSENCES.findIndex(a=>a.id===id);
  if (idx > -1) ABSENCES.splice(idx,1);
  renderAbsenceList();
  showMsg('İzin silindi','green');
}

// ════════════════════════════════════════════
// FEATURE 5: KUNDENKARTE ERWEITERN
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// FEATURE 7: MONATSANSICHT FIX
// ════════════════════════════════════════════
// zweite Definition entfernt — wird von renderMonthView() oben erledigt

// ════════════════════════════════════════════
// FEATURE 8: KAMPANYA / İNDİRİM
// ════════════════════════════════════════════
let DISCOUNT_CODES = [
  { id:1, code:'HOSGELDIN', type:'percent', value:15, uses:0,  maxUses:50,  validTo:'2026-06-30', active:true, desc:'Yeni müşteri indirimi' },
  { id:2, code:'BAHAR2026', type:'fixed',   value:50, uses:12, maxUses:100, validTo:'2026-05-31', active:true, desc:'Bahar kampanyası'       },
  { id:3, code:'DOGUMGUNU', type:'percent', value:20, uses:5,  maxUses:null,validTo:null,         active:true, desc:'Doğum günü indirimi'   },
];
let _discNextId = 10;

let LOYALTY_RULES = { pointsPerTL:1, redeemRate:10, minRedeemPoints:100 };

function renderKampanya() {
  const gateEl = document.getElementById('view-kampanya');
  const gate = _gateHtml('kampanya', 'Lüks');
  if (gate) { if (gateEl) gateEl.innerHTML = '<div class="sec-hdr"><h2>Kampanya & İndirim</h2></div>' + gate; return; }
  renderDiscountCodes();
  renderLoyaltySettings();
}

function renderDiscountCodes() {
  const el = document.getElementById('kamp-codes-list');
  if (!el) return;
  if (!DISCOUNT_CODES.length) {
    el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--tx2)">Henüz kod yok.</div>`;
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  el.innerHTML = DISCOUNT_CODES.map(dc => {
    const expired = dc.validTo && dc.validTo < today;
    const full    = dc.maxUses && dc.uses >= dc.maxUses;
    const st      = !dc.active ? 'Pasif' : expired ? 'Süresi Doldu' : full ? 'Tükendi' : 'Aktif';
    const stCls   = (!dc.active||expired||full) ? 'kamp-status-off' : 'kamp-status-on';
    return `<div class="kamp-code-row">
      <div class="kamp-code-badge">${dc.code}</div>
      <div class="kamp-code-info">
        <div class="kamp-code-desc">${dc.desc}</div>
        <div class="kamp-code-meta">
          ${dc.type==='percent'?`%${dc.value} indirim`:`₺${dc.value} indirim`}
          · ${dc.uses}${dc.maxUses?'/'+dc.maxUses:''} kullanım
          ${dc.validTo?`· Son: ${dc.validTo}`:''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div class="kamp-status ${stCls}">${st}</div>
        <button class="kamp-del-btn" onclick="deleteDiscountCode(${dc.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function addDiscountCode() {
  const g = id => document.getElementById(id);
  const code  = g('dc-code')?.value?.trim().toUpperCase();
  const value = parseFloat(g('dc-value')?.value);
  if (!code||!value) { showMsg('Kod ve değer zorunludur.','red'); return; }
  if (DISCOUNT_CODES.find(d=>d.code===code)) { showMsg('Bu kod zaten var.','red'); return; }
  DISCOUNT_CODES.push({
    id:++_discNextId, code,
    type:    g('dc-type')?.value    || 'percent',
    value,
    uses:    0,
    maxUses: g('dc-max-uses')?.value ? parseInt(g('dc-max-uses').value) : null,
    validTo: g('dc-valid-to')?.value || null,
    active:  true,
    desc:    g('dc-desc')?.value?.trim() || '',
  });
  ['dc-code','dc-value','dc-valid-to','dc-desc','dc-max-uses'].forEach(id=>{ const el=g(id); if(el) el.value=''; });
  renderDiscountCodes();
  showMsg('Kampanya kodu eklendi ✓','green');
}

function deleteDiscountCode(id) {
  const idx = DISCOUNT_CODES.findIndex(d=>d.id===id);
  if (idx>-1) DISCOUNT_CODES.splice(idx,1);
  renderDiscountCodes();
}

function renderLoyaltySettings() {
  const g = id => document.getElementById(id);
  if (g('ly-points-per-tl')) g('ly-points-per-tl').value = LOYALTY_RULES.pointsPerTL;
  if (g('ly-redeem-rate'))   g('ly-redeem-rate').value   = LOYALTY_RULES.redeemRate;
  if (g('ly-min-redeem'))    g('ly-min-redeem').value    = LOYALTY_RULES.minRedeemPoints;
}

function saveLoyaltySettings() {
  const g = id => parseInt(document.getElementById(id)?.value) || 0;
  LOYALTY_RULES = { pointsPerTL: g('ly-points-per-tl')||1, redeemRate: g('ly-redeem-rate')||10, minRedeemPoints: g('ly-min-redeem')||100 };
  showMsg('Sadakat ayarları kaydedildi ✓','green');
}

// ════════════════════════════════════════════
// FEATURE 9: BEWERTUNGEN (Ratings)
// ════════════════════════════════════════════
const RATINGS = [
  { id:1, custName:'Mehmet Yılmaz', staffId:1, service:'Saç Kesimi',   stars:5, comment:'Harika iş çıkardı!',   date:'16 Nis 2026' },
  { id:2, custName:'Buse Demir',    staffId:2, service:'Röfle & Boya', stars:4, comment:'Çok güzel oldu.',       date:'16 Nis 2026' },
  { id:3, custName:'Elif Kaya',     staffId:3, service:'Cilt Bakımı',  stars:5, comment:'Muhteşem!',             date:'16 Nis 2026' },
  { id:4, custName:'Can Öztürk',    staffId:2, service:'Saç Kesimi',   stars:3, comment:'İdare eder.',           date:'15 Nis 2026' },
  { id:5, custName:'Leyla Arslan',  staffId:1, service:'Saç Boyama',   stars:5, comment:'',                      date:'15 Nis 2026' },
  { id:6, custName:'Selin Çelik',   staffId:2, service:'Fön',          stars:4, comment:'Güzel, teşekkürler.', date:'14 Nis 2026' },
];

function renderBewertungen() {
  const avg = RATINGS.reduce((s,r)=>s+r.stars,0) / (RATINGS.length||1);
  const g = id => document.getElementById(id);
  if (g('bw-avg-score')) g('bw-avg-score').textContent = avg.toFixed(1);
  if (g('bw-avg-stars')) g('bw-avg-stars').innerHTML   = _starsHtml(avg, true);
  if (g('bw-total'))     g('bw-total').textContent     = RATINGS.length + ' değerlendirme';

  const staffEl = g('bw-staff-ratings');
  if (staffEl) {
    staffEl.innerHTML = STAFF.map(s => {
      const rs  = RATINGS.filter(r=>r.staffId===s.id);
      const avg = rs.length ? rs.reduce((a,r)=>a+r.stars,0)/rs.length : 0;
      return `<div class="bw-staff-row">
        ${_av(s, 38)}
        <div class="bw-staff-info">
          <div class="bw-staff-name">${s.name}</div>
          <div class="bw-staff-stars">${_starsHtml(avg)} <span class="bw-staff-avg">${rs.length?avg.toFixed(1):'—'}</span></div>
        </div>
        <div class="bw-staff-count">${rs.length} değ.</div>
      </div>`;
    }).join('');
  }

  const listEl = g('bw-review-list');
  if (listEl) {
    listEl.innerHTML = RATINGS.map(r => {
      const staff = STAFF.find(s=>s.id===r.staffId);
      return `<div class="bw-review-card">
        <div class="bw-review-hdr">
          <div class="bw-review-cust">${r.custName}</div>
          <div class="bw-review-stars">${_starsHtml(r.stars)}</div>
          <div class="bw-review-date">${r.date}</div>
        </div>
        <div class="bw-review-svc">${r.service} · <span style="color:${staff?.color||'var(--tx2)'}">${staff?.name||'—'}</span></div>
        ${r.comment?`<div class="bw-review-comment">"${r.comment}"</div>`:''}
      </div>`;
    }).join('');
  }
}

function _starsHtml(rating, large=false) {
  const cls = large ? 'bw-star-lg' : 'bw-star';
  return [1,2,3,4,5].map(i =>
    `<span class="${cls} ${i<=Math.round(rating)?'bw-star-on':''}">${i<=Math.round(rating)?'★':'☆'}</span>`
  ).join('');
}

// ════════════════════════════════════════════
// FEATURE 10: STOK / LAGER
// ════════════════════════════════════════════
let STOK = [
  { id:1,  name:'Saç Boyası — Siyah',          category:'Boya',     qty:8,  unit:'adet', minQty:3, price:45  },
  { id:2,  name:'Saç Boyası — Kahve',           category:'Boya',     qty:5,  unit:'adet', minQty:3, price:45  },
  { id:3,  name:'Perma Solüsyonu',              category:'Kimyasal', qty:2,  unit:'şişe', minQty:2, price:120 },
  { id:4,  name:'Keratin Kremi',                category:'Bakım',    qty:6,  unit:'adet', minQty:2, price:280 },
  { id:5,  name:'Saç Şampuanı (Prof.)',         category:'Bakım',    qty:12, unit:'litre',minQty:4, price:85  },
  { id:6,  name:'Jilet (Kutu)',                 category:'Malzeme',  qty:3,  unit:'kutu', minQty:5, price:35  },
  { id:7,  name:'Havlu (Pamuklu)',              category:'Malzeme',  qty:24, unit:'adet', minQty:10,price:25  },
  { id:8,  name:'Boya Eldiveni',                category:'Malzeme',  qty:1,  unit:'kutu', minQty:2, price:40  },
];
let _stokNextId = 20;

function renderStok() {
  const gateEl = document.getElementById('view-stok');
  const gate = _gateHtml('stok', 'Lüks');
  if (gate) { if (gateEl) gateEl.innerHTML = '<div class="sec-hdr"><h2>Stok Yönetimi</h2></div>' + gate; return; }
  const list   = document.getElementById('stok-list');
  const lowEl  = document.getElementById('stok-low-count');
  const totEl  = document.getElementById('stok-total-count');
  if (!list) return;
  const low = STOK.filter(s=>s.qty<=s.minQty);
  if (lowEl) lowEl.textContent = low.length;
  if (totEl) totEl.textContent = STOK.length;

  const cats = [...new Set(STOK.map(s=>s.category))];
  list.innerHTML = cats.map(cat => {
    const items = STOK.filter(s=>s.category===cat);
    return `<div class="stok-cat-hdr">${cat}</div>` +
      items.map(s => {
        const isLow = s.qty <= s.minQty;
        return `<div class="stok-row ${isLow?'stok-row-low':''}">
          <div class="stok-row-info">
            <div class="stok-name">${s.name}</div>
            ${isLow?`<div class="stok-low-badge">⚠️ Az kaldı</div>`:''}
          </div>
          <div class="stok-qty-ctrl">
            <button class="stok-qty-btn" onclick="changeStokQty(${s.id},-1)">−</button>
            <div class="stok-qty-val ${isLow?'stok-qty-low':''}">${s.qty} ${s.unit}</div>
            <button class="stok-qty-btn" onclick="changeStokQty(${s.id},+1)">+</button>
          </div>
          <div class="stok-price">₺${s.price}</div>
        </div>`;
      }).join('');
  }).join('');
}

function changeStokQty(id, delta) {
  const item = STOK.find(s=>s.id===id);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  renderStok();
}

function addStokItem() {
  const g = id => document.getElementById(id);
  const name = g('stok-new-name')?.value?.trim();
  if (!name) { showMsg('Ürün adı gerekli.','red'); return; }
  STOK.push({
    id: ++_stokNextId,
    name,
    category: g('stok-new-cat')?.value?.trim()  || 'Diğer',
    qty:      parseInt(g('stok-new-qty')?.value) || 0,
    unit:     g('stok-new-unit')?.value?.trim()  || 'adet',
    minQty:   parseInt(g('stok-new-min')?.value) || 0,
    price:    parseFloat(g('stok-new-price')?.value) || 0,
  });
  ['stok-new-name','stok-new-cat','stok-new-qty','stok-new-unit','stok-new-min','stok-new-price']
    .forEach(id => { const el=g(id); if(el) el.value=''; });
  renderStok();
  showMsg('Ürün eklendi ✓','green');
}

// ════════════════════════════════════════════
// FEATURE 11: CSV EXPORT
// ════════════════════════════════════════════
function exportCSV(type) {
  let rows = [], filename = '';
  if (type === 'customers') {
    filename = 'musteriler.csv';
    rows.push(['ID','Ad Soyad','Telefon','Doğum Tarihi','Saç Tipi','Saç Rengi','Alerji','Toplam Ziyaret','Sadakat Puanı','Son Ziyaret']);
    CUSTOMERS.forEach(c => rows.push([
      c.id, c.name, c.phone||'', c.birthday||'', c.hairType||'', c.hairColor||'',
      c.allergies||'', c.history?.length||0, c.loyaltyPoints||0,
      c.history?.length ? c.history[0].date : ''
    ]));
  } else if (type === 'appointments') {
    filename = 'randevular.csv';
    rows.push(['ID','Müşteri','Hizmet','Personel','Saat','Süre','Fiyat','Durum']);
    TODAY_APPOINTMENTS.filter(a=>a.status!=='break').forEach(a => {
      const staff = STAFF.find(s=>s.id===a.staffId);
      rows.push([a.id, a.name, a.service, staff?.name||'', a.time, a.duration, a.price, a.status]);
    });
  } else if (type === 'revenue') {
    filename = 'gelir_raporu.csv';
    rows.push(['Hizmet','Randevu Sayısı','Toplam Gelir','Ortalama Fiyat']);
    BERICHTE_DATA.serviceRanking.forEach(s => rows.push([
      s.name, s.count, s.revenue, Math.round(s.revenue/s.count)
    ]));
  } else if (type === 'stok') {
    filename = 'stok.csv';
    rows.push(['Ürün','Kategori','Miktar','Birim','Min. Miktar','Fiyat']);
    STOK.forEach(s => rows.push([s.name, s.category, s.qty, s.unit, s.minQty, s.price]));
  }
  const csv = rows.map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  a.download= filename; a.click();
  URL.revokeObjectURL(a.href);
  showMsg(`📥 ${filename} indirildi`,'green');
}

// ════════════════════════════════════════════
// FEATURE 6: BOOKING BRIDGE (Online Randevular)
// ════════════════════════════════════════════
function checkPendingBookings() {
  try {
    const pending = JSON.parse(localStorage.getItem('rd_pending_bookings')||'[]');
    const badge   = document.getElementById('pending-booking-badge');
    if (badge) badge.style.display = pending.length ? 'flex' : 'none';
    if (badge && pending.length) badge.textContent = pending.length;
    return pending;
  } catch(e) { return []; }
}

function renderPendingBookings() {
  const pending = checkPendingBookings();
  const el = document.getElementById('pending-bookings-list');
  if (!el) return;
  if (!pending.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--tx2);font-size:.86rem">Bekleyen online randevu yok.<br><br><a href="booking.html" target="_blank" style="color:var(--accent);text-decoration:none">→ Booking sayfasını görüntüle</a></div>`;
    return;
  }
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  el.innerHTML = pending.map((b,i) => {
    const dt  = b.date ? new Date(b.date) : null;
    const dts = dt ? `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}` : '—';
    return `<div class="pending-bk-row">
      <div class="pending-bk-av">${b.name?.[0]?.toUpperCase()||'?'}</div>
      <div class="pending-bk-info">
        <div class="pending-bk-name">${b.name}</div>
        <div class="pending-bk-meta">${b.service} · ${dts} ${b.time||''}</div>
        <div class="pending-bk-phone">${b.phone}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="pending-confirm-btn" onclick="confirmPendingBooking(${i})">✓</button>
        <button class="pending-del-btn"     onclick="rejectPendingBooking(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function confirmPendingBooking(idx) {
  const pending = JSON.parse(localStorage.getItem('rd_pending_bookings')||'[]');
  const b = pending[idx];
  if (!b) return;
  showMsg(`✓ ${b.name} randevusu onaylandı`,'green');
  pending.splice(idx,1);
  localStorage.setItem('rd_pending_bookings', JSON.stringify(pending));
  renderPendingBookings();
}

function rejectPendingBooking(idx) {
  const pending = JSON.parse(localStorage.getItem('rd_pending_bookings')||'[]');
  if (!pending[idx]) return;
  pending.splice(idx,1);
  localStorage.setItem('rd_pending_bookings', JSON.stringify(pending));
  renderPendingBookings();
  showMsg('Randevu reddedildi','green');
}

// ══ VIEW: ABONELİK ══════════════════════════
function renderAbonelik() {
  const plans = [
    { key:'free', icon:'🆓', name:'Başlangıç', yearlyPrice:0,    monthlyEquiv:0,   staff:1,  aptLimit:30,   color:'#5A7A8A',
      features:['30 randevu/ay','1 personel','Online booking','Müşteri yönetimi'],
      locked:['Kasa & Gelir Raporu','Stok Yönetimi','Kampanya','WhatsApp & SMS'] },
    { key:'std',  icon:'⭐', name:'Standart',  yearlyPrice:1990,  monthlyEquiv:166, staff:3,  aptLimit:100,  color:'#00C8FF',
      features:['100 randevu/ay','3 personel','Müşteri yönetimi','💬 WA & SMS Paket eklenebilir'],
      locked:['Kasa & Gelir Raporu','Stok Yönetimi','Kampanya'] },
    { key:'pro',  icon:'🚀', name:'Pro',       yearlyPrice:3990,  monthlyEquiv:332, staff:10, aptLimit:1000, color:'#FFB830',
      features:['1000 randevu/ay','10 personel','✅ Kasa & Gelir Raporları','💬 WA & SMS Paket eklenebilir'],
      locked:['Stok Yönetimi','Kampanya'] },
    { key:'lux',  icon:'💎', name:'Lüks',      yearlyPrice:7990,  monthlyEquiv:666, staff:50, aptLimit:null, color:'#8B5CF6',
      features:['Sınırsız randevu','50 personel','✅ Kasa & Gelir Raporları','✅ Stok Yönetimi','✅ Kampanya & İndirim','💬 WA & SMS Paket eklenebilir'],
      locked:[] },
  ];

  const currentPlan = (SALON_CONFIG && SALON_CONFIG.plan) || 'std';
  const plan = plans.find(p => p.key === currentPlan) || plans[1];

  // Demo expiry (in Produktion aus DB)
  const expiryDate = (SALON_CONFIG && SALON_CONFIG.expiryDate) || '2027-04-18';
  const daysLeft   = expiryDate ? Math.ceil((new Date(expiryDate) - new Date()) / 86400000) : null;
  const expiryFmt  = expiryDate ? new Date(expiryDate).toLocaleDateString('tr-TR', {day:'numeric',month:'long',year:'numeric'}) : null;

  // Current plan card
  const cc = document.getElementById('abo-current-content');
  if (cc) {
    const waUsed  = (SALON_CONFIG && SALON_CONFIG.waUsed)  || 62;
    const waLimit = plan.waLimit || 0;
    const waPct   = waLimit > 0 ? Math.min(Math.round(waUsed / waLimit * 100), 100) : 0;
    const waCls   = waPct >= 90 ? 'danger' : waPct >= 70 ? 'warning' : 'safe';

    const expiryColor = daysLeft === null ? 'var(--green)' :
                        daysLeft < 0    ? 'var(--red)'    :
                        daysLeft <= 14  ? 'var(--red)'    :
                        daysLeft <= 30  ? 'var(--orange)'  : 'var(--green)';
    const expiryIcon  = daysLeft === null ? '∞' :
                        daysLeft < 0    ? '⛔' :
                        daysLeft <= 14  ? '🔴' :
                        daysLeft <= 30  ? '🟡' : '🟢';

    cc.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;flex-wrap:wrap">
        <div style="width:52px;height:52px;border-radius:14px;background:rgba(201,168,76,.12);
                    display:flex;align-items:center;justify-content:center;font-size:1.7rem;flex-shrink:0">${plan.icon}</div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:1rem;font-weight:700;color:var(--gold)">${plan.icon} ${plan.name} Paketi</div>
          ${plan.yearlyPrice > 0
            ? `<div style="font-size:.82rem;color:var(--tx2);margin-top:2px">₺${plan.yearlyPrice.toLocaleString('tr-TR')}/yıl <span style="color:var(--tx3);">(≈ aylık ₺${plan.monthlyEquiv})</span></div>`
            : `<div style="font-size:.82rem;color:var(--tx2);margin-top:2px">Sonsuza dek ücretsiz</div>`}
        </div>
        <span style="font-size:.7rem;font-weight:700;padding:4px 12px;border-radius:6px;
                     background:rgba(34,197,94,.12);color:var(--green);flex-shrink:0">✓ AKTİF</span>
      </div>

      ${expiryFmt && plan.key !== 'free' ? `
      <div style="padding:12px;margin:4px 0 8px;border-radius:10px;
                  background:${daysLeft !== null && daysLeft <= 30 ? 'rgba(239,68,68,.07)' : 'rgba(0,0,0,.12)'};
                  border:1px solid ${daysLeft !== null && daysLeft <= 30 ? 'rgba(239,68,68,.2)' : 'var(--border)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:.7rem;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Abonelik Bitiş Tarihi</div>
            <div style="font-size:.95rem;font-weight:700;color:${expiryColor}">${expiryIcon} ${expiryFmt}</div>
            <div style="font-size:.76rem;color:var(--tx2);margin-top:2px">
              ${daysLeft < 0 ? `Süresi ${Math.abs(daysLeft)} gün önce doldu — lütfen yenileyin` :
                daysLeft <= 30 ? `⚠️ ${daysLeft} gün kaldı — yakında sona eriyor!` :
                `${daysLeft} gün kaldı`}
            </div>
          </div>
          <div style="font-size:.76rem;color:var(--tx3);text-align:right">
            <div>Yıllık faturalandırma</div>
            <div style="margin-top:2px;color:var(--tx2)">Sonraki ödeme: ${expiryFmt}</div>
          </div>
        </div>
      </div>` : ''}

      <div style="padding:10px 0;border-top:1px solid var(--border)">
        <div style="font-size:.76rem;color:var(--tx2);margin-bottom:8px">Planınızda dahil:</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${plan.features.map(f => `<span style="font-size:.72rem;padding:3px 10px;border-radius:5px;
            background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:var(--tx1)">✓ ${f}</span>`).join('')}
          ${(plan.locked||[]).map(f => `<span style="font-size:.72rem;padding:3px 10px;border-radius:5px;
            background:var(--surface3);border:1px solid var(--border);color:var(--tx3);opacity:.6">✗ ${f}</span>`).join('')}
        </div>
      </div>

      ${plan.key !== 'free' ? `
      <div style="padding:10px 0;border-top:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:.72rem;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">💬 WA Krediniz</div>
            <div style="font-size:1.1rem;font-weight:800;color:#25d366">${((SALON_CONFIG&&SALON_CONFIG.waCredits)||312).toLocaleString('tr-TR')} <span style="font-size:.72rem;font-weight:400;color:var(--tx3)">mesaj hakkı</span></div>
          </div>
          <button onclick="showView('abonelik')"
            style="padding:6px 14px;background:rgba(37,211,102,.12);color:#25D366;
                   border:1px solid rgba(37,211,102,.3);border-radius:8px;font-size:.75rem;
                   font-weight:700;cursor:pointer">+ Kredi Al</button>
        </div>
      </div>` : ''}`;
  }

  // Plans grid
  const pg = document.getElementById('abo-plans-grid');
  if (pg) {
    pg.innerHTML = plans.map(p => {
      const isCurrent = p.key === currentPlan;
      const isUpgrade = plans.indexOf(p) > plans.findIndex(x => x.key === currentPlan);
      return `
        <div style="border:2px solid ${isCurrent ? p.color : 'var(--border)'};border-radius:14px;
                    padding:14px;background:${isCurrent ? 'rgba(0,0,0,.08)' : 'var(--surface2)'};
                    position:relative;transition:border-color .2s">
          ${isCurrent ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);
            font-size:.6rem;font-weight:700;padding:2px 10px;border-radius:5px;
            background:${p.color};color:#080808;white-space:nowrap">MEVCUT</div>` : ''}
          <div style="font-size:1.2rem;margin-bottom:4px">${p.icon}</div>
          <div style="font-size:.88rem;font-weight:700;margin-bottom:2px">${p.name}</div>
          <div style="font-size:1rem;font-weight:700;color:var(--gold);line-height:1.2">
            ${p.yearlyPrice === 0 ? 'Ücretsiz' : '₺'+p.yearlyPrice.toLocaleString('tr-TR')}
          </div>
          ${p.yearlyPrice > 0 ? `<div style="font-size:.68rem;color:var(--tx3);margin-bottom:8px">≈ ₺${p.monthlyEquiv}/ay · yıllık</div>` : '<div style="font-size:.68rem;color:var(--tx3);margin-bottom:8px">sonsuza dek</div>'}
          <div style="font-size:.7rem;color:var(--tx2);margin-bottom:3px">📅 ${p.aptLimit?p.aptLimit+'/ay':'∞'} randevu</div>
          <div style="font-size:.7rem;color:var(--tx2);margin-bottom:3px">👥 Max ${p.staff} personel</div>
          <div style="font-size:.7rem;color:${p.key==='free'?'var(--tx3)':'#25d366'};margin-bottom:10px">
            💬 ${p.key==='free'?'WA & SMS yok':'WA & SMS Paket eklenebilir'}</div>
          ${!isCurrent ? `<button onclick="showUpgradeConfirm('${p.key}')"
            style="width:100%;padding:8px;border-radius:8px;border:none;font-family:inherit;
                   font-size:.76rem;font-weight:700;cursor:pointer;transition:all .2s;
                   background:${isUpgrade ? p.color : 'var(--surface3)'};
                   color:${isUpgrade ? '#080808' : 'var(--tx2)'}">
            ${isUpgrade ? '↑ Yükselt' : '↓ Düşür'}</button>` :
            `<div style="text-align:center;font-size:.72rem;color:var(--green);font-weight:600;padding:6px 0">✓ Aktif Plan</div>`}
        </div>`;
    }).join('');
  }

  // Mesajlaşma Tab render
  _renderWaSection();
  _renderSmsSection();
}

function switchMsgTab(tab) {
  const waContent = document.getElementById('abo-wa-content');
  const smsContent = document.getElementById('abo-sms-content');
  const waBtn = document.getElementById('msg-tab-wa-btn');
  const smsBtn = document.getElementById('msg-tab-sms-btn');
  if (!waContent || !smsContent) return;
  if (tab === 'wa') {
    waContent.style.display = '';
    smsContent.style.display = 'none';
    if (waBtn)  { waBtn.style.background  = '#25d366'; waBtn.style.color = '#080808'; waBtn.style.fontWeight = '700'; }
    if (smsBtn) { smsBtn.style.background = 'transparent'; smsBtn.style.color = 'var(--tx2)'; smsBtn.style.fontWeight = '600'; }
  } else {
    waContent.style.display = 'none';
    smsContent.style.display = '';
    if (smsBtn) { smsBtn.style.background = '#4fa8ff'; smsBtn.style.color = '#080808'; smsBtn.style.fontWeight = '700'; }
    if (waBtn)  { waBtn.style.background  = 'transparent'; waBtn.style.color = 'var(--tx2)'; waBtn.style.fontWeight = '600'; }
  }
}

function _renderWaSection() {
  const wa = document.getElementById('abo-wa-content');
  if (wa) {
    const waCredits = (SALON_CONFIG && SALON_CONFIG.waCredits) || 312;
    const waPackages = [
      { msgs:100,  price:149,   perMsg:'1,49', tag:'',           color:'#5A7A8A' },
      { msgs:200,  price:289,   perMsg:'1,45', tag:'En Popüler', color:'#00C8FF' },
      { msgs:500,  price:689,   perMsg:'1,38', tag:'Tasarruf',   color:'#FFB830' },
      { msgs:1000, price:1299,  perMsg:'1,30', tag:'En İyi Fiyat',color:'#8B5CF6' },
    ];

    wa.innerHTML = `
      <!-- Mevcut Kredi -->
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;
                  background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.18);margin-bottom:16px">
        <div style="font-size:1.6rem">💬</div>
        <div>
          <div style="font-size:.72rem;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Mevcut WA Krediniz</div>
          <div style="font-size:1.4rem;font-weight:800;color:#25d366;line-height:1">${waCredits.toLocaleString('tr-TR')} <span style="font-size:.75rem;font-weight:500;color:var(--tx2)">mesaj hakkı</span></div>
          <div style="font-size:.7rem;color:var(--tx3);margin-top:3px">Kredi bitmeden yeniden satın alabilirsiniz. Süre sınırı yok.</div>
        </div>
      </div>

      <!-- Paketler -->
      <div style="font-size:.78rem;font-weight:700;color:var(--tx2);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Kredi Paketi Satın Al</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        ${waPackages.map(p => `
          <div style="border:1.5px solid ${p.tag ? p.color : 'var(--border)'};border-radius:12px;padding:12px;
                      background:${p.tag ? `rgba(0,0,0,.05)` : 'var(--surface3)'};
                      position:relative;cursor:pointer;transition:border-color .2s,transform .15s"
               onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            ${p.tag ? `<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);
              font-size:.58rem;font-weight:800;padding:2px 10px;border-radius:5px;white-space:nowrap;
              background:${p.color};color:#080808">${p.tag}</div>` : ''}
            <div style="font-size:1.3rem;font-weight:800;color:var(--tx);line-height:1;margin-bottom:2px">
              ${p.msgs.toLocaleString('tr-TR')}
              <span style="font-size:.7rem;font-weight:500;color:var(--tx2)">mesaj</span>
            </div>
            <div style="font-size:.65rem;color:var(--tx3);margin-bottom:8px">₺${p.perMsg} / mesaj</div>
            <div style="font-size:1.05rem;font-weight:800;color:${p.color};margin-bottom:8px">₺${p.price.toLocaleString('tr-TR')}</div>
            <button onclick="buyWaPackage(${p.msgs},${p.price})"
              style="width:100%;padding:7px;border-radius:8px;border:none;font-family:inherit;
                     font-size:.74rem;font-weight:700;cursor:pointer;
                     background:${p.color};color:#080808;transition:opacity .15s"
              onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
              Satın Al →
            </button>
          </div>`).join('')}
      </div>

      <!-- Bilgi -->
      <div style="background:rgba(0,0,0,.08);border-radius:10px;padding:10px 14px;font-size:.74rem;color:var(--tx3);line-height:1.7">
        <div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--green)">✓</span><span>Kredi <strong style="color:var(--tx2)">süresiz geçerlidir</strong> — aylık sıfırlama yok</span></div>
        <div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--green)">✓</span><span>Her paket mevcut kredinizin üzerine eklenir</span></div>
        <div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--green)">✓</span><span>Randevu hatırlatması, iptal bildirimi, doğum günü mesajı</span></div>
        <div style="display:flex;gap:8px"><span style="color:var(--green)">✓</span><span>Kredi bitmeden 7 gün önce bildirim alırsınız</span></div>
      </div>`;
  }
}

function _renderSmsSection() {
  const sms = document.getElementById('abo-sms-content');
  if (!sms) return;
  const smsCredits = (SALON_CONFIG && SALON_CONFIG.smsCredits) || 0;
  const smsPackages = [
    { msgs:100,  price:79,   perMsg:'0,79', tag:'',              color:'#5A7A8A' },
    { msgs:200,  price:149,  perMsg:'0,745', tag:'En Popüler',   color:'#4fa8ff' },
    { msgs:500,  price:349,  perMsg:'0,698', tag:'Tasarruf',     color:'#FFB830' },
    { msgs:1000, price:649,  perMsg:'0,649', tag:'En İyi Fiyat', color:'#8B5CF6' },
  ];

  sms.innerHTML = `
    <!-- Mevcut SMS Kredi -->
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;
                background:rgba(79,168,255,.07);border:1px solid rgba(79,168,255,.18);margin-bottom:16px">
      <div style="font-size:1.6rem">📱</div>
      <div>
        <div style="font-size:.72rem;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Mevcut SMS Krediniz</div>
        <div style="font-size:1.4rem;font-weight:800;color:#4fa8ff;line-height:1">${smsCredits.toLocaleString('tr-TR')} <span style="font-size:.75rem;font-weight:500;color:var(--tx2)">mesaj hakkı</span></div>
        <div style="font-size:.7rem;color:var(--tx3);margin-top:3px">Tüm operatörlere gönderim · Her Türk numarasına ulaşır</div>
      </div>
    </div>

    <!-- SMS vs WA bilgi -->
    <div style="display:flex;gap:8px;align-items:flex-start;background:rgba(201,168,76,.06);
                border:1px solid rgba(201,168,76,.18);border-radius:10px;padding:10px 12px;margin-bottom:14px">
      <span style="font-size:1rem">💡</span>
      <div style="font-size:.72rem;color:var(--tx3);line-height:1.6">
        SMS her telefona ulaşır, internet gerekmez. Müşteri tercihine göre <strong style="color:var(--tx2)">WA veya SMS</strong> otomatik seçilir.
        <br>Her müşteri kaydında bildirim tercihi belirtebilirsiniz.
      </div>
    </div>

    <!-- Paketler -->
    <div style="font-size:.78rem;font-weight:700;color:var(--tx2);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">SMS Kredi Paketi Satın Al</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      ${smsPackages.map(p => `
        <div style="border:1.5px solid ${p.tag ? p.color : 'var(--border)'};border-radius:12px;padding:12px;
                    background:${p.tag ? 'rgba(0,0,0,.05)' : 'var(--surface3)'};
                    position:relative;cursor:pointer;transition:border-color .2s,transform .15s"
             onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
          ${p.tag ? `<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);
            font-size:.58rem;font-weight:800;padding:2px 10px;border-radius:5px;white-space:nowrap;
            background:${p.color};color:#080808">${p.tag}</div>` : ''}
          <div style="font-size:1.3rem;font-weight:800;color:var(--tx);line-height:1;margin-bottom:2px">
            ${p.msgs.toLocaleString('tr-TR')}
            <span style="font-size:.7rem;font-weight:500;color:var(--tx2)">SMS</span>
          </div>
          <div style="font-size:.65rem;color:var(--tx3);margin-bottom:8px">₺${p.perMsg} / SMS</div>
          <div style="font-size:1.05rem;font-weight:800;color:${p.color};margin-bottom:8px">₺${p.price.toLocaleString('tr-TR')}</div>
          <button onclick="buySmsPackage(${p.msgs},${p.price})"
            style="width:100%;padding:7px;border-radius:8px;border:none;font-family:inherit;
                   font-size:.74rem;font-weight:700;cursor:pointer;
                   background:${p.color};color:#080808;transition:opacity .15s"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            Satın Al →
          </button>
        </div>`).join('')}
    </div>

    <!-- Bilgi -->
    <div style="background:rgba(0,0,0,.08);border-radius:10px;padding:10px 14px;font-size:.74rem;color:var(--tx3);line-height:1.7">
      <div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--green)">✓</span><span>Kredi <strong style="color:var(--tx2)">süresiz geçerlidir</strong> — aylık sıfırlama yok</span></div>
      <div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--green)">✓</span><span>Tüm Türk operatörlerine gönderim (Turkcell, Vodafone, Türk Telekom)</span></div>
      <div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--green)">✓</span><span>Randevu hatırlatması, iptal bildirimi, doğum günü mesajı</span></div>
      <div style="display:flex;gap:8px"><span style="color:var(--green)">✓</span><span>Gönderici adı salon adınız olarak görünür</span></div>
    </div>`;
}

function showUpgradeConfirm(planKey) {
  const names = { free:'Başlangıç', std:'Standart', pro:'Pro', lux:'Lüks' };
  showMsg(`💎 ${names[planKey]} paketi için admin panelinden veya destek ekibimizle iletişime geçin.`, 'gold');
}

function _getWaCfg() {
  try { return JSON.parse(localStorage.getItem('rd_wa_payment_cfg') || '{}'); } catch(e) { return {}; }
}

function buyWaPackage(msgs, price) {
  // Preis aus Admin-Einstellungen lesen falls vorhanden
  const cfg  = _getWaCfg();
  if (cfg.prices && cfg.prices[msgs]) price = cfg.prices[msgs];

  const salonId  = (SALON_CONFIG && SALON_CONFIG.id) || 'RD-00000';
  const ref      = `WA-${salonId}-${msgs}`;
  const modal    = document.getElementById('wa-payment-modal');
  if (!modal) return;

  document.getElementById('wap-msgs').textContent  = msgs.toLocaleString('tr-TR') + ' mesaj';
  document.getElementById('wap-price').textContent = '₺' + price.toLocaleString('tr-TR');
  document.getElementById('wap-ref').textContent   = ref;
  document.getElementById('wap-ref2').textContent  = ref;

  // Banka bilgilerini admin ayarlarından doldur
  const _set = (id, val, fallback) => { const el = document.getElementById(id); if(el) el.textContent = val || fallback; };
  _set('wap-bank-name',    cfg.bankName,      'Ziraat Bankası');
  _set('wap-account-name', cfg.accountHolder, 'Randevu Deluxe Ltd. Şti.');
  _set('wap-iban-display', cfg.iban,          'TR00 0001 0002 0003 0004 0005 00');

  // Aktivasyon süresi
  const actMap = {'1':'en geç 1 saat','4':'en geç 4 saat','24':'en geç 24 saat','48':'en geç 2 iş günü'};
  _set('wap-activation', actMap[cfg.activationTime] || 'en geç 24 saat', 'en geç 24 saat');

  // Ek not
  const noteEl = document.getElementById('wap-extra-note');
  if (noteEl) noteEl.textContent = cfg.note || '';

  modal.style.display = 'flex';
}

function closeWaPaymentModal() {
  const modal = document.getElementById('wa-payment-modal');
  if (modal) modal.style.display = 'none';
}

function copyWaRef() {
  const ref = document.getElementById('wap-ref').textContent;
  navigator.clipboard.writeText(ref).then(() => showMsg('✅ Referans kopyalandı', 'green'));
}

function openWaWhatsApp() {
  const ref   = document.getElementById('wap-ref').textContent;
  const price = document.getElementById('wap-price').textContent;
  const msgs  = document.getElementById('wap-msgs').textContent;
  const cfg   = _getWaCfg();
  const phone = cfg.waPhone || '905XXXXXXXXX';
  const text  = encodeURIComponent(
    `Merhaba, WA Kredi paketi satın almak istiyorum.\n\nSalon ID: ${SALON_CONFIG?.id || ''}\nReferans: ${ref}\nPaket: ${msgs}\nTutar: ${price}\n\nHavaleyi yaptıktan sonra aktivasyon bekliyorum.`
  );
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}

// ── SMS Ödeme ──────────────────────────────────
function _getSmsCfg() {
  try { return JSON.parse(localStorage.getItem('rd_sms_payment_cfg') || '{}'); } catch(e) { return {}; }
}

function buySmsPackage(msgs, price) {
  const cfg = _getSmsCfg();
  if (cfg.prices && cfg.prices[msgs]) price = cfg.prices[msgs];

  const salonId = (SALON_CONFIG && SALON_CONFIG.id) || 'RD-00000';
  const ref     = `SMS-${salonId}-${msgs}`;
  const modal   = document.getElementById('sms-payment-modal');
  if (!modal) return;

  document.getElementById('smsp-msgs').textContent  = msgs.toLocaleString('tr-TR') + ' SMS';
  document.getElementById('smsp-price').textContent = '₺' + price.toLocaleString('tr-TR');
  document.getElementById('smsp-ref').textContent   = ref;
  document.getElementById('smsp-ref2').textContent  = ref;

  const _set = (id, val, fallback) => { const el = document.getElementById(id); if(el) el.textContent = val || fallback; };
  _set('smsp-bank-name',    cfg.bankName,      'Ziraat Bankası');
  _set('smsp-account-name', cfg.accountHolder, 'Randevu Deluxe Ltd. Şti.');
  _set('smsp-iban-display', cfg.iban,          'TR00 0001 0002 0003 0004 0005 00');

  const actMap = {'1':'en geç 1 saat','4':'en geç 4 saat','24':'en geç 24 saat','48':'en geç 2 iş günü'};
  _set('smsp-activation', actMap[cfg.activationTime] || 'en geç 24 saat', 'en geç 24 saat');

  const noteEl = document.getElementById('smsp-extra-note');
  if (noteEl) noteEl.textContent = cfg.note || '';

  modal.style.display = 'flex';
}

function closeSmsPaymentModal() {
  const modal = document.getElementById('sms-payment-modal');
  if (modal) modal.style.display = 'none';
}

function copySmsRef() {
  const ref = document.getElementById('smsp-ref').textContent;
  navigator.clipboard.writeText(ref).then(() => showMsg('✅ Referans kopyalandı', 'green'));
}

function openSmsContact() {
  const ref   = document.getElementById('smsp-ref').textContent;
  const price = document.getElementById('smsp-price').textContent;
  const msgs  = document.getElementById('smsp-msgs').textContent;
  const cfg   = _getSmsCfg();
  const phone = cfg.waPhone || (_getWaCfg().waPhone) || '905XXXXXXXXX';
  const text  = encodeURIComponent(
    `Merhaba, SMS Kredi paketi satın almak istiyorum.\n\nSalon ID: ${SALON_CONFIG?.id || ''}\nReferans: ${ref}\nPaket: ${msgs}\nTutar: ${price}\n\nHavaleyi yaptıktan sonra aktivasyon bekliyorum.`
  );
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}

// ════════════════════════════════════════════
// PATCH showView + DOMContentLoaded
// ════════════════════════════════════════════
(function patchShowView() {
  const _orig = showView;
  window.showView = function(name) {
    _orig(name);
    if (name === 'berichte')    renderBerichte();
    if (name === 'kampanya')    renderKampanya();
    if (name === 'stok')        renderStok();
    if (name === 'bewertungen') renderBewertungen();
    if (name === 'online')      renderPendingBookings();
    if (name === 'personel')    setTimeout(renderDienstplan, 50);
    if (name === 'abonelik')    renderAbonelik();
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkPendingBookings, 600);
});
