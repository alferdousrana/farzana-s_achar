/* =========================================================
   Farzana's Home Made Achar — admin panel
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const M = FZ.moneyEn;
  const ico = (n) => `<svg><use href="#a-${n}"/></svg>`;

  const STATUS = { pending: 'অপেক্ষমাণ', confirmed: 'কনফার্মড', processing: 'প্রস্তুত হচ্ছে', shipped: 'পাঠানো হয়েছে', delivered: 'ডেলিভারি সম্পন্ন', cancelled: 'বাতিল' };
  const STATUS_COLOR = { pending: '#E0A800', confirmed: '#2F6FB3', processing: '#7B48B5', shipped: '#169184', delivered: '#0E5A2B', cancelled: '#D42A26' };
  const PAY = { cod: 'ক্যাশ অন ডেলিভারি', bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট', upay: 'উপায়', card: 'কার্ড', netbank: 'ইন্টারনেট ব্যাংকিং' };
  const PAY_COLOR = { cod: '#0E5A2B', bkash: '#E2136E', nagad: '#EE4023', rocket: '#8C3494', upay: '#1A4FA0', card: '#1A1F71', netbank: '#355E3B' };
  const TAGS = { featured: 'ফিচার্ড', hot: 'হট ডিল', best: 'বেস্ট সেলার', popular: 'জনপ্রিয়' };
  const DISTRICTS = ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মানিকগঞ্জ', 'মুন্সিগঞ্জ', 'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'গোপালগঞ্জ', 'মাদারীপুর', 'রাজবাড়ী', 'শরীয়তপুর', 'চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'ব্রাহ্মণবাড়িয়া', 'চাঁদপুর', 'ফেনী', 'লক্ষ্মীপুর', 'নোয়াখালী', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান', 'রাজশাহী', 'নাটোর', 'নওগাঁ', 'চাঁপাইনবাবগঞ্জ', 'পাবনা', 'সিরাজগঞ্জ', 'বগুড়া', 'জয়পুরহাট', 'খুলনা', 'যশোর', 'সাতক্ষীরা', 'বাগেরহাট', 'নড়াইল', 'মাগুরা', 'ঝিনাইদহ', 'কুষ্টিয়া', 'চুয়াডাঙ্গা', 'মেহেরপুর', 'বরিশাল', 'ঝালকাঠি', 'পটুয়াখালী', 'পিরোজপুর', 'ভোলা', 'বরগুনা', 'সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ', 'রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'লালমনিরহাট', 'নীলফামারী', 'পঞ্চগড়', 'ঠাকুরগাঁও', 'ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'];
  const LOW_STOCK = 10;

  const fmtDate = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const stChip = (s) => `<span class="chip st-${s}">${STATUS[s] || s}</span>`;
  const payChip = (o) => `<span class="chip ${o.payment.status === 'paid' ? 'paid' : 'unpaid'}">${o.payment.status === 'paid' ? 'পরিশোধিত' : 'অপরিশোধিত'}</span>`;
  const itemCount = (o) => o.items.reduce((s, i) => s + i.qty, 0);
  const counts = (o) => o.status !== 'cancelled';

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'atoast';
    t.textContent = msg;
    $('#atoasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2400);
  }
  function download(name, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(name, rows) {
    const text = rows.map((r) => r.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    download(name, '\ufeff' + text, 'text/csv;charset=utf-8');
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  /* ---------- auth ---------- */
  const SESSION = 'fz_admin_session';
  const loggedIn = () => {
    try { const s = JSON.parse(sessionStorage.getItem(SESSION) || 'null'); return s && s.exp > Date.now(); } catch (e) { return false; }
  };
  async function checkLogin(user, pass) {
    const a = FZ.settings().admin || { user: 'admin', passHash: '' };
    const expected = a.passHash || (await FZ.hash('farzana123'));
    return user.trim() === (a.user || 'admin') && (await FZ.hash(pass)) === expected;
  }
  function showLogin() {
    $('#shell').hidden = true;
    $('#login').hidden = false;
    setTimeout(() => $('#loginForm [name=user]').focus(), 50);
  }
  function showApp() {
    $('#login').hidden = true;
    $('#shell').hidden = false;
    route();
  }
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    const ok = await checkLogin(f.user.value, f.pass.value);
    btn.disabled = false;
    if (ok) {
      sessionStorage.setItem(SESSION, JSON.stringify({ exp: Date.now() + 8 * 36e5 }));
      $('#loginErr').hidden = true;
      f.reset();
      showApp();
    } else {
      $('#loginErr').hidden = false;
      f.pass.value = '';
      f.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 });
    }
  });
  function logout() { sessionStorage.removeItem(SESSION); location.hash = ''; showLogin(); }
  $('#logout').addEventListener('click', logout);

  /* ---------- drawer / modal ---------- */
  function openDrawer(html) { $('#drawerCard').innerHTML = html; $('#drawer').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeDrawer() { $('#drawer').hidden = true; if ($('#amodal').hidden) document.body.style.overflow = ''; }
  function openModal(html) { $('#amodalCard').innerHTML = html; $('#amodal').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { $('#amodal').hidden = true; if ($('#drawer').hidden) document.body.style.overflow = ''; }
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (!c) return;
    if (c.closest('#amodal')) closeModal(); else if (c.closest('#drawer')) closeDrawer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#amodal').hidden) closeModal(); else if (!$('#drawer').hidden) closeDrawer();
  });
  function confirmBox(title, text, okLabel = 'হ্যাঁ, নিশ্চিত') {
    return new Promise((res) => {
      openModal(`<div class="m-head"><h2>${esc(title)}</h2><button class="icon" data-close aria-label="বন্ধ">${ico('close')}</button></div>
        <div class="m-body"><p style="margin:0">${text}</p></div>
        <div class="m-foot"><button class="btn btn-line" data-close>না</button><button class="btn btn-red" id="cfOk">${esc(okLabel)}</button></div>`);
      const card = $('#amodalCard');
      const done = (v) => { obs.disconnect(); res(v); };
      const obs = new MutationObserver(() => { if ($('#amodal').hidden) done(false); });
      obs.observe($('#amodal'), { attributes: true, attributeFilter: ['hidden'] });
      $('#cfOk', card).onclick = () => { obs.disconnect(); closeModal(); res(true); };
    });
  }

  /* ---------- router ---------- */
  const PAGES = {
    dashboard: { title: 'ড্যাশবোর্ড', render: renderDashboard },
    orders: { title: 'অর্ডার', render: renderOrders },
    customers: { title: 'কাস্টমার', render: renderCustomers },
    products: { title: 'প্রোডাক্ট', render: renderProducts },
    settings: { title: 'সেটিংস', render: renderSettings }
  };
  let current = 'dashboard';
  function route() {
    if (!loggedIn()) { showLogin(); return; }
    const key = (location.hash || '#dashboard').slice(1).split('/')[0];
    current = PAGES[key] ? key : 'dashboard';
    $$('#sideNav a').forEach((a) => a.classList.toggle('on', a.dataset.page === current));
    $('#pageTitle').textContent = PAGES[current].title;
    document.title = PAGES[current].title + ' — অ্যাডমিন';
    $('#headActions').innerHTML = '';
    const page = $('#page');
    page.style.animation = 'none'; void page.offsetWidth; page.style.animation = '';
    PAGES[current].render(page);
    updateBadge();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => { closeDrawer(); closeModal(); route(); });
  function refresh() { if (loggedIn() && !$('#shell').hidden) { $('#headActions').innerHTML = ''; PAGES[current].render($('#page')); updateBadge(); } }
  function updateBadge() {
    const n = FZ.orders().filter((o) => o.status === 'pending').length;
    $('#navPending').textContent = n ? n : '';
  }
  // live updates when a customer places an order in another tab
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith('fz_')) return;
    if (e.key === FZ.KEYS.orders) {
      const before = e.oldValue ? JSON.parse(e.oldValue).length : 0;
      const after = e.newValue ? JSON.parse(e.newValue).length : 0;
      if (after > before) toast('🔔 নতুন অর্ডার এসেছে!');
    }
    updateBadge();
    if ($('#amodal').hidden && $('#drawer').hidden && current !== 'settings') refresh();
  });

  /* =========================================================
     DASHBOARD
     ========================================================= */
  let period = 30;
  function inRange(o, from, to) { const t = new Date(o.createdAt).getTime(); return t >= from && t < to; }

  function renderDashboard(page) {
    $('#headActions').innerHTML = `<div class="seg" id="periodSeg">${[[7, '৭ দিন'], [30, '৩০ দিন'], [90, '৯০ দিন'], [0, 'সব']].map(([v, l]) => `<button data-p="${v}" class="${period === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    $('#periodSeg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; period = +b.dataset.p; renderDashboard(page); };

    const all = FZ.orders();
    const products = FZ.products();
    const now = Date.now();
    const DAY = 864e5;
    const from = period ? now - period * DAY : 0;
    const list = all.filter((o) => inRange(o, from, now + DAY));
    const prev = period ? all.filter((o) => inRange(o, from - period * DAY, from)) : [];
    const valid = list.filter(counts);
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const prevRevenue = prev.filter(counts).reduce((s, o) => s + o.total, 0);
    const aov = valid.length ? revenue / valid.length : 0;
    const firstOrder = {};
    all.slice().reverse().forEach((o) => { const p = o.customer.phone; if (!firstOrder[p]) firstOrder[p] = new Date(o.createdAt).getTime(); });
    const newCustomers = Object.values(firstOrder).filter((t) => t >= from).length;
    const pending = all.filter((o) => o.status === 'pending').length;
    const low = products.filter((p) => p.active !== false && p.stock <= LOW_STOCK);
    const trend = (a, b) => {
      if (!period || !b) return '';
      const d = Math.round(((a - b) / b) * 100);
      return `<em class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}% আগের তুলনায়</em>`;
    };

    if (!all.length) {
      page.innerHTML = `<div class="panel empty"><b>এখনো কোনো অর্ডার নেই</b>স্টোরে অর্ডার এলে এখানে বিশ্লেষণ দেখা যাবে। পরীক্ষার জন্য সেটিংস থেকে ডেমো অর্ডার তৈরি করতে পারেন।<br><br><a class="btn btn-green" href="#settings">সেটিংসে যান</a></div>` + lowStockPanel(low);
      return;
    }

    page.innerHTML = `
      <div class="kpis">
        <div class="kpi hl"><span>মোট বিক্রি</span><b>${M(revenue)}</b>${trend(revenue, prevRevenue)}</div>
        <div class="kpi"><span>অর্ডার</span><b>${list.length}</b>${trend(list.length, prev.length)}</div>
        <div class="kpi"><span>গড় অর্ডার মূল্য</span><b>${M(aov)}</b></div>
        <div class="kpi"><span>নতুন কাস্টমার</span><b>${newCustomers}</b></div>
        <a class="kpi ${pending ? 'warn' : ''}" href="#orders" style="text-decoration:none"><span>অপেক্ষমাণ অর্ডার</span><b>${pending}</b><em class="muted">দেখতে ক্লিক করুন</em></a>
        <a class="kpi ${low.length ? 'warn' : ''}" href="#products" style="text-decoration:none"><span>স্টক কম (≤${LOW_STOCK})</span><b>${low.length}</b><em class="muted">প্রোডাক্ট</em></a>
      </div>
      <div class="dash">
        <div class="panel wide chart"><h2>বিক্রির ট্রেন্ড <small>বাতিল অর্ডার বাদে</small></h2>${revenueChart(valid, from || (all.length ? new Date(all[all.length - 1].createdAt).getTime() : now), now)}</div>
        <div class="panel"><h2>সেরা প্রোডাক্ট <small>বিক্রিত পরিমাণ</small></h2>${topProducts(valid)}</div>
        <div class="panel chart"><h2>অর্ডার স্ট্যাটাস</h2>${statusDonut(list)}</div>
        <div class="panel tall"><h2>সাম্প্রতিক অর্ডার <small><a href="#orders">সব দেখুন →</a></small></h2>${recentTable(all.slice(0, 9))}</div>
        <div class="panel"><h2>পেমেন্ট মেথড</h2>${payBars(valid)}</div>
        <div class="panel"><h2>শীর্ষ জেলা</h2>${districtBars(valid)}</div>
        ${low.length ? `<div class="panel">${lowStockInner(low)}</div>` : ''}
      </div>`;
    requestAnimationFrame(() => $$('.track i', page).forEach((i) => { i.style.width = i.dataset.w + '%'; }));
    $$('tr[data-oid]', page).forEach((tr) => tr.onclick = () => openOrder(tr.dataset.oid));
  }
  function lowStockInner(low) {
    return `<h2>স্টক কম <small><a href="#products">ম্যানেজ করুন →</a></small></h2><div class="bars">${low.map((p) => `<div class="bar-row"><span>${esc(p.name)}</span><div class="track"><i data-w="${Math.min(100, p.stock * 10)}" style="background:var(--red)"></i></div><b class="low">${p.stock}</b></div>`).join('')}</div>`;
  }
  const lowStockPanel = (low) => (low.length ? `<div class="panel" style="margin-top:14px">${lowStockInner(low)}</div>` : '');

  function revenueChart(orders, from, to) {
    const DAY = 864e5;
    const spanDays = Math.max(1, Math.ceil((to - from) / DAY));
    let step = 'day';
    if (spanDays > 120) step = 'month'; else if (spanDays > 35) step = 'week';
    const buckets = [];
    const start = new Date(from); start.setHours(0, 0, 0, 0);
    if (step === 'month') start.setDate(1);
    if (step === 'week') start.setDate(start.getDate() - start.getDay());
    for (let d = new Date(start); d.getTime() <= to; ) {
      const s = d.getTime();
      const n = new Date(d);
      if (step === 'day') n.setDate(n.getDate() + 1); else if (step === 'week') n.setDate(n.getDate() + 7); else n.setMonth(n.getMonth() + 1);
      buckets.push({ s, e: n.getTime(), v: 0, c: 0, label: step === 'month' ? d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : fmtDay(d) });
      d = n;
    }
    orders.forEach((o) => { const t = new Date(o.createdAt).getTime(); const b = buckets.find((x) => t >= x.s && t < x.e); if (b) { b.v += o.total; b.c++; } });
    const W = 760, H = 240, pl = 52, pr = 30, pt = 14, pb = 30;
    const max = Math.max(100, ...buckets.map((b) => b.v));
    const raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const stepV = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((v) => v >= raw);
    const top = stepV * 4;
    const n = buckets.length;
    const x = (i) => pl + (n === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (n - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - v / top);
    const pts = buckets.map((b, i) => [x(i), y(b.v)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ` L${x(n - 1).toFixed(1)} ${H - pb} L${x(0).toFixed(1)} ${H - pb} Z`;
    const grid = [0, .25, .5, .75, 1].map((f) => { const v = top * f; return `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#ECE8DA"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : v}</text>`; }).join('');
    const every = Math.ceil(n / 8);
    const labels = buckets.map((b, i) => ((i % every === 0 && n - 1 - i >= every / 2) || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${b.label}</text>` : '')).join('');
    const dots = buckets.map((b, i) => `<g class="dot"><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${n > 40 ? 2.5 : 4}" fill="#fff" stroke="#0E5A2B" stroke-width="2"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="12" fill="transparent"><title>${b.label}: ${M(b.v)} · ${b.c}টি অর্ডার</title></circle></g>`).join('');
    const totalOrders = buckets.reduce((s, b) => s + b.c, 0);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="বিক্রির চার্ট">
      <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98A1B" stop-opacity=".45"/><stop offset="1" stop-color="#F6C21C" stop-opacity=".02"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#rg)"/><path d="${line}" fill="none" stroke="#0E5A2B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.1s ease forwards"/>${dots}${labels}
    </svg><style>@keyframes draw{to{stroke-dashoffset:0}}</style>
    <div class="legend"><span><i style="background:#0E5A2B"></i>বিক্রি (${step === 'day' ? 'দৈনিক' : step === 'week' ? 'সাপ্তাহিক' : 'মাসিক'})</span><span>মোট ${totalOrders}টি অর্ডার</span></div>`;
  }

  function statusDonut(list) {
    const c = {};
    list.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    const total = list.length || 1;
    const R = 54, C = 2 * Math.PI * R;
    let off = 0;
    const segs = Object.keys(STATUS).filter((s) => c[s]).map((s) => {
      const len = (c[s] / total) * C;
      const seg = `<circle r="${R}" cx="80" cy="80" fill="none" stroke="${STATUS_COLOR[s]}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"><title>${STATUS[s]}: ${c[s]}</title></circle>`;
      off += len;
      return seg;
    }).join('');
    return `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 160 160" style="width:150px;flex:none">${segs}<text x="80" y="78" text-anchor="middle" style="font-size:26px;font-weight:700;fill:var(--ink)">${list.length}</text><text x="80" y="98" text-anchor="middle">অর্ডার</text></svg>
      <div class="legend" style="display:grid;gap:6px">${Object.keys(STATUS).map((s) => `<span><i style="background:${STATUS_COLOR[s]}"></i>${STATUS[s]} — <b>${c[s] || 0}</b></span>`).join('')}</div></div>`;
  }

  function barsHTML(rows, color) {
    if (!rows.length) return '<p class="muted">কোনো ডেটা নেই</p>';
    const max = Math.max(...rows.map((r) => r.v));
    return `<div class="bars">${rows.map((r) => `<div class="bar-row"><span title="${esc(r.k)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.k)}</span><div class="track"><i data-w="${(r.v / max) * 100}" style="background:${r.c || color}"></i></div><b class="num">${r.label}</b></div>`).join('')}</div>`;
  }
  function topProducts(orders) {
    const m = {};
    orders.forEach((o) => o.items.forEach((i) => { m[i.name] = m[i.name] || { q: 0, r: 0 }; m[i.name].q += i.qty; m[i.name].r += i.qty * i.price; }));
    const rows = Object.entries(m).sort((a, b) => b[1].q - a[1].q).slice(0, 6).map(([k, v]) => ({ k, v: v.q, label: `${v.q} · ${M(v.r)}` }));
    return barsHTML(rows, 'var(--oil)');
  }
  function payBars(orders) {
    const m = {};
    orders.forEach((o) => { m[o.payment.method] = (m[o.payment.method] || 0) + o.total; });
    return barsHTML(Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k: PAY[k] || k, v, label: M(v), c: PAY_COLOR[k] })), 'var(--green)');
  }
  function districtBars(orders) {
    const m = {};
    orders.forEach((o) => { m[o.shipping.district] = (m[o.shipping.district] || 0) + 1; });
    return barsHTML(Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ k, v, label: v + 'টি' })), 'var(--green-600)');
  }
  function recentTable(list) {
    return `<div class="table-wrap"><table><tbody>${list.map((o) => `<tr class="click" data-oid="${o.id}"><td><b>${esc(o.customer.name)}</b><br><small class="muted">${o.id}</small></td><td>${stChip(o.status)}</td><td class="r"><b>${M(o.total)}</b></td></tr>`).join('')}</tbody></table></div>`;
  }

  /* expose for part 2 */
  window.__FZA = { $, $$, esc, M, ico, STATUS, STATUS_COLOR, PAY, TAGS, DISTRICTS, LOW_STOCK, fmtDate, fmtDay, stChip, payChip, itemCount, counts, toast, download, csv, stamp, openDrawer, closeDrawer, openModal, closeModal, confirmBox, refresh, updateBadge, logout, route, loggedIn, showApp, showLogin, barsHTML };
  function renderOrders(p) { window.__FZA.renderOrders(p); }
  function renderCustomers(p) { window.__FZA.renderCustomers(p); }
  function renderProducts(p) { window.__FZA.renderProducts(p); }
  function renderSettings(p) { window.__FZA.renderSettings(p); }
  function openOrder(id) { window.__FZA.openOrder(id); }
})();
