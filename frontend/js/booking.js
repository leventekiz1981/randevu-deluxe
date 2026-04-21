/* =============================================
   RANDEVU-DELUXE — Buchungsseite Logik
   booking.js
   ============================================= */

// ── SALON KONFIGURATION ──────────────────────
// Diese Werte kommen später aus der Datenbank.
// Jetzt sind sie fest eingetragen zum Testen.

const SALON_PHONE = '905551234567'; // WhatsApp Nummer (mit Ländercode, ohne + und Leerzeichen)

const SERVICES = [
  { id: 1, name: '✂️ Saç Kesimi',   price: 150, duration: 30 },
  { id: 2, name: '🪒 Sakal Tıraşı', price: 100, duration: 20 },
  { id: 3, name: '💈 Saç + Sakal',  price: 220, duration: 50 },
  { id: 4, name: '👦 Çocuk Kesimi', price: 100, duration: 20 },
];

// Türkische Monatsnamen
const MONTHS_TR = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'
];

// Türkische Tageskürzel (Montag zuerst)
const DAYS_TR = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

// Belegte Zeiten (später aus der Datenbank)
const TAKEN_TIMES = ['10:00', '11:30', '14:00'];

// ── ZUSTAND (aktuell ausgewählte Werte) ─────
let state = {
  service:   SERVICES[0],
  date:      null,
  time:      null,
  waEnabled: true,
  curMonth:  new Date().getMonth(),
  curYear:   new Date().getFullYear()
};

// ── START ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
});

// ── HIZMET (Dienstleistungen) ────────────────
function renderServices() {
  const grid = document.getElementById('service-grid');
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-item ${s.id === state.service.id ? 'selected' : ''}"
         onclick="selectService(${s.id})">
      <div>
        <div class="service-name">${s.name}</div>
        <div class="service-detail">${s.duration} dk</div>
      </div>
      <div class="service-price">₺${s.price}</div>
    </div>
  `).join('');
}

function selectService(id) {
  state.service = SERVICES.find(s => s.id === id);
  renderServices();
}

// ── ADIMLAR (Schritte) ───────────────────────
function goStep(n) {
  // Alle Panels ausblenden, nur das aktive zeigen
  ['panel-service', 'panel-calendar', 'panel-time', 'panel-info'].forEach((id, i) => {
    document.getElementById(id).style.display = (i + 1 === n) ? '' : 'none';
  });

  // Step-Circles aktualisieren
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('step' + i);
    s.className = 'step' + (i < n ? ' done' : i === n ? ' active' : '');
    s.querySelector('.step-circle').textContent = i < n ? '✓' : i;
  }

  // Inhalte laden
  if (n === 2) renderCalendar();
  if (n === 3) renderSlots();
  if (n === 4) updateSummary();

  // Nach oben scrollen
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── KALENDER ─────────────────────────────────
function renderCalendar() {
  const { curMonth, curYear } = state;

  document.getElementById('cal-month-label').textContent =
    `${MONTHS_TR[curMonth]} ${curYear}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  // Tageskürzel-Zeile
  DAYS_TR.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-label';
    el.textContent = d;
    grid.appendChild(el);
  });

  // Erster Tag des Monats → Offset berechnen (Woche startet Montag)
  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Leere Zellen vor dem 1.
  for (let i = 0; i < offset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  // Tage des Monats
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(curYear, curMonth, d);
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;

    if (date < today) {
      el.classList.add('past');
    } else {
      if (date.toDateString() === today.toDateString()) el.classList.add('today');
      if (state.date && date.toDateString() === state.date.toDateString()) el.classList.add('selected');
      el.onclick = () => selectDate(date);
    }

    grid.appendChild(el);
  }
}

function selectDate(date) {
  state.date = date;
  state.time = null; // Uhrzeit zurücksetzen bei neuem Datum
  renderCalendar();
}

function changeMonth(dir) {
  state.curMonth += dir;
  if (state.curMonth > 11) { state.curMonth = 0; state.curYear++; }
  if (state.curMonth < 0)  { state.curMonth = 11; state.curYear--; }
  renderCalendar();
}

// ── SAAT (Uhrzeiten) ─────────────────────────
function renderSlots() {
  const times = [];
  for (let h = 9; h <= 18; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 18) times.push(`${String(h).padStart(2, '0')}:30`);
  }

  const grid = document.getElementById('slot-grid');
  grid.innerHTML = times.map(t => {
    const isTaken    = TAKEN_TIMES.includes(t);
    const isSelected = state.time === t;
    return `
      <div class="slot ${isTaken ? 'taken' : ''} ${isSelected ? 'selected' : ''}"
           ${isTaken ? '' : `onclick="selectTime('${t}')"`}>
        ${t}
      </div>`;
  }).join('');
}

function selectTime(t) {
  state.time = t;
  renderSlots();
}

// ── ÖZET (Zusammenfassung) ───────────────────
function updateSummary() {
  const dateStr = state.date
    ? state.date.toLocaleDateString('tr-TR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : '—';

  document.getElementById('sum-service').textContent = state.service.name;
  document.getElementById('sum-date').textContent    = dateStr;
  document.getElementById('sum-time').textContent    = state.time || '—';
  document.getElementById('sum-price').textContent   = `₺${state.service.price}`;
}

// ── WHATSAPP HATIRLATMA (Toggle) ─────────────
function toggleWA() {
  state.waEnabled = !state.waEnabled;
  document.getElementById('wa-reminder').classList.toggle('active', state.waEnabled);
  document.getElementById('wa-check').style.opacity = state.waEnabled ? '1' : '0.3';
}

// ── RANDEVU ONAYLA ───────────────────────────
function confirmBooking() {
  const name    = document.getElementById('inp-name').value.trim();
  const surname = document.getElementById('inp-surname').value.trim();
  const phone   = document.getElementById('inp-phone').value.trim();

  // Pflichtfelder prüfen
  if (!name || !surname) {
    showError('Lütfen adınızı ve soyadınızı girin.');
    return;
  }
  if (!phone) {
    showError('Lütfen telefon numaranızı girin.');
    return;
  }
  if (!state.date) {
    showError('Lütfen bir tarih seçin.');
    return;
  }
  if (!state.time) {
    showError('Lütfen bir saat seçin.');
    return;
  }

  const fullName = `${name} ${surname}`;
  const dateStr  = state.date.toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Erfolgseite befüllen
  document.getElementById('conf-name').textContent     = fullName;
  document.getElementById('conf-service').textContent  = state.service.name;
  document.getElementById('conf-datetime').textContent = `${dateStr}, ${state.time}`;
  document.getElementById('conf-price').textContent    = `₺${state.service.price}`;

  // WhatsApp Link aufbauen
  const waMsg = `Merhaba! 🌟\n\nRandevu talebim:\n👤 ${fullName}\n✂️ ${state.service.name}\n📅 ${dateStr}\n🕐 ${state.time}\n💰 ₺${state.service.price}\n\nOnayınızı bekliyorum, teşekkürler!`;
  document.getElementById('wa-link').href =
    `https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(waMsg)}`;

  // Erfolgseite anzeigen
  document.getElementById('view-booking').style.display = 'none';
  document.getElementById('view-success').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── HATA (Fehlermeldung) ─────────────────────
function showError(msg) {
  // Bestehende Fehlermeldung entfernen
  const old = document.getElementById('booking-error');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id = 'booking-error';
  el.style.cssText = `
    background: rgba(231,76,60,0.12);
    border: 1px solid rgba(231,76,60,0.3);
    border-radius: 10px;
    padding: 12px 16px;
    color: #e74c3c;
    font-size: 0.88rem;
    margin-bottom: 12px;
  `;
  el.textContent = msg;

  // Vor dem aktiven Panel einfügen
  const activePanel = document.querySelector('.card:not([style*="display:none"])');
  if (activePanel) activePanel.prepend(el);

  setTimeout(() => el.remove(), 4000);
}

// ── SIFIRLA (Reset) ──────────────────────────
function resetBooking() {
  state = {
    service:   SERVICES[0],
    date:      null,
    time:      null,
    waEnabled: true,
    curMonth:  new Date().getMonth(),
    curYear:   new Date().getFullYear()
  };

  // Formular leeren
  ['inp-name','inp-surname','inp-phone','inp-email'].forEach(id => {
    document.getElementById(id).value = '';
  });

  document.getElementById('view-success').style.display = 'none';
  document.getElementById('view-booking').style.display = '';
  goStep(1);
  renderServices();
}
