/* =============================================
   RANDEVU-DELUXE — Kassa Logik v2
   kasse.js — Multi-Person / Split Layout
   ============================================= */

// ── ZUSTAND ──────────────────────────────────
const kasseState = {
  persons: [
    { id: 1, name: 'Kişi 1', basket: [], paymentMethod: 'nakit' }
  ],
  activePersonId:  1,
  personCounter:   2,
  transactions:    [],
  txCounter:       1,
  nakit:           0,
  kart:            0,
  extrasTargetId:  null,
  extrasSelected:  [],
};

// ── Aktive Person ─────────────────────────────
function activePerson() {
  return kasseState.persons.find(p => p.id === kasseState.activePersonId);
}

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderKasseAppointments();
  updateKasseSummary();
  renderPersonTabs();
  renderBasket();
  updateCartBadge();

  const dateEl = document.getElementById('kasse-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  initMobileCartSwipe();
});

// ── Personen Tabs ─────────────────────────────
function renderPersonTabs() {
  const bar = document.getElementById('person-tabs-bar');
  if (!bar) return;

  bar.innerHTML = kasseState.persons.map(p => {
    const itemCount = p.basket.reduce((n, b) => n + 1 + (b.extras || []).length, 0);
    return `
    <button class="person-tab ${p.id === kasseState.activePersonId ? 'active' : ''}"
            onclick="switchPerson(${p.id})">
      ${p.name}
      <span style="background:rgba(0,0,0,.15);border-radius:10px;padding:1px 6px;font-size:.68rem;margin-left:2px">${itemCount}</span>
      ${kasseState.persons.length > 1
        ? `<button class="person-tab-remove" onclick="event.stopPropagation();removePerson(${p.id})">✕</button>`
        : ''}
    </button>`;
  }).join('') + `
    <button class="person-tab-add" onclick="addPerson()" title="Kişi Ekle">+</button>`;
}

function addPerson() {
  const id   = kasseState.personCounter++;
  const name = 'Kişi ' + id;
  kasseState.persons.push({ id, name, basket: [], paymentMethod: 'nakit' });
  kasseState.activePersonId = id;
  renderPersonTabs();
  renderBasket();
  renderKasseAppointments();
  syncPaymentButtons();
}

function switchPerson(id) {
  kasseState.activePersonId = id;
  renderPersonTabs();
  renderBasket();
  renderKasseAppointments();
  syncPaymentButtons();
}

function removePerson(id) {
  if (kasseState.persons.length === 1) return;
  kasseState.persons = kasseState.persons.filter(p => p.id !== id);
  if (kasseState.activePersonId === id) {
    kasseState.activePersonId = kasseState.persons[0].id;
  }
  renderPersonTabs();
  renderBasket();
  renderKasseAppointments();
  syncPaymentButtons();
  updateCartBadge();
}

function syncPaymentButtons() {
  const p = activePerson();
  if (!p) return;
  document.getElementById('pay-nakit')?.classList.toggle('selected', p.paymentMethod === 'nakit');
  document.getElementById('pay-kart')?.classList.toggle('selected',  p.paymentMethod === 'kart');
}

// ── Heutige Termine als Schnellauswahl ────────
function renderKasseAppointments() {
  const list = document.getElementById('kasse-appt-list');
  if (!list) return;
  const appts  = typeof TODAY_APPOINTMENTS !== 'undefined' ? TODAY_APPOINTMENTS : [];
  const person = activePerson();

  if (appts.length === 0) {
    list.innerHTML = `<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Bugün randevu bulunamadı.</div>`;
    return;
  }

  list.innerHTML = appts.map(a => {
    const inBasket = person?.basket.find(b => b.id === 'appt-' + a.id);
    return `
      <button class="kasse-appt-btn ${inBasket ? 'active' : ''}" id="kappt-${a.id}" onclick="addAppointmentToBasket(${a.id})">
        <span class="kab-time">${a.time}</span>
        <div class="kab-info">
          <div class="kab-name">${a.name}</div>
          <div class="kab-svc">${a.service}</div>
        </div>
        <span class="kab-price">₺${a.price}</span>
      </button>`;
  }).join('');
}

// ── Termin in Warenkorb ───────────────────────
function addAppointmentToBasket(apptId) {
  const appts  = typeof TODAY_APPOINTMENTS !== 'undefined' ? TODAY_APPOINTMENTS : [];
  const appt   = appts.find(a => a.id === apptId);
  const person = activePerson();
  if (!appt || !person) return;

  // Toggle: nochmal klicken = entfernen
  if (person.basket.find(b => b.id === 'appt-' + apptId)) {
    removeFromBasket('appt-' + apptId);
    return;
  }

  person.basket.push({
    id:     'appt-' + apptId,
    name:   appt.name + ' — ' + appt.service,
    price:  appt.price,
    type:   'appointment',
    extras: [],
  });

  renderPersonTabs();
  renderBasket();
  renderKasseAppointments();
  updateCartBadge();
}

// ── Manueller Artikel ─────────────────────────
function addManualItem() {
  const nameEl  = document.getElementById('manual-name');
  const priceEl = document.getElementById('manual-price');
  const name    = nameEl?.value.trim();
  const price   = parseFloat(priceEl?.value);
  const person  = activePerson();

  if (!name)               { showKasseMsg('Lütfen ürün adı girin.');          return; }
  if (!price || price <= 0){ showKasseMsg('Lütfen geçerli bir fiyat girin.');  return; }
  if (!person)             return;

  person.basket.push({
    id:     'manual-' + Date.now(),
    name,
    price,
    type:   'manual',
    extras: [],
  });

  if (nameEl)  nameEl.value  = '';
  if (priceEl) priceEl.value = '';

  renderPersonTabs();
  renderBasket();
  updateCartBadge();
}

// ── Warenkorb rendern ─────────────────────────
function renderBasket() {
  const container = document.getElementById('basket');
  const emptyMsg  = document.getElementById('basket-empty');
  const totalBox  = document.getElementById('kasse-total-box');
  const person    = activePerson();

  if (!container) return;

  if (!person || person.basket.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'flex';
    if (totalBox) totalBox.style.display = 'none';
    container.innerHTML = '';
    if (emptyMsg) container.appendChild(emptyMsg);
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (totalBox) totalBox.style.display = 'block';

  container.innerHTML = person.basket.map(item => {
    const extrasHtml = (item.extras || []).length > 0 ? `
      <div class="basket-extras">
        ${item.extras.map(ex => `
          <div class="basket-extra-row">
            <span style="color:var(--tx3);font-size:.72rem">↳</span>
            <span class="basket-extra-row-name">${ex.name}</span>
            <span class="basket-extra-row-price"
              onclick="editExtraPrice('${item.id}','${ex.id}',this)">₺${ex.price.toFixed(2)}</span>
            <button class="basket-extra-remove" onclick="removeExtra('${item.id}','${ex.id}')">✕</button>
          </div>`).join('')}
      </div>` : '';

    return `
      <div class="basket-item" id="bitem-${item.id}">
        <div class="basket-item-main">
          <div class="basket-item-info">
            <div class="basket-item-name">${item.name}</div>
            <div class="basket-item-sub">${item.type === 'appointment' ? 'Randevu hizmeti' : 'Manuel eklendi'}</div>
          </div>
          <button class="basket-extra-btn" onclick="openExtrasModal('${item.id}')">+ Ekstra</button>
          <span class="basket-item-price" onclick="editItemPrice('${item.id}',this)">₺${item.price.toFixed(2)}</span>
          <button class="basket-remove" onclick="removeFromBasket('${item.id}')">✕</button>
        </div>
        ${extrasHtml}
      </div>`;
  }).join('');

  updateTotals();
  updateCartBadge();
}

// ── Preis bearbeiten (Hauptposition) ──────────
function editItemPrice(itemId, el) {
  const item = activePerson()?.basket.find(b => b.id === itemId);
  if (!item) return;
  const input = document.createElement('input');
  input.type  = 'number'; input.step = '0.01'; input.min = '0';
  input.value = item.price.toFixed(2);
  input.className = 'basket-item-price-input';
  el.replaceWith(input);
  input.focus(); input.select();
  const save = () => {
    const v = parseFloat(input.value);
    if (!isNaN(v) && v >= 0) item.price = v;
    renderBasket();
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') renderBasket();
  });
}

// ── Preis bearbeiten (Extra) ──────────────────
function editExtraPrice(itemId, extraId, el) {
  const item = activePerson()?.basket.find(b => b.id === itemId);
  const ex   = item?.extras?.find(e => e.id === extraId);
  if (!ex) return;
  const input = document.createElement('input');
  input.type  = 'number'; input.step = '0.01'; input.min = '0';
  input.value = ex.price.toFixed(2);
  input.className = 'basket-extra-row-price-input';
  el.replaceWith(input);
  input.focus(); input.select();
  const save = () => {
    const v = parseFloat(input.value);
    if (!isNaN(v) && v >= 0) ex.price = v;
    renderBasket();
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') renderBasket();
  });
}

// ── Extra entfernen ───────────────────────────
function removeExtra(itemId, extraId) {
  const item = activePerson()?.basket.find(b => b.id === itemId);
  if (!item) return;
  item.extras = (item.extras || []).filter(e => e.id !== extraId);
  renderPersonTabs();
  renderBasket();
}

// ── Artikel entfernen ─────────────────────────
function removeFromBasket(itemId) {
  const person = activePerson();
  if (!person) return;
  const item = person.basket.find(b => b.id === itemId);
  if (item?.type === 'appointment') {
    document.getElementById('kappt-' + itemId.replace('appt-', ''))?.classList.remove('active');
  }
  person.basket = person.basket.filter(b => b.id !== itemId);
  renderPersonTabs();
  renderBasket();
  renderKasseAppointments();
  updateCartBadge();
}

// ── Totals berechnen ──────────────────────────
function updateTotals() {
  const person   = activePerson();
  const subtotal = (person?.basket || []).reduce((sum, b) => {
    return sum + b.price + (b.extras || []).reduce((es, ex) => es + ex.price, 0);
  }, 0);
  const subEl   = document.getElementById('subtotal-val');
  const grandEl = document.getElementById('grand-total-val');
  if (subEl)   subEl.textContent   = '₺' + subtotal.toFixed(2);
  if (grandEl) grandEl.textContent = '₺' + subtotal.toFixed(2);
}

// ── Zahlungsmethode ───────────────────────────
function selectPayment(method) {
  const person = activePerson();
  if (person) person.paymentMethod = method;
  document.getElementById('pay-nakit')?.classList.toggle('selected', method === 'nakit');
  document.getElementById('pay-kart')?.classList.toggle('selected',  method === 'kart');
}

// ── Cart Badge ────────────────────────────────
function updateCartBadge() {
  const total = kasseState.persons.reduce((n, p) => n + p.basket.length, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = total;
  const btn = document.getElementById('kassa-cart-toggle-btn');
  if (btn) btn.style.display = 'none';
}

// ── Mobile Bottom Sheet ───────────────────────
function toggleMobileCart() {
  document.getElementById('kassa-right-panel')?.classList.toggle('open');
}

function initMobileCartSwipe() {
  const handle = document.getElementById('cart-drag-handle');
  const panel  = document.getElementById('kassa-right-panel');
  if (!handle || !panel) return;
  let startY = 0;
  handle.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  handle.addEventListener('touchmove',  e => {
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) panel.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  handle.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY;
    panel.style.transform = '';
    if (dy > 80) panel.classList.remove('open');
  });
}

// ── Verkauf abschließen ───────────────────────
function completeSale() {
  const person = activePerson();
  if (!person || person.basket.length === 0) { showKasseMsg('Sepet boş.'); return; }

  const total  = person.basket.reduce((sum, b) => {
    return sum + b.price + (b.extras || []).reduce((es, ex) => es + ex.price, 0);
  }, 0);
  const method  = person.paymentMethod;
  const txNo    = String(kasseState.txCounter).padStart(4, '0');
  const now     = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const tx = {
    no:     txNo,
    person: person.name,
    items:  JSON.parse(JSON.stringify(person.basket)),
    total,
    method,
    time:   timeStr,
    date:   dateStr,
  };

  kasseState.transactions.push(tx);
  kasseState.txCounter++;

  if (method === 'nakit') kasseState.nakit += total;
  else                    kasseState.kart  += total;

  buildReceipt(tx);
  document.getElementById('receipt-modal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Person-Warenkorb leeren
  person.basket = [];
  document.querySelectorAll('.kasse-appt-btn').forEach(b => b.classList.remove('active'));
  renderPersonTabs();
  renderBasket();
  renderKasseAppointments();
  updateKasseSummary();
  renderTransactionHistory();
  updateCartBadge();
}

// ── Quittung aufbauen ─────────────────────────
function buildReceipt(tx) {
  const salonName = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.name) ? SALON_CONFIG.name : 'Salon';

  // Salon name in receipt header
  const salonNameEl = document.getElementById('rp-salon-name');
  if (salonNameEl) salonNameEl.textContent = salonName;

  document.getElementById('rp-date-time').textContent = tx.date + ' · ' + tx.time;
  document.getElementById('rp-total').textContent     = '₺' + tx.total.toFixed(2);
  document.getElementById('rp-payment').textContent   = tx.method === 'nakit' ? 'Nakit' : 'Kredi/Banka Kartı';
  document.getElementById('rp-tx-no').textContent     = 'İşlem #' + tx.no;

  document.getElementById('rp-items').innerHTML = tx.items.map(item => {
    const extrasHtml = (item.extras || []).map(ex => `
      <div class="rp-row" style="padding-left:12px;opacity:.8">
        <span>↳ ${ex.name}</span><span>₺${ex.price.toFixed(2)}</span>
      </div>`).join('');
    return `
      <div class="rp-row"><span>${item.name}</span><span>₺${item.price.toFixed(2)}</span></div>
      ${extrasHtml}`;
  }).join('');

  // Wire up WhatsApp receipt button
  const waBtn = document.getElementById('rp-wa-btn');
  if (waBtn) {
    waBtn.onclick = () => whatsappReceipt(tx);
  }
}

// ── Drucken ───────────────────────────────────
function printReceipt() {
  const salonName    = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.name)    ? SALON_CONFIG.name    : 'Salon';
  const salonAddress = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.address) ? SALON_CONFIG.address : '';
  const content      = document.getElementById('receipt-content').innerHTML;

  const headerHtml = `
    <div class="print-header">
      <div class="print-salon-name">${salonName}</div>
      ${salonAddress ? `<div class="print-salon-address">${salonAddress}</div>` : ''}
      <hr class="print-divider">
    </div>`;

  const win = window.open('', '_blank', 'width=400,height=640');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fiş — ${salonName}</title>
    <style>
      body { font-family:'Courier New',monospace; font-size:13px; padding:20px; color:#111; }
      .print-header        { text-align:center; margin-bottom:14px; }
      .print-salon-name    { font-size:16px; font-weight:700; letter-spacing:1px; }
      .print-salon-address { font-size:11px; color:#555; margin-top:3px; }
      .print-divider       { border:none; border-top:1px dashed #999; margin:10px 0; }
      .rp-header { text-align:center; margin-bottom:14px; }
      .rp-logo   { font-size:15px; font-weight:700; letter-spacing:1px; }
      .rp-sub    { font-size:11px; color:#666; margin-top:2px; }
      .rp-line   { border:none; border-top:1px dashed #999; margin:10px 0; }
      .rp-row    { display:flex; justify-content:space-between; padding:2px 0; }
      .rp-total  { font-weight:700; font-size:14px; }
      .rp-footer { text-align:center; color:#888; font-size:10px; margin-top:10px; }
      /* hide WA button when printing */
      button, .rp-wa-btn { display:none !important; }
      @media print { body { margin:0; } }
    </style></head><body>${headerHtml}${content}</body></html>`);
  win.document.close(); win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ── WhatsApp Quittung ─────────────────────────
function whatsappReceipt(tx) {
  const salonName = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.name) ? SALON_CONFIG.name : 'Salon';
  const waNumber  = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.social?.whatsapp) ? SALON_CONFIG.social.whatsapp : '';

  const itemLines = tx.items.map(item => {
    const extraLines = (item.extras || []).map(ex => `  ↳ ${ex.name}: ₺${ex.price.toFixed(2)}`).join('\n');
    return `• ${item.name}: ₺${item.price.toFixed(2)}` + (extraLines ? '\n' + extraLines : '');
  }).join('\n');

  const msg = [
    `🧾 *${salonName} — Fiş #${tx.no}*`,
    `📅 ${tx.date} ${tx.time}`,
    ``,
    itemLines,
    ``,
    `💰 *TOPLAM: ₺${tx.total.toFixed(2)}*`,
    `💳 Ödeme: ${tx.method === 'nakit' ? 'Nakit' : 'Kart'}`,
    ``,
    `Teşekkür ederiz! 🙏`,
  ].join('\n');

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
}

// ── WA Teilen (letzter Vorgang) ───────────────
function shareReceiptWA() {
  const txs = kasseState.transactions;
  if (!txs.length) { showKasseMsg('Henüz işlem yok.'); return; }
  whatsappReceipt(txs[txs.length - 1]);
}

// ── E-Mail ────────────────────────────────────
function emailReceipt() {
  const tx      = kasseState.transactions[kasseState.transactions.length - 1];
  const subject = encodeURIComponent('Randevu Deluxe — Fiş #' + tx.no);
  const body    = encodeURIComponent(
    'Sayın Müşterimiz,\n\n' +
    tx.items.map(i => i.name + ' — ₺' + i.price.toFixed(2)).join('\n') +
    '\n\nTOPLAM: ₺' + tx.total.toFixed(2) +
    '\nÖdeme: ' + (tx.method === 'nakit' ? 'Nakit' : 'Kart') +
    '\n\nTeşekkür ederiz.\nRandevu Deluxe'
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  closeModal();
}

// ── Modal schließen ───────────────────────────
function closeModal(id) {
  const el = document.getElementById(id || 'receipt-modal');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Tagesübersicht ────────────────────────────
function updateKasseSummary() {
  const nakitEl = document.getElementById('ks-nakit');
  const kartEl  = document.getElementById('ks-kart');
  const totalEl = document.getElementById('ks-total');
  const txEl    = document.getElementById('kasse-tx-count');
  const brBugün = document.getElementById('br-bugun');

  if (txEl)    txEl.textContent    = kasseState.transactions.length + ' işlem';
  if (nakitEl) nakitEl.textContent = '₺' + kasseState.nakit.toFixed(2);
  if (kartEl)  kartEl.textContent  = '₺' + kasseState.kart.toFixed(2);
  if (totalEl) totalEl.textContent = '₺' + (kasseState.nakit + kasseState.kart).toFixed(2);
  if (brBugün) brBugün.textContent = '₺' + (kasseState.nakit + kasseState.kart).toFixed(2);
}

// ── Transaktionsverlauf ───────────────────────
function renderTransactionHistory() {
  const container = document.getElementById('kasse-history');
  if (!container) return;

  if (kasseState.transactions.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:.84rem">Henüz işlem yok.</div>`;
    return;
  }

  container.innerHTML = [...kasseState.transactions].reverse().map(tx => `
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px">
      <div style="background:var(--surface3);border-radius:8px;padding:6px 10px;font-size:.7rem;color:var(--tx2);text-align:center;flex-shrink:0">
        <div style="font-weight:700;color:var(--tx)">${tx.time}</div>
        <div>#${tx.no}</div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.78rem;font-weight:600;color:var(--tx)">${tx.person || ''}</div>
        <div style="font-size:.76rem;color:var(--tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tx.items.map(i => i.name).join(', ')}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-weight:700;color:var(--gold)">₺${tx.total.toFixed(2)}</div>
        <div style="font-size:.7rem;color:var(--tx2)">${tx.method === 'nakit' ? '💵 Nakit' : '💳 Kart'}</div>
      </div>
    </div>`).join('');
}

// ── Kasse Tab Wechsler ────────────────────────
function switchKasseTab(tab) {
  document.querySelectorAll('.kasse-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.kasse-tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('ktab-' + tab)?.classList.add('active');
  document.getElementById('ktp-' + tab)?.classList.add('active');
  if (tab === 'rapor')   updateBericht?.();
  if (tab === 'gecmis')  renderTransactionHistory();
}

// ── Extras Modal ──────────────────────────────
function openExtrasModal(itemId) {
  kasseState.extrasTargetId = itemId;
  kasseState.extrasSelected = [];

  const person = activePerson();
  const item   = person?.basket.find(b => b.id === itemId);
  const sub    = document.getElementById('extras-modal-subtitle');
  if (sub && item) sub.textContent = item.name;

  const services = typeof SERVICES !== 'undefined' ? SERVICES : [];
  const list = document.getElementById('extras-svc-list');
  if (!list) return;
  list.innerHTML = services.map(s => `
    <div class="extras-svc-row" id="esvc-${s.id}" onclick="toggleExtraService(${s.id})">
      <div class="extras-svc-check">✓</div>
      <div class="extras-svc-name">${s.name}</div>
      <div class="extras-svc-dur">${s.duration} dk</div>
      <div class="extras-svc-price">₺${s.price}</div>
    </div>`).join('');

  updateExtrasCount();
  document.getElementById('extras-modal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function toggleExtraService(svcId) {
  const idx = kasseState.extrasSelected.indexOf(svcId);
  if (idx === -1) kasseState.extrasSelected.push(svcId);
  else            kasseState.extrasSelected.splice(idx, 1);
  document.getElementById('esvc-' + svcId)?.classList.toggle('selected', idx === -1);
  updateExtrasCount();
}

function updateExtrasCount() {
  const el = document.getElementById('extras-count');
  if (el) el.textContent = kasseState.extrasSelected.length;
}

function confirmExtras() {
  if (!kasseState.extrasSelected.length) { closeExtrasModal(); return; }
  const person = activePerson();
  const item   = person?.basket.find(b => b.id === kasseState.extrasTargetId);
  if (!item) { closeExtrasModal(); return; }
  if (!item.extras) item.extras = [];

  const services = typeof SERVICES !== 'undefined' ? SERVICES : [];
  kasseState.extrasSelected.forEach(svcId => {
    const svc = services.find(s => s.id === svcId);
    if (!svc || item.extras.find(e => e.id === 'extra-' + svcId)) return;
    item.extras.push({ id: 'extra-' + svcId, name: svc.name, price: svc.price });
  });

  closeExtrasModal();
  renderPersonTabs();
  renderBasket();
}

function closeExtrasModal() {
  document.getElementById('extras-modal')?.classList.remove('open');
  document.body.style.overflow = '';
  kasseState.extrasTargetId = null;
  kasseState.extrasSelected = [];
}

// ── Kassenschluss ─────────────────────────────
function openKassenschluss() {
  // ── Tagesdaten berechnen ──
  const txs       = kasseState.transactions;
  const nakit     = kasseState.nakit;
  const kart      = kasseState.kart;
  const grand     = nakit + kart;
  const txCount   = txs.length;
  const today     = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Einfache Felder befüllen ──
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('ks-close-date',     today);
  set('ks-close-nakit',    '₺' + nakit.toFixed(2));
  set('ks-close-kart',     '₺' + kart.toFixed(2));
  set('ks-close-grand',    '₺' + grand.toFixed(2));
  set('ks-close-tx-count', txCount + ' işlem');

  // ── Personal-Aufschlüsselung ──
  const staffTbody = document.getElementById('ks-close-staff-rows');
  if (staffTbody) {
    const appts = typeof TODAY_APPOINTMENTS !== 'undefined' ? TODAY_APPOINTMENTS : [];
    const staff = typeof STAFF !== 'undefined' ? STAFF : [];

    // Gruppierung nach staffId
    const byStaff = {};
    appts.forEach(a => {
      const sid = a.staffId || 'unknown';
      if (!byStaff[sid]) byStaff[sid] = { count: 0, revenue: 0 };
      byStaff[sid].count++;
      byStaff[sid].revenue += (a.price || 0);
    });

    const rows = Object.entries(byStaff).map(([sid, data]) => {
      const member = staff.find(s => String(s.id) === String(sid));
      const name   = member ? member.name : (sid === 'unknown' ? 'Atanmamış' : 'Personel #' + sid);
      return `<tr>
        <td style="padding:6px 8px">${name}</td>
        <td style="padding:6px 8px;text-align:center">${data.count}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600">₺${data.revenue.toFixed(2)}</td>
      </tr>`;
    });

    staffTbody.innerHTML = rows.length
      ? rows.join('')
      : `<tr><td colspan="3" style="padding:10px;text-align:center;color:var(--muted);font-size:.82rem">Bugün randevu bulunamadı.</td></tr>`;
  }

  // ── Top-5 Leistungen ──
  const itemsTbody = document.getElementById('ks-close-items-rows');
  if (itemsTbody) {
    const svcMap = {};
    txs.forEach(tx => {
      (tx.items || []).forEach(item => {
        // Nur die Basisbezeichnung verwenden (vor " — ")
        const svcName = item.name.split(' — ').pop().trim() || item.name;
        if (!svcMap[svcName]) svcMap[svcName] = { count: 0, revenue: 0 };
        svcMap[svcName].count++;
        svcMap[svcName].revenue += item.price;
        (item.extras || []).forEach(ex => {
          const exName = ex.name;
          if (!svcMap[exName]) svcMap[exName] = { count: 0, revenue: 0 };
          svcMap[exName].count++;
          svcMap[exName].revenue += ex.price;
        });
      });
    });

    const sorted = Object.entries(svcMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    itemsTbody.innerHTML = sorted.length
      ? sorted.map(([name, data], i) => `<tr>
          <td style="padding:6px 8px;color:var(--muted);font-size:.75rem">${i + 1}</td>
          <td style="padding:6px 8px">${name}</td>
          <td style="padding:6px 8px;text-align:center;color:var(--muted)">${data.count}×</td>
          <td style="padding:6px 8px;text-align:right;font-weight:600">₺${data.revenue.toFixed(2)}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" style="padding:10px;text-align:center;color:var(--muted);font-size:.82rem">Henüz işlem yok.</td></tr>`;
  }

  // ── WhatsApp-Button verdrahten ──
  const waBtn = document.getElementById('ks-close-wa-btn');
  if (waBtn) waBtn.onclick = kassenschlussWA;

  // ── Modal öffnen ──
  document.getElementById('kassenschluss-modal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeKassenschluss() {
  document.getElementById('kassenschluss-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function printKassenschluss() {
  const salonName    = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.name)    ? SALON_CONFIG.name    : 'Salon';
  const salonAddress = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.address) ? SALON_CONFIG.address : '';
  const content      = document.getElementById('kassenschluss-modal')?.querySelector('.ks-body')?.innerHTML
                    || document.getElementById('kassenschluss-modal')?.innerHTML
                    || '';

  const win = window.open('', '_blank', 'width=500,height=700');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kassenschluss — ${salonName}</title>
    <style>
      body    { font-family:'Courier New',monospace; font-size:13px; padding:20px; color:#111; }
      h2      { text-align:center; font-size:16px; margin:0 0 4px; }
      .sub    { text-align:center; font-size:11px; color:#555; margin-bottom:12px; }
      hr      { border:none; border-top:1px dashed #999; margin:10px 0; }
      table   { width:100%; border-collapse:collapse; font-size:12px; }
      td,th   { padding:4px 6px; }
      th      { text-align:left; font-weight:700; border-bottom:1px solid #ccc; }
      button, .ks-wa-btn { display:none !important; }
      @media print { body { margin:0; } }
    </style>
  </head><body>
    <h2>${salonName}</h2>
    ${salonAddress ? `<div class="sub">${salonAddress}</div>` : ''}
    <hr>
    ${content}
  </body></html>`);
  win.document.close(); win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function kassenschlussWA() {
  const salonName = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.name) ? SALON_CONFIG.name : 'Salon';
  const waNumber  = (typeof SALON_CONFIG !== 'undefined' && SALON_CONFIG.social?.whatsapp) ? SALON_CONFIG.social.whatsapp : '';

  const nakit   = kasseState.nakit;
  const kart    = kasseState.kart;
  const grand   = nakit + kart;
  const txCount = kasseState.transactions.length;
  const today   = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Top-3 Leistungen für kompakte Zusammenfassung
  const svcMap = {};
  kasseState.transactions.forEach(tx => {
    (tx.items || []).forEach(item => {
      const svcName = item.name.split(' — ').pop().trim() || item.name;
      if (!svcMap[svcName]) svcMap[svcName] = 0;
      svcMap[svcName] += item.price;
    });
  });
  const topSvcs = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, rev]) => `  • ${name}: ₺${rev.toFixed(2)}`)
    .join('\n');

  const msg = [
    `📊 *${salonName} — Günlük Kapanış*`,
    `📅 ${today}`,
    ``,
    `💵 Nakit:   ₺${nakit.toFixed(2)}`,
    `💳 Kart:    ₺${kart.toFixed(2)}`,
    `💰 *TOPLAM: ₺${grand.toFixed(2)}*`,
    `🧾 İşlem sayısı: ${txCount}`,
    topSvcs ? `\n🏆 En çok kazandıran hizmetler:\n${topSvcs}` : '',
    ``,
    `İyi akşamlar! 🌙`,
  ].filter(l => l !== undefined).join('\n');

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
}

// ── Fehlermeldung ─────────────────────────────
function showKasseMsg(msg) {
  if (typeof showMsg === 'function') { showMsg(msg, 'red'); return; }
  alert(msg);
}

// ── Klick außerhalb schließt Panels ──────────
document.addEventListener('click', e => {
  if (e.target === document.getElementById('receipt-modal'))       closeModal('receipt-modal');
  if (e.target === document.getElementById('extras-modal'))        closeExtrasModal();
  if (e.target === document.getElementById('kassenschluss-modal')) closeKassenschluss();
  // Mobile: Klick außerhalb Cart schließt Bottom Sheet
  const panel = document.getElementById('kassa-right-panel');
  if (panel?.classList.contains('open') && !panel.contains(e.target)) {
    const toggleBtn = document.getElementById('kassa-cart-toggle-btn');
    if (!toggleBtn?.contains(e.target)) panel.classList.remove('open');
  }
});
