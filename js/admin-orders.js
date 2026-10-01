/* Admin — orders & customers */
(function () {
  'use strict';
  const A = window.__FZA;
  const { $, $$, esc, M, ico, STATUS, PAY, DISTRICTS, fmtDate, stChip, payChip, itemCount, counts, toast, csv, stamp, openDrawer, closeDrawer, openModal, closeModal, confirmBox, refresh } = A;

  /* ---------- shared order helpers ---------- */
  // keep stock in sync when an order is cancelled / restored
  function adjustStock(order, dir) {
    const ps = FZ.products();
    order.items.forEach((it) => {
      const p = ps.find((x) => x.id === it.id);
      if (p) { p.stock = Math.max(0, p.stock + dir * it.qty); p.sold = Math.max(0, (p.sold || 0) - dir * it.qty); }
    });
    FZ.saveProducts(ps);
  }
  function setStatus(id, status) {
    const o = FZ.orders().find((x) => x.id === id);
    if (!o || o.status === status) return o;
    if (status === 'cancelled') adjustStock(o, +1);
    else if (o.status === 'cancelled') adjustStock(o, -1);
    const history = (o.history || []).concat({ status, at: new Date().toISOString() });
    const patch = { status, history };
    if (status === 'delivered' && o.payment.method === 'cod') patch.payment = Object.assign({}, o.payment, { status: 'paid' });
    FZ.updateOrder(id, patch);
    toast(`${id} → ${STATUS[status]}`);
    A.updateBadge();
    return FZ.orders().find((x) => x.id === id);
  }
  const waLink = (phone, text) => `https://wa.me/88${phone}?text=${encodeURIComponent(text)}`;

  /* =========================================================
     ORDERS
     ========================================================= */
  const ost = { tab: 'all', q: '', limit: 50 };
  function filterOrders() {
    const q = ost.q.trim().toLowerCase();
    return FZ.orders().filter((o) => (ost.tab === 'all' || o.status === ost.tab) && (!q || [o.id, o.customer.name, o.customer.phone, o.shipping.district, o.shipping.area, o.payment.trxId].join(' ').toLowerCase().includes(q)));
  }
  A.renderOrders = function (page) {
    $('#headActions').innerHTML = `<button class="btn btn-line" id="oCsv">${ico('down')} CSV</button><button class="btn btn-green" id="oNew">${ico('plus')} নতুন অর্ডার</button>`;
    $('#oCsv').onclick = () => {
      const rows = [['Order ID', 'Date', 'Name', 'Phone', 'District', 'Area', 'Address', 'Items', 'Subtotal', 'Discount', 'Coupon', 'Delivery', 'Total', 'Payment', 'Pay status', 'TrxID', 'Status']];
      filterOrders().forEach((o) => rows.push([o.id, fmtDate(o.createdAt), o.customer.name, o.customer.phone, o.shipping.district, o.shipping.area, o.shipping.address, o.items.map((i) => `${i.name} x${i.qty}`).join('; '), o.subtotal, o.discount, o.coupon || '', o.delivery, o.total, PAY[o.payment.method] || o.payment.method, o.payment.status, o.payment.trxId || '', STATUS[o.status]]));
      csv(`orders-${stamp()}.csv`, rows);
    };
    $('#oNew').onclick = manualOrder;

    const all = FZ.orders();
    const c = { all: all.length };
    all.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    page.innerHTML = `
      <div class="tabs" id="oTabs">${[['all', 'সব'], ...Object.entries(STATUS)].map(([k, l]) => `<button data-t="${k}" class="${ost.tab === k ? 'on' : ''}">${l}<b>${c[k] || 0}</b></button>`).join('')}</div>
      <div class="toolbar"><label class="searchbox">${ico('search')}<input class="inp" id="oQ" placeholder="আইডি, নাম, ফোন, জেলা, TrxID…" value="${esc(ost.q)}"></label></div>
      <div id="oList"></div>`;
    $('#oTabs').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; ost.tab = b.dataset.t; ost.limit = 50; A.renderOrders(page); };
    $('#oQ').oninput = (e) => { ost.q = e.target.value; ost.limit = 50; drawList(); };
    drawList();

    function drawList() {
      const list = filterOrders();
      const box = $('#oList');
      if (!list.length) { box.innerHTML = `<div class="panel empty"><b>কোনো অর্ডার পাওয়া যায়নি</b>${all.length ? 'ফিল্টার বা সার্চ পরিবর্তন করে দেখুন।' : 'কাস্টমার অর্ডার করলে এখানে দেখা যাবে।'}</div>`; return; }
      box.innerHTML = `<div class="table-wrap cards"><table class="otable">
        <thead><tr><th>অর্ডার</th><th>কাস্টমার</th><th>ঠিকানা</th><th class="r">আইটেম</th><th class="r">মোট</th><th>পেমেন্ট</th><th>স্ট্যাটাস</th></tr></thead>
        <tbody>${list.slice(0, ost.limit).map((o) => `<tr class="click" data-oid="${o.id}">
          <td><b>${o.id}</b><br><small class="muted">${fmtDate(o.createdAt)}</small></td>
          <td data-l="কাস্টমার"><b>${esc(o.customer.name)}</b> <small class="muted">${esc(o.customer.phone)}</small></td>
          <td data-l="ঠিকানা">${esc(o.shipping.district)}<small class="muted">, ${esc(o.shipping.area)}</small></td>
          <td class="r" data-l="আইটেম">${itemCount(o)}</td>
          <td class="r"><b>${M(o.total)}</b></td>
          <td data-l="${esc(PAY[o.payment.method] || '')}">${payChip(o)}</td>
          <td class="r"><select class="status-sel" data-sel="${o.id}">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        </tr>`).join('')}</tbody></table></div>
        ${list.length > ost.limit ? `<div style="text-align:center;margin-top:12px"><button class="btn btn-line" id="oMore">আরও দেখুন (${list.length - ost.limit})</button></div>` : ''}`;
      $$('tr[data-oid]', box).forEach((tr) => tr.addEventListener('click', (e) => { if (e.target.closest('select')) return; openOrder(tr.dataset.oid); }));
      $$('select[data-sel]', box).forEach((s) => s.addEventListener('change', () => { setStatus(s.dataset.sel, s.value); A.renderOrders(page); }));
      const more = $('#oMore'); if (more) more.onclick = () => { ost.limit += 50; drawList(); };
    }
  };

  function openOrder(id) {
    const o = FZ.orders().find((x) => x.id === id);
    if (!o) { toast('অর্ডারটি পাওয়া যায়নি'); return; }
    const S = FZ.settings();
    const msg = `আসসালামু আলাইকুম ${o.customer.name}, ${S.storeName} থেকে বলছি। আপনার অর্ডার ${o.id} (মোট ${M(o.total)}) এর স্ট্যাটাস: ${STATUS[o.status]}। ধন্যবাদ!`;
    openDrawer(`
      <div class="d-head"><h2>${o.id}</h2>${stChip(o.status)}<button class="icon" data-close aria-label="বন্ধ">${ico('close')}</button></div>
      <div class="d-body">
        <div class="d-sec"><h3>স্ট্যাটাস পরিবর্তন</h3>
          <div class="st-buttons">${Object.entries(STATUS).map(([k, l]) => `<button data-st="${k}" class="${k === o.status ? 'on st-' + k : ''}">${l}</button>`).join('')}</div></div>
        <div class="d-sec"><h3>কাস্টমার</h3>
          <dl class="kv"><dt>নাম</dt><dd>${esc(o.customer.name)}</dd><dt>ফোন</dt><dd>${esc(o.customer.phone)}${o.customer.altPhone ? ' / ' + esc(o.customer.altPhone) : ''}</dd>
          <dt>জেলা</dt><dd>${esc(o.shipping.district)}</dd><dt>এলাকা</dt><dd>${esc(o.shipping.area)}</dd><dt>ঠিকানা</dt><dd>${esc(o.shipping.address)}</dd>
          ${o.shipping.note ? `<dt>নোট</dt><dd>${esc(o.shipping.note)}</dd>` : ''}<dt>অর্ডারের সময়</dt><dd>${fmtDate(o.createdAt)}</dd><dt>উৎস</dt><dd>${o.source === 'admin' ? 'অ্যাডমিন (ম্যানুয়াল)' : o.source === 'demo' ? 'ডেমো' : 'ওয়েবসাইট'}</dd></dl>
          <div class="d-actions" style="margin-top:10px"><a class="btn btn-line btn-sm" href="tel:${esc(o.customer.phone)}">${ico('phone')} কল</a><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${waLink(o.customer.phone, msg)}">${ico('chat')} WhatsApp</a></div></div>
        <div class="d-sec"><h3>আইটেম</h3><div class="d-items">${o.items.map((i) => `<div><img src="${esc(i.image)}" alt=""><span>${esc(i.name)} <small class="muted">× ${i.qty}</small></span><b>${M(i.price * i.qty)}</b></div>`).join('')}</div>
          <div style="margin-top:10px"><div class="srow"><span>সাবটোটাল</span><span>${M(o.subtotal)}</span></div>
          ${o.discount ? `<div class="srow"><span>ছাড় ${o.coupon ? '(' + esc(o.coupon) + ')' : ''}</span><span>−${M(o.discount)}</span></div>` : ''}
          <div class="srow"><span>ডেলিভারি</span><span>${o.delivery ? M(o.delivery) : 'ফ্রি'}</span></div><div class="srow t"><span>মোট</span><span>${M(o.total)}</span></div></div></div>
        <div class="d-sec"><h3>পেমেন্ট</h3><dl class="kv"><dt>মেথড</dt><dd>${esc(PAY[o.payment.method] || o.payment.label)}</dd><dt>অবস্থা</dt><dd>${payChip(o)}</dd>
          ${o.payment.trxId ? `<dt>TrxID</dt><dd>${esc(o.payment.trxId)}</dd>` : ''}${o.payment.account ? `<dt>অ্যাকাউন্ট</dt><dd>${esc(o.payment.account)}</dd>` : ''}</dl>
          <div class="d-actions" style="margin-top:10px"><button class="btn btn-line btn-sm" id="dPaid">${o.payment.status === 'paid' ? 'অপরিশোধিত চিহ্নিত করুন' : '✓ পরিশোধিত চিহ্নিত করুন'}</button></div></div>
        <div class="d-sec"><h3>অ্যাডমিন নোট</h3><label class="fld"><textarea id="dNote" placeholder="শুধু অ্যাডমিন দেখবে — যেমন কুরিয়ার ট্র্যাকিং নম্বর">${esc(o.adminNote || '')}</textarea></label><button class="btn btn-line btn-sm" id="dNoteSave" style="margin-top:8px">নোট সেভ</button></div>
        <div class="d-sec"><h3>ইতিহাস</h3><ul class="timeline">${(o.history || []).slice().reverse().map((h) => `<li><b>${STATUS[h.status] || h.status}</b><span class="muted">${fmtDate(h.at)}</span></li>`).join('')}</ul></div>
        <div class="d-actions"><button class="btn btn-green" id="dPrint">${ico('print')} ইনভয়েস প্রিন্ট</button><button class="btn btn-ghost-red" id="dDel">${ico('trash')} মুছে ফেলুন</button></div>
      </div>`);
    const card = $('#drawerCard');
    $$('[data-st]', card).forEach((b) => b.onclick = () => { setStatus(id, b.dataset.st); openOrder(id); refreshBehind(); });
    $('#dPaid', card).onclick = () => { const cur = FZ.orders().find((x) => x.id === id); FZ.updateOrder(id, { payment: Object.assign({}, cur.payment, { status: cur.payment.status === 'paid' ? 'unpaid' : 'paid' }) }); toast('পেমেন্ট আপডেট হয়েছে'); openOrder(id); refreshBehind(); };
    $('#dNoteSave', card).onclick = () => { FZ.updateOrder(id, { adminNote: $('#dNote', card).value.trim() }); toast('নোট সেভ হয়েছে'); };
    $('#dPrint', card).onclick = () => printInvoice(FZ.orders().find((x) => x.id === id));
    $('#dDel', card).onclick = async () => {
      if (!(await confirmBox('অর্ডার মুছবেন?', `<b>${id}</b> স্থায়ীভাবে মুছে যাবে। স্টক ফেরত যোগ হবে (যদি বাতিল না হয়ে থাকে)।`, 'মুছে ফেলুন'))) return;
      const cur = FZ.orders().find((x) => x.id === id);
      if (cur && cur.status !== 'cancelled') adjustStock(cur, +1);
      FZ.saveOrders(FZ.orders().filter((x) => x.id !== id));
      closeDrawer(); toast('অর্ডার মুছে ফেলা হয়েছে'); refresh();
    };
  }
  A.openOrder = openOrder;
  function refreshBehind() { const y = window.scrollY; refresh(); window.scrollTo(0, y); }

  function printInvoice(o) {
    const S = FZ.settings();
    $('#printArea').innerHTML = `<div class="inv">
      <div class="inv-head"><div><h2 style="margin:0;font-family:Lobster,cursive;color:#0E5A2B">${esc(S.storeName)}</h2><div>${esc(S.address)} · ${esc(S.phone)}</div></div>
      <div style="text-align:right"><b>ইনভয়েস</b><br>${o.id}<br>${fmtDate(o.createdAt)}</div></div>
      <p><b>প্রাপক:</b> ${esc(o.customer.name)} · ${esc(o.customer.phone)}<br>${esc(o.shipping.address)}, ${esc(o.shipping.area)}, ${esc(o.shipping.district)}</p>
      <table><thead><tr><th>পণ্য</th><th>পরিমাণ</th><th>দর</th><th>মোট</th></tr></thead><tbody>
      ${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${M(i.price)}</td><td>${M(i.price * i.qty)}</td></tr>`).join('')}
      <tr><td colspan="3" style="text-align:right">সাবটোটাল</td><td>${M(o.subtotal)}</td></tr>
      ${o.discount ? `<tr><td colspan="3" style="text-align:right">ছাড়</td><td>−${M(o.discount)}</td></tr>` : ''}
      <tr><td colspan="3" style="text-align:right">ডেলিভারি</td><td>${M(o.delivery)}</td></tr>
      <tr><td colspan="3" style="text-align:right"><b>সর্বমোট</b></td><td><b>${M(o.total)}</b></td></tr></tbody></table>
      <p>পেমেন্ট: ${esc(PAY[o.payment.method] || '')} — ${o.payment.status === 'paid' ? 'পরিশোধিত' : 'ডেলিভারিতে আদায়যোগ্য: ' + M(o.total)}</p>
      <p style="margin-top:30px;text-align:center">ধন্যবাদ! আচার খোলার পর ফ্রিজে রাখুন। — ${esc(S.tagline)}</p></div>`;
    window.print();
  }

  /* ---------- manual order (phone / WhatsApp orders) ---------- */
  function manualOrder() {
    const S = FZ.settings();
    const ps = FZ.products().filter((p) => p.active !== false);
    const districts = [S.homeDistrict, ...DISTRICTS.filter((d) => d !== S.homeDistrict)];
    openModal(`<div class="m-head"><h2>নতুন অর্ডার (ফোন / WhatsApp)</h2><button class="icon" data-close aria-label="বন্ধ">${ico('close')}</button></div>
      <form class="m-body" id="moForm">
        <div class="grid2"><label class="fld"><span>নাম *</span><input name="name" required></label><label class="fld"><span>মোবাইল *</span><input name="phone" required inputmode="tel" pattern="01[3-9][0-9]{8}" placeholder="01XXXXXXXXX"></label>
        <label class="fld"><span>জেলা</span><select name="district">${districts.map((d) => `<option>${d}</option>`).join('')}</select></label><label class="fld"><span>এলাকা / থানা *</span><input name="area" required></label>
        <label class="fld span2"><span>পূর্ণ ঠিকানা *</span><input name="address" required></label></div>
        <div class="d-sec" style="padding:10px"><h3>প্রোডাক্ট ও পরিমাণ</h3><div style="display:grid;gap:6px">${ps.map((p) => `<div class="set-row"><span style="flex:1">${esc(p.name)} <small class="muted">${M(p.offerPrice)} · স্টক ${p.stock}</small></span><input class="stock-inp" type="number" min="0" max="${p.stock}" value="0" data-q="${p.id}"></div>`).join('')}</div></div>
        <div class="grid3"><label class="fld"><span>পেমেন্ট</span><select name="pay">${Object.entries(PAY).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label class="fld"><span>ডেলিভারি চার্জ</span><input name="delivery" type="number" min="0" value="${S.deliveryInside}"></label><label class="fld"><span>ছাড় (৳)</span><input name="discount" type="number" min="0" value="0"></label></div>
        <label class="check"><input type="checkbox" name="paid"> পেমেন্ট পাওয়া গেছে</label>
        <p class="preview-price" id="moTotal">মোট: ${M(0)}</p>
      </form>
      <div class="m-foot"><button class="btn btn-line" data-close>বাতিল</button><button class="btn btn-green" id="moSave">অর্ডার তৈরি করুন</button></div>`);
    const f = $('#moForm');
    const deliveryFor = () => (f.district.value === S.homeDistrict ? S.deliveryInside : S.deliveryOutside);
    f.district.onchange = () => { f.delivery.value = deliveryFor(); calc(); };
    const lines = () => $$('[data-q]', f).map((i) => ({ p: FZ.product(i.dataset.q), qty: Math.min(+i.value || 0, +i.max) })).filter((l) => l.qty > 0);
    const calc = () => { const sub = lines().reduce((s, l) => s + l.p.offerPrice * l.qty, 0); const t = Math.max(0, sub - (+f.discount.value || 0)) + (+f.delivery.value || 0); $('#moTotal').textContent = `সাবটোটাল ${M(sub)} · মোট ${M(t)}`; return { sub, t }; };
    f.addEventListener('input', calc);
    $('#moSave').onclick = () => {
      if (!f.reportValidity()) return;
      const ls = lines();
      if (!ls.length) { toast('অন্তত একটি প্রোডাক্টের পরিমাণ দিন'); return; }
      const { sub, t } = calc();
      const now = new Date().toISOString();
      FZ.addOrder({
        id: FZ.newOrderId(), createdAt: now,
        customer: { name: f.name.value.trim(), phone: f.phone.value.trim(), altPhone: '' },
        shipping: { district: f.district.value, area: f.area.value.trim(), address: f.address.value.trim(), note: '' },
        items: ls.map((l) => ({ id: l.p.id, name: l.p.name, qty: l.qty, price: l.p.offerPrice, mrp: l.p.price, image: l.p.image })),
        subtotal: sub, discount: Math.min(sub, +f.discount.value || 0), coupon: '', delivery: +f.delivery.value || 0, total: t,
        payment: { method: f.pay.value, label: PAY[f.pay.value], status: f.paid.checked ? 'paid' : 'unpaid', trxId: '' },
        status: 'confirmed', history: [{ status: 'pending', at: now }, { status: 'confirmed', at: now }], source: 'admin'
      });
      // addOrder records the id in "my orders" for this browser — remove it, this is the admin's browser
      FZ.write(FZ.KEYS.myOrders, FZ.read(FZ.KEYS.myOrders, []).slice(1));
      closeModal(); toast('অর্ডার তৈরি হয়েছে'); refresh();
    };
  }

  /* =========================================================
     CUSTOMERS
     ========================================================= */
  const cst = { q: '', sort: 'spent' };
  const notes = () => FZ.read(FZ.KEYS.notes, {});
  function customers() {
    const m = {};
    FZ.orders().slice().reverse().forEach((o) => {
      const k = o.customer.phone;
      const c = m[k] || (m[k] = { phone: k, name: o.customer.name, district: o.shipping.district, address: '', orders: [], spent: 0, first: o.createdAt, last: o.createdAt });
      c.name = o.customer.name; c.district = o.shipping.district; c.address = `${o.shipping.address}, ${o.shipping.area}, ${o.shipping.district}`;
      c.orders.unshift(o); c.last = o.createdAt;
      if (counts(o)) c.spent += o.total;
    });
    return Object.values(m);
  }
  A.renderCustomers = function (page) {
    $('#headActions').innerHTML = `<button class="btn btn-line" id="cCsv">${ico('down')} CSV</button>`;
    const all = customers();
    $('#cCsv').onclick = () => { const n = notes(); csv(`customers-${stamp()}.csv`, [['Name', 'Phone', 'District', 'Address', 'Orders', 'Total spent', 'First order', 'Last order', 'Note'], ...all.map((c) => [c.name, c.phone, c.district, c.address, c.orders.length, c.spent, fmtDate(c.first), fmtDate(c.last), n[c.phone] || ''])]); };
    const repeat = all.filter((c) => c.orders.length > 1).length;
    page.innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
        <div class="kpi hl"><span>মোট কাস্টমার</span><b>${all.length}</b></div>
        <div class="kpi"><span>রিপিট কাস্টমার</span><b>${repeat}</b><em class="muted">${all.length ? Math.round((repeat / all.length) * 100) : 0}%</em></div>
        <div class="kpi"><span>কাস্টমার প্রতি গড় খরচ</span><b>${M(all.length ? all.reduce((s, c) => s + c.spent, 0) / all.length : 0)}</b></div>
      </div>
      <div class="toolbar"><label class="searchbox">${ico('search')}<input class="inp" id="cQ" placeholder="নাম, ফোন বা জেলা…" value="${esc(cst.q)}"></label>
        <select class="inp" id="cSort" style="width:auto"><option value="spent">সবচেয়ে বেশি খরচ</option><option value="orders">সবচেয়ে বেশি অর্ডার</option><option value="last">সাম্প্রতিক</option><option value="name">নাম (A–Z)</option></select></div>
      <div id="cList"></div>`;
    $('#cSort').value = cst.sort;
    $('#cQ').oninput = (e) => { cst.q = e.target.value; draw(); };
    $('#cSort').onchange = (e) => { cst.sort = e.target.value; draw(); };
    draw();
    function draw() {
      const q = cst.q.trim().toLowerCase();
      const n = notes();
      const list = all.filter((c) => !q || [c.name, c.phone, c.district].join(' ').toLowerCase().includes(q));
      const sorters = { spent: (a, b) => b.spent - a.spent, orders: (a, b) => b.orders.length - a.orders.length, last: (a, b) => new Date(b.last) - new Date(a.last), name: (a, b) => a.name.localeCompare(b.name) };
      list.sort(sorters[cst.sort]);
      const box = $('#cList');
      if (!list.length) { box.innerHTML = `<div class="panel empty"><b>কোনো কাস্টমার নেই</b>অর্ডার এলে কাস্টমার তালিকা স্বয়ংক্রিয়ভাবে তৈরি হবে।</div>`; return; }
      box.innerHTML = `<div class="table-wrap cards"><table><thead><tr><th>কাস্টমার</th><th>জেলা</th><th class="r">অর্ডার</th><th class="r">মোট খরচ</th><th>শেষ অর্ডার</th></tr></thead><tbody>
        ${list.map((c) => `<tr class="click" data-ph="${esc(c.phone)}"><td><b>${esc(c.name)}</b>${c.orders.length > 1 ? ' <span class="chip tagchip">রিপিট</span>' : ''}${n[c.phone] ? ' <span title="নোট আছে">📝</span>' : ''}<br><small class="muted">${esc(c.phone)}</small></td>
        <td data-l="জেলা">${esc(c.district)}</td><td class="r" data-l="অর্ডার">${c.orders.length}</td><td class="r"><b>${M(c.spent)}</b></td><td data-l="শেষ অর্ডার">${fmtDate(c.last)}</td></tr>`).join('')}
      </tbody></table></div>`;
      $$('tr[data-ph]', box).forEach((tr) => tr.onclick = () => openCustomer(tr.dataset.ph));
    }
  };
  function openCustomer(phone) {
    const c = customers().find((x) => x.phone === phone);
    if (!c) return;
    const n = notes();
    openDrawer(`<div class="d-head"><h2>${esc(c.name)}</h2><button class="icon" data-close aria-label="বন্ধ">${ico('close')}</button></div>
      <div class="d-body">
        <div class="d-sec"><dl class="kv"><dt>ফোন</dt><dd>${esc(c.phone)}</dd><dt>ঠিকানা</dt><dd>${esc(c.address)}</dd><dt>মোট অর্ডার</dt><dd>${c.orders.length}</dd><dt>মোট খরচ</dt><dd>${M(c.spent)}</dd><dt>প্রথম অর্ডার</dt><dd>${fmtDate(c.first)}</dd></dl>
          <div class="d-actions" style="margin-top:10px"><a class="btn btn-line btn-sm" href="tel:${esc(c.phone)}">${ico('phone')} কল</a><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${waLink(c.phone, `আসসালামু আলাইকুম ${c.name}, ${FZ.settings().storeName} থেকে বলছি।`)}">${ico('chat')} WhatsApp</a></div></div>
        <div class="d-sec"><h3>নোট</h3><label class="fld"><textarea id="cNote" placeholder="যেমন: ঝাল কম পছন্দ করেন">${esc(n[c.phone] || '')}</textarea></label><button class="btn btn-line btn-sm" id="cNoteSave" style="margin-top:8px">সেভ</button></div>
        <div class="d-sec"><h3>অর্ডার ইতিহাস</h3><div class="table-wrap"><table><tbody>${c.orders.map((o) => `<tr class="click" data-oid="${o.id}"><td><b>${o.id}</b><br><small class="muted">${fmtDate(o.createdAt)}</small></td><td>${stChip(o.status)}</td><td class="r"><b>${M(o.total)}</b></td></tr>`).join('')}</tbody></table></div></div>
      </div>`);
    const card = $('#drawerCard');
    $('#cNoteSave', card).onclick = () => { const all = notes(); const v = $('#cNote', card).value.trim(); if (v) all[phone] = v; else delete all[phone]; FZ.write(FZ.KEYS.notes, all); toast('নোট সেভ হয়েছে'); refresh(); };
    $$('tr[data-oid]', card).forEach((tr) => tr.onclick = () => openOrder(tr.dataset.oid));
  }
})();
