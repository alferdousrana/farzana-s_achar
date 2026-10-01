/* Admin — products, settings & boot */
(function () {
  'use strict';
  const A = window.__FZA;
  const { $, $$, esc, M, ico, STATUS, PAY, TAGS, DISTRICTS, LOW_STOCK, toast, download, stamp, openModal, closeModal, confirmBox, refresh } = A;

  /* ---------- image upload → compressed webp data URL ---------- */
  function compressImage(file, maxW = 900, quality = 0.8) {
    return new Promise((res, rej) => {
      if (!file || !file.type.startsWith('image/')) { rej(new Error('শুধু ছবি ফাইল দিন')); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let out = c.toDataURL('image/webp', quality);
        if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', quality);
        res(out);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('ছবিটি পড়া যায়নি')); };
      img.src = url;
    });
  }
  const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item-' + Date.now().toString(36);

  /* =========================================================
     PRODUCTS
     ========================================================= */
  const pst = { q: '', f: 'all' };
  A.renderProducts = function (page) {
    $('#headActions').innerHTML = `<button class="btn btn-green" id="pNew">${ico('plus')} নতুন প্রোডাক্ট</button>`;
    $('#pNew').onclick = () => editProduct(null);
    page.innerHTML = `<div class="toolbar"><label class="searchbox">${ico('search')}<input class="inp" id="pQ" placeholder="প্রোডাক্ট খুঁজুন…" value="${esc(pst.q)}"></label>
      <div class="tabs" id="pF" style="margin:0">${[['all', 'সব'], ['single', 'একক আচার'], ['package', 'প্যাকেজ'], ['low', 'স্টক কম'], ['off', 'লুকানো']].map(([k, l]) => `<button data-f="${k}" class="${pst.f === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="pgrid" id="pGrid"></div>`;
    $('#pQ').oninput = (e) => { pst.q = e.target.value; draw(); };
    $('#pF').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; pst.f = b.dataset.f; $$('#pF button').forEach((x) => x.classList.toggle('on', x === b)); draw(); };
    draw();

    function draw() {
      const q = pst.q.trim().toLowerCase();
      const list = FZ.products().filter((p) => {
        if (q && !(p.name + ' ' + p.nameEn + ' ' + (p.keywords || '')).toLowerCase().includes(q)) return false;
        if (pst.f === 'single') return p.type !== 'package';
        if (pst.f === 'package') return p.type === 'package';
        if (pst.f === 'low') return p.stock <= LOW_STOCK;
        if (pst.f === 'off') return p.active === false;
        return true;
      });
      const grid = $('#pGrid');
      if (!list.length) { grid.innerHTML = `<div class="panel empty" style="grid-column:1/-1"><b>কোনো প্রোডাক্ট নেই</b>নতুন প্রোডাক্ট যোগ করুন বা ফিল্টার বদলান।</div>`; return; }
      grid.innerHTML = list.map((p) => `<article class="pcard ${p.active === false ? 'off' : ''}" data-id="${p.id}">
        <img src="${esc(p.image)}" alt="" loading="lazy">
        <div class="pcard-body">
          <h3>${esc(p.name)} <small class="muted">${esc(p.weight)}</small></h3>
          <div>${p.type === 'package' ? '<span class="chip st-processing">প্যাকেজ</span> ' : ''}${(p.tags || []).map((t) => `<span class="chip tagchip">${TAGS[t] || t}</span>`).join('')}</div>
          <div class="pcard-row"><span class="pcard-price"><b>${M(p.offerPrice)}</b>${p.price > p.offerPrice ? `<s>${M(p.price)}</s> <span class="chip st-cancelled">-${FZ.pct(p)}%</span>` : ''}</span></div>
          <div class="pcard-row"><label>স্টক <input class="stock-inp ${p.stock <= LOW_STOCK ? 'low' : ''}" type="number" min="0" value="${p.stock}" data-stock="${p.id}"></label><span class="muted">বিক্রি ${p.sold || 0} · ★ ${p.rating}</span></div>
        </div>
        <div class="pcard-foot">
          <label class="switch" title="স্টোরে দেখান / লুকান"><input type="checkbox" data-active="${p.id}" ${p.active !== false ? 'checked' : ''}><i></i></label>
          <a class="icon" href="index.html#/product/${esc(p.slug)}" target="_blank" title="স্টোরে দেখুন">${ico('store')}</a>
          <button class="icon" data-edit="${p.id}" title="এডিট">${ico('edit')}</button>
          <button class="icon" data-dup="${p.id}" title="ডুপ্লিকেট">${ico('copy')}</button>
          <button class="icon" data-del="${p.id}" title="মুছুন" style="color:var(--red)">${ico('trash')}</button>
        </div></article>`).join('');
    }
    $('#pGrid').onchange = (e) => {
      const t = e.target;
      const ps = FZ.products();
      if (t.dataset.stock) { const p = ps.find((x) => x.id === t.dataset.stock); p.stock = Math.max(0, parseInt(t.value, 10) || 0); FZ.saveProducts(ps); t.classList.toggle('low', p.stock <= LOW_STOCK); toast(`${p.name}: স্টক ${p.stock}`); }
      if (t.dataset.active) { const p = ps.find((x) => x.id === t.dataset.active); p.active = t.checked; FZ.saveProducts(ps); t.closest('.pcard').classList.toggle('off', !t.checked); toast(t.checked ? `${p.name} স্টোরে দেখানো হচ্ছে` : `${p.name} লুকানো হয়েছে`); }
    };
    $('#pGrid').onclick = async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.edit) editProduct(b.dataset.edit);
      if (b.dataset.dup) {
        const ps = FZ.products(); const src = ps.find((x) => x.id === b.dataset.dup);
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = FZ.uid('p'); copy.slug = src.slug + '-copy-' + Date.now().toString(36).slice(-3); copy.name = src.name + ' (কপি)'; copy.sold = 0; copy.active = false;
        ps.splice(ps.indexOf(src) + 1, 0, copy); FZ.saveProducts(ps); toast('কপি তৈরি হয়েছে (লুকানো অবস্থায়)'); draw();
      }
      if (b.dataset.del) {
        const p = FZ.product(b.dataset.del);
        if (!(await confirmBox('প্রোডাক্ট মুছবেন?', `<b>${esc(p.name)}</b> স্টোর থেকে স্থায়ীভাবে মুছে যাবে। পুরনো অর্ডারের তথ্য ঠিক থাকবে।`, 'মুছে ফেলুন'))) return;
        FZ.saveProducts(FZ.products().filter((x) => x.id !== p.id).map((x) => (x.items ? Object.assign(x, { items: x.items.filter((i) => i !== p.id) }) : x)));
        toast('প্রোডাক্ট মুছে ফেলা হয়েছে'); draw();
      }
    };
  };

  function editProduct(id) {
    const isNew = !id;
    const p = isNew ? {
      id: FZ.uid('p'), slug: '', type: 'single', name: '', nameEn: '', weight: '২৫০ গ্রাম', price: 150, offerPrice: 120, stock: 50, sold: 0, rating: 4.8, reviews: 0,
      tags: [], lid: '#F6C21C', image: '', gallery: [], short: '', description: '', ingredients: [], storage: FZ.DEFAULT_PRODUCTS[0].storage.slice(), pairing: [], benefits: [], keywords: '', items: [], active: true
    } : JSON.parse(JSON.stringify(FZ.product(id)));
    const singles = FZ.products().filter((x) => x.type !== 'package' && x.id !== p.id);
    let imgs = [p.image, ...(p.gallery || []).filter((g) => g !== p.image)].filter(Boolean);
    const lines = (a) => esc((a || []).join('\n'));

    openModal(`<div class="m-head"><h2>${isNew ? 'নতুন প্রোডাক্ট' : 'প্রোডাক্ট এডিট'}</h2><button class="icon" data-close aria-label="বন্ধ">${ico('close')}</button></div>
      <div class="m-tabs" id="peTabs"><button class="on" data-tab="0">মৌলিক তথ্য</button><button data-tab="1">ছবি</button><button data-tab="2">বিস্তারিত</button></div>
      <form class="m-body" id="peForm" novalidate>
        <div class="tab-pane on">
          <div class="grid2">
            <label class="fld"><span>নাম (বাংলা) *</span><input name="name" required value="${esc(p.name)}" placeholder="যেমন: জলপাইয়ের আচার"></label>
            <label class="fld"><span>নাম (English)</span><input name="nameEn" value="${esc(p.nameEn)}" placeholder="Jolpai Achar"></label>
            <label class="fld"><span>ধরন</span><select name="type"><option value="single">একক আচার</option><option value="package">কম্বো প্যাকেজ</option></select></label>
            <label class="fld"><span>ওজন / সাইজ</span><input name="weight" value="${esc(p.weight)}"></label>
            <label class="fld"><span>রেগুলার দাম (৳) *</span><input name="price" type="number" min="0" required value="${p.price}"></label>
            <label class="fld"><span>অফার দাম (৳) *</span><input name="offerPrice" type="number" min="0" required value="${p.offerPrice}"><small id="peOff"></small></label>
            <label class="fld"><span>স্টক</span><input name="stock" type="number" min="0" value="${p.stock}"></label>
            <label class="fld"><span>ঢাকনার রং (কার্ডের উপরের দাগ)</span><input name="lid" type="color" value="${esc(p.lid || '#F6C21C')}" style="padding:4px"></label>
            <label class="fld"><span>রেটিং (০–৫)</span><input name="rating" type="number" min="0" max="5" step="0.1" value="${p.rating}"></label>
            <label class="fld"><span>রিভিউ সংখ্যা</span><input name="reviews" type="number" min="0" value="${p.reviews || 0}"></label>
          </div>
          <div class="fld"><span>হোম পেজের সেকশন</span><div class="tagpick">${Object.entries(TAGS).map(([k, l]) => `<label><input type="checkbox" name="tag" value="${k}" ${p.tags.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div><small>প্যাকেজগুলো স্বয়ংক্রিয়ভাবে "কম্বো প্যাকেজ" সেকশনে দেখাবে।</small></div>
          <div class="fld" id="peItems"><span>প্যাকেজে যা থাকবে</span><div class="tagpick">${singles.map((s) => `<label><input type="checkbox" name="item" value="${s.id}" ${(p.items || []).includes(s.id) ? 'checked' : ''}> ${esc(s.name)}</label>`).join('')}</div><small id="peItemsSum"></small></div>
          <label class="fld"><span>সংক্ষিপ্ত বর্ণনা (কার্ডে দেখাবে)</span><input name="short" value="${esc(p.short)}" maxlength="120"></label>
          <label class="fld"><span>বিস্তারিত বর্ণনা</span><textarea name="description">${esc(p.description)}</textarea></label>
          <div class="grid2"><label class="fld"><span>URL স্লাগ</span><input name="slug" value="${esc(p.slug)}" placeholder="jolpai"><small>ইংরেজি নাম থেকে নিজে তৈরি হবে</small></label>
          <label class="fld"><span>সার্চ কিওয়ার্ড</span><input name="keywords" value="${esc(p.keywords || '')}" placeholder="olive jolpai টক ঝাল"></label></div>
          <label class="check"><input type="checkbox" name="active" ${p.active !== false ? 'checked' : ''}> স্টোরে দেখান</label>
        </div>
        <div class="tab-pane">
          <p class="muted" style="margin:0">প্রথম ছবিটি মূল ছবি (কার্ড ও কার্টে দেখাবে)। যেকোনো ছবিতে ক্লিক করে মূল ছবি বানান। ছবি স্বয়ংক্রিয়ভাবে ছোট (WebP) করে সেভ হবে।</p>
          <div class="imgs" id="peImgs"></div>
          <label class="fld"><span>অথবা ছবির লিংক / পাথ যোগ করুন</span><div class="set-row"><input class="inp" id="peUrl" placeholder="images/jar-new.webp"><button type="button" class="btn btn-line" id="peUrlAdd">যোগ</button></div></label>
        </div>
        <div class="tab-pane">
          <p class="muted" style="margin:0">প্রতিটি লাইনে একটি করে পয়েন্ট লিখুন।</p>
          <label class="fld"><span>উপকরণ</span><textarea name="ingredients" rows="5">${lines(p.ingredients)}</textarea></label>
          <label class="fld"><span>সংরক্ষণ পদ্ধতি</span><textarea name="storage" rows="5">${lines(p.storage)}</textarea></label>
          <label class="fld"><span>কিসের সাথে খাবেন</span><textarea name="pairing" rows="4">${lines(p.pairing)}</textarea></label>
          <label class="fld"><span>উপকারিতা</span><textarea name="benefits" rows="5">${lines(p.benefits)}</textarea></label>
        </div>
      </form>
      <div class="m-foot"><button class="btn btn-line" data-close>বাতিল</button><button class="btn btn-green" id="peSave">${isNew ? 'প্রোডাক্ট যোগ করুন' : 'সেভ করুন'}</button></div>`);

    const f = $('#peForm');
    f.type.value = p.type;
    $('#peTabs').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; $$('#peTabs button').forEach((x) => x.classList.toggle('on', x === b)); $$('.tab-pane', f).forEach((x, i) => x.classList.toggle('on', i === +b.dataset.tab)); };
    const syncOff = () => { const pr = +f.price.value || 0, of = +f.offerPrice.value || 0; $('#peOff').textContent = pr > of && of > 0 ? `ব্যাজে দেখাবে: ${Math.round(((pr - of) / pr) * 100)}% ছাড়` : 'অফার দাম রেগুলার দামের চেয়ে কম হলে ছাড়ের ব্যাজ দেখাবে'; };
    const syncItems = () => {
      $('#peItems').hidden = f.type.value !== 'package';
      const ids = $$('[name=item]:checked', f).map((i) => i.value);
      const reg = ids.reduce((s, i) => s + (FZ.product(i) || {}).price, 0);
      $('#peItemsSum').textContent = ids.length ? `${ids.length}টি আচার · আলাদা কিনলে ${M(reg)}` : 'প্যাকেজে কোন আচারগুলো থাকবে বেছে নিন';
    };
    f.addEventListener('input', () => { syncOff(); syncItems(); });
    f.addEventListener('change', syncItems);
    syncOff(); syncItems();

    function drawImgs() {
      $('#peImgs').innerHTML = imgs.map((src, i) => `<figure class="${i === 0 ? 'main' : ''}" data-i="${i}"><img src="${esc(src)}" alt="">${i === 0 ? '<em>মূল</em>' : ''}<button type="button" data-rm="${i}" aria-label="মুছুন">${ico('close')}</button></figure>`).join('') +
        `<label class="add-img">+ ছবি আপলোড<input type="file" accept="image/*" multiple hidden id="peFile"></label>`;
      $('#peFile').onchange = async (e) => {
        for (const file of e.target.files) { try { imgs.push(await compressImage(file)); } catch (err) { toast(err.message); } }
        drawImgs();
      };
    }
    $('#peImgs').onclick = (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { imgs.splice(+rm.dataset.rm, 1); drawImgs(); return; }
      const fig = e.target.closest('figure');
      if (fig && +fig.dataset.i > 0) { const [x] = imgs.splice(+fig.dataset.i, 1); imgs.unshift(x); drawImgs(); }
    };
    $('#peUrlAdd').onclick = () => { const v = $('#peUrl').value.trim(); if (v) { imgs.push(v); $('#peUrl').value = ''; drawImgs(); } };
    drawImgs();

    $('#peSave').onclick = () => {
      const split = (v) => v.split('\n').map((s) => s.trim()).filter(Boolean);
      const name = f.name.value.trim();
      if (!name) { $('#peTabs button').click(); f.name.focus(); toast('প্রোডাক্টের নাম দিন'); return; }
      const price = +f.price.value || 0, offer = +f.offerPrice.value || 0;
      if (!offer) { toast('অফার দাম দিন'); return; }
      if (!imgs.length) { $$('#peTabs button')[1].click(); toast('অন্তত একটি ছবি দিন'); return; }
      const all = FZ.products();
      let slug = slugify(f.slug.value || f.nameEn.value || p.slug);
      if (all.some((x) => x.slug === slug && x.id !== p.id)) slug += '-' + Date.now().toString(36).slice(-3);
      Object.assign(p, {
        name, nameEn: f.nameEn.value.trim(), type: f.type.value, weight: f.weight.value.trim(), price: Math.max(price, offer), offerPrice: offer,
        stock: Math.max(0, parseInt(f.stock.value, 10) || 0), lid: f.lid.value, rating: Math.min(5, Math.max(0, +f.rating.value || 0)), reviews: parseInt(f.reviews.value, 10) || 0,
        tags: $$('[name=tag]:checked', f).map((i) => i.value), items: f.type.value === 'package' ? $$('[name=item]:checked', f).map((i) => i.value) : [],
        short: f.short.value.trim(), description: f.description.value.trim(), slug, keywords: f.keywords.value.trim(), active: f.active.checked,
        image: imgs[0], gallery: imgs.slice(),
        ingredients: split(f.ingredients.value), storage: split(f.storage.value), pairing: split(f.pairing.value), benefits: split(f.benefits.value)
      });
      if (isNew) all.unshift(p); else all[all.findIndex((x) => x.id === p.id)] = p;
      if (FZ.saveProducts(all)) { closeModal(); toast(isNew ? 'নতুন প্রোডাক্ট যোগ হয়েছে' : 'প্রোডাক্ট আপডেট হয়েছে'); refresh(); }
    };
  }

  /* =========================================================
     SETTINGS
     ========================================================= */
  const toLocal = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
  let draft = null;
  A.renderSettings = function (page) {
    draft = JSON.parse(JSON.stringify(FZ.settings()));
    $('#headActions').innerHTML = `<button class="btn btn-green" id="sSave">সব সেভ করুন</button>`;
    const sec = draft.sections;
    const secNames = { featured: 'ফিচার্ড', hot: 'হট ডিল', best: 'বেস্ট সেলার', packages: 'প্যাকেজ', popular: 'জনপ্রিয়' };
    page.innerHTML = `<form class="set-grid" id="sForm" onsubmit="return false">
      <section class="panel"><h2>${ico('store')} স্টোরের তথ্য</h2>
        <label class="fld"><span>স্টোরের নাম</span><input name="storeName" value="${esc(draft.storeName)}"></label>
        <label class="fld"><span>ট্যাগলাইন</span><input name="tagline" value="${esc(draft.tagline)}"></label>
        <div class="grid2"><label class="fld"><span>ফোন</span><input name="phone" value="${esc(draft.phone)}"></label>
        <label class="fld"><span>WhatsApp (৮৮ সহ)</span><input name="whatsapp" value="${esc(draft.whatsapp)}"></label></div>
        <label class="fld"><span>ঠিকানা</span><input name="address" value="${esc(draft.address)}"></label>
        <label class="fld"><span>Facebook পেজ লিংক</span><input name="facebook" value="${esc(draft.facebook)}"></label>
      </section>
      <section class="panel"><h2>🚚 ডেলিভারি</h2>
        <label class="fld"><span>নিজ জেলা (কম চার্জ)</span><select name="homeDistrict">${DISTRICTS.map((d) => `<option ${d === draft.homeDistrict ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        <div class="grid3"><label class="fld"><span>নিজ জেলায় (৳)</span><input name="deliveryInside" type="number" min="0" value="${draft.deliveryInside}"></label>
        <label class="fld"><span>অন্য জেলায় (৳)</span><input name="deliveryOutside" type="number" min="0" value="${draft.deliveryOutside}"></label>
        <label class="fld"><span>ফ্রি ডেলিভারি (৳+)</span><input name="freeDeliveryOver" type="number" min="0" value="${draft.freeDeliveryOver}"><small>০ = বন্ধ</small></label></div>
        <h2 style="margin-top:8px">🔥 হট ডিল ও নোটিশ</h2>
        <label class="fld"><span>হট ডিল শেষ হবে</span><input name="hotDealEnds" type="datetime-local" value="${toLocal(draft.hotDealEnds)}"><small>হোম পেজে কাউন্টডাউন দেখাবে</small></label>
        <label class="fld"><span>উপরের চলমান নোটিশ (প্রতি লাইনে একটি)</span><textarea name="notices" rows="4">${esc((draft.notices || []).join('\n'))}</textarea></label>
      </section>
      <section class="panel"><h2>🏠 হোম পেজ সেকশন</h2>
        ${Object.keys(secNames).map((k) => `<div class="set-row"><label class="switch" title="দেখান/লুকান"><input type="checkbox" name="show_${k}" ${sec[k].show ? 'checked' : ''}><i></i></label><label class="fld"><span>${secNames[k]} — শিরোনাম</span><input name="title_${k}" value="${esc(sec[k].title)}"></label></div>`).join('')}
      </section>
      <section class="panel"><h2>🖼️ ব্যানার স্লাইডার <small>ক্রম বদলাতে ↑ চাপুন</small></h2><div class="banner-list" id="sBanners"></div>
        <label class="btn btn-line" style="cursor:pointer">${ico('plus')} ব্যানার আপলোড (২:১ সাইজ ভালো)<input type="file" accept="image/*" hidden id="sBannerFile"></label></section>
      <section class="panel"><h2>🎟️ কুপন</h2>
        <div class="coupon-row muted" style="font-size:12.5px"><span>কোড</span><span>ধরন</span><span>মান</span><span>সর্বনিম্ন (৳)</span><span>চালু</span><span></span></div>
        <div id="sCoupons" style="display:grid;gap:6px"></div>
        <button type="button" class="btn btn-line" id="sCouponAdd">${ico('plus')} কুপন যোগ করুন</button></section>
      <section class="panel"><h2>${ico('user')} অ্যাডমিন অ্যাকাউন্ট</h2>
        <label class="fld"><span>ইউজারনেম</span><input id="aUser" value="${esc((draft.admin || {}).user || 'admin')}" autocomplete="username"></label>
        <div class="grid2"><label class="fld"><span>নতুন পাসওয়ার্ড</span><input id="aPass" type="password" autocomplete="new-password" minlength="6"></label>
        <label class="fld"><span>আবার লিখুন</span><input id="aPass2" type="password" autocomplete="new-password"></label></div>
        <small class="muted">${(draft.admin || {}).passHash ? 'কাস্টম পাসওয়ার্ড সেট করা আছে।' : '⚠️ এখনো ডিফল্ট পাসওয়ার্ড (farzana123) ব্যবহার হচ্ছে — অবশ্যই বদলান।'}</small>
        <div class="d-actions"><button type="button" class="btn btn-green" id="aSave">অ্যাকাউন্ট আপডেট</button><button type="button" class="btn btn-line" id="aOut">${ico('out')} লগ আউট</button></div></section>
      <section class="panel danger"><h2>💾 ব্যাকআপ ও ডেটা</h2>
        <p class="muted" style="margin:0">সব ডেটা এই ব্রাউজারে সেভ থাকে। নিয়মিত ব্যাকআপ ডাউনলোড করে রাখুন।</p>
        <div class="d-actions"><button type="button" class="btn btn-line" id="bExp">${ico('down')} ব্যাকআপ ডাউনলোড</button>
        <label class="btn btn-line" style="cursor:pointer">${ico('up')} ব্যাকআপ রিস্টোর<input type="file" accept="application/json,.json" hidden id="bImp"></label></div>
        <div class="d-actions"><button type="button" class="btn btn-line" id="bDemo">🧪 ৪০টি ডেমো অর্ডার তৈরি</button><button type="button" class="btn btn-ghost-red" id="bDemoClear">ডেমো অর্ডার মুছুন</button></div>
        <div class="d-actions"><button type="button" class="btn btn-ghost-red" id="bClear">${ico('trash')} সব অর্ডার মুছুন</button><button type="button" class="btn btn-red" id="bReset">সব ফ্যাক্টরি রিসেট</button></div></section>
    </form>`;

    const f = $('#sForm');
    drawBanners(); drawCoupons();

    $('#sBannerFile').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { draft.banners.push({ image: await compressImage(file, 1600, 0.78), link: '' }); drawBanners(); toast('ব্যানার যোগ হয়েছে — সেভ করতে ভুলবেন না'); } catch (err) { toast(err.message); }
      e.target.value = '';
    };
    $('#sCouponAdd').onclick = () => { draft.coupons.push({ code: 'NEW' + Math.floor(Math.random() * 90 + 10), type: 'percent', value: 5, min: 0, active: true }); drawCoupons(); };

    $('#sSave').onclick = () => {
      const g = (n) => f.elements[n].value.trim();
      Object.assign(draft, {
        storeName: g('storeName'), tagline: g('tagline'), phone: g('phone'), whatsapp: g('whatsapp').replace(/[^\d]/g, ''), address: g('address'), facebook: g('facebook'),
        homeDistrict: g('homeDistrict'), deliveryInside: +g('deliveryInside') || 0, deliveryOutside: +g('deliveryOutside') || 0, freeDeliveryOver: +g('freeDeliveryOver') || 0,
        hotDealEnds: g('hotDealEnds') ? new Date(g('hotDealEnds')).toISOString() : draft.hotDealEnds,
        notices: g('notices').split('\n').map((s) => s.trim()).filter(Boolean)
      });
      Object.keys(secNames).forEach((k) => { draft.sections[k] = { show: f.elements['show_' + k].checked, title: f.elements['title_' + k].value.trim() || secNames[k] }; });
      const codes = draft.coupons.map((c) => c.code);
      if (codes.some((c) => !c) || new Set(codes).size !== codes.length) { toast('কুপন কোড ফাঁকা বা একই রকম হতে পারবে না'); return; }
      const cur = FZ.settings();
      draft.admin = cur.admin; // credentials are changed separately
      if (FZ.saveSettings(draft)) toast('✓ সেটিংস সেভ হয়েছে — স্টোরে আপডেট দেখাবে');
    };

    $('#aSave').onclick = async () => {
      const user = $('#aUser').value.trim(), p1 = $('#aPass').value, p2 = $('#aPass2').value;
      if (!user) { toast('ইউজারনেম দিন'); return; }
      if (p1 && p1.length < 6) { toast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'); return; }
      if (p1 !== p2) { toast('দুই পাসওয়ার্ড মিলছে না'); return; }
      const s = FZ.settings();
      s.admin = { user, passHash: p1 ? await FZ.hash(p1) : (s.admin || {}).passHash || '' };
      FZ.saveSettings(s); $('#aPass').value = $('#aPass2').value = '';
      toast('অ্যাকাউন্ট আপডেট হয়েছে'); A.renderSettings(page);
    };
    $('#aOut').onclick = A.logout;

    $('#bExp').onclick = () => download(`farzana-backup-${stamp()}.json`, JSON.stringify(FZ.exportAll(), null, 2), 'application/json');
    $('#bImp').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!(await confirmBox('ব্যাকআপ রিস্টোর করবেন?', 'বর্তমান সব প্রোডাক্ট, অর্ডার ও সেটিংস এই ফাইলের ডেটা দিয়ে বদলে যাবে।', 'রিস্টোর করুন'))) return;
        FZ.importAll(data); toast('ব্যাকআপ রিস্টোর হয়েছে'); A.renderSettings(page); A.updateBadge();
      } catch (err) { toast('ফাইলটি পড়া যায়নি: ' + err.message); }
      e.target.value = '';
    };
    $('#bDemo').onclick = () => { const n = makeDemoOrders(40); toast(`${n}টি ডেমো অর্ডার তৈরি হয়েছে`); A.updateBadge(); };
    $('#bDemoClear').onclick = async () => {
      if (!(await confirmBox('ডেমো অর্ডার মুছবেন?', 'শুধু ডেমো হিসেবে তৈরি অর্ডারগুলো মুছে যাবে।', 'মুছে ফেলুন'))) return;
      const all = FZ.orders(); const demo = all.filter((o) => o.source === 'demo');
      const ps = FZ.products();
      demo.forEach((o) => o.items.forEach((i) => { const p = ps.find((x) => x.id === i.id); if (p) p.sold = Math.max(0, (p.sold || 0) - i.qty); }));
      FZ.saveProducts(ps); FZ.saveOrders(all.filter((o) => o.source !== 'demo'));
      toast(`${demo.length}টি ডেমো অর্ডার মুছে ফেলা হয়েছে`); A.updateBadge();
    };
    $('#bClear').onclick = async () => {
      if (!(await confirmBox('সব অর্ডার মুছবেন?', 'সব অর্ডার স্থায়ীভাবে মুছে যাবে। আগে ব্যাকআপ নিয়ে রাখুন।', 'সব মুছুন'))) return;
      FZ.saveOrders([]); toast('সব অর্ডার মুছে ফেলা হয়েছে'); A.updateBadge();
    };
    $('#bReset').onclick = async () => {
      if (!(await confirmBox('ফ্যাক্টরি রিসেট?', 'সব প্রোডাক্ট, অর্ডার, সেটিংস ও পাসওয়ার্ড ডিফল্টে ফিরে যাবে। এটি ফেরানো যাবে না!', 'রিসেট করুন'))) return;
      FZ.reset(); FZ.write(FZ.KEYS.notes, {}); toast('ফ্যাক্টরি রিসেট সম্পন্ন'); A.logout();
    };

    function drawBanners() {
      const links = [['', '— কোনো লিংক নেই —'], ['packages', 'কম্বো প্যাকেজ সেকশন'], ...FZ.products().map((p) => [p.slug, p.name])];
      const box = $('#sBanners');
      box.innerHTML = draft.banners.length ? draft.banners.map((b, i) => `<div class="banner-item"><img src="${esc(b.image)}" alt="">
        <label class="fld"><span>ক্লিক করলে যাবে</span><select data-bl="${i}">${links.map(([v, l]) => `<option value="${esc(v)}" ${v === b.link ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        <div><button type="button" class="icon" data-bu="${i}" title="উপরে" ${i ? '' : 'disabled'}>${ico('up')}</button><button type="button" class="icon" data-bd="${i}" title="মুছুন" style="color:var(--red)">${ico('trash')}</button></div></div>`).join('') : '<p class="muted">কোনো ব্যানার নেই — স্লাইডার লুকানো থাকবে।</p>';
      box.onchange = (e) => { const s = e.target.closest('[data-bl]'); if (s) draft.banners[+s.dataset.bl].link = s.value; };
      box.onclick = (e) => {
        const up = e.target.closest('[data-bu]'), del = e.target.closest('[data-bd]');
        if (up) { const i = +up.dataset.bu; [draft.banners[i - 1], draft.banners[i]] = [draft.banners[i], draft.banners[i - 1]]; drawBanners(); }
        if (del) { draft.banners.splice(+del.dataset.bd, 1); drawBanners(); }
      };
    }
    function drawCoupons() {
      const box = $('#sCoupons');
      box.innerHTML = draft.coupons.map((c, i) => `<div class="coupon-row" data-ci="${i}">
        <input class="inp" data-k="code" value="${esc(c.code)}" style="text-transform:uppercase" aria-label="কোড">
        <select class="inp" data-k="type" aria-label="ধরন"><option value="percent" ${c.type === 'percent' ? 'selected' : ''}>% ছাড়</option><option value="flat" ${c.type === 'flat' ? 'selected' : ''}>৳ ছাড়</option></select>
        <input class="inp" data-k="value" type="number" min="0" value="${c.value}" aria-label="মান">
        <input class="inp" data-k="min" type="number" min="0" value="${c.min}" aria-label="সর্বনিম্ন">
        <label class="switch"><input type="checkbox" data-k="active" ${c.active ? 'checked' : ''}><i></i></label>
        <button type="button" class="icon" data-cd="${i}" style="color:var(--red)" aria-label="মুছুন">${ico('trash')}</button></div>`).join('') || '<p class="muted">কোনো কুপন নেই</p>';
      box.oninput = box.onchange = (e) => {
        const row = e.target.closest('[data-ci]'); const k = e.target.dataset.k; if (!row || !k) return;
        const c = draft.coupons[+row.dataset.ci];
        c[k] = k === 'active' ? e.target.checked : k === 'value' || k === 'min' ? +e.target.value || 0 : k === 'code' ? e.target.value.trim().toUpperCase() : e.target.value;
      };
      box.onclick = (e) => { const d = e.target.closest('[data-cd]'); if (d) { draft.coupons.splice(+d.dataset.cd, 1); drawCoupons(); } };
    }
  };

  /* ---------- demo data for testing analytics ---------- */
  function makeDemoOrders(n) {
    const names = ['রহিম উদ্দিন', 'সুমাইয়া আক্তার', 'তানভীর হাসান', 'নুসরাত জাহান', 'মাহমুদুল হক', 'ফারহানা ইসলাম', 'আরিফ চৌধুরী', 'সাবরিনা রহমান', 'জাহিদ হোসেন', 'মরিয়ম বেগম', 'রাকিব আহমেদ', 'তাসনিম ফেরদৌস'];
    const districts = ['ঢাকা', 'ঢাকা', 'ঢাকা', 'ঝালকাঠি', 'ঝালকাঠি', 'বরিশাল', 'চট্টগ্রাম', 'খুলনা', 'সিলেট', 'গাজীপুর', 'রাজশাহী', 'পিরোজপুর'];
    const pays = ['cod', 'cod', 'cod', 'bkash', 'bkash', 'nagad', 'rocket', 'card', 'netbank', 'upay'];
    const flow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const S = FZ.settings();
    const ps = FZ.products().filter((p) => p.active !== false);
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const all = FZ.orders();
    const phones = names.map(() => '01' + pick(['3', '5', '7', '8', '9']) + String(Math.floor(Math.random() * 1e8)).padStart(8, '0'));
    const prods = FZ.products();
    for (let k = 0; k < n; k++) {
      const ci = Math.floor(Math.random() * names.length);
      const t = Date.now() - Math.pow(Math.random(), 1.4) * 60 * 864e5;
      const at = new Date(t).toISOString();
      const lines = [];
      const count = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) { const p = pick(ps); const ex = lines.find((l) => l.id === p.id); if (ex) ex.qty++; else lines.push({ id: p.id, name: p.name, qty: 1 + (Math.random() < .25 ? 1 : 0), price: p.offerPrice, mrp: p.price, image: p.image }); }
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const district = pick(districts);
      const delivery = S.freeDeliveryOver && subtotal >= S.freeDeliveryOver ? 0 : district === S.homeDistrict ? S.deliveryInside : S.deliveryOutside;
      const discount = Math.random() < .2 && subtotal >= 300 ? Math.round(subtotal * .1) : 0;
      const age = (Date.now() - t) / 864e5;
      let status = age > 6 ? 'delivered' : flow[Math.min(4, Math.floor(age))];
      if (Math.random() < .07) status = 'cancelled';
      const method = pick(pays);
      const history = [];
      const upto = status === 'cancelled' ? 1 : flow.indexOf(status) + 1;
      for (let s = 0; s < upto; s++) history.push({ status: flow[s], at: new Date(t + s * 0.8 * 864e5).toISOString() });
      if (status === 'cancelled') history.push({ status: 'cancelled', at: new Date(t + 3e6).toISOString() });
      all.push({
        id: FZ.newOrderId().slice(0, 2) + new Date(t).toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        createdAt: at, customer: { name: names[ci], phone: phones[ci], altPhone: '' },
        shipping: { district, area: pick(['সদর', 'মিরপুর', 'উত্তরা', 'ধানমন্ডি', 'নতুন বাজার', 'কলেজ রোড']), address: `বাসা ${Math.floor(Math.random() * 90 + 1)}, রোড ${Math.floor(Math.random() * 20 + 1)}`, note: '' },
        items: lines, subtotal, discount, coupon: discount ? 'FARZANA10' : '', delivery, total: subtotal - discount + delivery,
        payment: { method, label: PAY[method], status: method !== 'cod' || status === 'delivered' ? 'paid' : 'unpaid', trxId: method !== 'cod' ? 'TRX' + Math.random().toString(36).slice(2, 10).toUpperCase() : '' },
        status, history, source: 'demo'
      });
      if (status !== 'cancelled') lines.forEach((l) => { const p = prods.find((x) => x.id === l.id); if (p) p.sold = (p.sold || 0) + l.qty; });
    }
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    FZ.saveProducts(prods);
    FZ.saveOrders(all);
    return n;
  }

  /* ---------- boot ---------- */
  if (A.loggedIn()) A.showApp(); else A.showLogin();
})();
