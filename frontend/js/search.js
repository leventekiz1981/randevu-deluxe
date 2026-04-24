/* =============================================
   RANDEVU-DELUXE — Salon Suche
   search.js
   ============================================= */

// ── TESTDATEN ─────────────────────────────────
const SALONS_DB = [
  {
    id: 1,
    name: "Ahmet's Barber",
    category: 'berber',
    catLabel: 'Berber',
    city: 'İstanbul',
    district: 'Kadıköy',
    plan: 'pro',
    rating: 4.9,
    reviewCount: 214,
    phone: '905321234567',
    address: 'Moda Cad. No:12, Kadıköy / İstanbul',
    hours: 'Pzt–Cts: 09:00–20:00',
    emoji: '✂️',
    bannerColor: '#1A1208',
    services: ['Saç Kesimi', 'Sakal Tıraşı', 'Cilt Bakımı', 'Boya'],
    priceFrom: 80,
    priceTo: 250,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 2,
    name: 'Bella Beauty',
    category: 'guzellik',
    catLabel: 'Güzellik Salonu',
    city: 'Ankara',
    district: 'Çankaya',
    plan: 'std',
    rating: 4.7,
    reviewCount: 98,
    phone: '905421234567',
    address: 'Tunalı Hilmi Cad. No:55, Çankaya / Ankara',
    hours: 'Pzt–Cum: 10:00–19:00',
    emoji: '💄',
    bannerColor: '#140C18',
    services: ['Makyaj', 'Kaş Tasarımı', 'Cilt Bakımı', 'Epilasyon'],
    priceFrom: 150,
    priceTo: 600,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 3,
    name: 'Güzellik Merkezi',
    category: 'guzellik',
    catLabel: 'Güzellik Salonu',
    city: 'İzmir',
    district: 'Karşıyaka',
    plan: 'lux',
    rating: 4.8,
    reviewCount: 312,
    phone: '905321111111',
    address: 'Cemal Gürsel Cad. No:88, Karşıyaka / İzmir',
    hours: 'Her Gün: 09:00–21:00',
    emoji: '✨',
    bannerColor: '#120A18',
    services: ['Saç Boyama', 'Keratin', 'Cilt Bakımı', 'Makyaj', 'SPA'],
    priceFrom: 200,
    priceTo: 1200,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 4,
    name: 'Hair Studio 34',
    category: 'kadin-kuafor',
    catLabel: 'Kadın Kuaförü',
    city: 'İstanbul',
    district: 'Beşiktaş',
    plan: 'free',
    rating: 4.5,
    reviewCount: 57,
    phone: '905331234567',
    address: 'Balmumcu Mah. No:7, Beşiktaş / İstanbul',
    hours: 'Pzt–Cts: 08:00–19:00',
    emoji: '💇‍♀️',
    bannerColor: '#0E1218',
    services: ['Saç Kesimi', 'Röfle', 'Fön', 'Keratin'],
    priceFrom: 120,
    priceTo: 500,
    waEnabled: false,
    bookingUrl: 'booking.html',
  },
  {
    id: 5,
    name: 'Moda Saç Tasarım',
    category: 'kadin-kuafor',
    catLabel: 'Kadın Kuaförü',
    city: 'Bursa',
    district: 'Nilüfer',
    plan: 'std',
    rating: 4.6,
    reviewCount: 143,
    phone: '905224321234',
    address: 'Görükle Mah. No:33, Nilüfer / Bursa',
    hours: 'Pzt–Cts: 09:30–19:30',
    emoji: '💫',
    bannerColor: '#0A120A',
    services: ['Saç Kesimi', 'Boya', 'Fön', 'Gelin Saçı'],
    priceFrom: 100,
    priceTo: 400,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 6,
    name: 'Royal Coiffure',
    category: 'erkek-kuafor',
    catLabel: 'Erkek Kuaförü',
    city: 'Antalya',
    district: 'Konyaaltı',
    plan: 'pro',
    rating: 4.8,
    reviewCount: 189,
    phone: '902421234567',
    address: 'Liman Mah. No:14, Konyaaltı / Antalya',
    hours: 'Pzt–Paz: 09:00–20:00',
    emoji: '👑',
    bannerColor: '#12100A',
    services: ['Saç Kesimi', 'Sakal', 'Cilt Bakımı', 'Hydra Facial'],
    priceFrom: 90,
    priceTo: 350,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 7,
    name: 'Stil Kuaförü',
    category: 'erkek-kuafor',
    catLabel: 'Erkek Kuaförü',
    city: 'Konya',
    district: 'Selçuklu',
    plan: 'free',
    rating: 4.3,
    reviewCount: 42,
    phone: '903321234567',
    address: 'Musalla Bağları, Selçuklu / Konya',
    hours: 'Pzt–Cts: 09:00–18:30',
    emoji: '💈',
    bannerColor: '#0A0E12',
    services: ['Saç Kesimi', 'Sakal Düzeltme', 'Fön'],
    priceFrom: 60,
    priceTo: 150,
    waEnabled: false,
    bookingUrl: 'booking.html',
  },
  {
    id: 8,
    name: 'Neon Nails',
    category: 'nail',
    catLabel: 'Nail Studio',
    city: 'İstanbul',
    district: 'Şişli',
    plan: 'pro',
    rating: 4.9,
    reviewCount: 267,
    phone: '905361234567',
    address: 'Halaskargazi Cad. No:91, Şişli / İstanbul',
    hours: 'Pzt–Paz: 10:00–20:00',
    emoji: '💅',
    bannerColor: '#14080E',
    services: ['Manikür', 'Pedikür', 'Jel Tırnak', 'Nail Art', 'Protez Tırnak'],
    priceFrom: 120,
    priceTo: 450,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 9,
    name: 'Zen Cilt Bakım',
    category: 'cilt',
    catLabel: 'Cilt Bakımı',
    city: 'İstanbul',
    district: 'Ataşehir',
    plan: 'lux',
    rating: 5.0,
    reviewCount: 88,
    phone: '905391234567',
    address: 'Küçükbakkalköy Mah. No:3, Ataşehir / İstanbul',
    hours: 'Sal–Paz: 10:00–19:00',
    emoji: '🌿',
    bannerColor: '#080E0A',
    services: ['Hydra Facial', 'Kimyasal Peeling', 'Akne Tedavisi', 'Anti-Aging'],
    priceFrom: 400,
    priceTo: 1800,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 10,
    name: 'Relax Masaj Merkezi',
    category: 'masaj',
    catLabel: 'Masaj',
    city: 'Ankara',
    district: 'Keçiören',
    plan: 'std',
    rating: 4.6,
    reviewCount: 121,
    phone: '905051234567',
    address: 'Atatürk Bulvarı No:44, Keçiören / Ankara',
    hours: 'Her Gün: 10:00–22:00',
    emoji: '💆',
    bannerColor: '#0A100E',
    services: ['İsveç Masajı', 'Derin Doku', 'Aromatik Masaj', 'Bali Masajı'],
    priceFrom: 200,
    priceTo: 600,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 11,
    name: 'La Belle',
    category: 'guzellik',
    catLabel: 'Güzellik Salonu',
    city: 'İstanbul',
    district: 'Bakırköy',
    plan: 'pro',
    rating: 4.7,
    reviewCount: 198,
    phone: '905351234567',
    address: 'İncirli Cad. No:22, Bakırköy / İstanbul',
    hours: 'Pzt–Cts: 09:00–19:00',
    emoji: '🌸',
    bannerColor: '#140A10',
    services: ['Kalıcı Makyaj', 'İpek Kirpik', 'Kaş Tasarımı', 'Cilt Bakımı'],
    priceFrom: 250,
    priceTo: 900,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
  {
    id: 12,
    name: 'Klasik Berber Salonu',
    category: 'berber',
    catLabel: 'Berber',
    city: 'İzmir',
    district: 'Bornova',
    plan: 'std',
    rating: 4.5,
    reviewCount: 76,
    phone: '902321234567',
    address: 'Ege Üniversitesi Cad. No:8, Bornova / İzmir',
    hours: 'Pzt–Cts: 08:30–19:30',
    emoji: '✂️',
    bannerColor: '#0E0E0A',
    services: ['Saç Kesimi', 'Sakal Tıraşı', 'Çocuk Kesimi'],
    priceFrom: 50,
    priceTo: 180,
    waEnabled: true,
    bookingUrl: 'booking.html',
  },
];

// ── ZUSTAND ───────────────────────────────────
let activeCity = 'Tümü';
let activeCat  = '';
let filteredSalons = [...SALONS_DB];

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderSalons(filteredSalons);
});

// ── SUCHE ─────────────────────────────────────
function doSearch() {
  const cityInput = document.getElementById('city-input').value.trim().toLowerCase();
  const catInput  = document.getElementById('cat-select').value;

  // Stadtfeld auswerten
  if (cityInput) {
    activeCity = 'custom';
    document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
  }

  if (catInput) {
    activeCat = catInput;
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    const pill = document.querySelector(`.cat-pill[data-cat="${catInput}"]`);
    if (pill) pill.classList.add('active');
  }

  applyFilters(cityInput);
}

// ── CITY FILTER ───────────────────────────────
function filterCity(city, el) {
  activeCity = city;
  document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('city-input').value = city === 'Tümü' ? '' : city;
  applyFilters();
}

// ── CATEGORY FILTER ───────────────────────────
function filterCat(cat, el) {
  activeCat = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('cat-select').value = cat;
  applyFilters();
}

// ── FILTER ANWENDEN ───────────────────────────
function applyFilters(customCity = '') {
  let results = [...SALONS_DB];

  // Stadt filtern
  if (customCity) {
    results = results.filter(s =>
      s.city.toLowerCase().includes(customCity) ||
      s.district.toLowerCase().includes(customCity)
    );
  } else if (activeCity && activeCity !== 'Tümü') {
    results = results.filter(s => s.city === activeCity);
  }

  // Kategorie filtern
  if (activeCat) {
    results = results.filter(s => s.category === activeCat);
  }

  filteredSalons = results;
  sortResults();
}

// ── SORTIEREN ─────────────────────────────────
function sortResults() {
  const sort = document.getElementById('sort-select').value;

  if (sort === 'rating') {
    filteredSalons.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'name') {
    filteredSalons.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  } else if (sort === 'newest') {
    filteredSalons.sort((a, b) => b.id - a.id);
  }

  renderSalons(filteredSalons);
}

// ── SALONS RENDERN ────────────────────────────
function renderSalons(list) {
  const grid      = document.getElementById('salon-grid');
  const emptyEl   = document.getElementById('empty-state');
  const countEl   = document.getElementById('results-count');

  countEl.innerHTML = `<b>${list.length}</b> salon bulundu`;

  if (list.length === 0) {
    grid.innerHTML = '';
    emptyEl.classList.add('visible');
    return;
  }

  emptyEl.classList.remove('visible');

  const planBadge = () => '';


  const stars = (rating) => {
    const full  = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let s = '';
    for (let i = 0; i < full; i++) s += '★';
    if (hasHalf) s += '½';
    return s;
  };

  grid.innerHTML = list.map(s => `
    <div class="salon-card" onclick="openModal(${s.id})">
      <div class="salon-banner" style="background:${s.bannerColor}">
        ${s.emoji}
        ${planBadge(s.plan)}
      </div>
      <div class="salon-body">
        <div class="salon-name">${s.name}</div>
        <div class="salon-cat">${s.catLabel}</div>
        <div class="salon-meta">
          <div class="salon-city">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${s.district}, ${s.city}
          </div>
          <div class="salon-rating">
            <span class="star">★</span> ${s.rating.toFixed(1)}
            <span style="color:var(--m2)">(${s.reviewCount})</span>
          </div>
        </div>
        <div class="salon-services">
          ${s.services.slice(0, 3).map(sv => `<span class="svc-tag">${sv}</span>`).join('')}
          ${s.services.length > 3 ? `<span class="svc-tag">+${s.services.length - 3}</span>` : ''}
        </div>
        <div class="salon-footer">
          <div class="salon-price-hint">
            <b>₺${s.priceFrom}</b>'den başlar
          </div>
          <button class="btn-book" onclick="event.stopPropagation(); openModal(${s.id})">
            Daha fazla bilgi
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── MODAL ÖFFNEN ──────────────────────────────
function openModal(salonId) {
  const s = SALONS_DB.find(x => x.id === salonId);
  if (!s) return;

  document.getElementById('modal-banner').style.background = s.bannerColor;
  document.getElementById('modal-banner').textContent = s.emoji;

  document.getElementById('modal-plan-badge').innerHTML = '';

  document.getElementById('modal-name').textContent    = s.name;
  document.getElementById('modal-cat').textContent     = s.catLabel + ' · ' + s.district + ', ' + s.city;
  document.getElementById('modal-address').innerHTML   = `<b>${s.address}</b>`;
  document.getElementById('modal-hours').innerHTML     = `<b>${s.hours}</b>`;
  document.getElementById('modal-phone').innerHTML     = `<b>+${s.phone}</b>`;
  document.getElementById('modal-rating-detail').innerHTML =
    `<b>★ ${s.rating.toFixed(1)}</b> <span style="color:var(--m2)">(${s.reviewCount} değerlendirme)</span>`;

  document.getElementById('modal-services').innerHTML =
    s.services.map(sv => `<div class="modal-svc">${sv}</div>`).join('');

  document.getElementById('modal-price-range').textContent =
    `₺${s.priceFrom} – ₺${s.priceTo}`;

  // Action Buttons
  const waMsg = encodeURIComponent(
    `Merhaba, ${s.name} salonundan randevu almak istiyorum.`
  );
  document.getElementById('modal-actions').innerHTML = `
    <a href="${s.bookingUrl}?salon=${s.id}" class="modal-btn modal-btn-primary">
      📅 Online Randevu Al
    </a>
    ${s.waEnabled ? `
    <a href="https://wa.me/${s.phone}?text=${waMsg}" target="_blank" class="modal-btn modal-btn-wa">
      💬 WhatsApp ile iletişime geç
    </a>
    ` : ''}
    <a href="tel:+${s.phone}" class="modal-btn modal-btn-sec">
      📞 Telefon ile Ara
    </a>
  `;

  document.getElementById('salon-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ── MODAL SCHLIEßEN ───────────────────────────
function closeModal() {
  document.getElementById('salon-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function handleModalClick(e) {
  if (e.target === document.getElementById('salon-modal')) closeModal();
}

// ── DIREKT BUCHEN ─────────────────────────────
function bookSalon(salonId) {
  const s = SALONS_DB.find(x => x.id === salonId);
  if (!s) return;

  if (s.waEnabled) {
    const waMsg = encodeURIComponent(
      `Merhaba, ${s.name} salonundan randevu almak istiyorum.`
    );
    window.open(`https://wa.me/${s.phone}?text=${waMsg}`, '_blank');
  } else {
    window.location.href = `booking.html?salon=${s.id}`;
  }
}

(function(){
  var t=localStorage.getItem('rd-theme')||'dark';
  document.documentElement.setAttribute('data-theme',t);
  var b=document.getElementById('sr-theme-btn');
  if(b) b.textContent=t==='dark'?'☀️':'🌙';
})();
function toggleSearchTheme(){
  var c=document.documentElement.getAttribute('data-theme')||'dark';
  var n=c==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',n);
  localStorage.setItem('rd-theme',n);
  var b=document.getElementById('sr-theme-btn');
  if(b) b.textContent=n==='dark'?'☀️':'🌙';
}
