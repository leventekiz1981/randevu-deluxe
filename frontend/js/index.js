if(window.innerWidth>768){
  var s=document.createElement('script');
  s.type='module';
  s.src='https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js';
  document.head.appendChild(s);
}

function lpMsgTab(tab) {
  const waP = document.getElementById('lp-wa-pkgs');
  const smsP = document.getElementById('lp-sms-pkgs');
  const waB = document.getElementById('lp-tab-wa');
  const smsB = document.getElementById('lp-tab-sms');
  if (tab === 'wa') {
    waP.style.display = ''; smsP.style.display = 'none';
    waB.style.background = '#25d366'; waB.style.color = '#080808'; waB.style.fontWeight = '700';
    smsB.style.background = 'transparent'; smsB.style.color = 'var(--m2)'; smsB.style.fontWeight = '600';
  } else {
    waP.style.display = 'none'; smsP.style.display = '';
    smsB.style.background = '#4fa8ff'; smsB.style.color = '#080808'; smsB.style.fontWeight = '700';
    waB.style.background = 'transparent'; waB.style.color = 'var(--m2)'; waB.style.fontWeight = '600';
  }
}

/* ── Theme System ── */
(function(){
  var saved = localStorage.getItem('rd-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  _setLpThemeBtn(saved);
})();
function toggleLpTheme(){
  var cur  = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('rd-theme', next);
  _setLpThemeBtn(next);
}
function _setLpThemeBtn(theme){
  var icon = document.getElementById('lp-theme-icon');
  if(!icon) return;
  icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ── FAQ Accordion ── */
document.querySelectorAll('.faq-q').forEach(function(btn){
  btn.addEventListener('click',function(){
    var item = this.closest('.faq-item');
    var isOpen = item.classList.contains('open');
    /* Schließe alle anderen */
    document.querySelectorAll('.faq-item.open').forEach(function(o){
      o.classList.remove('open');
      o.querySelector('.faq-q').setAttribute('aria-expanded','false');
    });
    if(!isOpen){
      item.classList.add('open');
      this.setAttribute('aria-expanded','true');
    }
  });
});

/* ── Cookie Banner ── */
(function(){
  var banner = document.getElementById('cookieBanner');
  var key = 'rd_cookies_accepted';

  if(localStorage.getItem(key) !== null){
    banner.classList.add('hidden');
    return;
  }

  document.getElementById('cookieAccept').addEventListener('click',function(){
    localStorage.setItem(key,'true');
    banner.classList.add('hidden');
  });

  document.getElementById('cookieReject').addEventListener('click',function(){
    localStorage.setItem(key,'false');
    banner.classList.add('hidden');
  });
})();

// ── Hero Gallery ─────────────────────────────
(function heroGallery() {
  var items = document.querySelectorAll('#hero-gallery .hg-item');
  if (!items.length) return;

  // 1) Einflug-Animation (staggered)
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      var els = e.target.querySelectorAll('.hg-item');
      els.forEach(function(el, i) {
        setTimeout(function(){ el.classList.add('hg-in'); }, i * 160);
      });
      io.disconnect();
    });
  }, { threshold: 0.15 });
  io.observe(document.getElementById('hero-gallery'));

  // 2) Auto-Highlight (rotiert alle 4s)
  var cur = 0;
  function nextHighlight() {
    items.forEach(function(el){ el.classList.remove('hg-active'); });
    items[cur].classList.add('hg-active');
    cur = (cur + 1) % items.length;
  }
  nextHighlight();
  setInterval(nextHighlight, 4000);

  // 3) Scroll-Parallax (sanftes translateY via CSS var)
  window.addEventListener('scroll', function() {
    var wy = window.scrollY;
    items.forEach(function(el, i) {
      var offset = -(wy * (0.04 + i * 0.02));
      el.style.setProperty('--par', offset + 'px');
    });
  }, { passive: true });
})();

// ── localStorage Preisbrücke ──────────────────
(function applyStoredPrices() {
  var plans = JSON.parse(localStorage.getItem('rd_plan_config') || 'null');
  var wa    = JSON.parse(localStorage.getItem('rd_wa_addons')   || 'null');
  if (!plans && !wa) return;

  // Hilfe: Setzt Text in einem Element wenn vorhanden
  function setText(sel, txt) { var el = document.querySelector(sel); if (el) el.textContent = txt; }

  if (plans) {
    var fmtTL = function(n){ return '₺' + n.toLocaleString('tr-TR'); };
    plans.forEach(function(p) {
      if (p.key === 'free') return;
      // Jahrespreis + Monatsäquivalent in Preiskarten
      var cards = document.querySelectorAll('.pc');
      cards.forEach(function(card) {
        var nameEl = card.querySelector('.pc-name');
        if (!nameEl) return;
        var planNames = { std:'Standart', pro:'Pro', lux:'Lüks' };
        if (nameEl.textContent.trim() !== planNames[p.key]) return;
        var amtEl = card.querySelector('.pc-amt');
        if (amtEl) amtEl.textContent = fmtTL(p.yearlyPrice);
        var perDivs = card.querySelectorAll('div[style*="font-size:.72rem"]');
        perDivs.forEach(function(d){ if (d.textContent.includes('/ay')) d.textContent = '≈ ' + fmtTL(p.monthlyEquiv) + ' / ay'; });
      });
    });
  }

  if (wa) {
    var waPaketEls = document.querySelectorAll('[data-wa-key]');
    if (!waPaketEls.length) return; // keine data-Attribute gesetzt → skip
    wa.forEach(function(a) {
      var el = document.querySelector('[data-wa-key="' + a.key + '"]');
      if (el) el.textContent = '₺' + a.price;
    });
  }
})();

(function splineSpotlight() {
  if(window.innerWidth<=768) return;
  // inject spline-viewer
  var visual = document.querySelector('.spline-visual');
  if(visual){
    var sv = document.createElement('spline-viewer');
    sv.setAttribute('url','https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode');
    visual.appendChild(sv);
  }
  var card = document.getElementById('spline-card');
  var spot = document.getElementById('spline-spotlight');
  if (!card || !spot) return;
  var canvas = null;

  function getCanvas() {
    if (canvas) return canvas;
    var viewer = card.querySelector('spline-viewer');
    if (viewer && viewer.shadowRoot) {
      canvas = viewer.shadowRoot.querySelector('canvas');
    }
    return canvas;
  }

  card.addEventListener('mousemove', function(e) {
    // spotlight blob
    var r = card.getBoundingClientRect();
    spot.style.left = (e.clientX - r.left) + 'px';
    spot.style.top  = (e.clientY - r.top)  + 'px';

    // forward to spline canvas so robot follows from anywhere on card
    var c = getCanvas();
    if (c) {
      c.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: false, cancelable: true,
        clientX: e.clientX, clientY: e.clientY,
        movementX: e.movementX, movementY: e.movementY
      }));
    }
  });
})();

/* ── Mockup Theme Switcher ── */
(function(){
  const devices = document.querySelector('.showcase-devices');
  if(!devices) return;
  let isLight = false;
  let autoTimer = null;

  window.setMockTheme = function(theme){
    const targetLight = (theme === 'light');
    if(targetLight === isLight) return;
    // Pause auto-timer, restart it after manual click
    clearInterval(autoTimer);
    applyTheme(targetLight);
    autoTimer = setInterval(autoSwitch, 4000);
  };

  function applyTheme(toLight){
    devices.classList.add('fading');
    setTimeout(()=>{
      isLight = toLight;
      if(isLight){
        devices.classList.add('mock-light');
      } else {
        devices.classList.remove('mock-light');
      }
      devices.classList.remove('fading');
      // Update button active states
      const btnDark  = document.getElementById('mock-btn-dark');
      const btnLight = document.getElementById('mock-btn-light');
      if(btnDark && btnLight){
        btnDark.classList.toggle('active', !isLight);
        btnLight.classList.toggle('active', isLight);
      }
    }, 400);
  }

  function autoSwitch(){ applyTheme(!isLight); }

  autoTimer = setInterval(autoSwitch, 4000);
})();

/* ── SHOWCASE CONTAINER SCROLL ANIMATION ───────────────── */
(function(){
  var devices = document.querySelector('.showcase-devices');
  if(!devices) return;

  function update(){
    var rect = devices.getBoundingClientRect();
    var vh   = window.innerHeight;

    // progress: 0 = bottom of viewport, 1 = element vertically centered in viewport
    var progress = (vh - rect.top) / (vh * 0.7 + rect.height * 0.3);
    progress = Math.min(1, Math.max(0, progress));

    if(progress >= 1){
      // Fully revealed — use class for smooth CSS transition
      if(!devices.classList.contains('scroll-revealed')){
        devices.classList.add('scroll-revealed');
      }
    } else {
      // Still animating — drive via inline style for continuous feel
      devices.classList.remove('scroll-revealed');
      var rotX  = 22 * (1 - progress);
      var scale = 0.88 + 0.12 * progress;
      var op    = 0.5 + 0.5 * progress;
      devices.style.transform = 'perspective(1200px) rotateX(' + rotX.toFixed(2) + 'deg) scale(' + scale.toFixed(4) + ')';
      devices.style.opacity   = op.toFixed(3);
    }
  }

  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update, {passive:true});
  update();
})();
