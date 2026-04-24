/* ============================================================
   DATA
============================================================ */
const SERVICES = [
  { id: 1, name: 'Saç Kesimi',        cat: 'Saç',   duration: 30, price: 150,  icon: '✂️',  color: '#C9A84C' },
  { id: 2, name: 'Saç + Sakal',       cat: 'Saç',   duration: 50, price: 220,  icon: '💈',  color: '#00C8FF' },
  { id: 3, name: 'Sakal Tıraşı',      cat: 'Saç',   duration: 20, price: 100,  icon: '🪒',  color: '#8B5CF6' },
  { id: 4, name: 'Çocuk Kesimi',      cat: 'Saç',   duration: 20, price: 100,  icon: '👦',  color: '#52C27A' },
  { id: 5, name: 'Saç Boyama',        cat: 'Renk',  duration: null,price: null, icon: '🎨',  color: '#E879A3' },
  { id: 6, name: 'Keratin Bakımı',    cat: 'Bakım', duration: 90, price: 480,  icon: '✨',  color: '#F59E0B' },
  { id: 7, name: 'Manikür & Pedikür', cat: 'Tırnak',duration: 60, price: 280,  icon: '💅',  color: '#E879A3' },
  { id: 8, name: 'Cilt Bakımı',       cat: 'Cilt',  duration: 60, price: 300,  icon: '🌿',  color: '#52C27A' },
  { id: 9, name: 'Masaj',             cat: 'Masaj', duration: 60, price: 500,  icon: '💆',  color: '#8B5CF6' },
];

const STAFF = [
  { id: 0,  name: 'Fark Etmez',   title: 'İlk müsait personel', color: '#4A4A5A', initial: '?',  any: true },
  { id: 1,  name: 'Ahmet',        title: 'Berber & Stilist',     color: '#C9A84C', initial: 'A' },
  { id: 2,  name: 'Mehmet',       title: 'Saç Uzmanı',           color: '#00C8FF', initial: 'M' },
  { id: 3,  name: 'Fatma',        title: 'Güzellik Uzmanı',      color: '#E879A3', initial: 'F' },
];

const TR_DAYS   = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

/* ============================================================
   STATE
============================================================ */
/* ============================================================
   SALON KANAL AYARLARI
   Gerçek sistemde bu veriler API'dan gelir.
   Şimdilik localStorage'dan okuyoruz (dashboard ayarlarına bağlı).
============================================================ */
const SALON_CHANNELS = (function() {
  try {
    // Dashboard'da kaydedilen ayarları oku (gerçek sistemde API çağrısı olur)
    const raw = localStorage.getItem('rd_salon_notify_cfg');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // Varsayılan: sadece WhatsApp aktif
  return { wa: true, sms: false };
})();

const state = {
  currentStep:    1,
  selectedService: null,
  selectedStaff:   null,
  selectedDate:    null,   // Date object
  selectedTime:    null,   // "HH:MM"
  notifyChannel:   null,   // 'wa' | 'sms' | 'both' | 'none'
  // Eski uyumluluk
  get waReminder() { return this.notifyChannel === 'wa' || this.notifyChannel === 'both'; },
};

/* ============================================================
   RENDER: SERVICES
============================================================ */
function renderServices() {
  const grid = document.getElementById('service-grid');
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card" id="svc-${s.id}" onclick="selectService(${s.id})">
      <div class="service-icon-wrap" style="background:${s.color}22">
        <span>${s.icon}</span>
      </div>
      <div class="service-name">${s.name}</div>
      <div class="service-meta">
        ${s.duration ? `<span class="service-duration">⏱ ${s.duration}dk</span>` : ''}
      </div>
      <div class="service-price ${s.price ? '' : 'free'}">
        ${s.price ? `₺${s.price}` : 'Serbest Fiyat'}
      </div>
      <div class="service-check">✓</div>
    </div>
  `).join('');
}

function selectService(id) {
  state.selectedService = id;
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('svc-' + id).classList.add('selected');
  hideError('err-1');
}

/* ============================================================
   RENDER: STAFF
============================================================ */
function renderStaff() {
  const list = document.getElementById('staff-list');
  list.innerHTML = STAFF.map(p => `
    <div class="staff-card ${p.any ? 'staff-any' : ''}" id="stf-${p.id}" onclick="selectStaff(${p.id})">
      <div class="staff-avatar" style="background:${p.any ? 'var(--card-bg2)' : p.color + '30'}; color:${p.color}; border: 2px solid ${p.color}40">
        ${p.any ? '✦' : p.initial}
      </div>
      <div class="staff-info">
        <div class="staff-name">${p.name}</div>
        <div class="staff-title">${p.title}</div>
      </div>
      <div class="staff-card-radio"></div>
    </div>
  `).join('');
}

function selectStaff(id) {
  state.selectedStaff = id;
  document.querySelectorAll('.staff-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('stf-' + id).classList.add('selected');
  hideError('err-2');
}

/* ============================================================
   RENDER: DATE PILLS
============================================================ */
function renderDates() {
  const scroll = document.getElementById('date-scroll');
  const today  = new Date();
  today.setHours(0,0,0,0);
  scroll.innerHTML = '';

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const isSunday = d.getDay() === 0;
    const isToday  = i === 0;

    const pill = document.createElement('div');
    pill.className = 'date-pill' + (isToday ? ' today' : '') + (isSunday ? ' closed' : '');
    pill.dataset.date = d.toISOString();
    pill.innerHTML = `
      <div class="date-day-name">${isToday ? 'Bugün' : TR_DAYS[d.getDay()]}</div>
      <div class="date-day-num">${d.getDate()}</div>
      ${isSunday ? '<div class="date-closed-badge">Kapalı</div>' : ''}
    `;
    if (!isSunday) {
      pill.addEventListener('click', () => selectDate(d, pill));
    }
    scroll.appendChild(pill);
  }
}

function selectDate(date, pillEl) {
  state.selectedDate = date;
  state.selectedTime = null;

  document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('selected'));
  pillEl.classList.add('selected');

  renderTimeSlots(date);
  hideError('err-3');
}

/* ============================================================
   RENDER: TIME SLOTS
============================================================ */
function getUnavailable(dateStr) {
  // Deterministically generate 4 unavailable slots per day based on date
  const seed = dateStr.split('-').reduce((a, b) => a + Number(b), 0);
  const all  = [];
  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      all.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  const unavail = new Set();
  let s = seed;
  while (unavail.size < 4) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    unavail.add(all[s % all.length]);
  }
  return unavail;
}

function renderTimeSlots(date) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const unavail = getUnavailable(dateStr);
  const now     = new Date();
  const isToday = date.toDateString() === now.toDateString();

  document.getElementById('time-placeholder').style.display = 'none';
  document.getElementById('time-grid-wrap').style.display = 'block';

  const gridMorning   = document.getElementById('grid-morning');
  const gridAfternoon = document.getElementById('grid-afternoon');
  gridMorning.innerHTML   = '';
  gridAfternoon.innerHTML = '';

  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      const label   = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const isPast  = isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
      const isUnavail = unavail.has(label) || isPast;

      const btn = document.createElement('button');
      btn.className = 'time-slot' + (isUnavail ? ' unavailable' : '');
      btn.textContent = label;
      btn.dataset.time = label;
      if (!isUnavail) {
        btn.addEventListener('click', () => selectTime(label, btn));
      }
      (h < 13 ? gridMorning : gridAfternoon).appendChild(btn);
    }
  }
}

function selectTime(time, btnEl) {
  state.selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
  hideError('err-3');
}

/* ============================================================
   STEP NAVIGATION
============================================================ */
const STEP_COUNT = 4;
const PROGRESS = [12.5, 37.5, 62.5, 87.5];

function updateProgress(step) {
  document.getElementById('progress-fill').style.width = PROGRESS[step-1] + '%';
  for (let i = 1; i <= STEP_COUNT; i++) {
    const el = document.getElementById('ps-' + i);
    el.classList.toggle('active', i === step);
    el.classList.toggle('done',   i < step);
  }
}

function showPanel(step, direction) {
  const panels = document.querySelectorAll('.step-panel');
  panels.forEach(p => {
    p.classList.remove('active', 'slide-in-right', 'slide-in-left');
  });
  const panel = document.getElementById('panel-' + step);
  panel.classList.add('active');
  panel.classList.add(direction === 'forward' ? 'slide-in-right' : 'slide-in-left');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function validateStep(step) {
  if (step === 1) {
    if (!state.selectedService) { showError('err-1'); return false; }
  }
  if (step === 2) {
    if (state.selectedStaff === null) { showError('err-2'); return false; }
  }
  if (step === 3) {
    if (!state.selectedDate || !state.selectedTime) { showError('err-3'); return false; }
  }
  return true;
}

function nextStep(from) {
  if (!validateStep(from)) return;
  const to = from + 1;
  if (to === 4) { populateSummary(); renderNotifyPref(); }
  state.currentStep = to;
  updateProgress(to);
  showPanel(to, 'forward');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(from) {
  const to = from - 1;
  state.currentStep = to;
  updateProgress(to);
  showPanel(to, 'back');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(id) {
  document.getElementById(id).classList.add('visible');
}
function hideError(id) {
  document.getElementById(id).classList.remove('visible');
}

/* ============================================================
   SUMMARY POPULATION
============================================================ */
function formatDate(d) {
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()} ${TR_DAYS[d.getDay()]}`;
}

function populateSummary() {
  const svc   = SERVICES.find(s => s.id === state.selectedService);
  const staff = STAFF.find(s => s.id === state.selectedStaff);

  document.getElementById('sum-service').textContent = svc   ? svc.name   : '—';
  document.getElementById('sum-staff').textContent   = staff ? staff.name : '—';
  document.getElementById('sum-date').textContent    = state.selectedDate ? formatDate(state.selectedDate) : '—';
  document.getElementById('sum-time').textContent    = state.selectedTime || '—';
  document.getElementById('sum-price').textContent   = svc && svc.price ? `₺${svc.price}` : 'Serbest Fiyat';
}

/* ============================================================
   BİLDİRİM TERCİHİ — dinamik kanal seçimi
============================================================ */
function renderNotifyPref() {
  const wrap = document.getElementById('notify-pref-wrap');
  if (!wrap) return;

  const waOn  = SALON_CHANNELS.wa;
  const smsOn = SALON_CHANNELS.sms;

  // Hiçbir kanal yoksa kutuyu gizle
  if (!waOn && !smsOn) {
    wrap.innerHTML = '';
    state.notifyChannel = 'none';
    return;
  }

  // Başlangıç değeri
  if (!state.notifyChannel) {
    if (waOn && smsOn)  state.notifyChannel = 'wa';   // varsayılan: WA
    else if (waOn)      state.notifyChannel = 'wa';
    else                state.notifyChannel = 'sms';
  }

  const channels = [];
  if (waOn)  channels.push({ key:'wa',   icon:'💬', label:'WhatsApp',       sub:'Şüpheli mesaj değil · WhatsApp app gerekir',  color:'#25d366' });
  if (smsOn) channels.push({ key:'sms',  icon:'📱', label:'SMS',            sub:'Her telefona ulaşır · İnternet gerekmez',     color:'#4fa8ff' });
  if (waOn && smsOn)
             channels.push({ key:'both', icon:'💬📱',label:'Her İkisi de',  sub:'Hem WA hem SMS gönderilir · Ekstra kredi',   color:'#C9A84C' });
             channels.push({ key:'none', icon:'🚫', label:'Bildirim İstemiyorum', sub:'Hatırlatma almak istemiyorum',          color:'#6B7280' });

  wrap.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:.78rem;font-weight:700;color:var(--form-label,#888);margin-bottom:8px">
        📲 Bildirim Tercihi
      </div>
      <div style="display:flex;flex-direction:column;gap:8px" id="notify-channel-opts">
        ${channels.map(ch => `
          <div class="notify-ch-opt${state.notifyChannel === ch.key ? ' selected' : ''}"
               onclick="selectNotifyChannel('${ch.key}')"
               style="display:flex;align-items:center;gap:12px;padding:12px 14px;
                      border-radius:12px;cursor:pointer;transition:all .18s;
                      border:2px solid ${state.notifyChannel === ch.key ? ch.color : 'var(--border,#2a2a3a)'};
                      background:${state.notifyChannel === ch.key ? ch.color+'18' : 'var(--surface2,#16162a)'}">
            <div style="font-size:1.3rem;flex-shrink:0">${ch.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.85rem;font-weight:700;color:${state.notifyChannel === ch.key ? ch.color : 'var(--form-label,#ccc)'}">${ch.label}</div>
              <div style="font-size:.68rem;color:#888;margin-top:1px">${ch.sub}</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${state.notifyChannel === ch.key ? ch.color : '#444'};
                        background:${state.notifyChannel === ch.key ? ch.color : 'transparent'};
                        display:flex;align-items:center;justify-content:center;
                        font-size:.7rem;color:#080808;flex-shrink:0">
              ${state.notifyChannel === ch.key ? '✓' : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function selectNotifyChannel(key) {
  state.notifyChannel = key;
  renderNotifyPref();
}

/* ============================================================
   FORM VALIDATION & SUBMIT
============================================================ */
function submitBooking() {
  let ok = true;

  const name  = document.getElementById('inp-name').value.trim();
  const phone = document.getElementById('inp-phone').value.trim();

  if (!name) {
    document.getElementById('inp-name').classList.add('error');
    document.getElementById('err-name').classList.add('visible');
    ok = false;
  } else {
    document.getElementById('inp-name').classList.remove('error');
    document.getElementById('err-name').classList.remove('visible');
  }

  const phoneClean = phone.replace(/\s+/g, '');
  if (!phone || phoneClean.length < 10) {
    document.getElementById('inp-phone').classList.add('error');
    document.getElementById('err-phone').classList.add('visible');
    ok = false;
  } else {
    document.getElementById('inp-phone').classList.remove('error');
    document.getElementById('err-phone').classList.remove('visible');
  }

  if (!ok) return;

  showConfirmScreen(name, phone);
}

/* ============================================================
   CONFIRMATION SCREEN
============================================================ */
function showConfirmScreen(name, phone) {
  const svc   = SERVICES.find(s => s.id === state.selectedService);
  const staff = STAFF.find(s => s.id === state.selectedStaff);

  const dateStr = state.selectedDate ? formatDate(state.selectedDate) : '—';
  const priceStr = svc && svc.price ? `₺${svc.price}` : 'Serbest Fiyat';

  document.getElementById('conf-service').textContent  = svc   ? svc.name   : '—';
  document.getElementById('conf-staff').textContent    = staff ? staff.name : '—';
  document.getElementById('conf-datetime').textContent = `${dateStr} – ${state.selectedTime}`;
  document.getElementById('conf-customer').textContent = name;
  document.getElementById('conf-price').textContent    = priceStr;

  // Bildirim kanalına göre Bestätigungstext anpassen
  const ch = state.notifyChannel || 'none';
  const notifyMsgs = {
    wa:   'Onaylandıktan sonra <strong>WhatsApp</strong> ile bildirim alacaksınız.',
    sms:  'Onaylandıktan sonra <strong>SMS</strong> ile bildirim alacaksınız.',
    both: 'Onaylandıktan sonra <strong>WhatsApp ve SMS</strong> ile bildirim alacaksınız.',
    none: 'Bildirim almayı tercih etmediniz.',
  };
  const notifyNotes = {
    wa:   'Randevunuz onaylandıktan sonra WhatsApp ile hatırlatma gönderilecektir.',
    sms:  'Randevunuz onaylandıktan sonra SMS ile hatırlatma gönderilecektir.',
    both: 'Randevunuz için hem WhatsApp hem SMS hatırlatması gönderilecektir.',
    none: 'Bildirim seçilmedi — salon randevunuzu onaylayacaktır.',
  };
  const confirmNotifyEl = document.getElementById('confirm-notify-text');
  const confirmNoteEl   = document.getElementById('confirm-note-text');
  if (confirmNotifyEl) confirmNotifyEl.innerHTML = notifyMsgs[ch] || notifyMsgs.none;
  if (confirmNoteEl)   confirmNoteEl.textContent  = notifyNotes[ch] || notifyNotes.none;

  // WA Onay butonu: nur bei WA oder both anzeigen
  const waLinkEl = document.getElementById('wa-confirm-link');
  if (waLinkEl) {
    if (ch === 'wa' || ch === 'both') {
      // Build WhatsApp message
      const msg = [
        `Merhaba, randevu almak istiyorum.`,
        `Ad Soyad: ${name}`,
        `Hizmet: ${svc ? svc.name : '—'}`,
        `Personel: ${staff ? staff.name : '—'}`,
        `Tarih: ${dateStr}`,
        `Saat: ${state.selectedTime}`,
        `Telefon: ${phone}`,
        `Bildirim: WhatsApp`,
      ].join('\n');
      const waNumber = '902125550101'; // replace with real number
      waLinkEl.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      waLinkEl.style.display = '';
    } else {
      waLinkEl.style.display = 'none';
    }
  }

  // Save to localStorage for dashboard sync
  const bookingData = {
    id: Date.now(),
    name: name,
    phone: phone,
    service: svc ? svc.name : '—',
    price: svc ? (svc.price || 0) : 0,
    staffName: staff ? staff.name : '—',
    staffId: (state.selectedStaff === 0) ? null : (state.selectedStaff || null),
    date: state.selectedDate ? state.selectedDate.toISOString() : null,
    time: state.selectedTime,
    notifyChannel: state.notifyChannel || 'none',
    status: 'pending',
    source: 'online',
    createdAt: new Date().toISOString(),
  };
  const existing = JSON.parse(localStorage.getItem('rd_pending_bookings') || '[]');
  existing.push(bookingData);
  localStorage.setItem('rd_pending_bookings', JSON.stringify(existing));

  // Switch screens
  document.getElementById('screen-booking').style.display = 'none';
  document.getElementById('screen-confirm').style.display = 'block';
  document.getElementById('screen-confirm').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   RESET
============================================================ */
function resetBooking() {
  state.currentStep     = 1;
  state.selectedService = null;
  state.selectedStaff   = null;
  state.selectedDate    = null;
  state.selectedTime    = null;
  state.notifyChannel   = null;

  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.staff-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.date-pill').forEach(c => c.classList.remove('selected'));
  document.getElementById('time-placeholder').style.display = 'block';
  document.getElementById('time-grid-wrap').style.display = 'none';
  document.getElementById('inp-name').value  = '';
  document.getElementById('inp-phone').value = '';
  document.getElementById('inp-email').value = '';
  document.getElementById('inp-notes').value = '';
  const npw = document.getElementById('notify-pref-wrap');
  if (npw) npw.innerHTML = '';

  document.getElementById('screen-confirm').style.display = 'none';
  document.getElementById('screen-confirm').classList.remove('active');
  document.getElementById('screen-booking').style.display = 'block';

  updateProgress(1);
  showPanel(1, 'back');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderStaff();
  renderDates();

  // Live WA checkbox sync with phone input
  document.getElementById('inp-phone').addEventListener('input', function() {
    if (this.value.trim().length > 3 && !document.getElementById('wa-toggle').classList.contains('checked')) {
      state.waReminder = true;
      document.getElementById('wa-toggle').classList.add('checked');
    }
  });
});

(function(){
  var t=localStorage.getItem('rd-theme')||'dark';
  document.documentElement.setAttribute('data-theme',t);
  _setBookingThemeBtn(t);
})();
function toggleBookingTheme(){
  var c=document.documentElement.getAttribute('data-theme')||'dark';
  var n=c==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',n);
  localStorage.setItem('rd-theme',n);
  _setBookingThemeBtn(n);
}
function _setBookingThemeBtn(t){
  var b=document.getElementById('bk-theme-btn');
  if(b) b.textContent=t==='dark'?'☀️':'🌙';
}
