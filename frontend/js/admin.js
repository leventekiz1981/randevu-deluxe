/* =============================================
   RANDEVU-DELUXE — Super Admin v2
   admin.js  (build 0417)
   ============================================= */

'use strict';

// ══════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════

// expiryDate: ISO-String (null = kein Ablauf / kostenlos)
// autoDeactivate: true = wird nach Ablauf automatisch deaktiviert
// waAddons: satın alınan WA paketleri (her ay yenilenir, tekrar eklenebilir)
// waLimit : waAddons toplamından hesaplanır
const SALONS = [
  { id:1,  name:"Ahmet's Barber",   city:'İstanbul', plan:'pro',  waUsed:312, waLimit:500,  waAddons:[{key:'p200',qty:2},{key:'p100',qty:1}], active:true,  color:'#C9A84C', email:'ahmet@example.com',  phone:'+90 532 111 22 33', expiryDate:'2027-02-14', autoDeactivate:true  },
  { id:2,  name:'Bella Beauty',     city:'Ankara',   plan:'std',  waUsed:87,  waLimit:100,  waAddons:[{key:'p100',qty:1}],                   active:true,  color:'#00C8FF', email:'bella@example.com',  phone:'+90 533 222 33 44', expiryDate:'2026-05-10', autoDeactivate:true  },
  { id:3,  name:'Güzellik Merkezi', city:'İzmir',    plan:'lux',  waUsed:241, waLimit:300,  waAddons:[{key:'p200',qty:1},{key:'p100',qty:1}], active:true,  color:'#8B5CF6', email:'guzmer@example.com', phone:'+90 534 333 44 55', expiryDate:'2027-03-01', autoDeactivate:false },
  { id:4,  name:'Hair Studio 34',   city:'İstanbul', plan:'free', waUsed:0,   waLimit:0,    waAddons:[],                                     active:true,  color:'#5A7A8A', email:'hair34@example.com', phone:'+90 535 444 55 66', expiryDate:null,         autoDeactivate:false },
  { id:5,  name:'Moda Saç Tasarım', city:'Bursa',    plan:'std',  waUsed:91,  waLimit:100,  waAddons:[{key:'p100',qty:1}],                   active:true,  color:'#00C8FF', email:'modasac@example.com',phone:'+90 536 555 66 77', expiryDate:'2026-04-30', autoDeactivate:true  },
  { id:6,  name:'Royal Coiffure',   city:'Antalya',  plan:'pro',  waUsed:188, waLimit:250,  waAddons:[{key:'p200',qty:1},{key:'p50',qty:1}],  active:true,  color:'#C9A84C', email:'royal@example.com',  phone:'+90 537 666 77 88', expiryDate:'2026-12-20', autoDeactivate:true  },
  { id:7,  name:'Stil Kuaförü',     city:'Konya',    plan:'free', waUsed:0,   waLimit:0,    waAddons:[],                                     active:false, color:'#5A7A8A', email:'stil@example.com',   phone:'+90 538 777 88 99', expiryDate:null,         autoDeactivate:false },
  { id:8,  name:'Trendy Kuaför',    city:'İstanbul', plan:'free', waUsed:0,   waLimit:0,    waAddons:[],                                     active:true,  color:'#22C55E', email:'trendy@example.com', phone:'+90 539 888 99 00', expiryDate:null,         autoDeactivate:false },
  { id:9,  name:'Kuaför Moda',      city:'Ankara',   plan:'std',  waUsed:44,  waLimit:100,  waAddons:[{key:'p100',qty:1}],                   active:true,  color:'#00C8FF', email:'kmode@example.com',  phone:'+90 530 999 00 11', expiryDate:'2027-01-16', autoDeactivate:true  },
  { id:10, name:'Beauty Point',     city:'İzmir',    plan:'free', waUsed:0,   waLimit:0,    waAddons:[],                                     active:true,  color:'#5A7A8A', email:'bpoint@example.com', phone:'+90 531 000 11 22', expiryDate:null,         autoDeactivate:false },
];

const PLAN_DIST = [
  { name:'Ücretsiz', key:'free', color:'#5A7A8A', count:161, pct:65 },
  { name:'Standart', key:'std',  color:'#00C8FF', count:44,  pct:18 },
  { name:'Pro',      key:'pro',  color:'#FFB830', count:27,  pct:11 },
  { name:'Lüks',     key:'lux',  color:'#8B5CF6', count:15,  pct:6  },
];

// Fiyatlar YILLIK (₺/yıl). WA ayrı eklenti paketi olarak satılır.
// hasKasa: Kasa + Gelir raporları  |  hasStok: Stok Yönetimi  |  hasKampanya: Kampanya & İndirim
let PLAN_CONFIG = [
  { key:'free', icon:'🆓', name:'Başlangıç', yearlyPrice:0,    monthlyEquiv:0,   staffLimit:1,  aptLimit:30,   hasKasa:false, hasStok:false, hasKampanya:false, color:'#5A7A8A' },
  { key:'std',  icon:'⭐', name:'Standart',  yearlyPrice:1990,  monthlyEquiv:166, staffLimit:3,  aptLimit:100,  hasKasa:false, hasStok:false, hasKampanya:false, color:'#00C8FF' },
  { key:'pro',  icon:'🚀', name:'Pro',       yearlyPrice:3990,  monthlyEquiv:332, staffLimit:10, aptLimit:1000, hasKasa:true,  hasStok:false, hasKampanya:false, color:'#FFB830' },
  { key:'lux',  icon:'💎', name:'Lüks',      yearlyPrice:7990,  monthlyEquiv:666, staffLimit:50, aptLimit:null, hasKasa:true,  hasStok:true,  hasKampanya:true,  color:'#8B5CF6' },
];

// WhatsApp eklenti paketleri — tekrar tekrar satın alınabilir (zubuchbar)
const WA_ADDONS = [
  { key:'p50',  name:'Paket 50',  msgs:50,  price:29, icon:'📨' },
  { key:'p100', name:'Paket 100', msgs:100, price:49, icon:'💬' },
  { key:'p200', name:'Paket 200', msgs:200, price:89, icon:'🚀' },
];

const ADMIN_REVENUE = [
  { month:'Eyl', value:28400 },
  { month:'Eki', value:31200 },
  { month:'Kas', value:35800 },
  { month:'Ara', value:38100 },
  { month:'Oca', value:33600 },
  { month:'Şub', value:41200 },
  { month:'Mar', value:44700 },
  { month:'Nis', value:48600, current:true },
];

const NEW_REGISTRATIONS = [
  { id:11, name:'Trendy Kuaför',  city:'İstanbul', plan:'free', date:'17 Nis 2026', converted:false },
  { id:12, name:'Kuaför Moda',    city:'Ankara',   plan:'std',  date:'16 Nis 2026', converted:true  },
  { id:13, name:'Beauty Point',   city:'İzmir',    plan:'free', date:'15 Nis 2026', converted:false },
  { id:14, name:'Saç Akademisi',  city:'Bursa',    plan:'pro',  date:'14 Nis 2026', converted:true  },
  { id:15, name:'Classic Barber', city:'Konya',    plan:'free', date:'13 Nis 2026', converted:false },
  { id:16, name:'Vogue Salon',    city:'İstanbul', plan:'std',  date:'12 Nis 2026', converted:true  },
  { id:17, name:'Güzel Saçlar',   city:'Ankara',   plan:'free', date:'11 Nis 2026', converted:false },
  { id:18, name:'Star Coiffure',  city:'İzmir',    plan:'pro',  date:'10 Nis 2026', converted:true  },
];

const SUPPORT_TICKETS = [
  { id:1, salon:'Bella Beauty',    subject:'WhatsApp mesajı gitmiyor',    status:'open',     date:'17 Nis', msg:'Randevu hatırlatması iletilmiyor, müşteriler randevuya gelmiyor.' },
  { id:2, salon:"Ahmet's Barber",  subject:'Fatura indirme sorunu',       status:'waiting',  date:'16 Nis', msg:'PDF fatura butonu çalışmıyor, tarayıcıda hata veriyor.' },
  { id:3, salon:'Hair Studio 34',  subject:'Pro pakete geçmek istiyoruz', status:'resolved', date:'14 Nis', msg:'Paket geçişi tamamlandı. Teşekkürler.' },
];

// BRANCHEN — Gewerbearten mit Vorlagen-Hizmetlern
// Der Salon-Betreiber legt seine eigenen Hizmetler im Dashboard an.
// Diese Vorlagen werden beim Onboarding vorgeschlagen / vorgeladen.
let BRANCHES = [
  {
    id:1, key:'kuafor', icon:'✂️', name:'Kuaför / Frisör',
    desc:'Saç kesimi, boyama, şekillendirme hizmetleri',
    color:'#00C8FF', active:true, _open:false,
    templates:[
      { id:1,  name:'Saç Kesimi',        dur:30,  sugPrice:150 },
      { id:2,  name:'Saç Boyama',        dur:90,  sugPrice:450 },
      { id:3,  name:'Röfle / Meche',     dur:120, sugPrice:550 },
      { id:4,  name:'Keratin Bakımı',    dur:60,  sugPrice:350 },
      { id:5,  name:'Düz Ütü',          dur:45,  sugPrice:180 },
      { id:6,  name:'Ombre / Balayaj',   dur:150, sugPrice:700 },
    ]
  },
  {
    id:2, key:'berber', icon:'💈', name:'Berber',
    desc:'Erkek saç kesimi ve sakal bakımı',
    color:'#C9A84C', active:true, _open:false,
    templates:[
      { id:7,  name:'Saç Kesimi (Erkek)', dur:20, sugPrice:80  },
      { id:8,  name:'Sakal Tıraşı',       dur:20, sugPrice:70  },
      { id:9,  name:'Saç + Sakal',        dur:40, sugPrice:130 },
      { id:10, name:'Çocuk Kesimi',       dur:15, sugPrice:60  },
      { id:11, name:'Ense Tıraşı',        dur:10, sugPrice:40  },
    ]
  },
  {
    id:3, key:'beauty', icon:'💄', name:'Beauty Studio',
    desc:'Makyaj, cilt bakımı, epilasyon, kaş-kirpik',
    color:'#F472B6', active:true, _open:false,
    templates:[
      { id:12, name:'Günlük Makyaj',        dur:45,  sugPrice:300 },
      { id:13, name:'Gelin Makyajı',         dur:90,  sugPrice:800 },
      { id:14, name:'Kalıcı Makyaj (Kaş)',   dur:120, sugPrice:1200},
      { id:15, name:'Kaş Şekillendirme',     dur:20,  sugPrice:80  },
      { id:16, name:'İpek Kirpik',           dur:90,  sugPrice:500 },
      { id:17, name:'İplik Epilasyon',       dur:20,  sugPrice:60  },
    ]
  },
  {
    id:4, key:'nagel', icon:'💅', name:'Nagelstudio / Tırnak',
    desc:'Manikür, pedikür, protez tırnak, kalıcı oje',
    color:'#EC4899', active:true, _open:false,
    templates:[
      { id:18, name:'Manikür',         dur:45, sugPrice:150 },
      { id:19, name:'Pedikür',         dur:60, sugPrice:180 },
      { id:20, name:'Kalıcı Oje',      dur:60, sugPrice:220 },
      { id:21, name:'Protez Tırnak',   dur:90, sugPrice:380 },
      { id:22, name:'Nail Art',        dur:30, sugPrice:100 },
    ]
  },
  {
    id:5, key:'massage', icon:'💆', name:'Masaj / Wellness',
    desc:'Terapötik ve gevşeme masajları, refleksoloji',
    color:'#8B5CF6', active:true, _open:false,
    templates:[
      { id:23, name:'İsveç Masajı (60dk)', dur:60, sugPrice:400 },
      { id:24, name:'Derin Doku Masajı',   dur:60, sugPrice:450 },
      { id:25, name:'Sırt & Boyun Masajı', dur:30, sugPrice:220 },
      { id:26, name:'Refleksoloji',        dur:45, sugPrice:280 },
      { id:27, name:'Aromaterapi Masajı',  dur:60, sugPrice:380 },
      { id:28, name:'Baş & Saçkökü',      dur:20, sugPrice:150 },
    ]
  },
  {
    id:6, key:'kosmetik', icon:'🧖', name:'Estetisyen / Cilt',
    desc:'Yüz bakımı, peeling, maske, cilt tedavileri',
    color:'#22C55E', active:true, _open:false,
    templates:[
      { id:29, name:'Yüz Temizleme Bakımı', dur:60, sugPrice:300 },
      { id:30, name:'Kimyasal Peeling',      dur:45, sugPrice:250 },
      { id:31, name:'Hydra Facial',          dur:60, sugPrice:500 },
      { id:32, name:'Göz Çevresi Bakımı',    dur:30, sugPrice:160 },
      { id:33, name:'Anti-Aging Bakımı',     dur:75, sugPrice:600 },
    ]
  },
  {
    id:7, key:'spa', icon:'🛁', name:'SPA / Hamam',
    desc:'Hamam, kese, köpük masajı, SPA paketleri',
    color:'#F59E0B', active:true, _open:false,
    templates:[
      { id:34, name:'Türk Hamamı',      dur:60, sugPrice:350 },
      { id:35, name:'Kese & Köpük',     dur:45, sugPrice:250 },
      { id:36, name:'SPA Paketi (2sa)', dur:120,sugPrice:800 },
      { id:37, name:'Buz + Buhar',      dur:30, sugPrice:150 },
    ]
  },
];

const CITY_DATA = [
  { city:'İstanbul', total:84,  paid:52, mrrShare:'₺19.4K' },
  { city:'Ankara',   total:41,  paid:28, mrrShare:'₺9.8K'  },
  { city:'İzmir',    total:33,  paid:20, mrrShare:'₺7.2K'  },
  { city:'Bursa',    total:22,  paid:14, mrrShare:'₺4.9K'  },
  { city:'Antalya',  total:18,  paid:11, mrrShare:'₺3.8K'  },
  { city:'Konya',    total:14,  paid:7,  mrrShare:'₺2.6K'  },
  { city:'Diğer',    total:35,  paid:19, mrrShare:'₺6.1K'  },
];

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Topbar date
  const ov = document.getElementById('ov-date');
  if (ov) {
    const d = new Date();
    ov.textContent = d.toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }

  // Update sidebar badges
  document.getElementById('sb-new-count').textContent    = NEW_REGISTRATIONS.length;
  document.getElementById('sb-ticket-count').textContent = SUPPORT_TICKETS.filter(t => t.status !== 'resolved').length;

  // Abgelaufene Salons prüfen
  checkAndAutoDeactivate();

  // Render initial view
  _renderRevChart('ov-chart');
  _renderPlanBars('ov-plan-bars');
  renderSalonlar();
  renderKayitlar();
  renderHizmetler();
  renderAbonelikler();
  renderWhatsapp();
  renderRaporlar();
  renderDestek();
  renderPlanPricesTable();
  renderMesajlar();
});

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════

const VIEW_TITLES = {
  overview:    'Genel Bakış',
  salonlar:    'Salonlar',
  kayitlar:    'Yeni Kayıtlar',
  hizmetler:   'Branchen & Hizmet Şablonları',
  abonelikler: 'Abonelik Planları',
  whatsapp:    'WhatsApp',
  raporlar:    'Raporlar',
  destek:      'Destek Talepleri',
  mesajlar:    'Mesajlar',
  ayarlar:     'Sistem Ayarları',
};

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('view-' + name);
  if (viewEl) viewEl.classList.add('active');

  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  const sbBtn = document.getElementById('sb-' + name);
  if (sbBtn) sbBtn.classList.add('active');

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = VIEW_TITLES[name] || name;

  if (name === 'mesajlar') renderMesajlar();

  closeSidebar();
  window.scrollTo({ top:0, behavior:'smooth' });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ══════════════════════════════════════════════
//  SHARED HELPERS
// ══════════════════════════════════════════════

const CHIP_MAP  = { free:'chip-free', std:'chip-std', pro:'chip-pro', lux:'chip-lux' };
const PLAN_NAME = { free:'Ücretsiz',  std:'Standart', pro:'Pro',       lux:'Lüks'    };

function _initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
}

// ── Ablauf-Helpers ────────────────────────────
function _daysLeft(isoDate) {
  if (!isoDate) return null;
  const diff = new Date(isoDate) - new Date();
  return Math.ceil(diff / 86400000);
}

function _expiryLabel(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  return d.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' });
}

function _expiryBadge(s) {
  if (s.plan === 'free' || !s.expiryDate) return '';
  const days = _daysLeft(s.expiryDate);
  if (days === null) return '';
  if (days < 0)  return `<span style="font-size:.62rem;font-weight:700;padding:1px 7px;border-radius:4px;background:rgba(239,68,68,.18);color:var(--danger)">⛔ Süresi doldu</span>`;
  if (days <= 14) return `<span style="font-size:.62rem;font-weight:700;padding:1px 7px;border-radius:4px;background:rgba(239,68,68,.15);color:var(--danger)">⚠️ ${days} gün</span>`;
  if (days <= 30) return `<span style="font-size:.62rem;font-weight:700;padding:1px 7px;border-radius:4px;background:rgba(245,158,11,.15);color:var(--orange)">⏳ ${days} gün</span>`;
  return `<span style="font-size:.62rem;color:var(--tx3)">📅 ${days} gün</span>`;
}

// Abgelaufene Salons automatisch deaktivieren
function checkAndAutoDeactivate() {
  let changed = 0;
  SALONS.forEach(s => {
    if (s.plan === 'free' || !s.expiryDate || !s.autoDeactivate) return;
    const days = _daysLeft(s.expiryDate);
    if (days !== null && days < 0 && s.active) {
      s.active = false;
      changed++;
    }
  });
  if (changed > 0) {
    renderSalonlar();
    showToast(`⛔ ${changed} salon süresi dolduğu için otomatik deaktive edildi`, 'danger');
  }
}

function _waLine(s) {
  if (s.plan === 'free') {
    return '<span style="font-size:.72rem;color:var(--tx3)">wa.me link</span>';
  }
  if (s.plan === 'lux') {
    return '<span style="font-size:.72rem;color:var(--green)">∞ Sınırsız</span>';
  }
  const pct = Math.min(Math.round((s.waUsed / s.waLimit) * 100), 100);
  const cls = pct >= 90 ? 'fill-danger' : pct >= 70 ? 'fill-warn' : 'fill-safe';
  return `
    <div class="wa-bar-wrap">
      <span class="wa-bar-lbl">💬 ${s.waUsed}/${s.waLimit}</span>
      <div class="wa-bar-track"><div class="wa-bar-fill ${cls}" style="width:${pct}%"></div></div>
      <span style="font-size:.68rem;color:var(--tx3)">${pct}%</span>
    </div>`;
}

function _renderRevChart(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const maxVal = Math.max(...ADMIN_REVENUE.map(d => d.value));
  el.innerHTML = ADMIN_REVENUE.map(d => {
    const h = Math.max(4, Math.round((d.value / maxVal) * 100));
    const kTL = (d.value/1000).toFixed(1).replace('.', ',');
    return `
      <div class="rev-col">
        <div class="rev-bar${d.current ? ' now' : ''}" style="height:${h}%" title="₺${d.value.toLocaleString('tr-TR')}"></div>
        <div class="rev-lbl">${d.month}</div>
      </div>`;
  }).join('');
}

function _renderPlanBars(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const colors = { free:'#5A7A8A', std:'#00C8FF', pro:'#FFB830', lux:'#8B5CF6' };
  el.innerHTML = PLAN_DIST.map(p => `
    <div class="plan-bar-row">
      <div class="plan-dot" style="background:${colors[p.key]}"></div>
      <div class="plan-name-lbl" style="color:${colors[p.key]}">${p.name}</div>
      <div class="plan-track">
        <div class="plan-fill-bar" style="width:${p.pct}%;background:${colors[p.key]}"></div>
      </div>
      <div class="plan-count-lbl">${p.count} salon</div>
    </div>`).join('');
}

// ══════════════════════════════════════════════
//  VIEW: SALONLAR
// ══════════════════════════════════════════════

let _salonFilter = 'all';

function renderSalonlar() {
  const lbl = document.getElementById('salon-count-lbl');
  const list = document.getElementById('salon-list');
  if (!list) return;

  const q = (document.getElementById('salon-search') || {}).value || '';
  const filtered = SALONS.filter(s => {
    const matchFilter = _salonFilter === 'all' || s.plan === _salonFilter;
    const matchSearch = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.city.toLowerCase().includes(q.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (lbl) lbl.textContent = `${filtered.length} salon gösteriliyor (toplam ${SALONS.length})`;

  list.innerHTML = filtered.map(s => {
    const days = _daysLeft(s.expiryDate);
    const rowBorder = (days !== null && days < 0) ? 'border-color:rgba(239,68,68,.4)' :
                      (days !== null && days <= 14) ? 'border-color:rgba(239,68,68,.25)' :
                      (days !== null && days <= 30) ? 'border-color:rgba(245,158,11,.25)' : '';
    return `
    <div class="salon-row" onclick="openSalonModal(${s.id})" style="${rowBorder}">
      <div class="salon-av" style="background:${s.color}">${_initials(s.name)}</div>
      <div class="salon-info">
        <div class="salon-name-row" style="display:flex;align-items:center;gap:6px">
          ${s.name}
          ${!s.active ? '<span style="font-size:.6rem;padding:1px 6px;border-radius:4px;background:rgba(239,68,68,.15);color:var(--danger)">Pasif</span>' : ''}
        </div>
        <div class="salon-meta">
          <span class="status-dot ${s.active ? 'dot-on' : 'dot-off'}"></span>
          ${s.city} · ${PLAN_NAME[s.plan]}
          ${s.expiryDate ? `· ${_expiryBadge(s)}` : ''}
        </div>
        ${_waLine(s)}
      </div>
      <div class="salon-right">
        <span class="chip ${CHIP_MAP[s.plan]}">${PLAN_NAME[s.plan]}</span>
      </div>
    </div>`;
  }).join('') || '<div style="text-align:center;padding:24px;color:var(--tx3)">Salon bulunamadı</div>';
}

function filterSalons() {
  renderSalonlar();
}

function setSalonFilter(filter, btn) {
  _salonFilter = filter;
  document.querySelectorAll('#salon-filter-chips .btn').forEach(b => {
    b.classList.remove('btn-accent');
    b.classList.add('btn-ghost');
  });
  btn.classList.remove('btn-ghost');
  btn.classList.add('btn-accent');
  renderSalonlar();
}

function openNewSalonModal() {
  showToast('Yeni salon kaydı için onboarding sayfasını kullanın: /onboarding.html', 'info');
}

// ══════════════════════════════════════════════
//  SALON DETAIL MODAL
// ══════════════════════════════════════════════

let _activeSalonId = null;

function openSalonModal(salonId) {
  const s = SALONS.find(x => x.id === salonId);
  if (!s) return;
  _activeSalonId = salonId;

  // Header
  const av = document.getElementById('sm-av');
  av.textContent = _initials(s.name);
  av.style.background = s.color;
  document.getElementById('sm-name').textContent = s.name;
  document.getElementById('sm-city').textContent = s.city;

  // Chips
  document.getElementById('sm-chips').innerHTML = `
    <span class="chip ${CHIP_MAP[s.plan]}">${PLAN_NAME[s.plan]}</span>
    <span class="chip ${s.active ? 'chip-active' : 'chip-paused'}">${s.active ? 'Aktif' : 'Askıda'}</span>`;

  // Plan & billing selects
  document.getElementById('sm-plan-sel').value = s.plan;
  document.getElementById('sm-billing').value = 'monthly';

  // WA usage
  const waLbl  = document.getElementById('sm-wa-lbl');
  const waPct  = document.getElementById('sm-wa-pct');
  const waFill = document.getElementById('sm-wa-fill');
  if (s.plan === 'free') {
    waLbl.textContent  = 'Ücretsiz planda WA yok';
    waPct.textContent  = '—';
    waFill.style.width = '0%';
    waFill.className   = 'progress-fill fill-safe';
  } else if (s.plan === 'lux') {
    waLbl.textContent  = '∞ Sınırsız kullanım';
    waPct.textContent  = '∞';
    waFill.style.width = '100%';
    waFill.className   = 'progress-fill fill-safe';
  } else {
    const pct = Math.min(Math.round((s.waUsed / s.waLimit) * 100), 100);
    waLbl.textContent  = `💬 ${s.waUsed} / ${s.waLimit} mesaj`;
    waPct.textContent  = `%${pct}`;
    waFill.style.width = pct + '%';
    waFill.className   = 'progress-fill ' + (pct >= 90 ? 'fill-danger' : pct >= 70 ? 'fill-warn' : 'fill-safe');
  }

  // Editable fields
  document.getElementById('sm-edit-name').value  = s.name;
  document.getElementById('sm-edit-city').value  = s.city;
  document.getElementById('sm-edit-email').value = s.email || '';
  document.getElementById('sm-edit-phone').value = s.phone || '';

  // Expiry section
  const exEl = document.getElementById('sm-expiry-section');
  if (exEl) {
    if (s.plan === 'free' || !s.expiryDate) {
      exEl.innerHTML = '<div style="font-size:.82rem;color:var(--tx3)">Ücretsiz plan — süre sınırı yok</div>';
    } else {
      const days = _daysLeft(s.expiryDate);
      const color = days < 0 ? 'var(--danger)' : days <= 14 ? 'var(--danger)' : days <= 30 ? 'var(--orange)' : 'var(--green)';
      const icon  = days < 0 ? '⛔' : days <= 14 ? '🔴' : days <= 30 ? '🟡' : '🟢';
      exEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:.76rem;color:var(--tx3);margin-bottom:3px">Abonelik Bitiş Tarihi</div>
            <div style="font-size:.92rem;font-weight:700;color:${color}">${icon} ${_expiryLabel(s.expiryDate)}</div>
            <div style="font-size:.76rem;color:var(--tx2);margin-top:2px">${days < 0 ? 'Süresi ' + Math.abs(days) + ' gün önce doldu' : days + ' gün kaldı'}</div>
          </div>
          <button class="btn btn-accent btn-sm" onclick="extendSubscription(${s.id})">🔄 +1 Yıl Uzat</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--br)">
          <div>
            <div style="font-size:.82rem;font-weight:500">Otomatik Deaktivasyon</div>
            <div style="font-size:.72rem;color:var(--tx3)">Süre dolunca otomatik pasife al</div>
          </div>
          <label class="toggle-sw">
            <input type="checkbox" id="sm-auto-deac" ${s.autoDeactivate ? 'checked' : ''} onchange="toggleAutoDeactivate(${s.id})">
            <span class="toggle-sw-slider"></span>
          </label>
        </div>`;
    }
  }

  // Activity
  document.getElementById('sm-activity').innerHTML = `
    <div style="padding:6px 0;border-bottom:1px solid var(--br)">📅 Son randevu: Bugün 14:30</div>
    <div style="padding:6px 0;border-bottom:1px solid var(--br)">👥 Toplam müşteri: ${Math.floor(Math.random()*200)+50}</div>
    <div style="padding:6px 0;border-bottom:1px solid var(--br)">📊 Bu ay randevu: ${Math.floor(Math.random()*120)+20}</div>
    <div style="padding:6px 0">📝 Kayıt tarihi: ${['Mar', 'Şub', 'Oca', 'Ara'][s.id % 4]} 2026</div>`;

  // Suspend button text
  const suspBtn = document.querySelector('#salon-modal .btn-danger');
  if (suspBtn) suspBtn.innerHTML = s.active ? '⏸ Askıya Al' : '▶️ Aktifleştir';

  openModal('salon-modal');
}

function extendSubscription(salonId) {
  const s = SALONS.find(x => x.id === salonId);
  if (!s) return;
  const base = s.expiryDate && _daysLeft(s.expiryDate) > 0
    ? new Date(s.expiryDate)
    : new Date();
  base.setFullYear(base.getFullYear() + 1);
  s.expiryDate = base.toISOString().split('T')[0];
  if (!s.active && s.plan !== 'free') s.active = true;
  openSalonModal(salonId); // modal aktualisieren
  showToast(`✅ ${s.name} — +1 yıl uzatıldı · Yeni bitiş: ${_expiryLabel(s.expiryDate)}`);
  renderSalonlar();
}

function toggleAutoDeactivate(salonId) {
  const s = SALONS.find(x => x.id === salonId);
  if (!s) return;
  const cb = document.getElementById('sm-auto-deac');
  s.autoDeactivate = cb ? cb.checked : !s.autoDeactivate;
  showToast(`${s.autoDeactivate ? '🔄 Otomatik deaktivasyon açık' : '⏸ Otomatik deaktivasyon kapalı'}: ${s.name}`);
}

function saveSalonPlan() {
  const s = SALONS.find(x => x.id === _activeSalonId);
  if (!s) return;
  const newPlan = document.getElementById('sm-plan-sel').value;
  const billing = document.getElementById('sm-billing').value;
  s.plan = newPlan;
  showToast(`✅ ${s.name} → ${PLAN_NAME[newPlan]} (${billing === 'yearly' ? 'Yıllık' : 'Aylık'})`, 'green');
  renderSalonlar();
}

function saveSalonInfo() {
  const s = SALONS.find(x => x.id === _activeSalonId);
  if (!s) return;
  s.name  = document.getElementById('sm-edit-name').value.trim() || s.name;
  s.city  = document.getElementById('sm-edit-city').value.trim() || s.city;
  s.email = document.getElementById('sm-edit-email').value.trim();
  s.phone = document.getElementById('sm-edit-phone').value.trim();
  document.getElementById('sm-name').textContent = s.name;
  document.getElementById('sm-city').textContent = s.city;
  showToast('✅ Salon bilgileri kaydedildi');
  renderSalonlar();
}

function toggleSalonStatus() {
  const s = SALONS.find(x => x.id === _activeSalonId);
  if (!s) return;
  if (s.active && !confirm(`"${s.name}" adlı salonu askıya almak istediğinize emin misiniz?`)) return;
  s.active = !s.active;
  showToast(`${s.active ? '✅ Aktifleştirildi' : '⏸ Askıya alındı'}: ${s.name}`);
  closeModal('salon-modal');
  renderSalonlar();
}

function resetWaLimit() {
  const s = SALONS.find(x => x.id === _activeSalonId);
  if (!s) return;
  s.waUsed = 0;
  openSalonModal(_activeSalonId); // refresh modal
  showToast('🔄 WA limiti sıfırlandı');
}

function sendUpsellModal() {
  const s = SALONS.find(x => x.id === _activeSalonId);
  if (!s) return;
  const nextPlan = s.plan === 'free' ? 'Standart' : s.plan === 'std' ? 'Pro' : 'Lüks';
  showToast(`📤 Upsell mesajı gönderildi → ${s.name} (${nextPlan} paketi önerisi)`);
}

// ══════════════════════════════════════════════
//  VIEW: YENİ KAYITLAR
// ══════════════════════════════════════════════

function renderKayitlar() {
  const listEl = document.getElementById('kayitlar-list');
  if (!listEl) return;

  listEl.innerHTML = `
    <table class="tbl">
      <thead><tr><th>Salon</th><th>Şehir</th><th>Plan</th><th>Tarih</th><th>Durum</th></tr></thead>
      <tbody>
        ${NEW_REGISTRATIONS.map(r => `
          <tr>
            <td style="font-weight:600">${r.name}</td>
            <td style="color:var(--tx2)">${r.city}</td>
            <td><span class="chip ${CHIP_MAP[r.plan]}">${PLAN_NAME[r.plan]}</span></td>
            <td style="color:var(--tx2);font-size:.78rem">${r.date}</td>
            <td><span class="chip ${r.converted ? 'chip-active' : 'chip-free'}">${r.converted ? 'Ücretli' : 'Ücretsiz'}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ══════════════════════════════════════════════
//  VIEW: BRANCHEN (Gewerbearten)
//  Admin verwaltet Branchen mit Vorlagen.
//  Salon-Betreiber legt eigene Hizmetler im
//  Dashboard selbst an.
// ══════════════════════════════════════════════

let _editBranchId   = null;
let _editTemplateId = null;
let _tplBranchId    = null;
let _nextTplId      = 200; // avoid ID collisions

function renderHizmetler() {
  const el = document.getElementById('hizmet-catalog');
  if (!el) return;

  if (!BRANCHES.length) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--tx3)">Henüz branche yok. ➕ ile ekle.</div>';
    return;
  }

  el.innerHTML = BRANCHES.map(b => {
    const tplCount = b.templates.length;
    const isOpen   = b._open;
    return `
      <div class="branch-card" id="branch-card-${b.id}" style="margin-bottom:10px;border-radius:14px;overflow:hidden;border:1px solid var(--br);background:var(--s2)">

        <!-- Branch Header -->
        <div class="branch-hdr" onclick="toggleBranch(${b.id})"
             style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;
                    border-left:4px solid ${b.color};transition:background .15s;
                    ${isOpen ? 'background:rgba(255,255,255,.03)' : ''}">
          <span style="font-size:1.5rem;flex-shrink:0">${b.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:.92rem;font-weight:700;display:flex;align-items:center;gap:8px">
              ${b.name}
              ${!b.active ? '<span class="chip chip-paused" style="font-size:.58rem">Pasif</span>' : ''}
            </div>
            <div style="font-size:.72rem;color:var(--tx3);margin-top:2px">${b.desc}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <span style="font-size:.72rem;color:var(--tx3)">${tplCount} şablon</span>
            <button class="btn btn-ghost btn-sm" onclick="openBranchModal(${b.id});event.stopPropagation()" title="Branche Düzenle">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBranch(${b.id});event.stopPropagation()" title="Branche Sil">🗑</button>
            <span style="color:var(--tx3);font-size:.9rem;margin-left:4px;transition:transform .2s;
                         ${isOpen ? 'transform:rotate(180deg)' : ''}">▼</span>
          </div>
        </div>

        <!-- Templates -->
        <div id="branch-tpls-${b.id}" style="display:${isOpen ? 'block' : 'none'};padding:0 16px 12px;border-top:1px solid var(--br)">
          <div style="font-size:.62rem;text-transform:uppercase;letter-spacing:2px;color:var(--tx3);
                      padding:10px 0 6px;font-weight:700">
            ℹ️ Bu şablonlar onboarding sırasında salon sahibine sunulur. Fiyatları salon sahibi belirler.
          </div>
          ${b.templates.length
            ? `<table class="tbl">
                 <thead><tr><th>#</th><th>Hizmet Şablonu</th><th>Önerilen Süre</th><th>Öneri Fiyat</th><th></th></tr></thead>
                 <tbody>
                   ${b.templates.map((t, i) => `
                     <tr>
                       <td style="color:var(--tx3)">${i+1}</td>
                       <td style="font-weight:600">${t.name}</td>
                       <td style="color:var(--tx2)">⏱ ${t.dur} dk</td>
                       <td style="color:var(--gold);font-weight:700">₺${t.sugPrice}</td>
                       <td style="display:flex;gap:5px">
                         <button class="btn btn-ghost btn-sm" onclick="openTemplateModal(${b.id},${t.id})">✏️</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteTemplate(${b.id},${t.id})">🗑</button>
                       </td>
                     </tr>`).join('')}
                 </tbody>
               </table>`
            : '<div style="padding:12px 0;color:var(--tx3);font-size:.82rem">Henüz şablon yok.</div>'}
          <button class="btn btn-accent btn-sm" style="margin-top:10px"
                  onclick="openTemplateModal(${b.id}, null)">➕ Şablon Ekle</button>
        </div>
      </div>`;
  }).join('');
}

function toggleBranch(id) {
  const b = BRANCHES.find(x => x.id === id);
  if (!b) return;
  b._open = !b._open;
  renderHizmetler();
}

// ── BRANCH MODAL ─────────────────────────────

function openBranchModal(id) {
  _editBranchId = id;
  const isNew = !id;
  document.getElementById('bm-title').textContent = isNew ? 'Yeni Branche Ekle' : 'Branche Düzenle';

  if (!isNew) {
    const b = BRANCHES.find(x => x.id === id);
    if (!b) return;
    document.getElementById('bm-name').value    = b.name;
    document.getElementById('bm-icon').value    = b.icon;
    document.getElementById('bm-desc').value    = b.desc;
    document.getElementById('bm-color').value   = b.color;
    document.getElementById('bm-active').checked = b.active;
  } else {
    document.getElementById('bm-name').value    = '';
    document.getElementById('bm-icon').value    = '✂️';
    document.getElementById('bm-desc').value    = '';
    document.getElementById('bm-color').value   = '#00C8FF';
    document.getElementById('bm-active').checked = true;
  }
  openModal('branch-modal');
}

function saveBranch() {
  const name   = document.getElementById('bm-name').value.trim();
  const icon   = document.getElementById('bm-icon').value.trim() || '✂️';
  const desc   = document.getElementById('bm-desc').value.trim();
  const color  = document.getElementById('bm-color').value || '#00C8FF';
  const active = document.getElementById('bm-active').checked;

  if (!name) { showToast('⚠️ Branche adı gerekli', 'danger'); return; }

  if (_editBranchId) {
    const b = BRANCHES.find(x => x.id === _editBranchId);
    if (b) Object.assign(b, { name, icon, desc, color, active });
    showToast('✅ Branche güncellendi');
  } else {
    const maxId = Math.max(0, ...BRANCHES.map(x => x.id));
    BRANCHES.push({ id:maxId+1, key:name.toLowerCase().replace(/\s+/g,'_'), icon, name, desc, color, active, _open:true, templates:[] });
    showToast('✅ Yeni branche eklendi');
  }

  closeModal('branch-modal');
  renderHizmetler();
}

function deleteBranch(id) {
  const b = BRANCHES.find(x => x.id === id);
  if (!b) return;
  if (!confirm(`"${b.name}" branche'ı ve tüm şablonları silinsin mi?`)) return;
  BRANCHES = BRANCHES.filter(x => x.id !== id);
  showToast('🗑 Branche silindi');
  renderHizmetler();
}

// ── TEMPLATE MODAL ────────────────────────────

function openTemplateModal(branchId, tplId) {
  _tplBranchId    = branchId;
  _editTemplateId = tplId;
  const isNew = !tplId;

  document.getElementById('hm-title').textContent = isNew ? 'Şablon Hizmet Ekle' : 'Şablonu Düzenle';

  const b = BRANCHES.find(x => x.id === branchId);
  document.getElementById('hm-branch-lbl').textContent = b ? `Branche: ${b.icon} ${b.name}` : '';

  if (!isNew) {
    const t = b && b.templates.find(x => x.id === tplId);
    if (!t) return;
    document.getElementById('hm-name').value  = t.name;
    document.getElementById('hm-dur').value   = t.dur;
    document.getElementById('hm-price').value = t.sugPrice;
  } else {
    document.getElementById('hm-name').value  = '';
    document.getElementById('hm-dur').value   = '30';
    document.getElementById('hm-price').value = '';
  }
  openModal('hizmet-modal');
}

function saveHizmet() {
  const name     = document.getElementById('hm-name').value.trim();
  const dur      = parseInt(document.getElementById('hm-dur').value)   || 30;
  const sugPrice = parseInt(document.getElementById('hm-price').value) || 0;

  if (!name) { showToast('⚠️ Hizmet adı gerekli', 'danger'); return; }

  const b = BRANCHES.find(x => x.id === _tplBranchId);
  if (!b) return;

  if (_editTemplateId) {
    const t = b.templates.find(x => x.id === _editTemplateId);
    if (t) Object.assign(t, { name, dur, sugPrice });
    showToast('✅ Şablon güncellendi');
  } else {
    b.templates.push({ id: _nextTplId++, name, dur, sugPrice });
    b._open = true;
    showToast('✅ Şablon eklendi');
  }

  closeModal('hizmet-modal');
  renderHizmetler();
}

function deleteTemplate(branchId, tplId) {
  const b = BRANCHES.find(x => x.id === branchId);
  if (!b) return;
  const t = b.templates.find(x => x.id === tplId);
  if (!t) return;
  if (!confirm(`"${t.name}" şablonu silinsin mi?`)) return;
  b.templates = b.templates.filter(x => x.id !== tplId);
  showToast('🗑 Şablon silindi');
  renderHizmetler();
}

// ══════════════════════════════════════════════
//  VIEW: ABONELİKLER
// ══════════════════════════════════════════════

function renderAbonelikler() {
  const cardsEl = document.getElementById('plan-cards-edit');
  if (cardsEl) {
    cardsEl.innerHTML = PLAN_CONFIG.map(p => `
      <div class="card" style="border-top:3px solid ${p.color || _planColor(p.key)}">
        <div class="card-title">${p.icon} ${p.name} <span class="chip ${CHIP_MAP[p.key]}">${PLAN_NAME[p.key]}</span></div>

        ${p.key !== 'free' ? `
        <div style="background:rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;margin-bottom:12px;border:1px solid var(--br)">
          <div style="font-size:.68rem;color:var(--tx3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Yıllık Ücret</div>
          <div style="display:flex;align-items:baseline;gap:6px">
            <span style="font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;color:var(--gold)">₺${p.yearlyPrice.toLocaleString('tr-TR')}</span>
            <span style="font-size:.76rem;color:var(--tx3)">/yıl</span>
          </div>
          <div style="font-size:.74rem;color:var(--tx2);margin-top:3px">≈ aylık <strong>₺${p.monthlyEquiv}</strong></div>
        </div>` : `
        <div style="font-size:.82rem;color:var(--tx3);margin-bottom:12px;padding:8px;background:rgba(0,0,0,.1);border-radius:8px">Sonsuza dek ücretsiz</div>`}

        <!-- Özellikler -->
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
          <span style="font-size:.7rem;padding:3px 8px;border-radius:5px;background:${p.aptLimit?'rgba(0,200,255,.1)':'rgba(34,197,94,.1)'};color:${p.aptLimit?'var(--cyan)':'var(--green)'}">
            📅 ${p.aptLimit ? p.aptLimit+'/ay' : '∞'} randevu
          </span>
          <span style="font-size:.7rem;padding:3px 8px;border-radius:5px;background:rgba(0,200,255,.1);color:var(--cyan)">
            👥 ${p.staffLimit} personel
          </span>
          <span style="font-size:.7rem;padding:3px 8px;border-radius:5px;background:${p.hasKasa?'rgba(34,197,94,.1)':'rgba(255,255,255,.05)'};color:${p.hasKasa?'var(--green)':'var(--tx3)'}">
            ${p.hasKasa?'✓':'✗'} Kasa & Raporlar
          </span>
          <span style="font-size:.7rem;padding:3px 8px;border-radius:5px;background:${p.hasStok?'rgba(34,197,94,.1)':'rgba(255,255,255,.05)'};color:${p.hasStok?'var(--green)':'var(--tx3)'}">
            ${p.hasStok?'✓':'✗'} Stok Yönetimi
          </span>
          <span style="font-size:.7rem;padding:3px 8px;border-radius:5px;background:${p.hasKampanya?'rgba(34,197,94,.1)':'rgba(255,255,255,.05)'};color:${p.hasKampanya?'var(--green)':'var(--tx3)'}">
            ${p.hasKampanya?'✓':'✗'} Kampanya
          </span>
          <span style="font-size:.7rem;padding:3px 8px;border-radius:5px;background:${p.key==='free'?'rgba(255,255,255,.05)':'rgba(37,211,102,.1)'};color:${p.key==='free'?'var(--tx3)':'#25d366'}">
            ${p.key==='free'?'✗ WhatsApp':'💬 WA Paket eklenebilir'}
          </span>
        </div>

        <div class="form-3col">
          <div class="form-row">
            <label>Yıllık Fiyat (₺)</label>
            <input class="inp" type="number" id="plan-price-${p.key}" value="${p.yearlyPrice}" ${p.key === 'free' ? 'disabled' : ''}>
          </div>
          <div class="form-row">
            <label>Randevu Limiti/ay</label>
            <input class="inp" type="number" id="plan-apt-${p.key}" value="${p.aptLimit || ''}" placeholder="${p.aptLimit === null ? '∞' : ''}">
          </div>
          <div class="form-row">
            <label>Personel Limiti</label>
            <input class="inp" type="number" id="plan-staff-${p.key}" value="${p.staffLimit || ''}">
          </div>
        </div>
        <button class="btn btn-accent btn-sm" onclick="saveSinglePlan('${p.key}')">💾 Kaydet</button>
      </div>`).join('');
  }

  // WA Paketleri bölümü
  const waEl = document.getElementById('wa-addon-cards');
  if (waEl) {
    waEl.innerHTML = WA_ADDONS.map(a => `
      <div class="card" style="border-top:3px solid #25D366">
        <div class="card-title">${a.icon} ${a.name}
          <span style="font-size:.7rem;padding:3px 9px;border-radius:5px;background:rgba(37,211,102,.12);color:#25D366;margin-left:6px">${a.msgs} mesaj/ay</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:6px;margin:10px 0 4px">
          <span style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:#25D366">₺${a.price}</span>
          <span style="font-size:.76rem;color:var(--tx3)">/ ay</span>
        </div>
        <div style="font-size:.74rem;color:var(--tx2);margin-bottom:12px">≈ ₺${(a.price/a.msgs).toFixed(2)} / mesaj · Tekrar eklenebilir</div>
        <div class="form-row">
          <label>Paket Fiyatı (₺)</label>
          <input class="inp" type="number" id="wa-price-${a.key}" value="${a.price}">
        </div>
        <button class="btn btn-accent btn-sm" onclick="saveWaAddon('${a.key}')">💾 Kaydet</button>
      </div>`).join('');
  }

  _renderPlanBars('abo-plan-bars');
}

function saveWaAddon(key) {
  const a = WA_ADDONS.find(x => x.key === key);
  if (!a) return;
  const newPrice = parseInt(document.getElementById('wa-price-' + key).value);
  if (newPrice > 0) { a.price = newPrice; }
  _saveConfigToStorage();
  showToast(`✅ ${a.name} fiyatı güncellendi → ₺${a.price}`);
}

function saveSinglePlan(key) {
  const p = PLAN_CONFIG.find(x => x.key === key);
  if (!p) return;
  p.yearlyPrice  = parseInt(document.getElementById('plan-price-' + key).value) || p.yearlyPrice;
  p.monthlyEquiv = Math.round(p.yearlyPrice / 12);
  p.aptLimit     = key === 'lux' ? null : (parseInt(document.getElementById('plan-apt-'  + key).value) || p.aptLimit);
  p.staffLimit   = parseInt(document.getElementById('plan-staff-' + key).value) || p.staffLimit;
  _saveConfigToStorage();
  showToast(`✅ ${PLAN_NAME[key]} planı güncellendi`);
  renderPlanPricesTable();
}

function _saveConfigToStorage() {
  localStorage.setItem('rd_plan_config', JSON.stringify(PLAN_CONFIG));
  localStorage.setItem('rd_wa_addons',   JSON.stringify(WA_ADDONS));
}

function _planColor(key) {
  return { free:'#5A7A8A', std:'#00C8FF', pro:'#FFB830', lux:'#8B5CF6' }[key] || '#fff';
}

// ══════════════════════════════════════════════
//  VIEW: WHATSAPP
// ══════════════════════════════════════════════

function renderWhatsapp() {
  const dangerEl = document.getElementById('wa-danger-list');
  const limitEl  = document.getElementById('wa-limit-grid');

  if (dangerEl) {
    const danger = SALONS.filter(s => s.waLimit && s.waUsed / s.waLimit >= 0.8);
    dangerEl.innerHTML = danger.length
      ? `<table class="tbl">
           <thead><tr><th>Salon</th><th>Kullanım</th><th>%</th><th>Plan</th><th></th></tr></thead>
           <tbody>${danger.map(s => {
             const pct = Math.min(Math.round((s.waUsed / s.waLimit) * 100), 100);
             const cls = pct >= 90 ? 'fill-danger' : 'fill-warn';
             return `<tr>
               <td style="font-weight:600">${s.name}</td>
               <td>${s.waUsed} / ${s.waLimit}</td>
               <td>
                 <div style="display:flex;align-items:center;gap:6px">
                   <div class="progress-track" style="width:70px"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
                   <span style="font-size:.74rem">%${pct}</span>
                 </div>
               </td>
               <td><span class="chip ${CHIP_MAP[s.plan]}">${PLAN_NAME[s.plan]}</span></td>
               <td><button class="btn btn-accent btn-sm" onclick="openSalonModal(${s.id})">Görüntüle</button></td>
             </tr>`;
           }).join('')}</tbody>
         </table>`
      : '<div style="text-align:center;padding:24px;color:var(--green)">✅ Limitine yakın salon yok</div>';
  }

  if (limitEl) {
    limitEl.innerHTML = `
      <table class="tbl">
        <thead><tr><th>Plan</th><th>WA Limiti</th><th>Açıklama</th></tr></thead>
        <tbody>
          ${PLAN_CONFIG.map(p => `
            <tr>
              <td><span class="chip ${CHIP_MAP[p.key]}">${p.icon} ${p.name}</span></td>
              <td style="font-weight:700">${p.waLimit === null ? '∞ Sınırsız' : p.waLimit === 0 ? 'Yok' : p.waLimit + ' mesaj/ay'}</td>
              <td style="color:var(--tx2);font-size:.78rem">${p.key === 'free' ? 'Manuel wa.me linki kullanır' : p.key === 'lux' ? 'Sınırsız otomatik gönderim' : 'Aylık limit, aşılırsa upgrade teklifi'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }
}

// ══════════════════════════════════════════════
//  VIEW: RAPORLAR
// ══════════════════════════════════════════════

function renderRaporlar() {
  _renderRevChart('rapor-chart');

  const cityTbody = document.getElementById('city-tbody');
  if (cityTbody) {
    cityTbody.innerHTML = CITY_DATA.map(c => `
      <tr>
        <td style="font-weight:600">${c.city}</td>
        <td>${c.total}</td>
        <td>${c.paid} <span style="font-size:.72rem;color:var(--tx3)">(${Math.round(c.paid/c.total*100)}%)</span></td>
        <td style="color:var(--gold);font-weight:700">${c.mrrShare}</td>
      </tr>`).join('');
  }
}

function exportAdminCSV() {
  const rows = [
    ['Şehir', 'Toplam Salon', 'Ücretli', 'MRR Payı'],
    ...CITY_DATA.map(c => [c.city, c.total, c.paid, c.mrrShare]),
  ];
  const bom = '\uFEFF';
  const csv = bom + rows.map(r => r.join(';')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'admin-rapor-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showToast('📥 CSV indirildi');
}

// ══════════════════════════════════════════════
//  VIEW: DESTEK
// ══════════════════════════════════════════════

function renderDestek() {
  const listEl = document.getElementById('ticket-list');
  if (!listEl) return;

  const statusMap = {
    open:     { label:'Açık',     cls:'chip-open',     icon:'🔴' },
    waiting:  { label:'Bekliyor', cls:'chip-waiting',  icon:'🟡' },
    resolved: { label:'Çözüldü', cls:'chip-resolved', icon:'🟢' },
  };

  // Update KPI elements if they exist
  const tkOpen = document.getElementById('tk-open');
  const tkWait = document.getElementById('tk-wait');
  if (tkOpen) tkOpen.textContent = SUPPORT_TICKETS.filter(t => t.status === 'open').length;
  if (tkWait) tkWait.textContent = SUPPORT_TICKETS.filter(t => t.status === 'waiting').length;

  listEl.innerHTML = SUPPORT_TICKETS.map(t => {
    const st = statusMap[t.status] || statusMap.open;
    return `
      <div class="ticket-row">
        <div class="ticket-hdr">
          <span>${st.icon}</span>
          <div class="ticket-subject">${t.subject}</div>
          <span class="chip ${st.cls}">${st.label}</span>
        </div>
        <div class="ticket-meta">${t.salon} · ${t.date}</div>
        ${t.msg ? `<div style="font-size:.78rem;color:var(--tx3);margin-top:4px">${t.msg}</div>` : ''}
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  VIEW: SİSTEM AYARLARI
// ══════════════════════════════════════════════

function renderPlanPricesTable() {
  const tbody = document.getElementById('plan-prices-body');
  if (!tbody) return;

  tbody.innerHTML = PLAN_CONFIG.map(p => `
    <tr>
      <td><span class="chip ${CHIP_MAP[p.key]}">${p.icon} ${p.name}</span></td>
      <td>
        <input class="inp" type="number" id="pp-price-${p.key}" value="${p.yearlyPrice}" style="padding:5px 8px;font-size:.8rem" ${p.key === 'free' ? 'disabled' : ''}>
        ${p.key !== 'free' ? `<div style="font-size:.66rem;color:var(--tx3);margin-top:2px">≈ ₺${p.monthlyEquiv}/ay</div>` : ''}
      </td>
      <td><input class="inp" type="number" id="pp-staff-${p.key}" value="${p.staffLimit}" style="padding:5px 8px;font-size:.8rem"></td>
      <td><input class="inp" type="number" id="pp-apt-${p.key}"   value="${p.aptLimit || ''}" placeholder="${p.aptLimit === null ? '∞' : '0'}" style="padding:5px 8px;font-size:.8rem" ${p.key === 'lux' ? 'disabled' : ''}></td>
      <td style="font-size:.75rem;color:var(--tx3)">
        ${p.hasKasa?'<span style="color:var(--green)">✓ Kasa</span>':'-'}
        ${p.hasStok?'<span style="color:var(--green)">✓ Stok</span>':''}
        ${p.hasKampanya?'<span style="color:var(--green)">✓ Kampanya</span>':''}
      </td>
    </tr>`).join('');
}

function savePlanPrices() {
  PLAN_CONFIG.forEach(p => {
    const priceEl = document.getElementById('pp-price-' + p.key);
    const staffEl = document.getElementById('pp-staff-' + p.key);
    const aptEl   = document.getElementById('pp-apt-'   + p.key);
    if (priceEl && p.key !== 'free') { p.yearlyPrice = parseInt(priceEl.value) || p.yearlyPrice; p.monthlyEquiv = Math.round(p.yearlyPrice/12); }
    if (staffEl)                       p.staffLimit = parseInt(staffEl.value) || p.staffLimit;
    if (aptEl   && p.key !== 'lux')    p.aptLimit   = parseInt(aptEl.value)   || p.aptLimit;
  });
  _saveConfigToStorage();
  showToast('✅ Plan fiyatları kaydedildi & landing page güncellendi');
  renderAbonelikler();
}

function saveSystemSettings() {
  const fields = ['cfg-platform-name','cfg-domain','cfg-support-email','cfg-support-phone',
                  'cfg-welcome-msg','cfg-smtp-host','cfg-smtp-port','cfg-smtp-name','cfg-smtp-from'];
  const data = {};
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });

  // Feature flags
  const flags = ['ff-booking','ff-wa','ff-kampanya','ff-stok','ff-maintenance','ff-signup'];
  flags.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.checked;
  });

  // Persist to localStorage (demo)
  try { localStorage.setItem('rd_admin_config', JSON.stringify(data)); } catch(e) {}
  showToast('✅ Sistem ayarları kaydedildi');
}

function testEmail() {
  const host = (document.getElementById('cfg-smtp-host') || {}).value || '';
  const from = (document.getElementById('cfg-smtp-from') || {}).value || '';
  if (!host || !from) { showToast('⚠️ SMTP bilgilerini doldurun', 'warn'); return; }
  showToast(`📨 Test e-postası gönderiliyor → ${from}`, 'blue');
  setTimeout(() => showToast('✅ Test e-postası başarıyla gönderildi'), 1500);
}

function confirmDangerAction(type) {
  const labels = { cache:'Cache temizlensin mi?', logs:'Tüm loglar silinsin mi?', db:'DB backup alınsın mı?' };
  const label  = labels[type] || 'Bu işlemi onaylıyor musunuz?';
  if (!confirm(label)) return;
  showToast(`⚙️ ${labels[type] ? labels[type].replace('?','') : type} işlemi başlatıldı`);
}

// ══════════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════════

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}

function handleModalClick(event, id) {
  if (event.target === document.getElementById(id)) closeModal(id);
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════

let _toastTimer = null;

function showToast(msg, type) {
  const el = document.getElementById('toast');
  if (!el) return;

  // Color variants
  const colorMap = {
    green:  'border-color:rgba(34,197,94,.4);color:var(--green)',
    danger: 'border-color:rgba(239,68,68,.4);color:var(--danger)',
    warn:   'border-color:rgba(245,158,11,.4);color:var(--orange)',
    blue:   'border-color:rgba(0,200,255,.4);color:var(--accent)',
    info:   'border-color:rgba(0,200,255,.4);color:var(--accent)',
  };
  el.setAttribute('style', colorMap[type] || '');
  el.textContent = msg;
  el.classList.add('show');

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ══════════════════════════════════════════════
//  MESSAGING SYSTEM
// ══════════════════════════════════════════════

let ADMIN_MESSAGES = {
  inbox: [
    { id:1, from:"Bella Beauty",    salonId:2, subject:'WhatsApp mesajları gitmiyor',       body:'Merhaba,\n\nBugünden beri WA mesajları müşterilere ulaşmıyor. Randevular kaçırılıyor. Acil yardım lazım.',                     date:'21 Nis, 11:42', read:false, color:'#00C8FF' },
    { id:2, from:"Ahmet's Barber",  salonId:1, subject:'Fatura indirme sorunu',             body:'Merhaba Admin,\n\nPDF faturayı indirmeye çalışıyorum ama sayfa hata veriyor. Tarayıcıda konsol hatası var.',                    date:'20 Nis, 09:15', read:true,  color:'#C9A84C' },
    { id:3, from:"Royal Coiffure",  salonId:6, subject:'Pro pakete geçmek istiyoruz',       body:'İyi günler,\n\nPro pakete geçmek istiyoruz. Fatura nasıl kesiliyor, hangi belgeleri göndermemiz gerekiyor?',                   date:'19 Nis, 16:30', read:true,  color:'#C9A84C' },
    { id:4, from:"Moda Saç Tasarım",salonId:5, subject:'Takvim senkronizasyon sorunu',      body:'Dashboard takviminde randevular bazen görünmüyor. Yenileyince geliyor ama müşterilerimiz bize şikayet ediyor.',                date:'18 Nis, 14:55', read:true,  color:'#00C8FF' },
  ],
  sent: [
    { id:101, to:'Tüm Salon Sahipleri', subject:'🔧 Sistem Güncellemesi — v2.1',           body:'Sayın salon sahiplerimiz,\n\nBu gece 02:00–04:00 arası sistem bakımı yapılacaktır. Bu sürede panele erişim geçici olarak kesintiye uğrayabilir.\n\nAnlayışınız için teşekkürler.',   date:'18 Nis, 10:00', type:'broadcast', priority:'high',   category:'maintenance', recipients:247 },
    { id:102, to:'Bella Beauty',         subject:'⚠️ WA Krediniz Tükeniyor',               body:'Sayın Bella Beauty,\n\nAylık WhatsApp kredinizin %87\'sini kullandınız (87/100 mesaj). Limitiniz dolmadan yeni kredi paketi satın almanızı tavsiye ederiz.',                         date:'17 Nis, 09:00', type:'direct',    priority:'high',   category:'billing',     recipients:1  },
    { id:103, to:'Tüm Salon Sahipleri', subject:'💡 Yeni Özellik: Kampanya Modülü',        body:'Merhaba,\n\nPro ve Lüks paket kullanıcıları için yeni kampanya & indirim kodu modülü yayına girdi. Dashboard\'unuzdan "Kampanya" sekmesini ziyaret edin.',                         date:'10 Nis, 11:00', type:'broadcast', priority:'normal', category:'update',      recipients:247 },
    { id:104, to:'Hair Studio 34',       subject:'📋 Hesabınız Hakkında Bilgi',            body:'Sayın Hair Studio 34,\n\nHesabınız şu an Ücretsiz planda. Pro pakete geçerek kasa, gelir raporları ve WA hatırlatmaları gibi özelliklere erişebilirsiniz.',                         date:'8 Nis,  14:30', type:'direct',    priority:'normal', category:'info',        recipients:1  },
  ],
};

let _activeMsgTab = 'inbox';
let _activeMsgId  = null;

const MSG_CAT_LABELS = {
  info:'💡 Bilgilendirme', update:'🔧 Güncelleme', billing:'💳 Faturalama',
  maintenance:'🛠️ Bakım', alert:'⚠️ Uyarı'
};
const MSG_CAT_COLORS = {
  info:'rgba(0,200,255,.1)', update:'rgba(139,92,246,.1)',
  billing:'rgba(201,168,76,.1)', maintenance:'rgba(245,158,11,.1)', alert:'rgba(239,68,68,.1)'
};
const MSG_CAT_TEXT = {
  info:'var(--accent)', update:'var(--purple)',
  billing:'var(--gold)', maintenance:'var(--orange)', alert:'var(--danger)'
};

function renderMesajlar() {
  _updateMsgBadge();
  renderMsgList();
}

function _updateMsgBadge() {
  const unread = ADMIN_MESSAGES.inbox.filter(m => !m.read).length;
  const badge  = document.getElementById('sb-msg-count');
  const inboxCount = document.getElementById('msg-inbox-count');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? '' : 'none'; }
  if (inboxCount) { inboxCount.textContent = unread; inboxCount.style.display = unread > 0 ? '' : 'none'; }
}

function switchMsgTab(tab) {
  _activeMsgTab = tab;
  _activeMsgId  = null;
  document.getElementById('msg-tab-inbox').classList.toggle('active', tab === 'inbox');
  document.getElementById('msg-tab-sent').classList.toggle('active', tab === 'sent');
  renderMsgList();
  showMsgEmpty();
}

function renderMsgList() {
  const list = document.getElementById('msg-list');
  if (!list) return;
  const messages = _activeMsgTab === 'inbox' ? ADMIN_MESSAGES.inbox : ADMIN_MESSAGES.sent;

  if (!messages.length) {
    list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--tx3);font-size:.82rem">Mesaj yok</div>';
    return;
  }

  list.innerHTML = messages.map(m => {
    const isUnread = _activeMsgTab === 'inbox' && !m.read;
    const initials = (m.from || m.to || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const color = m.color || (m.type === 'broadcast' ? '#8B5CF6' : '#00C8FF');
    return `
      <div class="msg-row${isUnread ? ' unread' : ''}${_activeMsgId === m.id ? ' active' : ''}" onclick="openMessage(${m.id}, '${_activeMsgTab}')">
        ${isUnread ? '<div class="msg-unread-dot"></div>' : '<div style="width:7px"></div>'}
        <div class="msg-av" style="background:${color}">${initials}</div>
        <div class="msg-row-info">
          <div class="msg-row-from">${_activeMsgTab === 'inbox' ? m.from : m.to}</div>
          <div class="msg-row-subject">${m.subject}</div>
        </div>
        <div class="msg-row-date">${m.date}</div>
      </div>`;
  }).join('');
}

function openMessage(id, tab) {
  _activeMsgId = id;
  const messages = tab === 'inbox' ? ADMIN_MESSAGES.inbox : ADMIN_MESSAGES.sent;
  const m = messages.find(x => x.id === id);
  if (!m) return;

  // Mark as read
  if (tab === 'inbox' && !m.read) {
    m.read = true;
    _updateMsgBadge();
  }

  renderMsgList(); // refresh to update active state

  const detail = document.getElementById('msg-detail');
  if (!detail) return;

  const priorityHtml = m.priority ? `<span class="msg-priority ${m.priority}">${m.priority === 'urgent' ? '🔴 Acil' : m.priority === 'high' ? '🟠 Yüksek' : '⚪ Normal'}</span>` : '';
  const catHtml = m.category ? `<span class="msg-cat" style="background:${MSG_CAT_COLORS[m.category]};color:${MSG_CAT_TEXT[m.category]}">${MSG_CAT_LABELS[m.category]}</span>` : '';

  const replyBtn = tab === 'inbox'
    ? `<button class="btn btn-accent btn-sm" onclick="replyToMessage(${m.id})">↩️ Yanıtla</button>`
    : '';

  const recipientsHtml = m.recipients
    ? `<div class="msg-recipients">📬 ${m.type === 'broadcast' ? `${m.recipients} salona gönderildi` : `${m.to} adresine gönderildi`}</div>`
    : '';

  detail.innerHTML = `
    <div class="msg-detail-hdr">
      <div class="msg-detail-subject">${m.subject}</div>
      <div class="msg-detail-meta">
        <span class="msg-detail-from">${tab === 'inbox' ? '📨 ' + m.from : '📤 ' + (m.to || 'Tüm Salonlar')} · ${m.date}</span>
        ${priorityHtml}${catHtml}
      </div>
      ${recipientsHtml}
    </div>
    <div class="msg-detail-body">${m.body}</div>
    <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">
      ${replyBtn}
      ${tab === 'inbox' ? `<button class="btn btn-ghost btn-sm" onclick="deleteMessage(${m.id},'inbox')">🗑 Sil</button>` : `<button class="btn btn-ghost btn-sm" onclick="deleteMessage(${m.id},'sent')">🗑 Sil</button>`}
    </div>`;
}

function showMsgEmpty() {
  const detail = document.getElementById('msg-detail');
  if (!detail) return;
  detail.innerHTML = `
    <div class="msg-empty">
      <div class="msg-empty-icon">📨</div>
      <div style="font-size:.88rem;font-weight:600">Bir mesaj seçin</div>
      <div style="font-size:.76rem">veya yeni mesaj gönderin</div>
    </div>`;
}

function replyToMessage(id) {
  const m = ADMIN_MESSAGES.inbox.find(x => x.id === id);
  if (!m) return;
  openComposeModal(m.salonId, 'Re: ' + m.subject);
}

function deleteMessage(id, tab) {
  if (!confirm('Bu mesaj silinsin mi?')) return;
  if (tab === 'inbox') ADMIN_MESSAGES.inbox = ADMIN_MESSAGES.inbox.filter(x => x.id !== id);
  else ADMIN_MESSAGES.sent = ADMIN_MESSAGES.sent.filter(x => x.id !== id);
  _activeMsgId = null;
  renderMsgList();
  showMsgEmpty();
  showToast('🗑 Mesaj silindi');
}

function openComposeModal(salonId, prefillSubject) {
  // Populate salon options
  const optGroup = document.getElementById('compose-salon-options');
  if (optGroup) {
    optGroup.innerHTML = SALONS.map(s =>
      `<option value="${s.id}">${s.name} — ${s.city}</option>`
    ).join('');
  }
  const sel = document.getElementById('compose-to');
  if (sel && salonId) sel.value = String(salonId);
  else if (sel) sel.value = 'all';

  const subjEl = document.getElementById('compose-subject');
  if (subjEl) subjEl.value = prefillSubject || '';
  const bodyEl = document.getElementById('compose-body');
  if (bodyEl) bodyEl.value = '';

  const cnt = document.getElementById('compose-recipient-count');
  if (cnt) cnt.textContent = SALONS.filter(s => s.active).length;

  openModal('compose-modal');
}

function sendAdminMessage() {
  const toVal    = document.getElementById('compose-to').value;
  const subject  = document.getElementById('compose-subject').value.trim();
  const body     = document.getElementById('compose-body').value.trim();
  const priority = document.getElementById('compose-priority').value;
  const category = document.getElementById('compose-category').value;

  if (!subject) { showToast('⚠️ Konu boş bırakılamaz', 'warn'); return; }
  if (!body)    { showToast('⚠️ Mesaj içeriği boş bırakılamaz', 'warn'); return; }

  const isBroadcast = toVal === 'all';
  const salon = !isBroadcast ? SALONS.find(s => s.id === +toVal) : null;
  const toLabel = isBroadcast ? 'Tüm Salon Sahipleri' : (salon ? salon.name : 'Seçilen Salon');

  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { day:'numeric', month:'kısa', hour:'2-digit', minute:'2-digit' })
    .replace(',', '');

  const newMsg = {
    id: Date.now(),
    to: toLabel,
    subject, body, priority, category,
    date: now.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }) + ', ' +
          now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
    type: isBroadcast ? 'broadcast' : 'direct',
    recipients: isBroadcast ? SALONS.filter(s => s.active).length : 1,
  };

  ADMIN_MESSAGES.sent.unshift(newMsg);
  closeModal('compose-modal');
  showView('mesajlar');
  switchMsgTab('sent');
  showToast(`✅ Mesaj gönderildi → ${toLabel}`, 'green');
}
