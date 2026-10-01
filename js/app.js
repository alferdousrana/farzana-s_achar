/* =========================================================
   Farzana's Home Made Achar — storefront app
   Hash routes: #/  #/product/:slug  #/cart  #/checkout
                #/success/:id  #/orders
   ========================================================= */
(function () {
  'use strict';
  const { bn, money, pct } = FZ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isMobile = () => matchMedia('(max-width: 860px)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = (id) => `<svg><use href="#i-${id}"/></svg>`;

  let S = FZ.settings();
  let route = { name: 'home' };
  let pendingGoto = null;
  let homeScroll = 0;
  let lenis = null;

  const DISTRICTS = ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মানিকগঞ্জ', 'মুন্সিগঞ্জ', 'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'গোপালগঞ্জ', 'মাদারীপুর', 'রাজবাড়ী', 'শরীয়তপুর', 'চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'ব্রাহ্মণবাড়িয়া', 'চাঁদপুর', 'ফেনী', 'লক্ষ্মীপুর', 'নোয়াখালী', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান', 'রাজশাহী', 'নাটোর', 'নওগাঁ', 'চাঁপাইনবাবগঞ্জ', 'পাবনা', 'সিরাজগঞ্জ', 'বগুড়া', 'জয়পুরহাট', 'খুলনা', 'যশোর', 'সাতক্ষীরা', 'বাগেরহাট', 'নড়াইল', 'মাগুরা', 'ঝিনাইদহ', 'কুষ্টিয়া', 'চুয়াডাঙ্গা', 'মেহেরপুর', 'বরিশাল', 'ঝালকাঠি', 'পটুয়াখালী', 'পিরোজপুর', 'ভোলা', 'বরগুনা', 'সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ', 'রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'লালমনিরহাট', 'নীলফামারী', 'পঞ্চগড়', 'ঠাকুরগাঁও', 'ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'];

  const PAY = {
    cod: { label: 'ক্যাশ অন ডেলিভারি', logo: 'COD', color: '#0E5A2B', note: 'আচার হাতে পেয়ে টাকা দিন', group: 'cod' },
    bkash: { label: 'বিকাশ', logo: 'bKash', color: '#E2136E', note: 'বিকাশ অ্যাকাউন্ট দিয়ে', group: 'mfs' },
    nagad: { label: 'নগদ', logo: 'Nagad', color: '#EE4023', note: 'নগদ অ্যাকাউন্ট দিয়ে', group: 'mfs' },
    rocket: { label: 'রকেট', logo: 'Rocket', color: '#8C3494', note: 'ডাচ্-বাংলা রকেট', group: 'mfs' },
    upay: { label: 'উপায়', logo: 'upay', color: '#1A4FA0', note: 'উপায় অ্যাকাউন্ট দিয়ে', group: 'mfs' },
    card: { label: 'ডেবিট / ক্রেডিট কার্ড', logo: 'VISA · MC', color: '#1A1F71', note: 'ভিসা, মাস্টারকার্ড, অ্যামেক্স', group: 'bank' },
    netbank: { label: 'ইন্টারনেট ব্যাংকিং', logo: 'Bank', color: '#355E3B', note: 'DBBL, City, BRAC, IBBL', group: 'bank' }
  };
  const STATUS = { pending: 'অপেক্ষমাণ', confirmed: 'কনফার্মড', processing: 'প্রস্তুত হচ্ছে', shipped: 'পাঠানো হয়েছে', delivered: 'ডেলিভারি সম্পন্ন', cancelled: 'বাতিল' };
  const TRACK = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  /* =========================================================
     Small utilities
     ========================================================= */
  function toast(msg, link) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = icon('check') + `<span>${msg}</span>` + (link ? `<a href="${link.href}">${link.text}</a>` : '');
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
  }
  const waLink = (text) => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;
  const fmtDate = (iso) => new Date(iso).toLocaleString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  function deliveryFor(district, net) {
    if (S.freeDeliveryOver > 0 && net >= S.freeDeliveryOver) return 0;
    if (!district) return S.deliveryOutside;
    return district === S.homeDistrict ? S.deliveryInside : S.deliveryOutside;
  }

  function totals(district) {
    const lines = FZ.cartLines();
    const subtotal = lines.reduce((s, l) => s + l.p.offerPrice * l.qty, 0);
    const mrp = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const code = sessionStorage.getItem('fz_coupon');
    const c = code ? FZ.findCoupon(code, subtotal) : null;
    const discount = c && !c.error ? c.amount : 0;
    const delivery = lines.length ? deliveryFor(district, subtotal - discount) : 0;
    return { lines, subtotal, mrp, discount, coupon: c && !c.error ? c.code : '', couponError: c && c.error, delivery, total: subtotal - discount + delivery };
  }

  /* =========================================================
     Product card templates
     ========================================================= */
  function addHTML(p) {
    const q = FZ.cartQty(p.id);
    const out = p.stock <= 0;
    return `<div class="add${q ? ' in' : ''}${out ? ' soldout' : ''}" data-id="${p.id}">
      <button class="add-go" type="button"><span class="add-jar">${icon('bag')}</span><span>${out ? 'স্টক শেষ' : 'ব্যাগে নিন'}</span></button>
      <div class="add-step"><button type="button" data-dec aria-label="কমান">${icon('minus')}</button><output>${bn(q || 1)} <small>টি ব্যাগে</small></output><button type="button" data-inc aria-label="বাড়ান">${icon('plus')}</button></div>
    </div>`;
  }

  function tagsHTML(p) {
    const t = [];
    if (p.type === 'package') t.push(`<span class="tag tag-pack">${bn((p.items || []).length)}টির প্যাক</span>`);
    if (p.tags.includes('hot')) t.push('<span class="tag tag-hot">হট ডিল</span>');
    if (p.tags.includes('best')) t.push('<span class="tag tag-best">বেস্ট সেলার</span>');
    return t.slice(0, 2).join('');
  }

  function sealHTML(p) {
    const off = pct(p);
    return off ? `<span class="seal"><b>${bn(off)}%</b><small>ছাড়</small></span>` : '';
  }

  function cardHTML(p, i = 0, opt = {}) {
    if (p.type === 'package' && opt.pack) return packHTML(p, i);
    const href = `#/product/${p.slug}`;
    return `<article class="card reveal" style="--lid:${esc(p.lid)};--i:${i % 6}" data-pid="${p.id}">
      <div class="card-lid"></div>
      <a class="card-media" href="${href}" aria-label="${esc(p.name)}">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400">
        ${sealHTML(p)}<span class="card-tags">${tagsHTML(p)}</span>
        ${opt.rank ? `<span class="rank">${bn(opt.rank)}</span>` : ''}
      </a>
      <div class="card-body">
        <a class="card-name" href="${href}">${esc(p.name)}</a>
        <div class="card-meta"><span class="stars">${icon('star')}${bn(p.rating)}</span><span>${esc(p.weight)}</span></div>
        <div class="price"><b>${money(p.offerPrice)}</b>${p.price > p.offerPrice ? `<s>${money(p.price)}</s>` : ''}</div>
        ${p.stock > 0 && p.stock <= 10 ? `<span class="stock-low">মাত্র ${bn(p.stock)}টি বাকি</span>` : ''}
        ${addHTML(p)}
      </div>
    </article>`;
  }

  function packHTML(p, i) {
    const items = (p.items || []).map((id) => FZ.product(id)).filter(Boolean);
    const href = `#/product/${p.slug}`;
    return `<article class="card pack reveal" style="--lid:${esc(p.lid)};--i:${i % 4}" data-pid="${p.id}">
      <div class="card-lid"></div>
      <a class="card-media" href="${href}" aria-label="${esc(p.name)}">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
        ${sealHTML(p)}
      </a>
      <div class="card-body">
        <span class="pack-count">${bn(items.length)}টি আচার</span>
        <a class="card-name" href="${href}">${esc(p.name)}</a>
        <div class="pack-items">${items.map((x) => `<span>${esc(x.name.replace('ের আচার', '').replace('র আচার', '').replace(' আচার', ''))}</span>`).join('')}</div>
        <div class="price"><b>${money(p.offerPrice)}</b>${p.price > p.offerPrice ? `<s>${money(p.price)}</s>` : ''}</div>
        ${p.price > p.offerPrice ? `<span class="pack-save">${money(p.price - p.offerPrice)} সাশ্রয়</span>` : ''}
        ${addHTML(p)}
      </div>
    </article>`;
  }

  function syncAdds() {
    $$('.add[data-id]').forEach((el) => {
      const q = FZ.cartQty(el.dataset.id);
      el.classList.toggle('in', q > 0);
      const o = el.querySelector('output');
      if (o) o.innerHTML = `${bn(q || 1)} <small>টি ব্যাগে</small>`;
    });
  }

  function updateCounts(animate) {
    const n = FZ.cartCount();
    [$('#bagCount'), $('#tabCount')].forEach((el) => {
      el.textContent = bn(n);
      el.style.visibility = n ? 'visible' : 'hidden';
      if (animate) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    });
  }

  /* =========================================================
     Fly-to-bag animation
     ========================================================= */
  function bagTarget() {
    const a = $('#bagBtn'), b = $('#tabBag');
    if (a && a.offsetParent) return a;
    if (b && b.offsetParent) return b;
    return a;
  }

  function flyToBag(img) {
    const target = bagTarget();
    const done = () => {
      target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
      updateCounts(true);
      puff(target);
    };
    if (!img || reduceMotion) return done();
    const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    const size = Math.max(56, Math.min(110, a.width * 0.55));
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const cx = ax + (bx - ax) * 0.35, cy = Math.min(ay, by) - (isMobile() ? 120 : 200);
    const el = document.createElement('div');
    el.className = 'fly';
    el.style.width = el.style.height = size + 'px';
    el.innerHTML = `<img src="${img.currentSrc || img.src}" alt="">`;
    document.body.appendChild(el);
    const frames = [];
    const N = 28;
    for (let k = 0; k <= N; k++) {
      const t = k / N, u = 1 - t;
      const x = u * u * ax + 2 * u * t * cx + t * t * bx;
      const y = u * u * ay + 2 * u * t * cy + t * t * by;
      const s = t < 0.15 ? 1 + t * 1.6 : 1.24 - 1.05 * ((t - 0.15) / 0.85);
      frames.push({ transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${s.toFixed(3)}) rotate(${Math.round(t * 420)}deg)`, opacity: t > 0.9 ? 0.4 : 1 });
    }
    const anim = el.animate(frames, { duration: 900, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
    anim.onfinish = () => { el.remove(); done(); };
  }

  function puff(target) {
    if (reduceMotion) return;
    const r = target.getBoundingClientRect();
    const colors = ['#F6C21C', '#D42A26', '#0E5A2B', '#C98A1B'];
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('i');
      d.className = 'puff';
      d.style.background = colors[i % 4];
      d.style.left = r.left + r.width / 2 + 'px';
      d.style.top = r.top + r.height / 2 + 'px';
      document.body.appendChild(d);
      const ang = (i / 10) * Math.PI * 2, dist = 26 + Math.random() * 18;
      d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(.2)`, opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => d.remove();
    }
  }

  function addToBag(id, qty, imgEl, addEl) {
    const p = FZ.product(id);
    if (!p || p.stock <= 0) return;
    if (FZ.cartQty(id) + qty > p.stock) { toast(`দুঃখিত, স্টকে মাত্র ${bn(p.stock)}টি আছে।`); return; }
    if (addEl) { addEl.classList.add('adding'); setTimeout(() => addEl.classList.remove('adding'), 650); }
    FZ.cartAdd(id, qty);
    flyToBag(imgEl);
    toast(`${esc(p.name)} ব্যাগে রাখা হয়েছে`, { href: '#/cart', text: 'ব্যাগ দেখুন' });
  }

  /* =========================================================
     Global click handling (event delegation)
     ========================================================= */
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) { e.preventDefault(); closeOverlays(); gotoSection(go.dataset.goto); return; }

    const add = e.target.closest('.add[data-id]');
    if (add) {
      const id = add.dataset.id;
      const card = add.closest('[data-pid]');
      const img = card ? card.querySelector('.card-media img') : null;
      if (e.target.closest('.add-go')) addToBag(id, 1, img, add);
      else if (e.target.closest('[data-inc]')) {
        const p = FZ.product(id);
        if (FZ.cartQty(id) >= p.stock) return toast(`স্টকে মাত্র ${bn(p.stock)}টি আছে।`);
        FZ.cartSet(id, FZ.cartQty(id) + 1); flyToBag(img);
      } else if (e.target.closest('[data-dec]')) { FZ.cartSet(id, FZ.cartQty(id) - 1); updateCounts(true); }
    }
  });

  document.addEventListener('cart:change', () => { syncAdds(); updateCounts(false); if (route.name === 'cart') renderCart(); });

  function gotoSection(name) {
    if (route.name !== 'home') { pendingGoto = name; location.hash = '#/'; return; }
    const el = document.getElementById('sec-' + name);
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68) - 60;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* =========================================================
     Reveal on scroll
     ========================================================= */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  function observeReveals(root = document) {
    $$('.reveal:not(.in)', root).forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  }

  /* =========================================================
     HOME
     ========================================================= */
  let bannerTimer = null, countdownTimer = null;

  function renderHome() {
    S = FZ.settings();
    const ps = FZ.activeProducts();
    const chalta = FZ.product('p-chalta');
    if (chalta) { $('#heroPrice').textContent = money(chalta.offerPrice); $('#heroOld').textContent = money(chalta.price); }

    // banners
    const banners = S.banners || [];
    $('#bannerTrack').innerHTML = banners.map((b, i) => {
      const href = b.link === 'packages' || !b.link ? '#/' : `#/product/${esc(b.link)}`;
      return `<a href="${href}" ${b.link === 'packages' ? 'data-goto="packages"' : ''} class="${i === 0 ? 'cur' : ''}"><img src="${esc(b.image)}" alt="অফার ব্যানার ${bn(i + 1)}" ${i ? 'loading="lazy"' : ''}></a>`;
    }).join('');
    $('#bannerDots').innerHTML = banners.map((_, i) => `<button class="${i ? '' : 'on'}" aria-label="ব্যানার ${bn(i + 1)}" data-b="${i}"></button>`).join('');
    $('.banners').hidden = !banners.length;
    startBanner();

    const sec = S.sections;
    const featured = ps.filter((p) => p.tags.includes('featured'));
    const hot = ps.filter((p) => p.tags.includes('hot')).sort((a, b) => pct(b) - pct(a));
    const best = ps.filter((p) => p.tags.includes('best')).sort((a, b) => b.sold - a.sold);
    const packs = ps.filter((p) => p.type === 'package');
    const popular = ps.filter((p) => p.tags.includes('popular')).sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);

    let html = '';
    if (sec.featured.show && featured.length) html += block('featured', sec.featured.title, 'আমাদের রান্নাঘরের সেরা বাছাই', featured.map((p, i) => cardHTML(p, i)).join(''), 'row');
    if (sec.hot.show && hot.length) {
      const ends = new Date(S.hotDealEnds);
      const cd = ends > new Date() ? `<span class="countdown" id="countdown">${icon('clock')}শেষ হবে <b data-u="d">০</b>দিন <b data-u="h">০০</b>:<b data-u="m">০০</b>:<b data-u="s">০০</b></span>` : '';
      html += `<div class="band-hot">${block('hot', sec.hot.title, 'সীমিত সময়ের ছাড়, স্টক থাকা পর্যন্ত', hot.map((p, i) => cardHTML(p, i)).join(''), 'row', cd)}</div>`;
    }
    if (sec.best.show && best.length) html += block('best', sec.best.title, 'সবচেয়ে বেশি অর্ডার হওয়া আচার', best.map((p, i) => cardHTML(p, i, { rank: i + 1 })).join(''), 'row');
    if (sec.packages.show && packs.length) html += block('packages', sec.packages.title, '২, ৩ বা ৪টি আচার একসাথে — আলাদা কেনার চেয়ে কম দামে', packs.map((p, i) => cardHTML(p, i, { pack: true })).join(''), 'grid grid-pack');
    if (sec.popular.show && popular.length) html += block('popular', sec.popular.title, 'ক্রেতাদের রেটিং অনুযায়ী', popular.map((p, i) => cardHTML(p, i)).join(''), 'row');
    $('#homeSections').innerHTML = html;

    renderAll();
    startCountdown();
    observeReveals($('#view-home'));
    observeSpy();
  }

  function block(key, title, note, inner, cls, extra = '') {
    return `<section class="block" id="sec-${key}">
      <div class="block-head"><div><h2 class="block-title">${esc(title)}</h2><p class="block-note">${note}</p></div>${extra ? `<div style="margin-left:auto">${extra}</div>` : ''}</div>
      <div class="${cls}">${inner}</div>
    </section>`;
  }

  let allFilter = 'all';
  function renderAll() {
    let list = FZ.activeProducts();
    if (allFilter !== 'all') list = list.filter((p) => p.type === allFilter);
    const sort = $('#sortAll').value;
    const sorters = { pop: (a, b) => b.sold - a.sold, low: (a, b) => a.offerPrice - b.offerPrice, high: (a, b) => b.offerPrice - a.offerPrice, off: (a, b) => pct(b) - pct(a) };
    list.sort(sorters[sort]);
    $('#gridAll').innerHTML = list.map((p, i) => cardHTML(p, i)).join('');
    observeReveals($('#gridAll'));
  }
  $('#sortAll').addEventListener('change', renderAll);
  $('#filterAll').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#filterAll button').forEach((x) => x.classList.toggle('on', x === b));
    allFilter = b.dataset.f; renderAll();
  });

  function startBanner() {
    clearInterval(bannerTimer);
    const track = $('#bannerTrack');
    const slides = $$('a', track);
    if (slides.length < 2) return;
    let paused = false;
    const cur = () => Math.round(track.scrollLeft / track.clientWidth);
    const mark = () => {
      const i = cur();
      slides.forEach((s, k) => s.classList.toggle('cur', k === i));
      $$('#bannerDots button').forEach((d, k) => d.classList.toggle('on', k === i));
    };
    track.onscroll = () => { clearTimeout(track._t); track._t = setTimeout(mark, 80); };
    track.onpointerenter = () => (paused = true);
    track.onpointerleave = () => (paused = false);
    track.ontouchstart = () => { paused = true; clearTimeout(track._r); track._r = setTimeout(() => (paused = false), 6000); };
    $('#bannerDots').onclick = (e) => { const d = e.target.closest('[data-b]'); if (d) track.scrollTo({ left: d.dataset.b * track.clientWidth, behavior: 'smooth' }); };
    bannerTimer = setInterval(() => {
      if (paused || document.hidden || route.name !== 'home') return;
      const n = (cur() + 1) % slides.length;
      track.scrollTo({ left: n * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, 5000);
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    const el = $('#countdown');
    if (!el) return;
    const end = new Date(S.hotDealEnds).getTime();
    const tick = () => {
      let d = Math.max(0, end - Date.now());
      if (d <= 0) { el.remove(); clearInterval(countdownTimer); return; }
      const parts = { d: Math.floor(d / 864e5), h: Math.floor(d / 36e5) % 24, m: Math.floor(d / 6e4) % 60, s: Math.floor(d / 1e3) % 60 };
      Object.entries(parts).forEach(([k, v]) => { const b = el.querySelector(`[data-u="${k}"]`); if (b) b.textContent = bn(k === 'd' ? v : String(v).padStart(2, '0')); });
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // scroll-spy for category chips
  let spy = null;
  function observeSpy() {
    if (spy) spy.disconnect();
    if (!('IntersectionObserver' in window)) return;
    spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const key = en.target.id.replace('sec-', '');
        $$('#chips button').forEach((b) => b.classList.toggle('on', b.dataset.goto === key));
        const on = $('#chips button.on');
        if (on) { const c = $('#chips'); c.scrollTo({ left: on.offsetLeft - 20, behavior: 'smooth' }); }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    $$('#view-home section.block[id^="sec-"]').forEach((s) => spy.observe(s));
  }

  // hero seeds
  (function seeds() {
    const box = $('#heroSeeds');
    const colors = ['#1C2A1E', '#C98A1B', '#F6C21C', '#D42A26', '#3B2A14'];
    let h = '';
    for (let i = 0; i < 26; i++) {
      const x = 10 + Math.random() * 80, y = 15 + Math.random() * 75;
      h += `<i style="--x:${x}%;--y:${y}%;--s:${3 + Math.random() * 5}px;--c:${colors[i % 5]};--d:${(Math.random() * 0.6).toFixed(2)}s;--fx:${(50 - x) * 3}px;--fy:${(60 - y) * 3}px;--dx:${(Math.random() * 16 - 8).toFixed(1)}px;--dy:${(Math.random() * 16 - 8).toFixed(1)}px"></i>`;
    }
    box.innerHTML = h;
  })();

  /* =========================================================
     SEARCH (desktop dropdown + mobile sheet)
     ========================================================= */
  const recent = () => FZ.read(FZ.KEYS.recent, []);
  function pushRecent(q) {
    q = q.trim(); if (!q) return;
    FZ.write(FZ.KEYS.recent, [q, ...recent().filter((x) => x !== q)].slice(0, 6));
  }
  function highlight(text, q) {
    const safe = esc(text);
    const tokens = q.trim().split(/\s+/).filter((t) => t.length > 0).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!tokens.length) return safe;
    return safe.replace(new RegExp('(' + tokens.join('|') + ')', 'gi'), '<mark>$1</mark>');
  }
  function resultsHTML(q) {
    if (!q.trim()) {
      const r = recent();
      const pop = ['চালতা', 'রসুন', 'কম্বো', 'তেঁতুল', 'হট ডিল'];
      return `${r.length ? `<div class="sr-head">সাম্প্রতিক খোঁজ</div><div class="sug">${r.map((x) => `<button data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
        <div class="sr-head">জনপ্রিয় খোঁজ</div><div class="sug">${pop.map((x) => `<button data-q="${x}">${x}</button>`).join('')}</div>`;
    }
    const res = FZ.search(q);
    if (!res.length) return `<div class="sr-empty">“${esc(q)}” নামে কোনো আচার পাওয়া যায়নি। অন্য নামে খুঁজুন, যেমন “চালতা” বা “combo”।</div>`;
    return `<div class="sr-head">${bn(res.length)}টি ফলাফল</div>` + res.map((p, i) => `<a class="sr-item" href="#/product/${p.slug}" style="--i:${i}" data-q="">
        <img src="${esc(p.image)}" alt="">
        <div><div class="sr-name">${highlight(p.name, q)}</div><div class="sr-meta">${highlight(p.nameEn, q)} · ${esc(p.weight)}</div></div>
        <span class="sr-price">${money(p.offerPrice)}</span></a>`).join('');
  }

  // desktop
  const sBox = $('#search'), sIn = $('#searchInput'), sPanel = $('#searchPanel');
  let sIdx = -1;
  const renderDesk = () => { sPanel.innerHTML = resultsHTML(sIn.value); sIdx = -1; };
  sIn.addEventListener('focus', () => { sBox.classList.add('open'); renderDesk(); });
  sIn.addEventListener('input', () => { sBox.classList.toggle('has-text', !!sIn.value); renderDesk(); });
  sIn.addEventListener('keydown', (e) => {
    const items = $$('.sr-item', sPanel);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sIdx = (sIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((it, k) => it.classList.toggle('active', k === sIdx));
    } else if (e.key === 'Enter') {
      const it = items[sIdx >= 0 ? sIdx : 0];
      if (it) { pushRecent(sIn.value); location.hash = it.getAttribute('href'); sIn.blur(); sBox.classList.remove('open'); }
    } else if (e.key === 'Escape') { sIn.blur(); sBox.classList.remove('open'); }
  });
  sPanel.addEventListener('mousedown', (e) => e.preventDefault());
  sPanel.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (!q) return;
    if (q.classList.contains('sr-item')) { pushRecent(sIn.value); sBox.classList.remove('open'); sIn.blur(); return; }
    sIn.value = q.dataset.q; sBox.classList.add('has-text'); renderDesk(); sIn.focus();
  });
  sIn.addEventListener('blur', () => setTimeout(() => sBox.classList.remove('open'), 120));
  $('#searchClear').addEventListener('click', () => { sIn.value = ''; sBox.classList.remove('has-text'); sIn.focus(); renderDesk(); });

  // typing placeholder
  (function typer() {
    const words = ['চালতার আচার খুঁজুন', 'রসুনের আচার', 'কম্বো প্যাকেজ', 'তেঁতুল', 'garlic, mango…'];
    const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('bn', { granularity: 'grapheme' }) : null;
    const split = (w) => (seg ? Array.from(seg.segment(w), (s) => s.segment) : Array.from(w));
    const ph = $('#searchPh');
    let wi = 0, ci = 0, del = false;
    if (reduceMotion) { ph.textContent = words[0]; return; }
    (function step() {
      const g = split(words[wi]);
      ph.textContent = g.slice(0, ci).join('');
      if (!del && ci < g.length) ci++;
      else if (!del) { del = true; return setTimeout(step, 1600); }
      else if (ci > 0) ci--;
      else { del = false; wi = (wi + 1) % words.length; }
      setTimeout(step, del ? 45 : 95);
    })();
  })();

  // mobile sheet
  const mS = $('#msearch'), mIn = $('#msearchInput'), mBody = $('#msearchBody');
  function openMSearch() { mS.hidden = false; mBody.innerHTML = resultsHTML(mIn.value); setTimeout(() => mIn.focus(), 60); lenis && lenis.stop(); }
  function closeMSearch() { mS.hidden = true; lenis && lenis.start(); }
  $('#openSearchM').addEventListener('click', openMSearch);
  $('#tabSearch').addEventListener('click', openMSearch);
  $('#closeSearchM').addEventListener('click', closeMSearch);
  mIn.addEventListener('input', () => (mBody.innerHTML = resultsHTML(mIn.value)));
  mBody.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (!q) return;
    if (q.classList.contains('sr-item')) { pushRecent(mIn.value); closeMSearch(); return; }
    mIn.value = q.dataset.q; mBody.innerHTML = resultsHTML(mIn.value);
  });
  mIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const it = $('.sr-item', mBody); if (it) { pushRecent(mIn.value); location.hash = it.getAttribute('href'); closeMSearch(); } } });

  // category sheet
  $('#tabCats').addEventListener('click', () => ($('#catSheet').hidden = false));
  $('#catSheet').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) $('#catSheet').hidden = true; });
  function closeOverlays() { $('#catSheet').hidden = true; if (!mS.hidden) closeMSearch(); }

  /* =========================================================
     PRODUCT DETAIL
     ========================================================= */
  function renderProduct(slug) {
    const p = FZ.product(slug);
    const v = $('#view-product');
    if (!p || p.active === false) {
      v.innerHTML = `<div class="empty"><img class="empty-jar" src="images/jar-chalta.webp" alt=""><h2>আচারটি খুঁজে পাওয়া যায়নি</h2><p>লিংকটি পুরনো হতে পারে। হোম পেজ থেকে অন্য আচার দেখুন।</p><a class="btn btn-green" href="#/">হোমে ফিরুন</a></div>`;
      return;
    }
    const off = pct(p);
    const gallery = (p.gallery && p.gallery.length ? p.gallery : [p.image]);
    const items = (p.items || []).map((id) => FZ.product(id)).filter(Boolean);
    const related = FZ.activeProducts().filter((x) => x.id !== p.id)
      .map((x) => ({ x, s: x.tags.filter((t) => p.tags.includes(t)).length + (x.type === p.type ? 2 : 0) + (items.some((i) => i.id === x.id) ? 3 : 0) + ((x.items || []).includes(p.id) ? 3 : 0) }))
      .sort((a, b) => b.s - a.s || b.x.sold - a.x.sold).slice(0, 8).map((r) => r.x);
    let qty = 1;

    v.innerHTML = `<div class="pd" data-pid="${p.id}">
      <nav class="crumb"><a class="back" href="#/" data-back>${icon('back')}ফিরে যান</a><span>/</span><span>${p.type === 'package' ? 'প্যাকেজ' : 'আচার'}</span></nav>
      <div class="pd-top">
        <div class="gallery">
          <div class="gal-main card-media">${sealHTML(p)}<img id="galImg" src="${esc(gallery[0])}" alt="${esc(p.name)}"></div>
          ${gallery.length > 1 ? `<div class="gal-thumbs">${gallery.map((g, i) => `<button class="${i ? '' : 'on'}" data-g="${esc(g)}" aria-label="ছবি ${bn(i + 1)}"><img src="${esc(g)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        </div>
        <div class="pd-info">
          <div class="pd-tags">${tagsHTML(p)}</div>
          <h1>${esc(p.name)}</h1>
          <div class="card-meta"><span class="stars">${icon('star')}${bn(p.rating)}</span><span>${bn(p.reviews)}টি রিভিউ</span><span>·</span><span>${bn(p.sold)}+ বিক্রি</span></div>
          <p class="pd-short">${esc(p.short)}</p>
          <div class="pd-price"><b>${money(p.offerPrice)}</b>${off ? `<s>${money(p.price)}</s><span class="pd-off">${bn(off)}% ছাড়</span><span class="pd-save">${money(p.price - p.offerPrice)} সাশ্রয়</span>` : ''}</div>
          <div class="pd-facts">
            <div>ওজন<b>${esc(p.weight)}</b></div>
            <div>স্টক<b>${p.stock > 0 ? (p.stock <= 10 ? `মাত্র ${bn(p.stock)}টি` : 'আছে') : 'শেষ'}</b></div>
            <div>ডেলিভারি<b>২–৪ দিন</b></div>
          </div>
          <div class="pd-actions">
            <div class="qty" data-qty><button type="button" data-q="-1" aria-label="কমান">${icon('minus')}</button><output>${bn(qty)}</output><button type="button" data-q="1" aria-label="বাড়ান">${icon('plus')}</button></div>
            <button class="btn btn-green" data-act="add" ${p.stock <= 0 ? 'disabled' : ''}>${icon('bag')}ব্যাগে নিন</button>
            <button class="btn btn-red" data-act="buy" ${p.stock <= 0 ? 'disabled' : ''}>এখনই কিনুন</button>
          </div>
          <a class="pd-wa" target="_blank" rel="noopener" href="${waLink(`আসসালামু আলাইকুম, আমি "${p.name}" (${p.weight}) অর্ডার করতে চাই।`)}">${icon('chat')}WhatsApp এ সরাসরি অর্ডার করুন</a>
          <p class="pd-desc">${esc(p.description)}</p>
          ${items.length ? `<div class="pd-included"><b>এই প্যাকে যা থাকছে</b>${items.map((x) => `<a href="#/product/${x.slug}"><img src="${esc(x.image)}" alt=""><span><b>${esc(x.name)}</b><br><small>${esc(x.weight)}</small></span></a>`).join('')}</div>` : ''}
        </div>
      </div>

      ${related.length ? `<section class="pd-related"><div class="block-head"><div><h2 class="block-title">আরও পছন্দ হতে পারে</h2><p class="block-note">এই আচারের সাথে ক্রেতারা যা নেন</p></div></div><div class="row">${related.map((x, i) => cardHTML(x, i)).join('')}</div></section>` : ''}

      <section class="pd-know">
        <div class="know k-ing reveal"><h3>${icon('leaf')}উপকরণ</h3><div class="know-ing">${p.ingredients.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>
        <div class="know reveal" style="--i:1"><h3>${icon('fridge')}সংরক্ষণ পদ্ধতি</h3><ol>${p.storage.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
        <div class="know reveal"><h3>${icon('home')}কিসের সাথে খাবেন</h3><div class="know-pair">${p.pairing.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>
        <div class="know reveal" style="--i:1"><h3>${icon('shield')}উপকারিতা</h3><ul>${p.benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </section>
    </div>
    <div class="buybar">
      <div class="bb-price"><b>${money(p.offerPrice)}</b>${off ? `<s>${money(p.price)}</s>` : ''}</div>
      <div class="qty" data-qty><button type="button" data-q="-1" aria-label="কমান">${icon('minus')}</button><output>${bn(qty)}</output><button type="button" data-q="1" aria-label="বাড়ান">${icon('plus')}</button></div>
      <button class="btn btn-green" data-act="add" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'স্টক শেষ' : 'ব্যাগে নিন'}</button>
    </div>`;

    v.onclick = (e) => {
      const g = e.target.closest('[data-g]');
      if (g) { const img = $('#galImg'); img.src = g.dataset.g; img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; $$('.gal-thumbs button', v).forEach((b) => b.classList.toggle('on', b === g)); return; }
      const q = e.target.closest('[data-qty] [data-q]');
      if (q) { qty = Math.max(1, Math.min(p.stock || 1, qty + Number(q.dataset.q))); $$('[data-qty] output', v).forEach((o) => (o.textContent = bn(qty))); return; }
      const act = e.target.closest('[data-act]');
      if (act) {
        if (act.dataset.act === 'add') { addToBag(p.id, qty, $('#galImg')); }
        if (act.dataset.act === 'buy') { if (FZ.cartQty(p.id) < qty) FZ.cartSet(p.id, qty); location.hash = '#/checkout'; }
        return;
      }
      if (e.target.closest('[data-back]') && history.length > 1 && document.referrer !== '') { /* default nav to home is fine */ }
    };
    observeReveals(v);
    document.title = `${p.name} — Farzana's Home Made Achar`;
  }

  /* =========================================================
     CART
     ========================================================= */
  function renderCart() {
    S = FZ.settings();
    const v = $('#view-cart');
    const t = totals(sessionStorage.getItem('fz_district') || '');
    if (!t.lines.length) {
      v.innerHTML = `<div class="page"><div class="empty"><img class="empty-jar" src="images/jar-chalta.webp" alt=""><h2>ব্যাগ এখনো খালি</h2><p>পছন্দের আচার ব্যাগে রাখুন — এক বয়ামেই শুরু করতে পারেন।</p><a class="btn btn-green" href="#/" data-goto="all">আচার দেখুন</a></div></div>`;
      return;
    }
    const net = t.subtotal - t.discount;
    const freeLeft = S.freeDeliveryOver > 0 ? Math.max(0, S.freeDeliveryOver - net) : 0;
    const prev = sessionStorage.getItem('fz_coupon') || '';
    v.innerHTML = `<div class="page">
      <h1 class="page-title">আমার ব্যাগ <small>${bn(FZ.cartCount())}টি আইটেম</small></h1>
      <div class="cart-layout">
        <div class="cart-list">${t.lines.map((l, i) => `
          <div class="line" style="animation-delay:${i * 50}ms" data-line="${l.id}">
            <a href="#/product/${l.p.slug}"><img src="${esc(l.p.image)}" alt=""></a>
            <div>
              <a class="line-name" href="#/product/${l.p.slug}">${esc(l.p.name)}</a>
              <div class="line-meta">${esc(l.p.weight)} · একক ${money(l.p.offerPrice)}</div>
              <div class="line-price">${money(l.p.offerPrice * l.qty)}</div>
            </div>
            <div class="line-right">
              <div class="qty"><button data-cq="-1" aria-label="কমান">${icon('minus')}</button><output>${bn(l.qty)}</output><button data-cq="1" aria-label="বাড়ান">${icon('plus')}</button></div>
              <button class="line-del" data-del aria-label="সরিয়ে ফেলুন">${icon('trash')}</button>
            </div>
          </div>`).join('')}
        </div>
        <aside class="summary">
          <h3>অর্ডার সারাংশ</h3>
          ${S.freeDeliveryOver > 0 ? `<div class="free-bar">${freeLeft > 0 ? `আর ${money(freeLeft)} কিনলে ডেলিভারি ফ্রি` : 'আপনার অর্ডারে ডেলিভারি ফ্রি!'}<i style="--w:${Math.min(100, (net / S.freeDeliveryOver) * 100)}%"></i></div>` : ''}
          <div class="sum-row"><span>পণ্যের দাম</span><b>${money(t.subtotal)}</b></div>
          ${t.mrp > t.subtotal ? `<div class="sum-row"><span>অফারে সাশ্রয়</span><b style="color:var(--red)">−${money(t.mrp - t.subtotal)}</b></div>` : ''}
          <div class="coupon"><input id="couponIn" placeholder="কুপন কোড" value="${esc(prev)}" aria-label="কুপন কোড"><button id="couponBtn">${prev ? 'বদলান' : 'প্রয়োগ'}</button></div>
          ${t.coupon ? `<p class="coupon-msg ok">${esc(t.coupon)} প্রয়োগ হয়েছে · −${money(t.discount)} <button id="couponRm" style="text-decoration:underline;color:var(--ink-2)">সরান</button></p>` : t.couponError ? `<p class="coupon-msg err">${t.couponError}</p>` : ''}
          <div class="sum-row"><span>ডেলিভারি চার্জ</span><b>${t.delivery ? money(t.delivery) : 'ফ্রি'}</b></div>
          <p style="font-size:13px;color:var(--ink-2);margin:0">${esc(S.homeDistrict)}: ${money(S.deliveryInside)} · অন্য জেলা: ${money(S.deliveryOutside)}</p>
          <div class="sum-row sum-total"><span>মোট</span><b>${money(t.total)}</b></div>
          <a class="btn btn-green btn-block" href="#/checkout" style="margin-top:14px">চেকআউট করুন</a>
          <button class="btn btn-block" data-goto="all" style="margin-top:6px;color:var(--green)">আরও আচার যোগ করুন</button>
        </aside>
      </div>
    </div>`;

    v.onclick = (e) => {
      const line = e.target.closest('[data-line]');
      if (line) {
        const id = line.dataset.line;
        const q = e.target.closest('[data-cq]');
        if (q) {
          const p = FZ.product(id), n = FZ.cartQty(id) + Number(q.dataset.cq);
          if (n > p.stock) return toast(`স্টকে মাত্র ${bn(p.stock)}টি আছে।`);
          if (n <= 0) { line.classList.add('leaving'); setTimeout(() => FZ.cartSet(id, 0), 280); } else FZ.cartSet(id, n);
          updateCounts(true);
          return;
        }
        if (e.target.closest('[data-del]')) { line.classList.add('leaving'); setTimeout(() => { FZ.cartSet(id, 0); toast('আইটেমটি ব্যাগ থেকে সরানো হয়েছে'); }, 280); }
      }
      if (e.target.closest('#couponBtn')) {
        const code = $('#couponIn').value.trim().toUpperCase();
        if (!code) return;
        sessionStorage.setItem('fz_coupon', code);
        renderCart();
        if (totals().coupon) toast('কুপন প্রয়োগ হয়েছে');
      }
      if (e.target.closest('#couponRm')) { sessionStorage.removeItem('fz_coupon'); renderCart(); }
    };
    const ci = $('#couponIn');
    ci && ci.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#couponBtn').click(); });
  }

  /* =========================================================
     CHECKOUT
     ========================================================= */
  let payMethod = 'cod';
  function renderCheckout() {
    S = FZ.settings();
    const v = $('#view-checkout');
    if (!FZ.cartLines().length) { location.hash = '#/cart'; return; }
    const saved = FZ.read('fz_checkout_form', {});
    const districts = [S.homeDistrict, ...DISTRICTS.filter((d) => d !== S.homeDistrict)];
    const payBtn = (k) => { const m = PAY[k]; return `<button type="button" class="pay${payMethod === k ? ' on' : ''}" data-pay="${k}"><span class="pay-logo" style="background:${m.color}">${m.logo}</span><b>${m.label}</b><small>${m.note}</small></button>`; };

    v.innerHTML = `<div class="page">
      <h1 class="page-title">চেকআউট</h1>
      <ol class="co-steps"><li class="on">ঠিকানা</li><li class="on">পেমেন্ট</li><li>নিশ্চিত</li></ol>
      <div class="cart-layout">
        <form id="coForm" novalidate>
          <div class="fieldset">
            <h3>${icon('pin')}ডেলিভারির ঠিকানা</h3>
            <div class="fields">
              <div class="f"><label for="cName">আপনার নাম <i>*</i></label><input id="cName" name="name" autocomplete="name" value="${esc(saved.name || '')}" required><span class="err-msg">নাম লিখুন</span></div>
              <div class="f"><label for="cPhone">মোবাইল নম্বর <i>*</i></label><input id="cPhone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="01XXXXXXXXX" value="${esc(saved.phone || '')}" required><span class="err-msg">সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)</span></div>
              <div class="f"><label for="cDistrict">জেলা <i>*</i></label><select id="cDistrict" name="district" required><option value="">জেলা বাছুন</option>${districts.map((d) => `<option ${saved.district === d ? 'selected' : ''}>${d}</option>`).join('')}</select><span class="err-msg">জেলা বাছুন</span></div>
              <div class="f"><label for="cArea">থানা / উপজেলা <i>*</i></label><input id="cArea" name="area" value="${esc(saved.area || '')}" required><span class="err-msg">থানা বা উপজেলা লিখুন</span></div>
              <div class="f full"><label for="cAddress">পূর্ণ ঠিকানা <i>*</i></label><textarea id="cAddress" name="address" autocomplete="street-address" placeholder="বাসা/রোড নম্বর, এলাকা, কাছের পরিচিত জায়গা" required>${esc(saved.address || '')}</textarea><span class="err-msg">পূর্ণ ঠিকানা লিখুন</span></div>
              <div class="f"><label for="cAlt">বিকল্প নম্বর</label><input id="cAlt" name="altPhone" type="tel" inputmode="numeric" value="${esc(saved.altPhone || '')}"></div>
              <div class="f"><label for="cNote">বিশেষ নির্দেশনা</label><input id="cNote" name="note" placeholder="যেমন: বিকেলে ডেলিভারি দিন" value="${esc(saved.note || '')}"></div>
            </div>
          </div>
          <div class="fieldset">
            <h3>${icon('shield')}পেমেন্ট পদ্ধতি</h3>
            <div class="pay-group">ডেলিভারির সময়</div><div class="paygrid">${payBtn('cod')}</div>
            <div class="pay-group">মোবাইল ব্যাংকিং</div><div class="paygrid">${['bkash', 'nagad', 'rocket', 'upay'].map(payBtn).join('')}</div>
            <div class="pay-group">ব্যাংক ও কার্ড</div><div class="paygrid">${['card', 'netbank'].map(payBtn).join('')}</div>
            <p class="demo-note">অনলাইন পেমেন্ট এখন ডেমো মোডে আছে — কোনো টাকা কাটা হবে না। লাইভ করার আগে পেমেন্ট গেটওয়ে যুক্ত করতে হবে।</p>
          </div>
        </form>
        <aside class="summary" id="coSummary"></aside>
      </div>
    </div>`;

    const form = $('#coForm');
    const drawSummary = () => {
      const t = totals(form.district.value);
      $('#coSummary').innerHTML = `<h3>আপনার অর্ডার</h3>
        <div class="mini-items">${t.lines.map((l) => `<div><img src="${esc(l.p.image)}" alt=""><span>${esc(l.p.name)}<br><small style="color:var(--ink-2)">${bn(l.qty)} × ${money(l.p.offerPrice)}</small></span><b>${money(l.qty * l.p.offerPrice)}</b></div>`).join('')}</div>
        <div class="sum-row"><span>পণ্যের দাম</span><b>${money(t.subtotal)}</b></div>
        ${t.discount ? `<div class="sum-row"><span>কুপন (${esc(t.coupon)})</span><b style="color:var(--red)">−${money(t.discount)}</b></div>` : ''}
        <div class="sum-row"><span>ডেলিভারি ${form.district.value ? '' : '<small>(জেলা বাছলে ঠিক হবে)</small>'}</span><b>${t.delivery ? money(t.delivery) : 'ফ্রি'}</b></div>
        <div class="sum-row sum-total"><span>মোট</span><b>${money(t.total)}</b></div>
        <button class="btn btn-red btn-block" id="placeBtn" style="margin-top:14px">${payMethod === 'cod' ? 'অর্ডার কনফার্ম করুন' : `${PAY[payMethod].label} দিয়ে ${money(t.total)} পেমেন্ট করুন`}</button>
        <a class="btn btn-block" href="#/cart" style="margin-top:6px;color:var(--green)">ব্যাগে ফিরে যান</a>`;
    };
    drawSummary();

    const persist = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      FZ.write('fz_checkout_form', data);
      sessionStorage.setItem('fz_district', data.district || '');
    };
    form.addEventListener('input', (e) => { e.target.closest('.f') && e.target.closest('.f').classList.remove('err'); persist(); if (e.target.name === 'district') drawSummary(); });
    form.addEventListener('change', (e) => { persist(); if (e.target.name === 'district') drawSummary(); });
    form.addEventListener('submit', (e) => e.preventDefault());

    v.onclick = (e) => {
      const pb = e.target.closest('[data-pay]');
      if (pb) { payMethod = pb.dataset.pay; $$('[data-pay]', v).forEach((b) => b.classList.toggle('on', b === pb)); drawSummary(); return; }
      if (e.target.closest('#placeBtn')) placeOrder(form);
    };
  }

  function validate(form) {
    let ok = true;
    const set = (name, bad) => { const f = form[name].closest('.f'); f.classList.toggle('err', bad); if (bad && ok) { form[name].focus(); ok = false; } };
    const phone = form.phone.value.replace(/[^\d]/g, '').replace(/^88/, '');
    set('name', form.name.value.trim().length < 2);
    set('phone', !/^01[3-9]\d{8}$/.test(phone));
    set('district', !form.district.value);
    set('area', !form.area.value.trim());
    set('address', form.address.value.trim().length < 6);
    return ok;
  }

  function placeOrder(form) {
    if (!validate(form)) { toast('লাল চিহ্নিত ঘরগুলো পূরণ করুন'); return; }
    const t = totals(form.district.value);
    // stock re-check
    for (const l of t.lines) if (l.qty > FZ.product(l.id).stock) { toast(`${l.p.name} স্টকে যথেষ্ট নেই`); return; }
    const d = Object.fromEntries(new FormData(form).entries());
    const order = {
      id: FZ.newOrderId(),
      createdAt: new Date().toISOString(),
      customer: { name: d.name.trim(), phone: d.phone.replace(/[^\d]/g, '').replace(/^88/, ''), altPhone: (d.altPhone || '').trim() },
      shipping: { district: d.district, area: d.area.trim(), address: d.address.trim(), note: (d.note || '').trim() },
      items: t.lines.map((l) => ({ id: l.id, name: l.p.name, qty: l.qty, price: l.p.offerPrice, mrp: l.p.price, image: l.p.image })),
      subtotal: t.subtotal, discount: t.discount, coupon: t.coupon, delivery: t.delivery, total: t.total,
      payment: { method: payMethod, label: PAY[payMethod].label, status: 'unpaid', trxId: '' },
      status: 'pending', history: [{ status: 'pending', at: new Date().toISOString() }], source: 'web'
    };
    const finish = (pay) => {
      Object.assign(order.payment, pay || {});
      FZ.addOrder(order);
      FZ.cartClear();
      sessionStorage.removeItem('fz_coupon');
      location.hash = '#/success/' + order.id;
    };
    if (payMethod === 'cod') finish();
    else openGateway(payMethod, order, finish);
  }

  /* ---------- demo payment gateway ---------- */
  function openGateway(method, order, onPaid) {
    const m = PAY[method];
    const modal = $('#payModal'), card = $('#payCard');
    const close = () => { modal.hidden = true; lenis && lenis.start(); };
    modal.hidden = false; lenis && lenis.stop();
    modal.querySelector('.modal-back').onclick = close;
    const head = `<div class="gw-head" style="background:${m.color}"><b>${m.logo}</b><span>ডেমো পেমেন্ট</span><button class="icon-btn" data-x aria-label="বন্ধ করুন">${icon('close')}</button></div>`;
    const merchant = `<div class="gw-merchant"><span>Farzana's Achar<br><small>অর্ডার ${order.id}</small></span><b>${money(order.total)}</b></div>`;
    const trx = () => (method.slice(0, 2).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-8));
    let account = '';

    const screens = {
      wallet: () => `${head}<div class="gw-body">${merchant}
          <div class="f"><label for="gwAcc">আপনার ${m.label} অ্যাকাউন্ট নম্বর</label><input id="gwAcc" inputmode="numeric" maxlength="11" value="${esc(order.customer.phone)}" placeholder="01XXXXXXXXX"><span class="err-msg">সঠিক ১১ সংখ্যার নম্বর দিন</span></div>
          <button class="btn btn-block" style="background:${m.color};color:#fff" data-next="otp">পরবর্তী</button></div>`,
      cardForm: () => `${head}<div class="gw-body">${merchant}
          ${method === 'netbank' ? `<div class="pay-group">ব্যাংক বাছুন</div><div class="banks">${['DBBL Nexus', 'City Touch', 'BRAC Astha', 'IBBL Cellfin', 'EBL Skybanking'].map((b, i) => `<button type="button" class="${i ? '' : 'on'}" data-bank>${b}</button>`).join('')}</div>
          <div class="f"><label for="gwAcc">ইউজার আইডি</label><input id="gwAcc" placeholder="আপনার ইন্টারনেট ব্যাংকিং আইডি" style="letter-spacing:0;text-align:left"><span class="err-msg">ইউজার আইডি দিন</span></div>`
          : `<div class="f"><label for="gwAcc">কার্ড নম্বর</label><input id="gwAcc" inputmode="numeric" maxlength="19" placeholder="4242 4242 4242 4242"><span class="err-msg">সঠিক কার্ড নম্বর দিন</span></div>
          <div class="card-row"><div class="f"><label for="gwExp">মেয়াদ</label><input id="gwExp" inputmode="numeric" maxlength="5" placeholder="MM/YY"></div><div class="f"><label for="gwCvv">CVV</label><input id="gwCvv" inputmode="numeric" maxlength="4" placeholder="•••" type="password"></div></div>`}
          <button class="btn btn-block" style="background:${m.color};color:#fff" data-next="otp">পরবর্তী</button></div>`,
      otp: () => `${head}<div class="gw-body">${merchant}
          <div class="f"><label for="gwOtp">ভেরিফিকেশন কোড (OTP)</label><input id="gwOtp" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="one-time-code"><span class="err-msg">৬ সংখ্যার কোড দিন</span></div>
          <p class="gw-hint">ডেমো: যেকোনো ৬টি সংখ্যা লিখুন</p>
          <button class="btn btn-block" style="background:${m.color};color:#fff" data-next="${m.group === 'mfs' ? 'pin' : 'paying'}">যাচাই করুন</button></div>`,
      pin: () => `${head}<div class="gw-body">${merchant}
          <div class="f"><label for="gwPin">${m.label} পিন</label><input id="gwPin" type="password" inputmode="numeric" maxlength="5" placeholder="•••••"><span class="err-msg">৪ বা ৫ সংখ্যার পিন দিন</span></div>
          <p class="gw-hint">ডেমো: যেকোনো ৪–৫টি সংখ্যা</p>
          <button class="btn btn-block" style="background:${m.color};color:#fff" data-next="paying">${money(order.total)} পেমেন্ট করুন</button></div>`,
      paying: () => `${head}<div class="gw-body"><div class="gw-spin"></div><p class="gw-hint">পেমেন্ট প্রসেস হচ্ছে…</p></div>`,
      done: (id) => `${head}<div class="gw-body gw-done"><div class="tick">${icon('check')}</div><h3 style="margin:0">পেমেন্ট সফল হয়েছে</h3><p class="gw-hint">ট্রানজেকশন আইডি: <b>${id}</b></p><button class="btn btn-green btn-block" data-finish="${id}">অর্ডার সম্পন্ন করুন</button></div>`
    };

    const show = (name, arg) => {
      card.innerHTML = screens[name](arg);
      const first = card.querySelector('input'); first && setTimeout(() => first.focus(), 50);
      if (name === 'paying') setTimeout(() => show('done', trx()), 1500);
      const ccIn = card.querySelector('#gwAcc');
      if (ccIn && method === 'card') ccIn.addEventListener('input', () => { ccIn.value = ccIn.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
      const exp = card.querySelector('#gwExp');
      if (exp) exp.addEventListener('input', () => { exp.value = exp.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'); });
    };
    const bad = (sel) => { const i = card.querySelector(sel); i.closest('.f').classList.add('err'); i.focus(); return false; };
    const check = (from) => {
      if (from === 'wallet' && !/^01[3-9]\d{8}$/.test(card.querySelector('#gwAcc').value)) return bad('#gwAcc');
      if (from === 'cardForm') {
        const v = card.querySelector('#gwAcc').value.replace(/\s/g, '');
        if (method === 'card' ? v.length < 15 : v.length < 3) return bad('#gwAcc');
      }
      if (from === 'otp' && !/^\d{6}$/.test(card.querySelector('#gwOtp').value)) return bad('#gwOtp');
      if (from === 'pin' && !/^\d{4,5}$/.test(card.querySelector('#gwPin').value)) return bad('#gwPin');
      return true;
    };
    let current = m.group === 'mfs' ? 'wallet' : 'cardForm';
    card.onclick = (e) => {
      if (e.target.closest('[data-x]')) return close();
      const bank = e.target.closest('[data-bank]');
      if (bank) { $$('[data-bank]', card).forEach((b) => b.classList.toggle('on', b === bank)); return; }
      const n = e.target.closest('[data-next]');
      if (n) {
        if (!check(current)) return;
        if (current === 'wallet' || current === 'cardForm') {
          const a = card.querySelector('#gwAcc').value.replace(/\s/g, '');
          account = method === 'card' ? '**** ' + a.slice(-4) : method === 'netbank' ? (($('[data-bank].on', card) || {}).textContent || 'Bank') : a;
        }
        current = n.dataset.next; show(current); return;
      }
      const f = e.target.closest('[data-finish]');
      if (f) { close(); onPaid({ status: 'paid', trxId: f.dataset.finish, account }); }
    };
    card.onkeydown = (e) => { if (e.key === 'Enter') { const b = card.querySelector('[data-next],[data-finish]'); b && b.click(); } if (e.key === 'Escape') close(); };
    show(current);
  }

  /* =========================================================
     SUCCESS
     ========================================================= */
  function renderSuccess(id) {
    const o = FZ.orders().find((x) => x.id === id);
    const v = $('#view-success');
    if (!o) { v.innerHTML = `<div class="empty"><h2>অর্ডারটি পাওয়া যায়নি</h2><a class="btn btn-green" href="#/orders">আমার অর্ডার</a></div>`; return; }
    const msg = `আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে অর্ডার করেছি।\nঅর্ডার নম্বর: ${o.id}\nনাম: ${o.customer.name}\nমোবাইল: ${o.customer.phone}\n${o.items.map((i) => `• ${i.name} × ${i.qty}`).join('\n')}\nমোট: ৳${o.total} (${o.payment.label})`;
    v.innerHTML = `<div class="success">
      <img class="success-jar" src="images/jar-chalta.webp" alt="">
      <h1>অর্ডার হয়ে গেছে!</h1>
      <p>ধন্যবাদ, ${esc(o.customer.name)}। শিগগিরই আমরা ${esc(o.customer.phone)} নম্বরে ফোন করে অর্ডার নিশ্চিত করব।</p>
      <span class="oid">${o.id}</span>
      <div class="receipt">
        ${o.items.map((i) => `<div class="sum-row"><span>${esc(i.name)} × ${bn(i.qty)}</span><b>${money(i.price * i.qty)}</b></div>`).join('')}
        ${o.discount ? `<div class="sum-row"><span>কুপন ছাড়</span><b>−${money(o.discount)}</b></div>` : ''}
        <div class="sum-row"><span>ডেলিভারি</span><b>${o.delivery ? money(o.delivery) : 'ফ্রি'}</b></div>
        <div class="sum-row sum-total"><span>মোট</span><b>${money(o.total)}</b></div>
        <div class="sum-row"><span>পেমেন্ট</span><b>${esc(o.payment.label)} · ${o.payment.status === 'paid' ? 'পরিশোধিত' : 'ডেলিভারিতে দেবেন'}</b></div>
        ${o.payment.trxId ? `<div class="sum-row"><span>TrxID</span><b>${esc(o.payment.trxId)}</b></div>` : ''}
        <div class="sum-row"><span>ঠিকানা</span><b style="text-align:right;max-width:60%">${esc(o.shipping.address)}, ${esc(o.shipping.area)}, ${esc(o.shipping.district)}</b></div>
      </div>
      <div class="success-actions">
        <a class="btn btn-green" target="_blank" rel="noopener" href="${waLink(msg)}">${icon('chat')}WhatsApp এ জানান</a>
        <a class="btn btn-line" href="#/orders">অর্ডার ট্র্যাক করুন</a>
        <a class="btn" href="#/" style="color:var(--green)">আরও কেনাকাটা</a>
      </div>
    </div>`;
    confetti();
  }

  function confetti() {
    if (reduceMotion) return;
    const colors = ['#F6C21C', '#D42A26', '#0E5A2B', '#C98A1B', '#fff'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % 5];
      document.body.appendChild(c);
      const dur = 1800 + Math.random() * 1800;
      c.animate([{ transform: `translateY(0) rotate(0)`, opacity: 1 }, { transform: `translate(${Math.random() * 200 - 100}px, 105vh) rotate(${Math.random() * 900}deg)`, opacity: 0.7 }], { duration: dur, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).onfinish = () => c.remove();
    }
  }

  /* =========================================================
     MY ORDERS
     ========================================================= */
  function orderCard(o) {
    const step = TRACK.indexOf(o.status);
    return `<article class="ord">
      <div class="ord-head"><div><div class="ord-id">${o.id}</div><div class="ord-date">${fmtDate(o.createdAt)}</div></div><span class="status st-${o.status}">${STATUS[o.status]}</span></div>
      ${o.status === 'cancelled' ? '<p style="color:var(--red-700);margin:12px 0 4px">এই অর্ডারটি বাতিল করা হয়েছে। প্রশ্ন থাকলে WhatsApp এ যোগাযোগ করুন।</p>' : `<ol class="track">${TRACK.map((s, i) => `<li class="${i <= step ? 'done' : ''}">${STATUS[s]}</li>`).join('')}</ol>`}
      <div class="ord-items">${o.items.map((i) => `${esc(i.name)} × ${bn(i.qty)}`).join(', ')}</div>
      <div class="sum-row" style="padding-bottom:0"><span>${esc(o.payment.label)} · ${o.payment.status === 'paid' ? 'পরিশোধিত' : 'অপরিশোধিত'}</span><b>${money(o.total)}</b></div>
    </article>`;
  }
  function renderOrders() {
    const v = $('#view-orders');
    const mine = FZ.myOrders();
    v.innerHTML = `<div class="page" style="max-width:820px">
      <h1 class="page-title">আমার অর্ডার</h1>
      <div class="lookup"><input id="lookIn" placeholder="অর্ডার নম্বর লিখুন (যেমন FZ260914-AB12)" aria-label="অর্ডার নম্বর"><button class="btn btn-green" id="lookBtn">খুঁজুন</button></div>
      <div id="lookRes"></div>
      ${mine.length ? mine.map(orderCard).join('') : `<div class="empty"><img class="empty-jar" src="images/jar-rosun.webp" alt=""><h2>এখনো কোনো অর্ডার নেই</h2><p>এই ডিভাইস থেকে করা অর্ডারগুলো এখানে দেখা যাবে।</p><a class="btn btn-green" href="#/">আচার দেখুন</a></div>`}
    </div>`;
    const find = () => {
      const q = $('#lookIn').value.trim().toUpperCase();
      const o = FZ.orders().find((x) => x.id.toUpperCase() === q);
      $('#lookRes').innerHTML = q ? (o ? orderCard(o) : '<p style="color:var(--red)">এই নম্বরে কোনো অর্ডার পাওয়া যায়নি। নম্বরটি আবার দেখে লিখুন।</p>') : '';
    };
    $('#lookBtn').onclick = find;
    $('#lookIn').onkeydown = (e) => e.key === 'Enter' && find();
  }

  /* =========================================================
     ROUTER
     ========================================================= */
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [a, b] = h.split('/');
    if (a === 'product' && b) return { name: 'product', slug: decodeURIComponent(b) };
    if (a === 'cart') return { name: 'cart' };
    if (a === 'checkout') return { name: 'checkout' };
    if (a === 'success' && b) return { name: 'success', id: b };
    if (a === 'orders') return { name: 'orders' };
    return { name: 'home' };
  }

  function render(keepScroll) {
    const prev = route.name;
    if (prev === 'home' && !keepScroll) homeScroll = scrollY;
    route = parse();
    $$('.view').forEach((v) => (v.hidden = v.dataset.view !== route.name));
    document.body.classList.toggle('on-product', route.name === 'product');
    $$('.tabbar [data-tab]').forEach((t) => t.classList.toggle('on', t.dataset.tab === route.name));
    if (route.name !== 'product') document.title = "Farzana's Home Made Achar — দেশি স্বাদ, ঘরের মতো যত্নে";

    if (route.name === 'home') renderHome();
    if (route.name === 'product') renderProduct(route.slug);
    if (route.name === 'cart') renderCart();
    if (route.name === 'checkout') renderCheckout();
    if (route.name === 'success') renderSuccess(route.id);
    if (route.name === 'orders') renderOrders();

    if (keepScroll) return;
    const jump = (y) => (lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y));
    if (route.name === 'home' && pendingGoto) { const g = pendingGoto; pendingGoto = null; jump(0); requestAnimationFrame(() => gotoSection(g)); }
    else if (route.name === 'home' && prev !== 'home') requestAnimationFrame(() => jump(homeScroll));
    else if (prev !== route.name || route.name === 'product') jump(0);
  }
  window.addEventListener('hashchange', () => render(false));

  // live updates when admin edits data in another tab
  window.addEventListener('storage', (e) => {
    if ([FZ.KEYS.products, FZ.KEYS.settings, FZ.KEYS.orders].includes(e.key)) { S = FZ.settings(); fillStatic(); if (route.name !== 'checkout') render(true); }
    if (e.key === FZ.KEYS.cart) { syncAdds(); updateCounts(false); if (route.name === 'cart') renderCart(); }
  });

  /* =========================================================
     Static bits, scroll meter, header
     ========================================================= */
  function fillStatic() {
    const n = S.notices && S.notices.length ? S.notices : [S.tagline];
    const one = n.map((x) => `<span>${esc(x)}</span>`).join('');
    $('#ticker').innerHTML = one + one + one + one;
    $('#fAddress').textContent = S.address;
    $('#fPhone').textContent = S.phone; $('#fPhone').href = 'tel:' + S.phone;
    $('#fWa').href = waLink('আসসালামু আলাইকুম, আমি আচার অর্ডার করতে চাই।');
    $('#heroWa').href = $('#fWa').href;
    $('#fFb').href = S.facebook || '#';
    $('#fYear').textContent = bn(new Date().getFullYear());
  }

  const meter = $('#meter'), fill = $('#meterFill'), wave = $('#meterWave'), pctEl = $('#meterPct'), topbar = $('#topbar');
  const heroJar = $('.hero-jar');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const y = 54 - p * 40;
      fill.setAttribute('y', y);
      wave.setAttribute('d', `M0 ${y} q5.5 -3 11 0 t11 0 t11 0 t11 0 t11 0 v40 h-55z`);
      pctEl.textContent = bn(Math.round(p * 100)) + '%';
      meter.classList.toggle('hide', scrollY < 120);
      topbar.classList.toggle('scrolled', scrollY > 8);
      if (route.name === 'home' && heroJar && !reduceMotion && scrollY < 900) heroJar.style.transform = `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.012}deg)`;
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  meter.addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 1.2 }) : scrollTo({ top: 0, behavior: 'smooth' })));

  // smooth (inertia) scrolling on desktop pointers only; touch keeps native scrolling
  function initLenis() {
    if (reduceMotion || !matchMedia('(pointer: fine)').matches) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js';
    s.onload = () => {
      if (!window.Lenis) return;
      lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, prevent: (node) => !!node.closest && !!node.closest('.search-panel, .modal-card, .msearch-body, .mini-items') });
      document.documentElement.classList.add('lenis');
      lenis.on('scroll', onScroll);
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    };
    document.head.appendChild(s);
  }

  /* ---------- PWA (installable, works like an app on phones) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  /* ---------- boot ---------- */
  fillStatic();
  updateCounts(false);
  render(false);
  onScroll();
  initLenis();
})();
